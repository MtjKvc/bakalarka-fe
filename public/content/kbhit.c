#include <stdio.h>
#include <unistd.h>
#include <termios.h>
#include <fcntl.h>
/*
 * Function kbhit() checks if a key has been pressed on the keyboard,
 * this funciton is default in windows, this code is for UNIX systems
 * @return 1 if a key has been pressed, 0 otherwise
 */
int kbhit(void) {
    struct termios oldt, newt;
    int ch;
    int oldf;

    tcgetattr(STDIN_FILENO, &oldt);
    newt = oldt;
    newt.c_lflag &= ~(ICANON | ECHO);
    tcsetattr(STDIN_FILENO, TCSANOW, &newt);
    oldf = fcntl(STDIN_FILENO, F_GETFL, 0);
    fcntl(STDIN_FILENO, F_SETFL, oldf | O_NONBLOCK);

    ch = getchar();

    tcsetattr(STDIN_FILENO, TCSANOW, &oldt);
    fcntl(STDIN_FILENO, F_SETFL, oldf);

    if(ch != EOF) {
        ungetc(ch, stdin);
        return 1;
    }

    return 0;
}

int main(void) {
    /* Disable canonical mode and echo for UNIX terminal */
    struct termios old_tio, new_tio;

    tcgetattr(STDIN_FILENO, &old_tio);
    new_tio = old_tio;

    new_tio.c_lflag &= ~(ICANON | ECHO);
    tcsetattr(STDIN_FILENO, TCSANOW, &new_tio);

    // Your code should go under this comment


    /* Restore settings to previous state */
    tcsetattr(STDIN_FILENO, TCSANOW, &old_tio);

    return 0;
}
