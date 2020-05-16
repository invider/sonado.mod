let W = 128
let H = 128
let SEGMENT = 8

let CP = 4  // command pointer
let SD = 1  // scan direction
let ST = 0
let SI = 0
let WI = 0
let AC = 0
let GO = false
let STEP = 1
let TIMER = 0
let TIMERA = 0
let TIMERB = 0
let CYCLES = 0
let DEBUG = 0

let dstack = []
let rstack = []

let ST_INIT = 0
let ST_HEADER = 1
let ST_GO = 2

let INT_SEGMENT = 3
let MAX_INT = 16
let SPRITE_SEGMENT = 32
let MAX_SPRITES = 64
let SPRITE_COUNT = 16

let INT = {
    INT_TIMER: 1,
    INT_TIMER2: 2,
    INT_TIMER3: 3,
    INT_SPRITE_COLLISION: 9,
    INT_SPRITE_WALL: 10,
}

let toStyle = function(c) {
    return 'rgb('
        + ((c & 0xff0000) >>> 16) + ', '
        + ((c & 0x00ff00) >>> 8) + ', '
        + (c & 0xff) + ')'
}

let emu

let segmentAddr = function(n) {
    return (Math.floor(n/emu.sw)*emu.SEGMENT) * emu.mw + (n % emu.sw)*emu.SEGMENT
}

// TODO refactor to make it possible to create several emulators
let Emu = function(vm, img, src) {
    this.vm = vm
    emu = this
    sys.augment(this, INT)

    // setup environment
    this.w = W
    this.h = H
    this.mapSysNames()

    // create emu-device canvas
    this.vcanvas = document.createElement('canvas')
    this.vcanvas.width = W
    this.vcanvas.height = H
    this.vctx = this.vcanvas.getContext('2d')

    // load or create memory image
    if (img) {
        this.initMemory(img)
    } else {
        this.initMemory(false, 32, 32)
    }

    // assemble image from sources
    if (sys.isString(src)) {
        lib.asm(this, src)
    }

    this.reset()
}

Emu.prototype.mapSysNames = function() {
    let map = {}
    let keys = Object.keys(this.sys)

    keys.forEach(k => map[this.sys[k].name] = k)
    this.map = map
}

