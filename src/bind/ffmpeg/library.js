// Only the multi-threaded core has workers to manage.
#if PTHREADS
addToLibrary({
  // Cap thread pools at 4 cores so one command can't exhaust PTHREAD_POOL_SIZE and hang (#597).
  emscripten_num_logical_cores: () => Math.min(navigator["hardwareConcurrency"], 4),

  // Joined threads return to the pool via a message exec() blocks; proxy it so exec() handles it while waiting.
  _emscripten_thread_cleanup__deps: ["$cleanupThread"],
  _emscripten_thread_cleanup__proxy: "async",
  _emscripten_thread_cleanup: (thread) => cleanupThread(thread),

  // Without cross-origin isolation the workers can't share memory and loading
  // hangs; fail right away instead (worker.ts explains it).
  $checkIsolation__postset: "checkIsolation();",
  $checkIsolation: () => {
    if (!ENVIRONMENT_IS_NODE && !globalThis.crossOriginIsolated) throw new Error("not cross-origin isolated");
  },

  // Keep the runtime alive between commands, or exiting it terminates every worker.
  $holdRuntime__deps: ["$runtimeKeepalivePush"],
  $holdRuntime__postset: "holdRuntime();",
  $holdRuntime: () => {
    if (!ENVIRONMENT_IS_PTHREAD) runtimeKeepalivePush();
  },
});
#endif
