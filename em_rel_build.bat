rem %EMSCRIPTEN%\emcc --clear-cache
rem --tracing
rem -D_LIBCPP_DEBUG=0 -x c++ -std=c++11

%EMSCRIPTEN%\emcc -O3  -s ALLOW_MEMORY_GROWTH=0 -D_DEBUG -D_LIBCPP_DEBUG=0 --memory-init-file 0 src/aztec.c src/common.c src/library.c src/reedsol.c src/render.c src/svg.c  src/main.cpp src/pdf417.c -Isrc -Wno-switch -o js_qr_brd.html -s EXPORTED_FUNCTIONS="['_run']"