import Entity from "./entity";
import Game from "./game";
import { ImageResource } from "./resourcecache";

class Background extends Entity {
    protected imageUrl: string
    protected image: HTMLImageElement | undefined

    constructor(game: Game, imageUrl: string) {
        super(game)
        this.imageUrl = imageUrl
        this.visible = true
        this.zorder =- 2
    }

    render(ctx: CanvasRenderingContext2D): void {
        if (this.image === undefined)
            this.image = (this.game.resources.get(this.imageUrl) as ImageResource).image
        ctx.drawImage(this.image, 0, 0)
    }
}

export default Background