//***********************************************
// System Calls
// #sys calls
//
Emu.prototype.sys = {

    // vm control
    0: function halt() {
        console.log('halt!')
    },
    1: function nop() {
        console.log('nop')
    },
    2: function dump() {
        log.out('dstack dump: ' + dstack)
        log.out('rstack dump: ' + rstack)
    },
    3: function test() {
        console.log('test!')
    },
    4: function pause() {
        console.log('pause...')
    },
    5: function mask() {
        let i = dstack.pop()
        emu.mask[i] = false
    },
    6: function unmask() {
        let i = dstack.pop()
        emu.mask[i] = true
    },
    7: function int() {
        rstack.push(SD) // save scan direction
        rstack.push(CP) // save return address
        emu.interrupt(dstack.pop())
    },


    // math
    11: function inc() {
        dstack.push(dstack.pop() + 1)
    },
    12: function dec() {
        dstack.push(dstack.pop() - 1)
    },
    13: function add() {
        dstack.push(dstack.pop() + dstack.pop())
    },
    14: function sub() {
        let v = dstack.pop()
        dstack.push(dstack.pop() - v)
    },
    15: function mul() {
        let v = dstack.pop()
        dstack.push(dstack.pop() * v)
    },
    16: function div() {
        let v = dstack.pop()
        dstack.push(Math.round(dstack.pop() / v))
    },
    17: function mod() {
        let v = dstack.pop()
        dstack.push(dstack.pop() % v)
    },


    // comparators and logic
    20: function gr() {
        let w = dstack.pop()
        let v = dstack.pop()
        if (v > w) dstack.push(1)
        else dstack.push(0)
    },
    21: function ls() {
        let w = dstack.pop()
        let v = dstack.pop()
        if (v < w) dstack.push(1)
        else dstack.push(0)
    },
    22: function ls() {
        let w = dstack.pop()
        let v = dstack.pop()
        if (v < w) dstack.push(1)
        else dstack.push(0)
    },
    23: function gre() {
        let w = dstack.pop()
        let v = dstack.pop()
        if (v >= w) dstack.push(1)
        else dstack.push(0)
    },
    24: function lse() {
        let w = dstack.pop()
        let v = dstack.pop()
        if (v <= w) dstack.push(1)
        else dstack.push(0)
    },
    25: function eq() {
        if (dstack.pop() === dstack.pop()) dstack.push(1)
        else dstack.push(0)
    },
    26: function neq() {
        if (dstack.pop() !== dstack.pop()) dstack.push(1)
        else dstack.push(0)
    },
    27: function and() {
        if (dstack.pop() || dstack.pop() === 0) dstack.push(0)
        else dstack.push(1)
    }, 
    28: function or() {
        if (dstack.pop() === 0 && dstack.pop() === 0) dstack.push(0)
        else dstack.push(1)
    }, 
    29: function not() {
        if (dstack.pop() === 0) dstack.push(1)
        else dstack.push(0)
    }, 

    30: function min() {
        let w = dstack.pop()
        let v = dstack.pop()
        if (w < v) dstack.push(w)
        else dstack.push(v)
    },
    31: function max() {
        let w = dstack.pop()
        let v = dstack.pop()
        if (w > v) dstack.push(w)
        else dstack.push(v)
    },



    // flow control
    40: function call() {
        // TODO move to special pattern?
        rstack.push(SD) // save scan direction
        rstack.push(CP) // save return address
        let addr = dstack.pop()
        CP = addr*4
        // consider even lines to be right-scanned
        if (Math.floor(addr/emu.mw) % 2 === 0) SD = 1
        else SD = -1
        console.log('calling @' + addr
            + '[' + (addr%emu.mw) + 'x' + Math.floor(addr/emu.mw) 
            + '] CP: ' + CP + ' -> ' + SD)
    },
    41: function ret() {
        if (rstack.length === 0) return
        let ptr = rstack.pop() // save return address
        let sd = rstack.pop()
        CP = ptr
        SD = sd
        //console.log('jumping back @' + CP + ' -> ' + SD)
    },
    42: function callz() {
        let v = dstack.pop()
        if (v === 0) {
            rstack.push(SD) // save scan direction
            rstack.push(CP) // save return address
            let addr = dstack.pop()
            CP = addr*4
            // consider even lines to be right-scanned
            if (Math.floor(addr/emu.mw) % 2 === 0) SD = 1
            else SD = -1
            console.log('calling @' + addr
                + '[' + (addr%emu.mw) + 'x' + Math.floor(addr/emu.mw) 
                + '] CP: ' + CP + ' -> ' + SD)
        } else {
            console.log('skipping the call ' + emu.atLabel())
        }
    },


    50: function drop() {
        dstack.pop()
    },
    51: function dup() {
        let v = dstack.pop()
        dstack.push(v)
        dstack.push(v)
    },
    52: function swap() {
        let w = dstack.pop()
        let v = dstack.pop()
        dstack.push(w)
        dstack.push(v)
    },
    53: function over() {
        let v = dstack[dstack.length-2]
        dstack.push(v)
    },
    54: function rot() {
        let v1 = dstack.pop()
        let v2 = dstack.pop()
        let v3 = dstack.pop()
        dstack.push(v2)
        dstack.push(v3)
        dstack.push(v1)
    },

    // memory manipulation
    60: function peek() {
        dstack.push(emu.getPixel(dstack.pop()))
    },
    61: function poke() {
        let c = emu.setPixel(dstack.pop(), dstack.pop())
    },
    62: function cpeek() {
        let c = emu.getCodel(dstack.pop())
        let v = dstack[dstack.length-2]
        dstack.push(v)
    },
    63: function cpoke() {
        let c = emu.setCodel(dstack.pop(), dstack.pop())
    },



    // sprite manipulation
    70: function spriteSet() {
        let n = dstack.pop()
        let i = dstack.pop()
        let v = dstack.pop()
        emu.sprite[n].set(i, v)
        // log.out('setting sprite#' + n + '.' + i + ' = ' + v)
        // dump sprite state
        // log.out(emu.sprite[n].dump())
    },
    71: function spriteGet() {
        let n = dstack.pop()
        let i = dstack.pop()
        dstack.push(emu.sprite[n].get(i))
    },
    72: function spriteInc() {
        let n = dstack.pop()
        let i = dstack.pop()
        emu.sprite[n].inc(i)
    },
    73: function spriteDec() {
        let n = dstack.pop()
        let i = dstack.pop()
        emu.sprite[n].inc(i)
    },
    74: function spriteAdd() {
        let n = dstack.pop()
        let i = dstack.pop()
        let v = dstack.pop()
        emu.sprite[n].add(i, v)
    },
    75: function spriteSub() {
        let n = dstack.pop()
        let i = dstack.pop()
        let v = dstack.pop()
        emu.sprite[n].sub(i, v)
    },
}

