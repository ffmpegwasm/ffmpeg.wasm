# @ffmpeg/core

To build @ffmpeg/core, make sure your docker is version 23.0+ as
[buildx](https://docs.docker.com/build/architecture/) is adopted. Also
You will need to install `make` to run build scripts.

## Build

Dev Build (single thread):
```bash
$ make dev
```

Dev Build (multithread):
```bash
$ make dev-mt
```

Prodution Build (single thread):
```bash
$ make prd
```

Prodution Build (multithread):
```bash
$ make prd-mt
```

> Each build might take around 1 hour depends on the spec of your machine,
> subsequent builds are faster as most layers are cached.

The output file locates at **/packages/core** or **/packages/core-mt**.

## Publish

Simply run `npm publish` under **packages/core** or **/packages/core-mt**.
