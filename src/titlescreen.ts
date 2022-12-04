import Background from "./background"
import PiggyGame from "./piggygame"

class TitleScreen extends Background {
    private alpha: number

    constructor(game: PiggyGame) {
        super(game, 'img/title.png')
        this.solid = false
        this.usesGravity = false
        this.visible = true
        this.alpha = 1
        this.zorder = 2
    }

    tick(timeDelta: number): void {
        super.tick(timeDelta)
        const piggyGame = this.game as PiggyGame
        if (!piggyGame.ingame) this.alpha = 1
        else if (this.alpha > 0) this.alpha -= (timeDelta / 500)
    }
    
    render(ctx: CanvasRenderingContext2D): void {
        if (this.alpha > 0) {
            ctx.save()
            ctx.globalAlpha = this.alpha
            super.render(ctx)
            ctx.restore()
        }
    }
}

export default TitleScreen