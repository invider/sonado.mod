let TOKEN = {
    EOF: -1,
    UNKNOWN: 0,
    ID:  1,
    NUM: 2,
    STR: 3,
    OPR:  4,
    TUP: 5,
    LABEL: 6,
}

let OP = {
    COLON: 0x3A,    // :
    SEMICOLON: 0x3B,// ;
    COMMA: 0x2C,    // ,
    UNDER: 0x5F,    // _
    ACCENT: 0x60,   // `
    EXCL: 0x21,     // !
    AT:   0x40,     // @
    HASH: 0x23,     // #

    LPAR: 0x28,     // (
    RPAR: 0x29,     // )
    LBR: 0x5B,      // [
    RBR: 0x5D,      // ]
    SQUOTE: 0x27,   // "
    DQUOTE: 0x22,   // '
    QUESTION: 0x3F, // ?
}

module.exports = function(src) {

    let pos = 0
    let start
    let ival
    let sval
    let tval
    let itval

    sys.augment(this, TOKEN)

    // -- lex utils --
    let alpha = function(c) {
        return (c >= 0x41 && c <= 0x5A)
                || (c >= 0x61 && c <= 0x7A)
                || (c >= 0xC0 && c <= 0x02B0)
                || (c > 0xA0);
    }
    let num = function(c) {
        return (c >= 0x30 && c <= 0x39);
    }
    let hex = function(c) {
        return (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66);
    }
    let alphaNum = function(c) {
        return alpha(c) || num(c);
    }
    let tupleSeparator = function(c) {
        return c === 0x78 || c === 0x58 || c === 0x3A; // x/X/:
    }
    let id = function(c) {
        return c === 0x2E || c === 0x2F || c === 0x2D; // . / -
    }
    let skipLine = function() {
        while (pos < src.length && src.charAt(pos) !== '\n') pos++;
    }
    let skipBlanks = function() {
        if (src.length <= pos) return;
        while(pos < src.length && 
            (src.charAt(pos) == ' '
            || src.charAt(pos) == '\t'
            || src.charAt(pos) == '\n'
            || src.charAt(pos) == '\r')) pos++;
        // skip comments
        if (src.charAt(pos) === '/'
                && src.length > pos + 1
                && src.charAt(pos+1) === '/') {
            skipLine()
            skipBlanks() // recursively skip more of the same
        }
    }

    let match = function(pattern) {
        skipBlanks();
        if (src.length <= pos && pattern != "") return false;
        if (src.indexOf(pattern, pos) == pos) {
            pos += pattern.length;
            return true;
        }
        return false;
    }

    let matchNumber = function(c) {
        var nstart = pos;
        if (c === 0x30 && src.charCodeAt(pos + 1) !== 0x2E) {
            // parse hex
            do {
                if (c < 0x41) {
                    ival = ival * 16 + (c - 0x30);
                } else if (c < 0x47) {
                    ival = ival * 16 + (c - 0x37);
                } else {
                    ival = ival * 16 + (c - 0x57);
                }
                c = src.charCodeAt(++pos);
            } while (hex(c));
        } else {
            // parse decimal
            var eat = false;
            var point = false;
            var minus = false;
            var e = false;
            do {
                eat = false
                var prev = c 
                c = src.charCodeAt(++pos)
                if (c === 0x2D && !minus && (prev === 0x45 || prev === 0x65)) {
                    minus = true;
                    eat = true;
                } else if (c === 0x45 || c === 0x65) {
                    if (e) throw new Error('unexpected symbol: ' + String.fromCharCode(c));
                    e = true;
                    eat = true;
                } else if (c === 0x2E) {
                    if (point) throw new Error('unexpected symbol: .');
                    point = true;
                    eat = true;
                }
            } while (num(c) || eat);
            ival = parseFloat(src.substring(nstart, pos));
        }
        return c;
    }

    let matchString = function() {
        var t = src.charCodeAt(pos) // get string terminal char
        var c
        pos++
        while ((c = src.charCodeAt(pos)) != t) {
            pos++
            if (pos >= src.length) throw new Error("unexpected end of string @" + start);
        }
        sval = src.substring(start+1, pos)
        pos++
    }

    let nextToken = function() {
        skipBlanks();
        if (src.length <= pos) return TOKEN.EOF;
        
        start = pos;
        sval = "";
        ival = 0;
        tval = [];
        itval = 0; // tuple array index
        let c = src.charCodeAt(pos);

        switch(c) {
            case OP.COLON: pos++; ival = c; sval = ':'; return TOKEN.OPR;
            case OP.SEMICOLON: pos++; ival = c; sval = ';'; return TOKEN.OPR;
            case OP.COMMA: pos++; ival = c; sval = ','; return TOKEN.OPR;
            case OP.UNDER: pos++; ival = c; sval = '_'; return TOKEN.OPR;
            case OP.ACCENT: pos++; ival = c; sval = '`'; return TOKEN.OPR;
            case OP.EXCL: pos++; ival = c; sval = '!'; return TOKEN.OPR;
            case OP.AT: pos++; ival = c; sval = '@'; return TOKEN.OPR;
            case OP.HASH: pos++; ival = c; sval = '#'; return TOKEN.OPR;
            case OP.DQUOTE: matchString(); return TOKEN.STR;
            case OP.SQUOTE: matchString(); return TOKEN.STR;
        }

        if (num(c)) {
            c = matchNumber(c);
            if (tupleSeparator(c)) {
                // we have a tuple
                tval[itval++] = ival;
                while(tupleSeparator(c)) {
                    pos++;
                    c = src.charCodeAt(pos);
                    if (num(c)) {
                        ival = 0;
                        c = matchNumber(c);
                        tval[itval++] = ival;
                    } else {
                        throw new Error("number was expected");
                    }
                }
                return TOKEN.TUP;
            }
            return TOKEN.NUM;
        }

        if (alpha(c) || id(c)) {
            var np = pos
            var tp = np;
            var path = false;
            var eat = false;

            do {
                c = src.charCodeAt(np++);
                eat = false;
                if (c === 0x5C) {
                    eat = true;
                    c = src.charCodeAt(np++);
                };
                if (c === 0x2F) {
                    path = true;
                    tval[itval++] = src.substring(tp, np-1);
                    tp = np;
                };
            } while(alphaNum(c) || id(c) || eat);

            pos = np-1;
            if (path) {
                tval[itval++] = src.substring(tp, pos);
                return PATH;
            }
            sval = src.substring(start, pos);
            sval = sval.replace("\\", ""); // TODO make a proper handling of \\
            
            if (src.charCodeAt(pos) === OP.COLON) {
                pos++
                return TOKEN.LABEL
            }
            return TOKEN.ID;
        }
        sval = src.charAt(pos) + "?";
        pos++;
        return TOKEN.UNKNOWN;
    }

    this.tokenString = function() {
        return src.substring(start+1, pos)
    }

    this.ival = function() { return ival; }

    this.sval = function() { return sval; }

    this.tval = function() { return tval; }

    this.next = function () {
        this.lastToken = nextToken()
        return this.lastToken
    }

    this.expectNumber = function() {
        let t = this.next()
        if (t !== TOKEN.NUM) {
            this.unexpected('number expected')
        }
        return ival
    }

    this.expectTuple = function() {
        let t = this.next()
        if (t !== TOKEN.TUP) {
            this.unexpected('tuple expected')
        }
        return tval
    }

    this.unexpected = function(suffix) {
        let msg = 'unexpected token [' + this.tokenString() + ']'
        if (suffix) msg += ' - ' + suffix
        throw msg
    }

    this.printLastToken = function() {
        log.out(this.getLastToken())
    }

    this.getLastToken = function() {
        switch (this.lastToken) {
        case TOKEN.ID: return sval;
        case TOKEN.OPR: return sval; 
        case TOKEN.STR: return '"' + sval + '"';
        case TOKEN.NUM: return ival;
        case TOKEN.TUP: return 'T::' + tval;
        case TOKEN.EOF: return '=== EOF ==='
        default: 
            return 'T#' + this.lastToken + ': UNKNOWN';
        }
    }

}
