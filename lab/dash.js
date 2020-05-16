module.exports = {
    Z: 0,

    evo: function() {
    },
    
    draw: function() {
        // background
        ctx.fillStyle = '#150525'
        ctx.fillRect(0, 0, ctx.width, ctx.height)

        /*
        // text
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = '#FFFF00'

        
        let y = 100
        for (let i = 0; i < 11; i++) {
            let f = '32px zekton'
            switch (i) {
            case 1: f = "32px T04B_03B"; break;
            case 2: f = "32px T04B_08"; break;
            case 3: f = "32px T04B_11"; break;
            case 4: f = "16px T04B_20"; break;
            case 5: f = "32px T04B_21"; break;
            case 6: f = "32px T04B_30"; break;
            case 7: f = "24px T04B_31"; break;
            case 8: f = "40px percyPixel"; break;
            case 9: f = "64px pixelText"; break;
            case 10: f = ctx.font="32px acknowtt"; break;
            }
            ctx.font = f 
            ctx.fillText("#" + i + ": " + "MESSAGE: Hello World!", ctx.width/2, y)
            y += 40
        }
        */
    },
}
