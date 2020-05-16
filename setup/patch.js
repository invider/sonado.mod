module.exports = function() {
    /*
    lab.draw = function() {
        // background nodes
        this._ls.forEach(e => { if (e.Z === 0) e.draw() })

        for (let i = 0; i < this._ls.length; i++) {
            let e = this._ls[i]
            if (e.draw && !e.dead && !e.hidden && !e.focus) {
                e.draw()
            }
        }

        this._ls.forEach(e => { if (e.focus === true) e.draw() })
    }
    */


    lab.shell.start()

    // insert and assemble cart
    lab.vm.insertCart(res.rom.ROM_X1, res.asm.header)

}
