module.exports = {
    cmd: function() {
        this.shell.print('making console screenshot...')
        lab.vm.emu.saveScreenshot()
    },
    help: 'save screenshot to a file'
}
