mov rax, rbx ;asdasdadas
asdada:
jmp asdada
;asdasdadas
global _start

call asdada
section .data:
section .daasda:
global _start


_start:
0x12

    mov di
    mov rax, 1          ; syscall: write
    mov rdi, 1          ; file descriptor: stdout
    mov rsi, message    ; pointer to message to write
    mov rdx, 13         ; message length
    syscall             ; call kernel
    mov rax, byte ptr [message + rax * 4] ; Load the first byte of the message
    mov rax, [rax]
    mov rax, 60         ; syscall: exit
    xor rdi, rdi        ; exit code 0
    syscall             ; call kernel
    