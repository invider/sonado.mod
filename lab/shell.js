'mode strict'

let Shell = function() {
    this.line = ''
    this.shell = this
    this.root = true
}

Shell.prototype.include = function(target, node) {
    node._ls.forEach(e => {
        if (sys.isFrame(e)) {
            let dir = new Dir(e.name)
            target.put(dir)
            this.include(dir, e)
        } else {
            if (e.cmd) {
                target.put(new Cmd(e.name, e.cmd, e.help))
            }
        }
    })
}

Shell.prototype.start = function() {
    let shell = this
    let system = shell.sys
    let home = shell.home

    // messages
    let messages = new Dir('messages')
    // patch title function
    messages.title = function() {
        let fresh = this.ls.reduce((a, v) => {
            if (!v.opened) return a+1
            else return a;
        }, 0)
        return this.name + ' <' + fresh + '/' + this.ls.length + '>'
    }
    messages.put = function(block) {
        Dir.prototype.put.call(this, block)
    }
    home.put(messages)
    this.messages = messages

    // initial welcome messages
    messages.put(new Msg('sysop', 'welcome', res.msg.welcome))
    messages.put(new Msg('sonado inc.', 'certified', res.msg.sonado))
    messages.put(new Msg('support', 'dev kit info', res.msg.devkit))
    messages.put(new Msg('support', 'upgrades info', res.msg.upgrades))

    // inventory
    home.put(new Cmd('inventory', function() {
        shell.println('dev chips: ' + env.state.dev)
        shell.print('rom chips: ' + env.state.rom)
    }))

    let library = new Dir('library')
    library.extend = function(rom, name) {
        let insertRom = new Cmd(name, function() {
            this.shell.print('inserting rom <' + name + '>')
            lab.vm.insertCart(rom)
        })
        library.put(insertRom)
    }
    home.put(library)

    // load library
    lab.shell.home.dir.library.extend(res.rom.ROM_B1, 'b.v1')
    lab.shell.home.dir.library.extend(res.rom.ROM_B2, 'b.v2')
    lab.shell.home.dir.library.extend(res.rom.ROM_B2, 'b.v3')

    // market
    let market = new Dir('market')
        shell.cur = shell.home
    home.put(market)
    this.market = market

    // attach commands
    this.include(this.sys, lib.sys)
    this.include(this.home, lib.cmd)

    this.print(res.msg.hello)
}

Shell.prototype.key = function(k) {
    this.line += k
}

Shell.prototype.del = function() {
    if (this.line.length > 0) {
        this.line = this.line.substring(0, this.line.length-1)
    }
}

Shell.prototype.invite = function() {
    lab.terminal.outc('\n')
    lab.terminal.outc('>')
}

Shell.prototype.print = function(txt) {
    lab.terminal.print(txt.toUpperCase())
}

Shell.prototype.println = function(txt) {
    lab.terminal.print(txt.toUpperCase() + '\n')
}

Shell.prototype.cmd = function() {
    let line = this.line.trim().toLowerCase()
    let args = line.split(' ')
    let cmd = args[0]
    //line = line.substring(args[0].length).trim()

    if (this.sys.test(cmd)) this.sys.open(line)
    else this.cur.open(line)

    this.line = ''
}

Shell.prototype.mount = function(sys, home) {
    this.sys = sys
    this.home = home
    this.cur = home
    sys.attach(this)
    home.attach(this)
}

// directory block
let Dir = function(name) {
    this.name = name.toUpperCase()
    this.ls = []
    this.dir = {}
}
Dir.prototype.attach = function(parent) {
    this.parent = parent
    this.shell = parent.shell
    this.ls.forEach(b => b.attach(this))
}
Dir.prototype.detach = function(node) {
    let i = this.ls.findIndex(e => e === node)
    if (i >= 0) this.ls.splice(i, 1)
    this.dir[node.name] = null
}
Dir.prototype.clean = function() {
    this.ls = []
    this.dir = {}
}
Dir.prototype.open = function(line) {
    if (!line || line.length === 0 || line === 'ls' ||line === 'dir') {
        if (this.shell.cur !== this) {
            // change to dir
            this.shell.cur = this
        }
        if (!this.parent.root) {
            this.shell.print('0.UP\n')
        }
        if (this.ls.length === 0) {
            this.shell.print('<empty>')
        } else {
            this.ls.forEach( (b, i) => {
                this.shell.print('' + (i+1) + '.' + b.title() + '\n')
            })
        }
    } else {
        let args = line.split(' ')
        let name = args[0]
        let index = parseInt(name)
        let block
        if (isNaN(index)) {
            block = this.dir[name]
        } else {
            if (index === 0) {
                if (!this.parent.root) block = this.parent
                else block = this
            } else {
                block = this.ls[index-1]
            }
        }

        if (block) {
            block.open(line.substring(name.length).trim())
        } else {
            this.shell.print('UNKNOWN COMMAND ' + name + '!\nTRY HELP.')
        }
    }
}
Dir.prototype.put = function(block) {
    if (block) {
        block.name = block.name.toLowerCase()
        this.ls.push(block)
        this.dir[block.name] = block
        block.attach(this)
    }
}
Dir.prototype.test = function(name) {
    return (this.dir[name] !== undefined)
}
Dir.prototype.title = function() {
    return this.name
}

// generic block
let Block = function(name) {
    this.name = name
}
Block.prototype.attach = function(parent) {
    this.parent = parent
    this.shell = parent.shell
}
Block.prototype.test = function() {
    return false
}
Block.prototype.title = function() {
    return this.name
}

// text block
let Text = function(name, text) {
    this.name = name.toUpperCase()
    this.text = text.toUpperCase()
}
Text.prototype = new Block()
Text.prototype.open = function() {
    this.shell.print(this.text)
}

// message
let MESSAGES_COUNT = 1
let Msg = function(from, topic, text) {
    this.name = 'message' + MESSAGES_COUNT++
    if (!topic) topic = ''
    if (!text) text = ''
    this.from = from.toUpperCase()
    this.topic = topic.toUpperCase()
    this.text = text.toUpperCase()
}
Msg.prototype = new Text('', '')
Msg.prototype.open = function() {
    this.shell.print(
        'from: ' + this.from + '\n'
        + 'topic: ' + this.topic + '\n'
        + this.text)
    this.opened = true
}
Msg.prototype.title = function() {
    let title = this.from + ':' + this.topic
    if (this.opened) return title
    return title + ' !'
}

// cmd block
let Cmd = function(name, fn, help) {
    this.name = name
    this.fn = fn
    this.help = help
}
Cmd.prototype = new Block()
Cmd.prototype.open = function(line, args) {
    this.fn(line, args)
}

let shell = new Shell()
let system = new Dir('sys')
let home = new Dir('home')

shell.mount(system, home)
shell.Dir = Dir
shell.Text = Text
shell.Msg = Msg
shell.Cmd = Cmd


module.exports = shell

