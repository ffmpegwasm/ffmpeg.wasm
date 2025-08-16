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

## Custom Build / Reduce Build Size

You can customize your build to include only the libraries you need, which can significantly reduce the final build size. This is done by modifying the `Dockerfile`.

---

### Step-by-Step Example: Removing WebP Support

Here's how to remove `libwebp` (WebP image support) from the build. The same principle applies to other libraries.

You need to make changes in **4 places** in the `Dockerfile`:

#### 1. Remove the library builder stage

Find the stage that builds the library you want to remove and delete the entire block:

```dockerfile
# Remove this entire block
FROM emsdk-base AS libwebp-builder
COPY --from=zlib-builder $INSTALL_DIR $INSTALL_DIR
ENV LIBWEBP_BRANCH=v1.3.2
ADD https://github.com/ffmpegwasm/libwebp.git#$LIBWEBP_BRANCH /src
COPY build/libwebp.sh /src/build.sh
RUN bash -x /src/build.sh
```

#### 2. Remove the COPY instruction

In the `ffmpeg-base` stage, remove the line that copies the built library:

```dockerfile
# Remove this line
COPY --from=libwebp-builder $INSTALL_DIR $INSTALL_DIR
```

#### 3. Remove the configure flag

In the `ffmpeg-builder` stage, remove the corresponding `--enable-lib...` flag:

```dockerfile
# Remove this line from the ffmpeg-builder stage
--enable-libwebp \
```

#### 4. Remove the linker flags

In the `ffmpeg-wasm-builder` stage, remove the library from `FFMPEG_LIBS`:

```dockerfile
# Remove these lines from FFMPEG_LIBS
-lwebpmux \
-lwebp \
-lsharpyuv \
```

> **💡 Pro Tip:** Start by removing just the main library flag (e.g., `-lwebp`). If the build fails with "undefined reference" errors, those errors will tell you exactly which additional libraries to remove.

#### 5. Build and test

```bash
# Run the build command
make prd

# Output will be in packages/core/dist/
```
---

**Additional Build Size Optimization:**

You can sometimes play around with `build/ffmpeg-wasm.sh` and `build/ffmpeg.sh` to disable things you are not using to make the size smaller.

### More Advance Customization Example: Creating a Minimal Build

For more advanced customization, you might want to create a minimal build that only includes the features you need. A good example is creating a build that can create a video from a sequence of images (e.g., from an HTML canvas), handle MP4 encoding/decoding, and support audio.

A community member, @Kaizodo, shared an approach that resulted in a build size of only 4.80MB. You can find the full details and a discussion in [GitHub Issue #866](https://github.com/ffmpegwasm/ffmpeg.wasm/issues/866).

The general strategy is to:

1.  **Start with a minimal configuration:** Instead of removing libraries one by one, a more effective approach is to start with a minimal ffmpeg configuration. This can be achieved by using flags like `--disable-everything` in the ffmpeg configuration step within the `Dockerfile`.
2.  **Enable specific components:** After disabling everything, you can selectively enable only the encoders, decoders, muxers, demuxers, and protocols you need for your specific use case. For example: `--enable-encoder=libx264`, `--enable-decoder=png`, `--enable-muxer=mp4`, etc.
3.  **Include only necessary libraries:** Make sure your `Dockerfile` only builds and links the external libraries that correspond to the features you enabled (e.g., `libx264`). You can remove the build stages for any other libraries.

This approach gives you control over the build content and its final size.

We would like to thank @Kaizodo, @harkdawg and other community members for sharing their knowledge!
## Publish

Simply run `npm publish` under **packages/core** or **/packages/core-mt**.
