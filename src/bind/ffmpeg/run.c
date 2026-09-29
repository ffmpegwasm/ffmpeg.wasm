/*
 * ffmpeg() and ffprobe() for bind.js, which reads their exit code from
 * Module.ret: in @ffmpeg/core, a call during which threads switched returns a
 * stale value to JavaScript (Asyncify rewinds it from the fiber trampoline).
 */
#include <emscripten.h>

int ffmpeg(int argc, char **argv);
int ffprobe(int argc, char **argv);

EM_JS(void, set_ret, (int ret), { Module.ret = ret; });

void run_ffmpeg(int argc, char **argv)
{
    set_ret(ffmpeg(argc, argv));
}

void run_ffprobe(int argc, char **argv)
{
    set_ret(ffprobe(argc, argv));
}
