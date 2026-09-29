// Cooperative ("green") pthreads for builds without SharedArrayBuffer: every
// thread is an emscripten fiber on the main thread, and a thread runs until it
// blocks (cond wait, join, a held mutex, sleep).
#include <emscripten/fiber.h>
#include <errno.h>
#include <pthread.h>
#include <sched.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define C_STACK (4 << 20)
#define ASYNCIFY_STACK (1 << 18)

typedef struct gthread {
  emscripten_fiber_t fiber;
  void *(*fn)(void *);
  void *arg, *ret;
  int id, done, detached, timed_out, ready;
  double deadline; // ms, 0 when not in a timed wait
  pthread_cond_t *waiting_on;
  struct gthread *joiner, *next_ready, *next_waiter;
  void *c_stack, *asyncify_stack;
} gthread;

static gthread main_thread;
static gthread *current, *ready_head, *ready_tail;
static gthread *timed[256];
static int n_timed, next_id = 1;
static char main_asyncify_stack[ASYNCIFY_STACK];

static void init(void) {
  if (current) return;
  emscripten_fiber_init_from_current_context(&main_thread.fiber, main_asyncify_stack, ASYNCIFY_STACK);
  current = &main_thread;
}

static double ms(const struct timespec *ts) { return ts->tv_sec * 1e3 + ts->tv_nsec / 1e6; }

static double now_ms(clockid_t clock) {
  struct timespec ts;
  clock_gettime(clock, &ts);
  return ms(&ts);
}

static void make_ready(gthread *t) {
  if (t->ready) return;
  t->ready = 1;
  t->next_ready = NULL;
  if (ready_tail) ready_tail->next_ready = t; else ready_head = t;
  ready_tail = t;
}

static void untime(gthread *t) {
  for (int i = 0; i < n_timed; i++)
    if (timed[i] == t) { timed[i] = timed[--n_timed]; break; }
  t->deadline = 0;
}

static void unwait(gthread *t) {
  if (!t->waiting_on) return;
  for (gthread **w = (gthread **)&t->waiting_on->__u.__p[0]; *w; w = &(*w)->next_waiter)
    if (*w == t) { *w = t->next_waiter; break; }
  t->waiting_on = NULL;
}

static void time_out(gthread *t) {
  untime(t);
  unwait(t);
  t->timed_out = 1;
  make_ready(t);
}

// Switches to the next ready thread; the current one must already be queued
// somewhere (ready, a cond, a joiner, the timed list) or it never runs again.
static void schedule(void) {
  double now = now_ms(CLOCK_MONOTONIC);
  for (int i = n_timed - 1; i >= 0; i--)
    if (timed[i]->deadline <= now) time_out(timed[i]);
  if (!ready_head && n_timed) {
    // Everyone is blocked: skip ahead to the timed wait that expires first.
    gthread *first = timed[0];
    for (int i = 1; i < n_timed; i++) if (timed[i]->deadline < first->deadline) first = timed[i];
    time_out(first);
  }
  if (!ready_head) {
    fprintf(stderr, "green threads: deadlock, every thread is blocked\n");
    abort();
  }
  gthread *next = ready_head;
  next->ready = 0;
  ready_head = next->next_ready;
  if (!ready_head) ready_tail = NULL;
  if (next == current) return;
  gthread *prev = current;
  current = next;
  emscripten_fiber_swap(&prev->fiber, &next->fiber);
}

static void yield(void) {
  make_ready(current);
  schedule();
}

static void entry(void *arg) {
  gthread *t = arg;
  t->ret = t->fn(t->arg);
  t->done = 1;
  if (t->joiner) make_ready(t->joiner);
  schedule(); // never returns: nothing queues a finished thread
}

int pthread_create(pthread_t *thread, const pthread_attr_t *attr, void *(*fn)(void *), void *arg) {
  init();
  gthread *t = calloc(1, sizeof(gthread));
  t->fn = fn;
  t->arg = arg;
  t->id = next_id++;
  // wasm's stack pointer must stay 16-byte aligned, and emscripten_fiber_init
  // doesn't align the top of the stack; malloc only guarantees 8 bytes.
  t->c_stack = aligned_alloc(16, C_STACK);
  t->asyncify_stack = aligned_alloc(16, ASYNCIFY_STACK);
  emscripten_fiber_init(&t->fiber, entry, t, t->c_stack, C_STACK, t->asyncify_stack, ASYNCIFY_STACK);
  make_ready(t);
  *thread = (pthread_t)t;
  return 0;
}

static void destroy(gthread *t) {
  free(t->c_stack);
  free(t->asyncify_stack);
  free(t);
}

