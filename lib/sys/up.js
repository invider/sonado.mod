module.exports = {
    cmd: function(args) {
        if (!this.shell.cur.parent.root) {
            this.shell.cur.parent.open()
        } else {
            this.shell.cur.open()
        }
    },
    help: 'one dir up'
}

