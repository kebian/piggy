import { PairXY } from "./common-types";
import Entity from "./entity";
import FrameSequence from "./framesequence";
import Game from "./game";
import { ImageResource } from "./resourcecache";

type Animation = {
    name: string
    sequence: FrameSequence
}

class Sprite extends Entity {
    private sheetPos: PairXY
    private size: PairXY
    private numFrames: number
    protected animations: Map<string, Animation>
    private currentAnimation: Animation | null
    private framesPerRow: number
    private sheet: HTMLImageElement

    constructor(game: Game, url: string, sheetPos: PairXY, size: PairXY, numFrames: number) {
        super(game)
        this.sheetPos = sheetPos
        this.size = size
        this.numFrames = numFrames
        this.sheet = (game.resources.get(url) as ImageResource).image
        this.framesPerRow = Math.floor(this.sheet.width / size.x) // TODO: Check this - it was size[1]
        this.animations = new Map()
        this.currentAnimation = null
        this.visible = true
        this._collisionRect = { left: 0, top: 0, right: size.x -1, bottom: size.y -1}
    }

    get currentFrame() {
        return this.animation?.sequence.frame
    }

    render(ctx: CanvasRenderingContext2D): void {
        if (!this.currentAnimation || this.currentFrame === undefined) return

        const row = Math.floor(this.currentFrame / this.framesPerRow)
        const col = this.currentFrame % this.framesPerRow

        // Temporarily render collision rect
        const cr = this.collisionRect;
        ctx.fillStyle="blue";
        ctx.fillRect(cr.left, cr.top, cr.right - cr.left +1, cr.bottom - cr.top +1);
    
        ctx.drawImage(
            this.sheet, this.sheetPos.x + (col * this.size.x), 
            this.sheetPos.y + (row * this.size.y),
            this.size.x,
            this.size.y,
            this._position.x,
            this._position.y,
            this.size.x,
            this.size.y
        )
    }

    addAnimation(animation: Animation) {
        this.animations.set(animation.name, animation)
        if (!this.currentAnimation) this.currentAnimation = animation
    }

    setAnimation(name: string) {
        if (this.currentAnimation?.name === name) return
        const newAnimation = this.animations.get(name)
        if (newAnimation === undefined) throw new Error(`Unknown animation: ${name}`)
        this.currentAnimation = newAnimation
        this.currentAnimation.sequence.reset()
    }

    getAnimation(name: string) {
        const animation = this.animations.get(name)
        if (animation === undefined) throw new Error(`Unknown animation: ${name}`)
        return animation
    }

    get animation() {
        return this.currentAnimation
    }

    public tick(timeDelta: number) {
        super.tick(timeDelta)
        this.currentAnimation?.sequence.tick(timeDelta)
    }
}

export default Sprite