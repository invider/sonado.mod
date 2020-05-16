'strict mode'

let SW = 6
let SW2 = SW*2
let BORDER = 8
let BACKGROUND = '#102030'
let MEMORY_BACKGROUND = '#d0d0f0'

let toStyle = function(c) {
    return 'rgb('
        + ((c & 0xff0000) >>> 16) + ', '
        + ((c & 0x00ff00) >>> 8) + ', '
        + (c & 0xff) + ')'
}

let Editor = function() {
    this.Z = 2

    this.focus = false
    this.visible = true

    this.targetX = 0
    this.targetY = 5
    this.paletteX = 7
    this.paletteY = 0
    this.targetColor = 0x9241f3
    this.vframe = {}
    this.eframe = {}
    this.pframe = {}
}

Editor.prototype.onEditorClick = function(x, y) {
    x = Math.floor(x/this.eframe.cell)
    y = Math.floor(y/this.eframe.cell)
    if (!this.targetColor) {
        lab.vm.emu.putCodel(0xff0000, this.targetX, this.targetY, x, y)
        lab.vm.emu.setAlpha(0x00, this.targetX, this.targetY, x, y)
    } else {
        lab.vm.emu.putCodel(this.targetColor, this.targetX, this.targetY, x, y)
    }
}

Editor.prototype.onMapClick = function(x, y) {
    this.targetX = Math.floor(x/this.vframe.cell)
    this.targetY = Math.floor(y/this.vframe.cell)
}

Editor.prototype.onPaletteClick = function(x, y) {
    x = Math.floor(x/this.pframe.cell)
    y = Math.floor(y/this.pframe.cell)
    if (y > 3) {
        this.targetColor = false
        lab.status.status = 'transparent'
    } else {
        this.targetColor = lab.vm.emu.getCodel(this.paletteX, this.paletteY, x, y)
        lab.status.status = this.targetColor.toString(16)
    }
}

Editor.prototype.onClick = function(e) {
    if (e.x >= this.x && e.x <= this.x+this.w
            && e.y >= this.y && e.y <= this.y+this.h) {
        if (!this.focus) {
            this.focus = true
        } else {
            if (e.x >= this.eframe.x && e.x <= this.eframe.x+this.eframe.w
                    && e.y >= this.eframe.y && e.y <= this.eframe.y+this.eframe.h) {
                this.onEditorClick(e.x - this.eframe.x, e.y - this.eframe.y)
            } else if (e.x >= this.vframe.x && e.x <= this.vframe.x+this.vframe.w
                    && e.y >= this.vframe.y && e.y <= this.vframe.y+this.vframe.h) {
                this.onMapClick(e.x - this.vframe.x, e.y - this.vframe.y)
            } else if (e.x >= this.pframe.x && e.x <= this.pframe.x+this.pframe.w
                    && e.y >= this.pframe.y && e.y <= this.pframe.y+this.pframe.h) {
                this.onPaletteClick(e.x - this.pframe.x, e.y - this.pframe.y)
            }
        }
    } else {
        this.focus = false
    }
}

Editor.prototype.evo = function(dt) {
    if (!lab.vm.emu) return
}