// TODO make interrupt control sys calls
Emu.prototype.mask = [
    true, // allow interrupts
]

Emu.prototype.interrupt = function(n) {
    if (!this.mask[0] || !this.mask[n]) return

    if (n > 0 && n < MAX_INT) {
        // calculate capsule shift
        let p = segmentAddr(INT_SEGMENT+n)

        this.jump(p)
        // clean up stacks
        while (this.dstack.length > 0) this.dstack.pop()
        while (this.rstack.length > 0) this.rstack.pop()
    } else {
        log.err('unknown interrupt #' + n)
    }
}

Emu.prototype.jump = function(p) {
    CP = p*4 
    AC = 0  // reset number accumulator
    SD = 1  // set default direction
    GO = true
    this.cycle()
}


Emu.prototype.initMemory = function(img, w, h) {
    if (img) {
        this.origWidth = img.width
        this.origHeight = img.height
        this.origImg = img
        this.loadImageData(img)
    } else {
        this.origWidth = w
        this.origHeight = h
        this.loadImageData(false, w, h)

        img = new Image();
        img.src = this.mcanvas.toDataURL();
        this.origImg = img
    }
}

Emu.prototype.loadImageData = function(img, w, h) {
    if (img) {
        w = img.width
        h = img.height
    }

    this.mcanvas = document.createElement('canvas')
    this.mcanvas.width = w
    this.mcanvas.height = h
    this.mctx = this.mcanvas.getContext('2d')

    if (img) {
        this.mctx.imageSmoothingEnabled = false
        this.mctx.drawImage(img, 0, 0)
    } else {
        this.mctx.fillStyle = '#808080'
        this.mctx.fillRect(0, 0, w, h)
    }

    this.imem = this.mctx.getImageData(0,0, w, h);
    this.mem = this.imem.data
    this.mw = w
    this.mw4 = w*4
    this.mh = h
    this.sw = w / SEGMENT
    this.sh = h / SEGMENT

    this.mapToAlpha(0xFFFFFF)
}

// TODO should do only map sprites?
Emu.prototype.mapToAlpha = function(c) {
    let i = 0
    while (i < this.mem.length/4) {
        let c = this.getCodel(i)
        if (c === 0xFFFFFF) {
            this.putRGBA(0xFF, 0xFF, 0xFF, 0x00, i)
        }
        i ++
    }
}

Emu.prototype.setStep = function(i) {
    STEP = i
}

