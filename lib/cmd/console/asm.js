module.exports = {
    cmd: function() {
        this.shell.print('loading and compiling...')
        lab.vm.emu.selectROM()
    },
    help: 'load and compile asm source'
}
