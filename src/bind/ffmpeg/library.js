// Cap thread pools at 4 cores so one command can't exhaust PTHREAD_POOL_SIZE and hang (#597).
mergeInto(LibraryManager.library, {
  emscripten_num_logical_cores: function () {
    return Math.min(navigator["hardwareConcurrency"], 4);
  },
});