Emu.prototype.getCodel = function(v1, v2, v3, v4) {
    // normalize absolute shift
    if (v4 !== undefined) {
        // coordinates within a segment
        v1 = (v2*this.SEGMENT + v4) * this.mw + v1*this.SEGMENT + v3
    } else if (v2 !== undefined) {
        // global x/y
        v1 = v2*this.mw + v1
    }
    v1 *= 4

    // assemble color components
    return (this.mem[v1++] << 16) | (this.mem[v1++] << 8) | this.mem[v1];
}

Emu.prototype.getAlpha = function(v1, v2, v3, v4) {
    // normalize absolute shift
    if (v4 !== undefined) {
        // coordinates within a segment
        v1 = (v2*this.SEGMENT + v4) * this.mw + v1*this.SEGMENT + v3
    } else if (v2 !== undefined) {
        // global x/y
        v1 = v2*this.mw + v1
    }
    v1 *= 4
    return this.mem[v1+3]
}

Emu.prototype.setAlpha = function(val, v1, v2, v3, v4) {
    // normalize absolute shift
    if (v4 !== undefined) {
        // coordinates within a segment
        v1 = (v2*this.SEGMENT + v4) * this.mw + v1*this.SEGMENT + v3
    } else if (v2 !== undefined) {
        // global x/y
        v1 = v2*this.mw + v1
    }
    v1 *= 4
    this.mem[v1+3] = val
}

Emu.prototype.getPixel = function(v1, v2, v3, v4) {
    // normalize absolute shift
    if (v4) {
        // coordinates within a segment
        v1 = (v2*this.SEGMENT + v4) * this.mw + v1*this.SEGMENT + v3
    } else if (v2) {
        // global x/y
        v1 = v2*this.mw + v1
    }
    v1 *= 4

    // assemble color components
    /*
    return (this.mem[v1++] << 24) | (this.mem[v1++] << 16)
        | (this.mem[v1++] << 8) | this.mem[v1]
    */
    return '#' + this.mem[v1++].toString(16)
        + this.mem[v1++].toString(16)
        + this.mem[v1++].toString(16)
        + this.mem[v1].toString(16)
}

Emu.prototype.putRGBA = function(r, g, b, a, v1, v2, v3, v4) {
    if (v4) {
        // coordinates within a segment
        v1 = (v2*this.SEGMENT + v4) + v1*this.SEGMENT + v3
    } else if (v2) {
        // global x/y
        v1 = v2*this.mw + v1
    }
    v1 *= 4
    this.mem[v1++] = r
    this.mem[v1++] = g
    this.mem[v1++] = b
    this.mem[v1] = a
}

/*
 * could set in 3 address modes:
 * v1 - absolute shift
 * v1/v2 - absolute x/y coordinates
 * v1/v2/v3/v4 - segment x/y followed by x/y within the segment
 */
Emu.prototype.putCodel = function(c, v1, v2, v3, v4) {
    // select color components
    let r = (c & 0xff0000) >>> 16
    let g = (c & 0xff00) >>> 8
    let b = c & 0xff

    if (v4 !== undefined) {
        // coordinates within a segment
        v1 = (v2*this.SEGMENT + v4)*this.mw + v1*this.SEGMENT + v3
    } else if (v2 !== undefined) {
        // global x/y
        v1 = v2*this.mw + v1
    }
    v1 *= 4
    this.mem[v1++] = r
    this.mem[v1++] = g
    this.mem[v1++] = b
    this.mem[v1] = 255
}

/*
 * could set in 3 address modes:
 * v1 - absolute shift
 * v1/v2 - absolute x/y coordinates
 * v1/v2/v3/v4 - segment x/y followed by x/y within the segment
 */
Emu.prototype.putPixel = function(c, v1, v2, v3, v4) {
    // select color components
    let r = (c & 0xff0000) >>> 24
    let g = (c & 0xff00) >>> 16
    let b = (c & 0xff00) >>> 8
    let a = c & 0xff

    if (v4) {
        // coordinates within a segment
        v1 = (v2*this.SEGMENT + v4) + v1*this.SEGMENT + v3
    } else if (v2) {
        // global x/y
        v1 = v2*this.mw + v1
    }
    v1 *= 4
    this.mem[v1++] = r
    this.mem[v1++] = g
    this.mem[v1++] = b
    this.mem[v1] = a
}

