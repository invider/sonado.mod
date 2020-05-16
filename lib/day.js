
function newItem() {
    let n = (lib.math.rndi(17) + 1) * 100
    let variation = lib.math.rndi(60)/10 - 3
    let price = 5 + variation
    let total = Math.round(price * n)

    let item = new lab.shell.Cmd(
            'selling ' + n + ' chips\n  $' + price
            + ' for each, $' + total + ' total', function() {
        if (env.state.money < total) {
            lab.shell.print("you don't have enough money!")
        } else {
            lab.shell.println('buying ' + n + ' rom chips for $' + total)
            env.state.rom += n
            env.state.money -= total
            lab.shell.println('you have ' + env.state.rom + ' chips now')
            lab.shell.print('you balance: ' + env.state.money)
            this.parent.detach(this)
        }
    })
    lab.shell.market.put(item)
}

function sale(item) {
    if (item.stock === 0) return
    // determine number
    let n = lib.math.rndi(20)
    if (n > item.stock) n = item.stock
    // determine price
    let pv = 4 - lib.math.rnd(80)/10
    let price = 7 + pv
    let total = Math.round(n * price)
    
    item.stock -= n
    env.state.money += total 
    env.state.saleStat += total
}

let REPORT_NUM = 1
function stat() {
    let stock = env.state.catalog.reduce((a, v) => a + v.stock, 0)
    lab.shell.messages.put(new lab.shell.Msg(
        'sonado inc.',
        'sales report #' + REPORT_NUM++,
        'sales: $' + env.state.saleStat
        + '\nstock: ' + stock + ' roms'
    ))
    env.state.saleStat = 0
}

module.exports = function() {
    // simulate market
    if (lab.shell.cur !== lab.shell.market) {
        // regenerate only when player is out of market
        // to avoid selection mismatch
        lab.shell.market.clean()
        let n = lib.math.rndi(4) + 1
        for (let i = 0; i < n; i++) newItem()
    }

    // simulate sales
    env.state.catalog.forEach(e => sale(e))

    if (env.state.day % 10 === 0 && env.state.saleStat > 0) stat()
}
