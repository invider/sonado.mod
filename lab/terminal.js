'mode strict'
let B = 7
let W = 28
let H = 32
let F = 14
let HF = F/2
let VW = W*F + B*2
let VH = H*F + B*2
//let SCALE = 1.5
let SCALE = 1
let BORDER = 8
let BLINK = 0.7
let BTIMER = BLINK
let OUT_SPEED = 0.03
let OTIMER = 0
let SESSION_TIME = 0

let BACKGROUND = '#102020'
let FOREGROUND = '#40FF00'
let BLOCKED = '#F0A000'

module.exports = {

    Z: 3,

    focus: true,

    changeFlag: true,

    buf: [],

    busy: false,

    input: '',

    cur: (H-1)*W,

    init: function() {
        // create terminal canvas
        this.tcanvas = document.createElement('canvas')
        this.tcanvas.width = VW
        this.tcanvas.height = VH
        this.tctx = this.tcanvas.getContext('2d')
        this.cls()
    },

    // clear the screen
    cls: function() {
        for (let i = 0; i < W*H; i++) this.buf[i] = ' '
        this.changeFlag = true
    }, 

    // clear the last line
    clearLast: function() {
        let p = W*(H-1)
        for (let i = 0; i < W; i++) this.buf[p++] = ' '
        this.changeFlag = true
    }, 

    set: function(c, x, y) {
        this.buf[x + y*W] = c.charAt(0)
        this.changeFlag = true
    }, 

    scroll: function() {
        let limit = W*(H-1)
        // move all up
        for (let i = 0; i < limit; i++) {
            this.buf[i] = this.buf[i+W]
        }
        // clear the last line
        this.clearLast()
        this.changeFlag = true
    },

    mv: function(n) {
        this.cur += n

        if (this.cur >= W*H) {
            this.cur = W*(H-1)
            this.scroll()
        } else if (this.cur < 0) {
            this.cur = 0
        }
        this.changeFlag = true
    },

    lf: function() {
        this.mv(W-(this.cur%W))
        this.changeFlag = true
    },

    del: function() {
        this.mv(-1)
        this.outc(' ')
        this.mv(-1)
        this.changeFlag = true
    },

    outc: function(c) {
        // handle control sequences
        if (c === '\n') this.lf()
        else if (c === '\t') {
            this.outc(' '); this.outc(' ');
            this.outc(' '); this.outc(' ');
        } else {
            // normalize char
            let v = c.toUpperCase().charAt(0)
            let d = v.charCodeAt(0)
            // skip all non-printable characters (non-latin, &)
            if (d < 0x20 || d > 0x5F
                    || d === 0x26
                    || d === 0x28
                    || d === 0x29
                    || d === 0x5B
                    || d === 0x5D) {
                v = '?'
            }

            this.buf[this.cur] = v
            this.mv(1)
        }
        this.changeFlag = true
    },

    out: function(text) {
        for (let i = 0; i < text.length; i++) {
            this.outc(text.charAt(i))
        }
    },

    print: function(text) {
        // send text to input buffer and rise the busy flag
        this.busy = true
        this.input += text
    },

    line: function(n) {
        let sh = n * W
        let line = ''
        for (let i = 0; i < W; i++) {
            line += this.buf[sh+i]
        }
        return line
    },

    key: function(c, k) {
        if (this.focus) {
            BTIMER = -BLINK/2
            
            // move line input handling functionality
            // to the shell interpreter
            if (k === 'Enter') {
                this.lf()
                lab.shell.cmd()
            } else if (k === 'Tab') {
                this.out('    ')
                lab.shell.key('    ')
            } else if (k === 'Backspace') {
                this.del()
                lab.shell.del()
            } else if (c.length === 1) {
                c = c.toUpperCase()
                this.outc(c)
                lab.shell.key(c)
            }
        }
    },

    onClick: function(e) {
        if (e.x >= this.x && e.x <= this.x+this.w
                && e.y >= this.y && e.y <= this.y+this.h) {
            this.focus = true
            this.changeFlag = true
        } else {
            this.focus = false
            this.changeFlag = true
        }
    },

    evo: function(dt) {
        BTIMER += dt
        SESSION_TIME += dt

        if (this.input.length > 0) {
            OTIMER -= dt
            if (OTIMER < 0) {
                OTIMER = OUT_SPEED
                // send next symbol
                let c = this.input.charAt(0)
                this.input = this.input.substring(1)

                // check if new line needed
                if (c != ' ' && c != '\t' && c != '\n'  && this.input.length > 0) {
                    let w = this.input.split(/\s+/g)[0]
                    let more = W - this.cur % W
                    if (w.length < W && w.length >= more) {
                        this.outc('\n')
                    }
                }
                this.outc(c)

                if (this.input.length === 0) {
                    lab.shell.invite()
                }
            }
        } else {
            this.busy = false
        }
    },
    
    draw: function() {
        if (this.changeFlag || SESSION_TIME < 1) {
            this.tctx.imageSmoothingEnabled = false
            this.tctx.fillStyle = BACKGROUND
            this.tctx.fillRect(0, 0, VW, VH)

            this.tctx.textAlign = "center"
            this.tctx.textBaseline = "top"
            this.tctx.fillStyle = FOREGROUND
            this.tctx.font = "16px T04B_08";
            //this.tctx.font = "8px T04B_11";
            for (let i = 0; i < H; i++) {
                for (let j = 0; j < W; j++) {
                    this.tctx.fillText(this.buf[i*W + j], j*F+HF+B, i*F+B)
                }
            }

            this.changeFlag = false
        }

        // draw cursor
        if (!this.focus || (BTIMER > BLINK && !this.busy)) {
            if (BTIMER > BLINK*2) BTIMER = 0
            this.tctx.fillStyle = BACKGROUND
            this.tctx.fillRect((this.cur%W)*F+1+B, Math.floor(this.cur/W)*F+1+B, F-2, F-1)
        } else {
            if (this.busy) {
                this.tctx.fillStyle = BLOCKED
            } else {
                this.tctx.fillStyle = FOREGROUND
            }
            this.tctx.fillRect((this.cur%W)*F+1+B, Math.floor(this.cur/W)*F+1+B, F-2, F-1)
        }
        // active frame
        if (this.focus) {
            this.tctx.strokeStyle = env.tuning.activeFrame
            this.tctx.lineWidth = 4
            this.tctx.strokeRect(0, 0, VW, VH)
        }

        this.x = canvas.width-(VW*SCALE)-BORDER
        this.y = canvas.height-(VH*SCALE)-BORDER - env.tuning.footer
        this.w = VW*SCALE
        this.h = VH*SCALE

        ctx.imageSmoothingEnabled = false
        ctx.drawImage(this.tcanvas,
            0, 0, VW, VH,
            this.x, this.y, this.w, this.h)
    }, 

    dump: function() {
        log.out('@' + this.cur + ' ->' + (this.cur % W) + 'x' + Math.floor(this.cur / W))
    }

}
