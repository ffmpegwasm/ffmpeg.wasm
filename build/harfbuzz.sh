#!/bin/bash

set -euo pipefail

meson setup build --cross-file=/meson-cross.ini \
  --prefix=$INSTALL_DIR --default-library=static --buildtype=release \
  -Dc_args="$CFLAGS" -Dcpp_args="$CXXFLAGS -DHB_NO_PRAGMA_GCC_DIAGNOSTIC_ERROR" \
  -Dglib=disabled -Dgobject=disabled -Dcairo=disabled -Dchafa=disabled \
  -Dicu=disabled -Dfreetype=enabled -Dpng=disabled -Dzlib=disabled \
  -Draster=disabled -Dvector=disabled -Dgpu=disabled -Dsubset=disabled \
  -Dtests=disabled -Ddocs=disabled -Dutilities=disabled -Dintrospection=disabled \
  -Dbenchmark=disabled
ninja -C build install
