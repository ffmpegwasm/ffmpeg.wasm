/*
 * The number of cores FFmpeg, swscale and x264 size their thread pools for.
 */
#include <emscripten.h>

#include "libavutil/common.h"

#ifdef __EMSCRIPTEN_PTHREADS__
EM_JS(int, hardware_concurrency, (void), { return navigator.hardwareConcurrency; });

/*
 * Every thread takes one of the PTHREAD_POOL_SIZE pre-spawned workers; a
 * command that needs more than the pool has fails instead of starting a new
 * worker while exec() blocks (#597). The cap lives in shared memory, so every
 * thread sees what setThreads() set.
 */
static int max_threads = 4;

void set_max_threads(int n)
{
    max_threads = n;
}

int emscripten_num_logical_cores(void)
{
    return FFMIN(hardware_concurrency(), max_threads);
}
#else
/* @ffmpeg/core runs every thread on one: more would only take turns. */
void set_max_threads(int n)
{
}

int emscripten_num_logical_cores(void)
{
    return 1;
}
#endif
