'mode strict'
let ST_INIT = 0
let ST_HEADER = 1
let ST_DEF = 2
let ST_OUT = 11

let MACRO = {
    '.sprite-state': 0,
    '.sprite-type': 1,
    '.sprite-x': 2,
    '.sprite-y': 3,
    '.sprite-speed': 4,
    '.sprite-dir': 5,
    '.sprite-frame': 6,
    '.sprite-frameRate': 7,
    '.sprite-stilex': 8,
    '.sprite-etilex': 9,
    '.sprite-health': 10,
    '.sprite-ammo': 11,
    '.sprite-power': 12,
    '.sprite-score': 13,
    '.sprite-life': 14,
}

module.exports = function(emu, src) {

    // setup assembler
    let AP = 0 // Asm Pointer
    let DV = 1 // Direction Value
    let ST = ST_INIT // State
    let SI = 0 // State Index
    let DEF = {}
    let LABEL = {}
    let lex = new lib.Lex(src)

    function testOutState(stFlag) {
        let c = emu.getCodel(AP)
        if (c === DEF.wall) {
            // time to quite this capsule
            ST = ST_OUT
        } else if (stFlag) {
            ST = stFlag
        }
    }

    let HW_FLAG = false
    function moveAP() {
        AP += DV
        let c = emu.getCodel(AP)
        if (c == DEF.wall) {
            // we hit the wall! bounce back!
            // get one step back (not to be in the wall)
            AP -= DV
            // shift down one line
            AP += emu.mw
            // revert direction pointer
            DV *= -1
            // check if we hit the wall second time
            testOutState()
            HW_FLAG = true
        }
    }

    function getSX() {
        return Math.floor((AP % emu.mw)/emu.SEGMENT)
    }

    function getSY() {
        return Math.floor(Math.floor((AP/emu.mw))/emu.SEGMENT)
    }

    function at() {
        let t = lex.expectTuple()
        if (t.length === 2) {
            AP = t[1]*emu.SEGMENT*emu.mh + t[0]*emu.SEGMENT
        } else if (t.length === 4) {
            AP = (t[1]*emu.SEGMENT+t[3])*emu.mh + t[0]*emu.SEGMENT + t[2]
        }
        if (Math.floor(AP/emu.mw) % 2 === 0) DV = 1
        else DV = -1
        testOutState(ST_DEF)
    }

    function defineHeader(c) {
        // we are generating header
        if (SI === 0) {
            // TODO step scale should be counted here
            DEF.wall = c; SI++;
        } else if (SI === 1) {
            DEF.space = c; SI++;
        } else {
            if (c !== DEF.space) {
                switch (SI) {
                case 2: DEF.def = c; SI++; break;
                case 3:
                    DEF.digit = [];
                    DEF.digit[0] = c;
                    SI++; 
                    break;
                case 4: DEF.digit[1] = c; SI++; break;
                case 5: DEF.digit[2] = c; SI++; break;
                case 6: DEF.digit[3] = c; SI++; break;
                case 7: DEF.digit[4] = c; SI++; break;
                case 8: DEF.digit[5] = c; SI++; break;
                case 9: DEF.digit[6] = c; SI++; break;
                case 10: DEF.digit[7] = c; SI++; break;
                case 11: DEF.term = c; SI++; break;
                case 12: DEF.label = c; SI++; break;
                case 13: DEF.sys = c; SI++; break;
                case 14: DEF.next = c; SI++; break;
                case 15:
                    if (c !== DEF.term) {
                        throw 'Wrong Header!'
                    } else {
                        ST = ST_DEF
                    }
                }
            }
        }
    }

    function genCodel(c) {
        if (ST === ST_OUT) {
            throw "Can't generate codels out of capsule @"
                + (AP % emu.mw) + 'x' + Math.floor(AP / emu.mw)
        }
        emu.putCodel(c, AP)
        if (ST === ST_HEADER) defineHeader(c)
        moveAP()
    }

    function genRaw() {
        let c = lex.expectNumber()
        genCodel(c)
    }

    function putHorizontalWall(x, y, w) {
        for (let i = 0; i < w; i++) {
            emu.putCodel(DEF.wall, x++, y)
        }
    }

    function putVerticalWall(x, y, h) {
        for (let i = 0; i < h; i++) {
            emu.putCodel(DEF.wall, x, y++)
        }
    }

    function genNumber(n) {
        if (ST < 2) throw 'Unable to generate number - header is not defined!'

        let v = []
        do {
            v.push(n % 8)
            n = Math.floor(n/8)
        } while(n > 0)
        v.reverse().forEach( d => genCodel(DEF.digit[d]) )
    }

    function genString(str) {
        genCodel(DEF.label)
        genNumber(str.length)
        genCodel(DEF.next)

        // characters
        str = str.toUpperCase()
        for (let i = 0; i < str.length; i++) {
            let sc = emu.charToSonacode(str.charAt(i))
            genNumber(sc)
        }
        genCodel(DEF.label)
    }

    function id() {
        let id = lex.sval()
        switch (id) {

        // .MACRO
        // TODO most of these must be process on lexer level
        case '.SEGMENT':
            emu.SEGMENT = lex.expectNumber()
            break;
        case '.HEADER':
            ST = ST_HEADER
            SI = 0
            break;
        case '.CAPSULE':
            let t = lex.expectTuple()
            let x = getSX() * emu.SEGMENT
            let y = getSY() * emu.SEGMENT
            putVerticalWall(x, y, t[1]*emu.SEGMENT)
            putVerticalWall(x + t[0] * emu.SEGMENT-1, y, t[1]*emu.SEGMENT)
            putHorizontalWall(x, y + t[1]*emu.SEGMENT-1, t[0]*emu.SEGMENT)
            break;
        case '.SKIP':
            let n = lex.expectNumber()
            for (let i = 0; i < n; i++) {
                genCodel(DEF.space)
            }
            break;
        case '.LF':
            HW_FLAG = false
            while (!HW_FLAG) {
                let c = emu.getCodel(AP)
                if (c !== DEF.wall) {
                    genCodel(DEF.space)
                }
            }
            break;
        case '.T':
            genCodel(DEF.wall)
            // shift down one line
            AP += emu.mw
            // reverse scan
            DV *= -1
            genCodel(DEF.wall)
            genCodel(DEF.wall)
            genCodel(DEF.wall)
            break;
        default:
            // try to map from symbol tables
            let macro = MACRO[id]
            if (sys.isNumber(macro)) {
                genNumber(macro)
                genCodel(DEF.next)
            } else {
                let sysCall = emu.map[id]
                if (sysCall) {
                    genNumber(sysCall)
                    genCodel(DEF.sys)
                } else {
                    // try to find a label
                    let label = LABEL[id]
                    if (label) {
                        //console.log('generating label ' + id + ': ' + label + ' @' + (label%emu.mw) + 'x' + Math.floor(label/emu.mw))
                        genNumber(label)
                        genCodel(DEF.next)
                    } else {
                        log.warn('unknown id: ' + lex.getLastToken())
                    }
                }
            }
        }
    }

    let token
    do {
        token = lex.next()

        switch (token) {
        case lex.ID:
            id()
            break;

        case lex.OPR:
            switch(lex.sval()) {
            case '#': genRaw(); break;
            case '@': at(); break;
            case ':': genCodel(DEF.def); break;
            case ';': genCodel(DEF.term); break;
            case '!': genCodel(DEF.sys); break;
            case ',': genCodel(DEF.next); break;
            case '_': genCodel(DEF.space); break;
            default: lex.printLastToken()
            }
            break;

        case lex.NUM:
            genNumber(lex.ival())
            break;

        case lex.STR:
            genString(lex.sval())
            break;

        case lex.LABEL:
            LABEL[lex.sval()] = AP
            break;
                
        default:
            lex.printLastToken()

        }
    } while (token != lex.EOF)

    function dumpAP() {
        log.dump('@' + AP + ': '
            + (AP % emu.mw) + 'x' + Math.floor(AP / emu.mw)
            + ' -> ' + DV)
    }

}

