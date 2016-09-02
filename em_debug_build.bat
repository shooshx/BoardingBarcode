rem %EMSCRIPTEN%\emcc --clear-cache
rem --tracing
rem -D_LIBCPP_DEBUG=0 -x c++ -std=c++11

%EMSCRIPTEN%\emcc -g3 -O0  -s ASSERTIONS=1 -s SAFE_HEAP=1 -s DEMANGLE_SUPPORT=1 -s ALLOW_MEMORY_GROWTH=0 -D_DEBUG -D_LIBCPP_DEBUG=0 --memory-init-file 0 src/aztec.c src/common.c src/library.c src/reedsol.c src/render.c src/svg.c  src/main.cpp -Isrc -Wno-switch -o js_qr_brd.html -s EXPORTED_FUNCTIONS="['_run']"