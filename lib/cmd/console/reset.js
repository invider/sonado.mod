module.exports = {
    cmd: function() {
        this.shell.print('reseting console...')
        lab.vm.reset()
    },
    help: 'reset the console'
}
