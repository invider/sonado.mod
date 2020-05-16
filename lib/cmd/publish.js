let MK = 1

module.exports = {
    cmd: function(args) {
        args = args.split(' ')

        let name = args[0]
        let n = parseInt(args[1])
        if (args.length < 2) {
            this.shell.print(this.help)
        } else if (isNaN(n)) {
            this.shell.println('expecting the number of chips to burn')
            this.shell.print(this.help)
        } else if (n > env.state.rom) {
            this.shell.print("you don't have enough chips!")
        } else if (!this.shell.home.dir.library.dir[name]) {
            this.shell.print('no rom in library named <' + name + '>')
        } else {
            env.state.rom -= n
            this.shell.print('burning')
            for (let i = 0; i < n; i++) this.shell.print('.')
            this.shell.println('\n' + n + ' chips burned')
            this.shell.print('<' + name + '> published!')
            env.state.catalog.push({
                name: 'mk' + MK++,
                copies: n,
                stock: n,
                gross: 0,
            })
        }
    },
    help: 'publish the game\nusage:\npublish <rom_name> <#chips>'
}