Emu.prototype.charToSonacode = function(ch) {
    let c = ch.toUpperCase().charCodeAt(0)
    if (c === 0x5E) {
        c = 0x1F // ?
    } else if (c === 0x0A) {
        c = 0x3E
    } else if (c >= 0x20 && c <= 0x5F) {
        c -= 0x20 // normalize regular
    } else {
        c = 0x1F // ?
    }
    return c
}

Emu.prototype.sonacodeToChar = function(sq) {
}

Emu.prototype.ac = function(digit) {
    AC = AC*8 + digit
}

Emu.prototype.pop = function() {
    return dstack.pop()
}

Emu.prototype.push = function(v) {
    dstack.push(v)
}

Emu.prototype.pushAC = function() {
    dstack.push(AC)
    AC = 0
}

Emu.prototype.eatAC = function() {
    let res = AC
    AC = 0
    return res
}

Emu.prototype.getCP = function() {
    return CP
}

Emu.prototype.getOp = function() {
    return this.getCodel(AC)
}


Emu.prototype.header = function(c) {
    // skip if a spaces or a walls
    if (c === this.DEF.space || c === this.DEF.wall) return;

    let emu = this

    switch(SI) {
    case 0:
        this.PAL[c] = function() {
            log.out('executing define - color #' + c.toString(16) + ' @' + CP)
        }
        this.DEF.def = c;
        SI++; break;
    case 1:
        this.PAL[c] = function() { emu.ac(0); }
        this.DEF.digit = [];
        this.DEF.digit[0] = c;
        SI++; break;
    case 2:
        this.PAL[c] = function() { emu.ac(1); }
        this.DEF.digit[1] = c;
        SI++; break;
    case 3: 
        this.PAL[c] = function() { emu.ac(2); }
        this.DEF.digit[2] = c;
        SI++; break;
    case 4: 
        this.PAL[c] = function() { emu.ac(3); }
        this.DEF.digit[3] = c;
        SI++; break;
    case 5: 
        this.PAL[c] = function() { emu.ac(4); }
        this.DEF.digit[4] = c;
        SI++; break;
    case 6: 
        this.PAL[c] = function() { emu.ac(5); }
        this.DEF.digit[5] = c;
        SI++; break;
    case 7: 
        this.PAL[c] = function() { emu.ac(6); }
        this.DEF.digit[6] = c;
        SI++; break;
    case 8: 
        this.PAL[c] = function() { emu.ac(7); }
        this.DEF.digit[7] = c;
        SI++; break;
    case 9:
        this.PAL[c] = function() { log.out('define') }
        this.DEF.term = c; SI++; break;
    case 10:
        this.PAL[c] = function() { log.out('label') }
        this.DEF.label = c; SI++; break;
    case 11:
        // define sys call
        this.PAL[c] = function() {
            let ac = emu.eatAC()
            let fn = emu.sys[ac]
            if (!fn) log.out('sys call #' + ac + ' is undefined ' + emu.atLabel())
            else emu.sys[ac]()
        }
        this.DEF.sys = c; SI++; break;
    case 12:
        this.PAL[c] = function() { emu.pushAC() }
        this.DEF.next = c; SI++; break;
    case 13:
        if (c != this.DEF.term) {
            throw 'Wrong header ' + this.atLabel()
                + ' ' + c.toString(16)
        } else {
            ST = ST_GO
            SI = 0
        }
    }
}

