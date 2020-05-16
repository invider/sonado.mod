module.exports = {
    cmd: function() {
        this.shell.print('pausing console...')
        lab.vm.pause = true
    },
    help: 'pause the console'
}
