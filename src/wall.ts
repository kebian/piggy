import { Rect } from "./common-types";
import Entity from "./entity";
import PiggyGame from "./piggygame";

class Wall extends Entity {
    
    constructor(game: PiggyGame, rect: Rect) {
        super(game)
        this._collisionRect = {... rect}
        this.solid = true
        this.visible = true
    }

    render(ctx: CanvasRenderingContext2D): void {
        const rect = this.collisionRect
        ctx.fillStyle="#ff0000";
        ctx.fillRect(rect.left, rect.top, rect.right - rect.left +1, rect.bottom - rect.top +1);    
    }
}

export default Wall