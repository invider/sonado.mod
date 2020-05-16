
let BORDER = 5
let SCALE = 3

module.exports = {
    Z: 1,

    focus: false,
    pause: false,

    // screen placement
    x: 0,
    y: 0,
    vw: 382,
    vh: 382,

    insertCart: function(rom, asm) {
        // create new emulator with attached rom/asm
        this.emu = new lib.Emu(this, rom, asm)
    },

    assembleCart: function(asm) {
        // create new emulator with attached rom/asm
        this.emu = new lib.Emu(this, false, asm)
        this.emu.vm = this
    },

    reset: function() {
        this.pause = false
        this.emu.reset()
    },

    onClick: function(e) {
        if (e.x >= this.x && e.x <= this.x+this.w
                && e.y >= this.y && e.y <= this.y+this.h) {
            this.focus = true
        } else {
            this.focus = false
        }
    },

    evo: function(dt) {
        if (this.pause) return
        this.emu.evo(dt)
    },

    draw: function() {
        //this.vctx.imageSmoothingEnabled = false
        //this.vctx.drawImage(this.origImg, 0, 0, 16, 16, 0, 0, 64, 64)
        
        // draw video memory
        /*
        var image = new Image()
        image.src = this.emu.vcanvas.toDataURL()
        ctx.imageSmootingEnabled = false
        ctx.drawImage(image, this.x, this.y, this.vw, this.vh)
        */

        // draw emu
        this.emu.draw()

        if (this.focus) {
            this.w = ctx.height * 0.7
            this.y = ctx.height * 0.1
        } else {
            this.y = ctx.height * 0.1
            this.w = ctx.height * 0.4
        }
        this.h = this.w
        this.x = ctx.width/2 - this.w/2

        // active frame
        if (this.focus) {
            ctx.strokeStyle = env.tuning.activeFrame
            ctx.lineWidth = 4
            ctx.strokeRect(this.x, this.y, this.w, this.h)
        }

        // move screen buffer to the screen
        ctx.drawImage(this.emu.vcanvas,
            this.x, this.y, this.w, this.h)

        // draw dump
        //this.emu.memDraw(0, ctx.height - this.emu.mh*8, 8)
    }
}
