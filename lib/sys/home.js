module.exports = {
    cmd: function(args) {
        this.shell.cur = this.shell.home
        this.shell.print('=== back home ===\n')
        this.shell.home.open()
    },
    help: 'open home dir',
}
