all: dev dev-mt

PROD_CFLAGS := -O3 -msimd128

clean:
	rm -rf ./packages/core$(PKG_SUFFIX)/dist
	rm -rf ./packages/core$(PKG_SUFFIX)/types

.PHONY: build
build:
	make clean PKG_SUFFIX="$(PKG_SUFFIX)"
	EXTRA_CFLAGS="$(EXTRA_CFLAGS)" \
	EXTRA_LDLAGS="$(EXTRA_LDLAGS)" \
	FFMPEG_MT="$(FFMPEG_MT)" \
		docker buildx build \
			--build-arg EXTRA_CFLAGS \
			--build-arg EXTRA_LDLAGS \
			--build-arg FFMPEG_MT \
			-o ./packages/core$(PKG_SUFFIX) \
			$(EXTRA_ARGS) \
			.
	cp -r src/types/core packages/core$(PKG_SUFFIX)/types

build-mt:
	make build \
		PKG_SUFFIX=-mt \
		FFMPEG_MT=yes \
		EXTRA_CFLAGS="-sUSE_PTHREADS -pthread" \
		EXTRA_LDLAGS="-sPTHREAD_POOL_SIZE=8"

dev:
	make build

dev-mt:
	make build-mt

prd:
	make build EXTRA_CFLAGS="$(PROD_CFLAGS)"

prd-mt:
	make build-mt EXTRA_CFLAGS="$(PROD_CFLAGS)"
