module.exports = {
    cmd: function() {
        this.shell.print('loading rom...')
        lab.vm.emu.selectROM()
    },
    help: 'load rom image from a file'
}
