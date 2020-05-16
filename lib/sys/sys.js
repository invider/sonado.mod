module.exports = {
    cmd: function(args) {
        this.shell.cur = this.shell.sys
        this.shell.sys.open()
    },
    help: 'open sys dir'
}
