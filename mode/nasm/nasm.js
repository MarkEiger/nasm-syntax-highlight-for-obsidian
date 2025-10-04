(function (mod) {
    if (typeof exports == "object" && typeof module == "object")
        mod(require("../../lib/codemirror"))
    else if (typeof define == "function" && define.amd)
        define(["../../lib/codemirror"], mod)
    else
        mod(CodeMirror)
})(function (CodeMirror) {
    "use strict"

    var mne = [
        "adc",
        "sbb",
        "mov",
        "add",
        "sub",
        "jmp",
        "je",
        "jne",
        "jg",
        "jge",
        "jl",
        "jle",
        "call",
        "ret",
        "push",
        "pop",
        "and",
        "or",
        "not",
        "xor",
        "test",
        "lea",
        "nop",
        "int",
        "syscall",
        "cmp",
        "inc",
        "dec",
        "mul",
        "div",
        "idiv",
        "imul",
        "sal",
        "shl",
        "sar",
        "shr",
        "movsx",
        "movzx",
        "xchg",
        "cbw",
        "cwd",
        "retn",
        "leave",
        "iret",
        "in",
        "out",
        "bound",
        "enter",
        "bswap",
        "bt",
        "cltd",
        "cld",
        "std",
        "sti",
        "cli",
        "hlt",
        "cmc",
        "clc",
        "stc",
        "lahf",
        "sahf",
        "pushf",
        "popf",
        "seta",
        "setae",
        "setb",
        "setbe",
        "sete",
        "setg",
        "setge",
        "setl",
        "setle",
        "setne",
        "movd",
        "movq",
        "movaps",
        "movdqa",
        "movdqu",
        "addps",
        "addpd",
        "subps",
        "subpd",
        "mulps",
        "mulpd",
        "divps",
        "divpd",
        "sqrtps",
        "sqrtpd",
        "rsqrtps",
        "rcpps",
        "andps",
        "andpd",
        "orps",
        "orpd",
        "xorps",
        "xorpd",
        "paddb",
        "paddw",
        "paddd",
        "paddq",
        "psubb",
        "psubw",
        "psubd",
        "psubq",
        "pmullw",
        "pmulhw",
        "pmuludq",
        "pmulld",
        "psrld",
        "psrad",
        "psrlq",
    ]

    var mnemonics = new RegExp('^(' + mne.join('|') + ')\\b')

    var classic_regs = /([re]?[abcd]x|[abcd][hl])/;
    var pointer_regs = /([re]?(sp|bp|si|di)|[sb]pl|[sd]il)/;
    var r8_15_regs   = /(r1[0-5]|r[89])[d|l]?/;

    var regs = new RegExp('\\b(' + [classic_regs.source, pointer_regs.source, r8_15_regs.source].join('|') + ')\\b');



    var section = /^section .(text|data|bss)/
    var ida_address = /^((\.\w+:)[\da-fA-F]+|(0x)?[\da-fA-F]+:)/ 
    var hexadecimal_0x = /\b\-?0x[\dA-Fa-f]+\b/
    var hexadecimal_h = /\b\-?[\d][\dA-Fa-f_]*h\b/
    var binary_0b = /\b\-?0b[01]+\b/
    var binary_b = /\b\-?[01]+b\b/
    var decimal = /\b\-?\d+\b/
    var comment = /;.*/
    var label = /^[a-zA-Z]\w*:/
    var brackets = /[\[\]]/
    var randomWord = /\w+/

    function tokenBase(stream, state, prev) {
        if (stream.sol()) state.indented = stream.indentation()
        if (stream.eatSpace()) return null

        if (stream.match(ida_address)) return "comment"
        if (stream.match(comment)) return "comment"
        if (stream.match(mnemonics)) return "number"
        if (stream.match(regs)) return "keyword"
        if (stream.match(label)) return "variable"
        if (stream.match(section)) return "variable"
        if (stream.match(hexadecimal_0x)) return "keyword"
        if (stream.match(hexadecimal_h)) return "keyword"
        if (stream.match(binary_0b)) return "keyword"
        if (stream.match(binary_b)) return "keyword"
        if (stream.match(decimal)) return "keyword"
        if (stream.match(brackets)) return "number"
        if (stream.match(randomWord)) return null

        stream.next()
        return null
    }

    function Context(prev, align, indented) {
        this.prev = prev
        this.align = align
        this.indented = indented
    }

    function pushContext(state, stream) {
        var align = stream.match(/^\s*($|\/[\/\*])/, false) ? null : stream.column() + 1
        state.context = new Context(state.context, align, state.indented)
    }

    function popContext(state) {
        if (state.context) {
            state.indented = state.context.indented
            state.context = state.context.prev
        }
    }

    CodeMirror.defineMode("nasm", function (config) {
        return {
            startState: function () {
                return {
                    prev: null,
                    context: null,
                    indented: 0,
                    tokenize: []
                }
            },

            token: function (stream, state) {
                var prev = state.prev
                state.prev = null
                var tokenize = state.tokenize[state.tokenize.length - 1] || tokenBase
                var style = tokenize(stream, state, prev)
                if (!style || style == "comment") state.prev = prev
                else if (!state.prev) state.prev = style

                if (style == "punctuation") {
                    var bracket = /[\(\[\{]|([\]\)\}])/.exec(stream.current())
                    if (bracket) {
                        (bracket[1] ? popContext : pushContext)(state, stream)
                    }
                }

                return style
            },

            indent: function (state, textAfter) {
                var cx = state.context
                if (!cx) return 0
                var closing = /^[\]\}\)]/.test(textAfter)
                if (cx.align != null) return cx.align - (closing ? 1 : 0)
                return cx.indented + (closing ? 0 : config.indentUnit)
            },

            electricInput: /^\s*[\)\}\]]$/,

            lineComment: ";",
            blockCommentStart: "/*",
            blockCommentEnd: "*/",
            fold: "brace",
            closeBrackets: "()[]{}''\"\"``"
        }
    })

    CodeMirror.defineMIME("text/x-nasm", "nasm")
});