Editor.prototype.draw = function() {
    if (!lab.vm.emu) return
    let segments = lab.vm.emu.mw/lab.vm.emu.SEGMENT

    this.x = BORDER
    this.y = BORDER + env.tuning.header
    this.h = ctx.height - BORDER*2 - env.tuning.header - env.tuning.footer
    this.w = ctx.height*0.4

    // active frame
    if (this.focus) {
        ctx.strokeStyle = env.tuning.activeFrame
        ctx.lineWidth = 4
        ctx.strokeRect(this.x, this.y, this.w, this.h)
    }
    
    // plane
    ctx.fillStyle = BACKGROUND
    ctx.fillRect(this.x, this.y, this.w, this.h)

    // memory map
    this.vframe.x = this.x + SW
    this.vframe.y = this.y + SW
    this.vframe.w = this.w-SW2
    this.vframe.h = this.vframe.w
    this.vframe.cell = this.vframe.w / segments

    ctx.fillStyle = MEMORY_BACKGROUND
    ctx.fillRect(this.vframe.x, this.vframe.y, this.vframe.w, this.vframe.h)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(lab.vm.emu.mcanvas,
        0, 0, lab.vm.emu.mw, lab.vm.emu.mh,
        this.vframe.x, this.vframe.y, this.vframe.w, this.vframe.h)

    // editor
    let border = this.w * 0.3
    this.eframe.x = this.x + border/2
    this.eframe.y = this.vframe.y + this.vframe.h + SW
    this.eframe.w = this.w - border
    this.eframe.h = this.eframe.w
    this.eframe.cell = this.eframe.w/lab.vm.emu.SEGMENT
    let b = 3

    for (let j = 0; j < lab.vm.emu.SEGMENT; j++) {
        for (let i = 0; i < lab.vm.emu.SEGMENT; i++) {
            let c = lab.vm.emu.getCodel(this.targetX, this.targetY, i, j)
            let a = lab.vm.emu.getAlpha(this.targetX, this.targetY, i, j)
            
            if (a !== 0) {
                ctx.fillStyle = 'rgb('
                        + ((c & 0xff0000) >>> 16) + ', '
                        + ((c & 0x00ff00) >>> 8) + ', '
                        + (c & 0xff) + ')'
                ctx.fillRect(this.eframe.x + i*this.eframe.cell + b/2,
                    this.eframe.y + j*this.eframe.cell + b,
                    this.eframe.cell-b, this.eframe.cell-b)
            } else {
                ctx.lineWidth = 2
                ctx.strokeStyle = env.tuning.paletteHighlight
                ctx.strokeRect(this.eframe.x + i*this.eframe.cell + b/2,
                    this.eframe.y + j*this.eframe.cell + b,
                    this.eframe.cell-b, this.eframe.cell-b)
            }
        }
    }

    // palette
    border = this.w * 0.45
    let colorHeight = 20
    this.pframe.x = this.x + border/2
    this.pframe.y = this.eframe.y + this.eframe.h + b*2 + colorHeight
    this.pframe.w = this.w - border
    this.pframe.h = this.pframe.w/2 + b + colorHeight
    this.pframe.cell = this.pframe.w/lab.vm.emu.SEGMENT
    b = 3

    if (this.targetColor !== false) {
        ctx.fillStyle = toStyle(this.targetColor)
        ctx.fillRect(this.pframe.x, this.pframe.y-colorHeight, this.pframe.w, colorHeight-b)
    }
    for (let j = 0; j < lab.vm.emu.SEGMENT/2; j++) {
        for (let i = 0; i < lab.vm.emu.SEGMENT; i++) {
            let c = lab.vm.emu.getCodel(this.paletteX, this.paletteY, i, j)
            
            if (this.targetColor === c) {
                ctx.lineWidth = 5
                ctx.strokeStyle = env.tuning.paletteSelector
                ctx.strokeRect(this.pframe.x + i*this.pframe.cell+b/2,
                    this.pframe.y + j*this.pframe.cell+b,
                    this.pframe.cell-b, this.pframe.cell-b)
            }

            ctx.fillStyle = toStyle(c)
            ctx.fillRect(this.pframe.x + i*this.pframe.cell+b/2,
                this.pframe.y + j*this.pframe.cell+b,
                this.pframe.cell-b, this.pframe.cell-b)

        }
    }

    if (this.targetColor === false) {
        ctx.lineWidth = 3
        ctx.strokeStyle = env.tuning.paletteSelector
    } else {
        ctx.lineWidth = 2
        ctx.strokeStyle = env.tuning.activeArea
    }
    ctx.strokeRect(this.pframe.x, this.pframe.y+this.pframe.h-colorHeight, this.pframe.w, colorHeight)

}

module.exports = new Editor()

