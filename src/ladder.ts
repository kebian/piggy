import { Rect } from "./common-types";
import Entity from "./entity";
import Game from "./game";


class Ladder extends Entity {

    constructor(game: Game, rect: Rect) {
        super(game)
        this._collisionRect = { ...rect }
        this.zorder = -1
        this.visible = true
        this.solid = false
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle="#00ff00";
        ctx.fillRect(this.collisionRect.left,
            this.collisionRect.top,
            this.collisionRect.right - this.collisionRect.left +1,
            this.collisionRect.bottom - this.collisionRect.top +1
        )
    }
}

export default Ladder