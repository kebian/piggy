import { PairXY } from './common-types'
import Entity from './entity'
import Game from './game'

class Text extends Entity {
    private text: string
    constructor(game: Game, text: string, position: PairXY) {
        super(game)
        this.position = position
        this.text = text
        this.zorder = 2
        this.visible = true
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.font = '10px Arial bolder'
        ctx.fillStyle = 'white'
        ctx.fillText(this.text, this._position.x, this._position.y)
    }
}

export default Text
