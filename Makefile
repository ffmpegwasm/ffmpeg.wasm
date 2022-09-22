all: dev

MT_FLAGS := -sUSE_PTHREADS -pthread
MT_LDFLAGS := -sPTHREAD_POOL_SIZE=8

DEV_CFLAGS := --profiling
DEV_MT_CFLAGS := $(DEV_CFLAGS) $(MT_FLAGS)
PROD_CFLAGS := -O3 -msimd128
PROD_MT_CFLAGS := $(PROD_CFLAGS) $(MT_FLAGS)

clean:
	rm -rf ./packages/ffmpeg$(PKG_SUFFIX)/dist
	rm -rf ./packages/ffmpeg$(PKG_SUFFIX)/types

.PHONY: build
build:
	make clean PKG_SUFFIX="$(PKG_SUFFIX)"
	cp -r src/types/ffmpeg packages/ffmpeg$(PKG_SUFFIX)/types
	EXTRA_CFLAGS="$(EXTRA_CFLAGS)" \
	EXTRA_LDLAGS="$(EXTRA_LDLAGS)" \
	FFMPEG_ST="$(FFMPEG_ST)" \
	FFMPEG_MT="$(FFMPEG_MT)" \
		docker buildx build \
			--build-arg EXTRA_CFLAGS \
			--build-arg EXTRA_LDLAGS \
			--build-arg FFMPEG_MT \
			--build-arg FFMPEG_ST \
			-o ./packages/ffmpeg$(PKG_SUFFIX) \
			$(EXTRA_ARGS) \
			.

build-st:
	make build \
		FFMPEG_ST=yes

build-mt:
	make build \
		PKG_SUFFIX=-mt \
		FFMPEG_MT=yes \
		EXTRA_LDLAGS="$(MT_LDFLAGS)"

dev:
	make build-st EXTRA_CFLAGS="$(DEV_CFLAGS)"

dev-mt:
	make build-mt EXTRA_CFLAGS="$(DEV_MT_CFLAGS)"

prd:
	make build-st EXTRA_CFLAGS="$(PROD_CFLAGS)"

prd-mt:
	make build-mt EXTRA_CFLAGS="$(PROD_MT_CFLAGS)"
