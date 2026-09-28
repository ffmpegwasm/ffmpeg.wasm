all: dev

DEV_ARGS := --progress=plain

DEV_CFLAGS := --profiling
PROD_CFLAGS := -O3 -msimd128

clean:
	rm -rf ./packages/core$(PKG_SUFFIX)/dist

.PHONY: build
build:
	$(if $(FFMPEG_JSPI),,make clean PKG_SUFFIX="$(PKG_SUFFIX)")
	EXTRA_CFLAGS="$(EXTRA_CFLAGS)" \
	EXTRA_LDFLAGS="$(EXTRA_LDFLAGS)" \
	FFMPEG_ST="$(FFMPEG_ST)" \
	FFMPEG_MT="$(FFMPEG_MT)" \
	FFMPEG_JSPI="$(FFMPEG_JSPI)" \
	FFMPEG_EXCEPTIONS="$(FFMPEG_EXCEPTIONS)" \
		docker buildx build \
			--build-arg EXTRA_CFLAGS \
			--build-arg EXTRA_LDFLAGS \
			--build-arg FFMPEG_MT \
			--build-arg FFMPEG_ST \
			--build-arg FFMPEG_JSPI \
			--build-arg FFMPEG_EXCEPTIONS \
			-o ./packages/core$(PKG_SUFFIX) \
			$(EXTRA_ARGS) \
			.

build-st:
	make build FFMPEG_ST=yes FFMPEG_EXCEPTIONS=-fexceptions

# after build-st: adds ffmpeg-core-jspi.{js,wasm} to packages/core/dist
build-jspi:
	make build FFMPEG_ST=yes FFMPEG_JSPI=yes FFMPEG_EXCEPTIONS=-fwasm-exceptions

build-mt:
	make build PKG_SUFFIX=-mt FFMPEG_MT=yes FFMPEG_EXCEPTIONS=-fwasm-exceptions

dev:
	make build-st EXTRA_CFLAGS="$(DEV_CFLAGS)" EXTRA_ARGS="$(DEV_ARGS)"

dev-jspi:
	make build-jspi EXTRA_CFLAGS="$(DEV_CFLAGS)" EXTRA_ARGS="$(DEV_ARGS)"

dev-mt:
	make build-mt EXTRA_CFLAGS="$(DEV_CFLAGS)" EXTRA_ARGS="$(DEV_ARGS)"

prd:
	make build-st EXTRA_CFLAGS="$(PROD_CFLAGS)"

prd-jspi:
	make build-jspi EXTRA_CFLAGS="$(PROD_CFLAGS)"

prd-mt:
	make build-mt EXTRA_CFLAGS="$(PROD_CFLAGS)"
