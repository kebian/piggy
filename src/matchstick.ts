import { PairXY } from "./common-types";
import Entity from "./entity";
import FrameSequence from "./framesequence";
import Ladder from "./ladder";
import Piggy from "./piggy";
import PiggyGame from "./piggygame";
import Sprite from "./sprite";

type MoveDirection = 'up' | 'down' | 'left' | 'right' | 'fall' | 'stand'

class Matchstick extends Sprite {
    private walkSpeed: number
    private climbSpeed: number
    private falling: boolean
    private moveDirection: MoveDirection
    constructor(game: PiggyGame, position: PairXY) {
        super(game, game.resPath('img/sprites.png'), { x: 0, y: 48 }, { x: 28, y: 29 }, 26)
        this.solid = true
        this.falling = false
        this.usesGravity = true
        this.walkSpeed = 20
        this.climbSpeed = 20
        this.position = position
        this._collisionRect = { left: 14, top: 1, right: 16, bottom: 28 }
        this.addAnimation({ name: 'stand', sequence: new FrameSequence({ frames: [6, 7], fps: 20, repeat: true })})
        this.addAnimation({ name: 'down', sequence: new FrameSequence({ frames: [21, 20, 19, 18, 17, 16], fps: 10, repeat: true })})
        this.addAnimation({ name: 'up', sequence: new FrameSequence({ frames: [16, 17, 18, 19, 20, 21], fps: 10, repeat: true })})
        this.addAnimation({ name: 'fall', sequence: new FrameSequence({ frames: [14, 15], fps: 10, repeat: true })})
        this.addAnimation({ name: 'right', sequence: new FrameSequence({ frames: [8, 9, 10, 11, 12, 13], fps: 10, repeat: true })})
        this.addAnimation({ name: 'left', sequence: new FrameSequence({ frames: [5, 4, 3, 2, 1, 0], fps: 10, repeat: true })})
        this.moveDirection = 'stand'
    }

    protected handleCollisionWith(other: Entity): void {
        super.handleCollisionWith(other)

        if (other instanceof Piggy) this.moveDir('stand')
    }

    private moveDir(dir: MoveDirection)  {
        if (this.moveDirection === dir) return // Already doing that

        // Unapply all movement forces
        switch(this.moveDirection) {
            case 'right':
                this.applyForce({ x: -this.walkSpeed, y: 0 })
                break
            case 'left':
                this.applyForce({ x: this.walkSpeed, y: 0 })
                break
            case 'up':
                this.applyForce({ x: 0, y: this.climbSpeed })
                break
            case 'down':
                this.applyForce({ x: 0, y: -this.climbSpeed})
                break
        }

        switch(dir) {
            case 'right':
                this.applyForce({ x: this.walkSpeed, y: 0 });
                break;
            case 'left':
                this.applyForce({ x: -this.walkSpeed, y: 0 });
                break;
            case 'up':
                this.applyForce({ x: 0, y: -this.climbSpeed });
                break;
            case 'down':
                this.applyForce({ x: 0, y: this.climbSpeed });
                break;
            case 'fall':
                break;   
        }

        this.moveDirection = dir
        this.setAnimation(dir)
    }

    private chasePiggy() {
        const piggy = this.game.entityByName('piggy')
        if (piggy === undefined) throw new Error("Can't find piggy entity")
        if (this.inCenterOfLadder) {
            const yOffset = (this._collisionRect.bottom - 1) - (piggy.collisionRect.bottom - 1)
            const yDiff = (this._position.y - piggy.position.y) + yOffset
            if (yDiff > 0 && this.isLadderAbove) {
                this.moveDir('up')
                return
            }
            else if (yDiff < 0 && this.isLadderBelow) {
                this.moveDir('down')
                return
            }
        }

        const xOffset = (this._collisionRect.right -1) - (piggy.collisionRect.right - 1)
        const xDiff = (this._position.x - piggy.position.x) + xOffset
        const xSlack = 2
        if (xDiff + xSlack < 0) this.moveDir('right')
        else if (xDiff - xSlack > 0) this.moveDir('left')
        else this.moveDir('stand')
    }

    get onLadder() {
        return (this.game as PiggyGame).isEntityOnLadder(this)
    }

    private get inCenterOfLadder() {
        const onLadder = this.onLadder
        if (onLadder) {
            const ladderRect = onLadder.collisionRect
            const padding = 6
            if ((this.collisionRect.left - padding > ladderRect.left) && (this.collisionRect.right + padding < ladderRect.right)) 
                return true
        }
        return false
    }

    private get canSeePiggy() {
        // Simply check to see if Piggy is close
        const piggy = this.game.entityByName('piggy')
        if (piggy === undefined) throw new Error("Can't find piggy entity")
        return (this.posDiff(this._position, piggy.position) < 80)
    }

    private posDiff(a: PairXY, b: PairXY) {
        const xDiff = Math.abs(b.x - a.x)
        const yDiff = Math.abs(b.y - a.y)
        return xDiff + yDiff
    }

    public tick(timeDelta: number): void {
        super.tick(timeDelta)

        if (!this.isLadderAbove && this.onLadder && this.force.y < 0) this.moveDir('stand')
        
        if (!this.isColliding(false) && !this.onLadder) {
            this.falling = true
            this.setAnimation('fall')
        }
        else {
            this.falling = false
            if (this.animation?.name === 'fall') this.moveDir('stand')
        }

        if (this.falling) this.moveDir('fall')
        else if ((this.game as PiggyGame).ingame && this.canSeePiggy) this.chasePiggy()
        else this.moveDir('stand')
    }

    private get isLadderAbove() {
        return this.collidingEntitiesAt({ x: this._position.x, y: this._position.y -1 }, false)
            .some(entity => entity instanceof Ladder)
    }

    private get isLadderBelow() {
        return this.collidingEntitiesAt({ x: this._position.x, y: this._position.y }, false)
            .some(entity => entity instanceof Ladder)
    }
}

export default Matchstick