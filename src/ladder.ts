import { Rect } from "./common-types";
import Entity from "./entity";
import Game from "./game";


class Ladder extends Entity {
    private rect: Rect

    constructor(game: Game, rect: Rect) {
        super(game)
        this.rect = rect
        //this.visible = true
    }

    getCollisionRect(): Rect {
        return this.rect
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle="#00ff00";
        ctx.fillRect(this.rect.left,
            this.rect.top,
            this.rect.right - this.rect.left +1,
            this.rect.bottom - this.rect.top +1
        )
    }
}

export default Ladder