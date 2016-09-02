
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>

#include <string>
#include <iostream>
using namespace std;

#ifdef EMSCRIPTEN
#include <emscripten.h>
#endif

#include "zint.h"
#define NESET "0123456789"

int escape_char_process(struct zint_symbol *my_symbol, uint8_t input_string[], int length)
{
	int error_number;
	int i, j;
    uint8_t *escaped_string = (uint8_t *)malloc(length + 1);

	i = 0;
	j = 0;

	do {
		if(input_string[i] == '\\') {
			switch(input_string[i + 1]) {
				case '0': escaped_string[j] = 0x00; i += 2; break; /* Null */
				case 'E': escaped_string[j] = 0x04; i += 2; break; /* End of Transmission */
				case 'a': escaped_string[j] = 0x07; i += 2; break; /* Bell */
				case 'b': escaped_string[j] = 0x08; i += 2; break; /* Backspace */
				case 't': escaped_string[j] = 0x09; i += 2; break; /* Horizontal tab */
				case 'n': escaped_string[j] = 0x0a; i += 2; break; /* Line feed */
				case 'v': escaped_string[j] = 0x0b; i += 2; break; /* Vertical tab */
				case 'f': escaped_string[j] = 0x0c; i += 2; break; /* Form feed */
				case 'r': escaped_string[j] = 0x0d; i += 2; break; /* Carriage return */
				case 'e': escaped_string[j] = 0x1b; i += 2; break; /* Escape */
				case 'G': escaped_string[j] = 0x1d; i += 2; break; /* Group Separator */
				case 'R': escaped_string[j] = 0x1e; i += 2; break; /* Record Separator */
				case '\\': escaped_string[j] = '\\'; i += 2; break;
				default: escaped_string[j] = input_string[i]; i++; break;
			}
		} else {
			escaped_string[j] = input_string[i];
			i++;
		}
		j++;
	} while (i < length);
	escaped_string[j] = '\0';

	error_number = ZBarcode_Encode(my_symbol, escaped_string, j);
    free(escaped_string);

	return error_number;
}


std::string g_buf = string("\0", 1);
extern "C" int buf_printf(FILE* s, const char* format, ...)
{
    va_list vl;
    va_start(vl, format);
    int sz = vsnprintf(nullptr, 0, format, vl);
    int offset = g_buf.size() - 1;
    if (offset < 0)
        offset = 0; // first one
    g_buf.resize(g_buf.size() + sz);
    int r = vsnprintf((char*)g_buf.data() + offset, sz + 1, format, vl);
    va_end(vl);
    return r;
}




// error correction code - 0,1,2,3 - 0 or -1 use the default which is 2
// symbol-size - 0-36, with 0, ecc is used
extern "C" int run(const char* data, int ecc, int symsize)
{
    g_buf.clear();
    struct zint_symbol *my_symbol;

    my_symbol = ZBarcode_Create();
    my_symbol->input_mode = DATA_MODE; //UNICODE_MODE;
    my_symbol->symbology = 92;

    my_symbol->output_options += BARCODE_STDOUT;
    strncpy(my_symbol->outfile, "test_dummy.svg", 250);
    my_symbol->scale = 10;
    my_symbol->option_1 = ecc;
    my_symbol->option_2 = symsize;

    int error_number = escape_char_process(my_symbol, (uint8_t*)data, strlen(data));
    if (error_number == 0) {
        error_number = ZBarcode_Print(my_symbol, 0); // rotate_angle
    }

    if (error_number != 0) {
        fprintf(stderr, "%s\n", my_symbol->errtxt);
        fflush(stderr);
    }

    ZBarcode_Delete(my_symbol);

   // cout << "len=" << g_buf.size() << "," << strlen(g_buf.c_str()) << "--" << (int)g_buf[36] << "," << (int)g_buf[37] <<"," << (int)g_buf[38] << endl;

#ifdef EMSCRIPTEN
    EM_ASM_(textOut = Pointer_stringify($0), g_buf.c_str());
#endif

    return 0;
}

#ifdef WIN32
int main(int argc, char **argv)
{
    return run(argv[1], -1);
}
#endif