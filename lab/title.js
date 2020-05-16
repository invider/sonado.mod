
let BACKGROUND = '#203040'
let FOREGROUND = '#F0B000'

let TIMER = 0

module.exports = {

    evo: function(dt) {
        // move day indicator if needed
        TIMER -= dt
        if (TIMER < 0) {
            env.state.day++
            lib.day()
            TIMER = env.tuning.dayInSeconds
        }
    },

    draw: function() {
        ctx.fillStyle = BACKGROUND
        ctx.fillRect(0, 0, ctx.width, env.tuning.header)

        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.font = "20px T04B_08";
        ctx.fillStyle = FOREGROUND

        ctx.fillText('Day ' + env.state.day, ctx.width*0.05, 5)
        ctx.fillText('dev chips: ' + env.state.dev, ctx.width*0.35, 5)
        ctx.fillText('rom chips: ' + env.state.rom, ctx.width*0.55, 5)
        ctx.fillText('Balance: $' + env.state.money, ctx.width*0.8, 5)
    },

}
