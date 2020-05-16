
let BACKGROUND = '#203040'
let FOREGROUND = '#F0B000'

module.exports = {

    status: 'a game by igor khotin',

    meta: 'Meta Game Jam 2018',

    draw: function() {
        ctx.fillStyle = BACKGROUND
        ctx.fillRect(0, ctx.height-env.tuning.footer, ctx.width, env.tuning.footer)

        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        ctx.fillStyle = FOREGROUND
        ctx.font = "20px T04B_08";
        ctx.fillText(this.status, 10, ctx.height-env.tuning.footer+5)

        ctx.textAlign = "right"
        ctx.fillText(this.meta, ctx.width-20, ctx.height-env.tuning.footer+5)
    },

}
