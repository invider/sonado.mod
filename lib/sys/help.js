module.exports = {
    cmd: function(line) {
        if (line) {
            let topic = line
            let target = false
            let msg = false
            if (this.shell.cur.test(topic)) {
                target = this.shell.cur.dir[topic]
            } else if (this.shell.sys.test(topic)) {
                target = this.shell.sys.dir[topic]
            }
            if (target && target.help) {
                msg = target.help
            }
            if (msg) {
                shell.print(msg)
            } else {
                shell.print("can't help you with that")
            }
        } else {
            this.shell.print(res.msg.help)
        }
    },
    help: 'shows help messages',
}
