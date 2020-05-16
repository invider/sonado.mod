module.exports = {
    cmd: function() {
        this.shell.print('saving rom...')
        lab.vm.emu.saveROM()
    },
    help: 'save rom image to a file'
}
