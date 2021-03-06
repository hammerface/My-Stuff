// $Id: cmatch.c,v 1.5 2013-10-31 20:41:42-07 - - $

//Peter Greer-Berezovsky - pbgreerb
//James Brower - jrbrower

//
// NAME
//    cmatch
//
// SYNOPSIS
//    cmatch [-lin] String [filename, ...]
//
// DESCRIPTION
//    Prints out any line in the given files that contain the given 
//    string. If multiple files are given the name of the file will
//    be printed before any of its containing the string are printed.
//    -n option will print the number line in front of any printed
//    lines. -l will only print the filenames for any of the files 
//    that containt the given string. -i will ignore the case of the
//    string and the test in the files.
//

#define _GNU_SOURCE
#include <libgen.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>

#define STDIN_NAME "-"

char *program_name = NULL;
int exit_status = EXIT_SUCCESS;

typedef struct options {
    bool ignore_case;
    bool filenames_only;
    bool number_lines;
} options;

//    Will set option variables to be true, based on the given options.

void scan_options (int argc, char **argv, options *opts) {
    opts->ignore_case = false;
    opts->filenames_only = false;
    opts->number_lines = false;
    opterr = false;
    for (;;) {
        int opt = getopt (argc, argv, "iln");
        if (opt == EOF) break;
        switch (opt) {
           case 'i':
               opts->ignore_case = true;
               break;
           case 'l':
               opts->filenames_only = true;
               break;
           case 'n':
               opts->number_lines = true;
               break;
           default:
               exit_status = EXIT_FAILURE;
               fflush (NULL);
               fprintf (stderr, "%s: -%c: invalid option\n",
                   program_name, optopt);
           break;
      }
   }
}

const char *strbool (bool value) {
    return value ? "true" : "false";
}

//    Will print out the proper output based on the selected options,
//    given file, and given key.

void file_print(FILE *input, char *filename, char *key, 
                              int opcount, options *opts){
    char buffer[1024];
    int linecount = 0;
    int i = 0;
    char next = (char) fgetc(input);
    int printed = 0;
    
    if (opcount >= 4 && opts->filenames_only == 0 && input != stdin) {
       printf ("FILE - %s\n", filename);
       printed++;
    }
    while(next != EOF){
        linecount++;
        if (next != '\n') {
        buffer[i] = next;
        do{
            i++;
            buffer[i] = (char) fgetc(input);
        }while(buffer[i] != '\n' && buffer[i] != EOF);
        buffer[i+1] = '\0';
        if (opts->ignore_case == 0) {
           if (strstr(buffer, key) != NULL){
               if (printed == 0 && input != stdin && 
                      (opcount > 3 || opts->filenames_only == 1)) {
                  printf ("FILE - %s\n", filename);
                  printed++;
               }
               if (opts->number_lines == 1 && 
                     opts->filenames_only != 1) {
                  printf("%d:", linecount);
               }
               if (opts->filenames_only != 1){
               printf("%s", buffer);
               }
           }
        }
        else {
           if (strcasestr(buffer,key) != NULL) {
              if (printed == 0 && input != stdin && 
                     (opcount > 3 || opts->filenames_only == 1)) {
                 printf ("FILE - %s\n", filename);
                 printed++;
               }
               if (opts->number_lines == 1 && 
                      opts->filenames_only != 1) {
                  printf("%d:", linecount);
               }
               if (opts->filenames_only != 1){
               printf("%s", buffer);
               }
           }
        }
        i = 0;
        }
        next = fgetc(input);
    }
}

//    Checks for usage errors. If none are found main will send the
//    designated input to be tested and printed. All files are tested
//    before being sent. If a file does not exist it is not sent and
//    an error message is printed.

int main (int argc, char **argv){
    FILE *input;
    int opcount = argc;
    options opts;
    program_name = basename (argv[0]);
    scan_options (argc, argv, &opts);
    int keyarg = 1;
    if(argc < (keyarg+1)){
        fprintf(stderr, 
            "Usage: cmatch [-iln] string [filename...]\n");
        exit(1);
    }
    if (argv[1][0] == '-') {
       keyarg++;
       if(argc < (keyarg+1)){
           fprintf(stderr, 
               "Usage: cmatch [-iln] string [filename...]\n");
           exit(1);
       }
    }
    char *key = argv[keyarg];
    if(opts.ignore_case != 0 || opts.filenames_only != 0 || 
                                   opts.number_lines != 0){
        opcount--;
    }
    if(argc < keyarg + 2 || strcmp(argv[keyarg + 1], STDIN_NAME) == 0){
       file_print(stdin, STDIN_NAME, key, opcount, &opts);
    } else {
        for(int i = keyarg + 1; i < argc; i++){
            if((input = fopen(argv[i], "r")) == NULL){
                fprintf(stderr, "%s: %s: No such file or directory\n", 
                                                   argv[0], argv[i]);
                    exit_status = 1;
                break;
            }
            input = fopen (argv[i], "r");
            file_print(input, argv[i], key, opcount, &opts);
            fclose(input);
        }
    }
}