Emu.prototype.cycle = function() {
    do {
        CYCLES++
        // assemble codel and move to the next
        let c
        if (SD === 1) {
            c = (this.mem[CP++] << 16)
                | (this.mem[CP++] << 8)
                | this.mem[CP++]
            CP ++
        } else if (SD === -1) {
            c = (this.mem[CP++] << 16)
                | (this.mem[CP++] << 8)
                | this.mem[CP]
            CP -= 6
        }
        if (DEBUG > 0) {
            log.out(c.toString(16) + ' @' + (CP/4))
        }

        // hit the wall?
        if (c === this.DEF.wall) {
            if (WI > 0) {
                // double hit the wall - exit cycle
                GO = false
            } else {
                // get back
                CP -= 8*SD
                // bounce of the wall
                CP += (this.mw4)
                // reverse execution
                SD *= -1
                WI ++
            }
        } else {
            WI = 0
        }

        if (ST === ST_HEADER) {
            this.header(c)
        } else if (ST === ST_GO) {
            // handle codels
            let fn = this.PAL[c]
            if (fn) {
                fn()
            } else {
                //log.out('!' + c.toString(16))
            }
        }

    } while (GO);
}

Emu.prototype.reset = function() {
    CP = 0
    ST = ST_HEADER
    SI = 0
    TIMER = 0
    CYCLES = 0
    dstack = []
    rstack = []
    this.dstack = dstack
    this.rstack = rstack

    this.PAL = []
    this.DEF = {}
    this.DEF.wall = 0x000000
    this.DEF.space = 0xFFFFFF

    // get the wall color and size
    let c = this.getCodel(CP)
    this.DEF.wall = c

    while (c === this.DEF.wall) {
        CP += 4
        c = this.getCodel(CP/4)
        if (c === this.DEF.wall) STEP ++
    }
    this.DEF.space = c

    // create devices
    this.sprite = []
    for (let i = 0; i < SPRITE_COUNT; i++) {
        this.sprite[i] = new lib.dev.Sprite(i)
        this.sprite[i].emu = this
    }

    GO = true
    this.cycle()
}

let keys = []
Emu.prototype.keyDown = function(k) {
    if (!this.vm.focus || this.vm.pause) return
    keys[k] = true
}
Emu.prototype.keyUp = function(k) {
    keys[k] = false
}

// move out to VM level
Emu.prototype.move = function() {

}

Emu.prototype.fire = function() {
    if (!this.vm.focus || this.vm.pause) return
}

Emu.prototype.reload = function() {
    if (!this.vm.focus || this.vm.pause) return
}

let TIMERAV = 1
let TIMERBV = 10
Emu.prototype.evo = function(dt) {
    this.interrupt(this.INT_TIMER)
    TIMER += dt
    TIMERA += dt
    TIMERB += dt

    if (TIMERA > TIMERAV) {
        TIMERA -= TIMERAV
        this.interrupt(this.INT_TIMER2)
    }
    if (TIMERB > TIMERBV) {
        TIMERB -= TIMERBV
        this.interrupt(this.INT_TIMER3)
    }

    // evolve sprits
    
    // fix direction of hero according to keys
    if (keys[1]) this.sprite[0].dir = 1
    else if (keys[2]) this.sprite[0].dir = 2
    else if (keys[3]) this.sprite[0].dir = 3
    else if (keys[4]) this.sprite[0].dir = 4
    else this.sprite[0].dir = 0

    this.sprite.forEach(s => s.evo(dt))
}

Emu.prototype.memDraw = function(x, y, scale) {
    let CPU = CP / 4
    let vx = scale * (CPU % this.mw)
    let vy = scale * (Math.floor(CPU / this.mw))
    let w = this.origImg.width
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.mcanvas, x, y, w*scale, w*scale)

    ctx.lineWidth = 2
    ctx.strokeStyle = '#ff0000'
    ctx.strokeRect(x + vx, y + vy, scale, scale)
}

