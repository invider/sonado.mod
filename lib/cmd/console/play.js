module.exports = {
    cmd: function() {
        this.shell.print('playing console...')
        lab.vm.pause = false
    },
    help: 'resume the playback'
}