int pthread_join(pthread_t thread, void **ret) {
  init();
  gthread *t = (gthread *)thread;
  while (!t->done) {
    t->joiner = current;
    schedule();
  }
  if (ret) *ret = t->ret;
  destroy(t);
  return 0;
}

int pthread_detach(pthread_t thread) {
  ((gthread *)thread)->detached = 1; // leaked: a finished detached thread can't free its own stack
  return 0;
}

pthread_t pthread_self(void) {
  init();
  return (pthread_t)current;
}

int (pthread_equal)(pthread_t a, pthread_t b) { return a == b; }

// Mutexes: __i[0] type, __i[1] lock count, __i[2] owner id.
int pthread_mutex_init(pthread_mutex_t *m, const pthread_mutexattr_t *attr) {
  int type = PTHREAD_MUTEX_NORMAL;
  if (attr) pthread_mutexattr_gettype(attr, &type);
  *m = (pthread_mutex_t){0};
  m->__u.__i[0] = type;
  return 0;
}

int pthread_mutex_destroy(pthread_mutex_t *m) { return 0; }

int pthread_mutex_trylock(pthread_mutex_t *m) {
  init();
  if (m->__u.__i[1] && m->__u.__i[2] == current->id && m->__u.__i[0] == PTHREAD_MUTEX_RECURSIVE) {
    m->__u.__i[1]++;
    return 0;
  }
  if (m->__u.__i[1]) return EBUSY;
  m->__u.__i[1] = 1;
  m->__u.__i[2] = current->id;
  return 0;
}

int pthread_mutex_lock(pthread_mutex_t *m) {
  while (pthread_mutex_trylock(m) == EBUSY) yield();
  return 0;
}

int pthread_mutex_unlock(pthread_mutex_t *m) {
  if (m->__u.__i[1] > 0 && --m->__u.__i[1] == 0) m->__u.__i[2] = 0;
  return 0;
}

// Condition variables: __p[0] is the list of waiting threads, __i[2] the clock
// of timed waits (0, CLOCK_REALTIME, by default).
int pthread_cond_init(pthread_cond_t *c, const pthread_condattr_t *attr) {
  clockid_t clock = CLOCK_REALTIME;
  if (attr) pthread_condattr_getclock(attr, &clock);
  *c = (pthread_cond_t){0};
  c->__u.__i[2] = clock;
  return 0;
}

int pthread_cond_destroy(pthread_cond_t *c) { return 0; }

static int wait(pthread_cond_t *c, pthread_mutex_t *m, const struct timespec *abstime) {
  init();
  current->next_waiter = c->__u.__p[0];
  c->__u.__p[0] = current;
  current->waiting_on = c;
  current->timed_out = 0;
  if (abstime) {
    clockid_t clock = c->__u.__i[2];
    current->deadline = now_ms(CLOCK_MONOTONIC) + ms(abstime) - now_ms(clock);
    timed[n_timed++] = current;
  }
  pthread_mutex_unlock(m);
  schedule();
  pthread_mutex_lock(m);
  return current->timed_out ? ETIMEDOUT : 0;
}

int pthread_cond_wait(pthread_cond_t *c, pthread_mutex_t *m) { return wait(c, m, NULL); }

int pthread_cond_timedwait(pthread_cond_t *c, pthread_mutex_t *m, const struct timespec *abstime) {
  return wait(c, m, abstime);
}

static void wake(gthread *t) {
  if (t->deadline) untime(t);
  make_ready(t);
}

int pthread_cond_signal(pthread_cond_t *c) {
  // wake the thread that has waited longest: the tail of the list
  gthread **w = (gthread **)&c->__u.__p[0];
  if (!*w) return 0;
  while ((*w)->next_waiter) w = &(*w)->next_waiter;
  gthread *t = *w;
  *w = NULL;
  t->waiting_on = NULL;
  wake(t);
  return 0;
}

int pthread_cond_broadcast(pthread_cond_t *c) {
  while (c->__u.__p[0]) pthread_cond_signal(c);
  return 0;
}

int sched_yield(void) {
  init();
  yield();
  return 0;
}

// A sleeping thread runs again once the time has passed, or earlier when every
// other thread is blocked (nothing could happen meanwhile anyway).
int nanosleep(const struct timespec *req, struct timespec *rem) {
  init();
  if (rem) *rem = (struct timespec){0};
  current->deadline = now_ms(CLOCK_MONOTONIC) + ms(req);
  timed[n_timed++] = current;
  schedule();
  return 0;
}

int clock_nanosleep(clockid_t clock, int flags, const struct timespec *req, struct timespec *rem) {
  return nanosleep(req, rem);
}

int usleep(unsigned usec) {
  struct timespec ts = { usec / 1000000, usec % 1000000 * 1000 };
  return nanosleep(&ts, NULL);
}