Emu.prototype.drawSprite = function(i, x, y) {
    // normalize coordinates
    x = Math.round(x)
    y = Math.round(y)
    // determine memory coordinates
    let seg = SPRITE_SEGMENT + i
    let sw = this.mw/SEGMENT
    let sx = (seg % sw) * SEGMENT
    let sy = Math.floor(seg / sw) * SEGMENT
    this.vctx.drawImage(this.mcanvas,
        sx, sy, SEGMENT, SEGMENT,
        x, y, SEGMENT, SEGMENT)

    /*
    // debug output
    this.vctx.fillStyle = '#FF0000'
    this.vctx.font = "8px T04B_08";
    this.vctx.fillText('coord: @' + sx + 'x' + sy, 0, 100)
    */
}

Emu.prototype.draw = function() {
    // draw memory
    this.mctx.putImageData(this.imem, 0, 0)

    /*
    ctx.fillStyle = '#A0A0A0'
    ctx.fillRect(20, 20, 512, 512)

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.mcanvas,
        0, 0, 64, 64,
        20, 20, 512, 512)
    */
    /*
    ctx.drawImage(this.mcanvas,
        0, 0, this.mw, this.mh,
        0, 0, 512, 512)
    */

    // ==================
    // draw screen buffer
    let backgroundColor = this.getCodel(7, 0, 7, 7)
    this.vctx.fillStyle = toStyle(backgroundColor)
    this.vctx.fillRect(0, 0, 128, 128)

    // draw sprites
    // sprites are drawn in high-to-low number priority
    for (let i = this.sprite.length-1; i >= 0; i--) {
        let s = this.sprite[i]
        if (s.state > 0) {
            // visible
            this.drawSprite(s.frame, s.x, s.y)
        }
    }

}

Emu.prototype.saveROM = function() {
    window.open(this.mcanvas.toDataURL('image/png'));
    var gh = this.mcanvas.toDataURL('png');

    var a  = document.createElement('a');
    a.href = gh;
    a.download = 'rom.png';

    a.click()
}

Emu.prototype.loadROM = function(file) {
	let input = file.target;
	var emu = this

	let reader = new FileReader();
	reader.onload = function(){
		let dataURL = reader.result;
		let img = new Image()
		img.src = dataURL
		img.onload = function() {
			emu.initMemory(img)
		}
	};
	reader.readAsDataURL(input.files[0]);
}

Emu.prototype.selectROM = function() {
	let input = document.createElement('input')
	input.setAttribute('type', 'file')
	input.setAttribute('accept', 'image/png')
	input.setAttribute('onchange', '$.lab.vm.emu.loadROM(event)')
	input.click()
}

Emu.prototype.saveScreenshot = function() {
    window.open(this.vcanvas.toDataURL('image/png'));
    var gh = this.vcanvas.toDataURL('png');

    var a  = document.createElement('a');
    a.href = gh;
    a.download = 'screenshot.png';

    a.click()
}

Emu.prototype.loadASM = function(file) {
	let input = file.target;
	var asm = lib.asm
	var emu = this

	let reader = new FileReader();
	reader.onload = function(){
		let src = reader.result;
    	asm(emu, src)
	};
	reader.readAsText(input.files[0]);
}

Emu.prototype.selectASM = function() {
	let input = document.createElement('input')
	input.setAttribute('type', 'file')
	input.setAttribute('accept', 'text/*')
	input.setAttribute('onchange', '$.lab.vm.emu.loadASM(event)')
	input.click()
}

Emu.prototype.atLabel = function() {
    let p = CP/4
    return '@' + p + '['
        + (p % this.mw) + 'x' + Math.floor(p / this.mw)
        + ']' + (SD > 0? '->' : '<-' )
}

Emu.prototype.dumpCP = function() {
    let p = CP/4
    log.debug('@' + p + '['
        + (p % this.mw) + 'x' + Math.floor(p / this.mw)
        + ']' + (SD > 0? '->' : '<-' ))
    log.debug('ST: ' + ST + ' SI: ' + SI)
}

module.exports = Emu

