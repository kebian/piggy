import { PairXY } from './common-types'
import { EntityEventKey, EntityEvents } from './entity'
import FrameSequence from './framesequence'
import Ladder from './ladder'
import PiggyGame from './piggygame'
import { AudioResource } from './resourcecache'
import Sprite from './sprite'

type WalkDirection = 'left' | 'right' | 'none'
type ClimbDirection = 'up' | 'down' | 'none'

interface PiggyEvents extends EntityEvents {
    dead: () => void
}

class Piggy extends Sprite {
    private walkSpeed: number
    private climbSpeed: number
    private _walkDirection: WalkDirection
    private _climbDirection: ClimbDirection
    private _falling: boolean
    private dead: boolean
    private sounds: {
        footsteps: AudioResource['audio']
        fire: AudioResource['audio']
    }
    private piggyGame: PiggyGame

    constructor(game: PiggyGame, position: PairXY) {
        super(game, 'spriteSheet', { x: 0, y: 0 }, { x: 24, y: 24 }, 26)
        this.piggyGame = game
        this.solid = true
        this.usesGravity = true
        this.position = position
        this.walkSpeed = 100
        this.climbSpeed = 100
        this._walkDirection = 'none'
        this._climbDirection = 'none'
        this._falling = false
        this.dead = false
        this._collisionRect = { left: 7, top: 1, right: 17, bottom: 22 }

        this.addAnimation({
            name: 'stand',
            sequence: new FrameSequence({
                frames: [6],
                fps: 1,
                repeat: false,
            }),
        })
        this.addAnimation({
            name: 'left',
            sequence: new FrameSequence({
                frames: [5, 4, 3, 2, 1, 0],
                fps: 10,
                repeat: true,
            }),
        })
        this.addAnimation({
            name: 'right',
            sequence: new FrameSequence({
                frames: [7, 8, 9, 10, 11, 12],
                fps: 10,
                repeat: true,
            }),
        })
        this.addAnimation({
            name: 'fall',
            sequence: new FrameSequence({
                frames: [13, 14],
                fps: 10,
                repeat: true,
            }),
        })
        this.addAnimation({
            name: 'climb-up',
            sequence: new FrameSequence({
                frames: [15, 16, 17, 18, 19, 20],
                fps: 16,
                repeat: true,
            }),
        })
        this.addAnimation({
            name: 'climb-down',
            sequence: new FrameSequence({
                frames: [20, 19, 18, 17, 16, 15],
                fps: 16,
                repeat: true,
            }),
        })
        this.addAnimation({
            name: 'fire',
            sequence: new FrameSequence({
                frames: [21, 22, 23, 24, 25],
                fps: 24,
                repeat: false,
            }),
        })

        this.getAnimation('fire').sequence.on('complete', () => {
            this.visible = false
            this.emit('dead')
        })

        this.sounds = {
            footsteps: game.getAudioResource('footstepsMp3').audio,
            fire: game.getAudioResource('fireMp3').audio,
        }
        this.sounds.footsteps.volume = 0.1
        this.sounds.footsteps.loop = true
    }

    setPosition(newPos: PairXY) {
        super.setPosition(newPos)
        this.game.input.relativeTouchPoint = this.centerPos
    }

    get falling() {
        return this._falling
    }

    set falling(newVal: boolean) {
        if (newVal === this._falling) return
        if (newVal) this.setAnimation('fall')
        else this.setAnimation('stand')
        this._falling = newVal
    }

    emit<K extends EntityEventKey<PiggyEvents>>(eventName: K, ...params: Parameters<PiggyEvents[K]>) {
        return this._emit(eventName, ...params)
    }

    on<K extends EntityEventKey<PiggyEvents>>(eventName: K, fn: PiggyEvents[K]) {
        return this._on(eventName, fn)
    }

    once<K extends EntityEventKey<PiggyEvents>>(eventName: K, fn: PiggyEvents[K]) {
        return this._once(eventName, fn)
    }

    removeAllListeners<K extends EntityEventKey<PiggyEvents>>(eventName: K) {
        return this._removeAllListeners(eventName)
    }

    get walkDirection() {
        return this._walkDirection
    }

    set walkDirection(newDirection: WalkDirection) {
        if (newDirection === this._walkDirection) return

        const walkForce: PairXY = { x: this.walkSpeed, y: 0 }

        // unset existing forces
        if (this._walkDirection === 'left') this.applyForce(walkForce)
        else if (this._walkDirection === 'right') this.applyReverseForce(walkForce)

        // set new forces
        if (newDirection === 'left') this.applyReverseForce(walkForce)
        else if (newDirection === 'right') this.applyForce(walkForce)

        /*
        if (this.climbDirection === 'none' && !this.falling) {
            if (newDirection === 'left') this.setAnimation('left')
            else if (newDirection === 'right') this.setAnimation('right')
            else this.setAnimation('stand')
        }
        */
        this.footsteps(newDirection === 'left' || newDirection === 'right')
        this._walkDirection = newDirection

        // set animations
        this.determineMovementAnimation()
    }

    private determineMovementAnimation() {
        let animation = 'stand'
        if (this.falling) animation = 'fall'
        else if (this.climbDirection === 'up') animation = 'climb-up'
        else if (this.climbDirection === 'down') animation = 'climb-down'
        else if (this.walkDirection === 'left') animation = 'left'
        else if (this.walkDirection === 'right') animation = 'right'
        this.setAnimation(animation)
    }

    get climbDirection() {
        return this._climbDirection
    }

    set climbDirection(newDirection: ClimbDirection) {
        if (newDirection === this._climbDirection) return

        const climbForce: PairXY = { x: 0, y: -this.climbSpeed }

        // unset existing forces
        if (this._climbDirection === 'up') this.applyReverseForce(climbForce)
        else if (this._climbDirection === 'down') this.applyForce(climbForce)

        // set new forces
        if (newDirection === 'up') this.applyForce(climbForce)
        else if (newDirection === 'down') this.applyReverseForce(climbForce)

        // set animations
        /*
        if (newDirection === 'up') this.setAnimation('climb-up')
        else if (newDirection === 'down') this.setAnimation('climb-down')
        else if (newDirection === 'none') this.setAnimation('stand')
        */

        this._climbDirection = newDirection

        this.determineMovementAnimation()
    }

    private footsteps(play: boolean) {
        if (play) this.sounds.footsteps.play()
        else this.sounds.footsteps.pause()
    }

    public die() {
        if (this.dead === true) return // already dead
        this.dead = true
        this.setAnimation('fire')
        this.sounds.fire.play()
    }

    public tick(timeDelta: number): void {
        super.tick(timeDelta)
        if (this.dead) return

        // fall if not even colliding with floor
        if (!this.isColliding(false) && !this.piggyGame.isEntityOnLadder(this)) this.falling = true
        else this.falling = false

        this.handleInput()
    }

    get isLadderAbove() {
        return this.collidingEntitiesAt({ x: this._position.x, y: this._position.y - 1 }, false).some(
            entity => entity instanceof Ladder
        )
    }

    private handleInput() {
        if (!this.piggyGame.ingame) {
            this.footsteps(false)
            if (!this.falling) this.setAnimation('stand')
            return
        }

        if (this.falling) {
            // We're falling.  Don't allow steering in the air.
            this.walkDirection = 'none'

            // And if we're falling, we can't be climbing
            this.climbDirection = 'none'
        } else {
            const onLadder = this.piggyGame.isEntityOnLadder(this)

            if (this.game.input.keyIsDown('ArrowLeft')) {
                if (this.walkDirection !== 'left') this.walkDirection = 'left'
            } else if (this.walkDirection === 'left') this.walkDirection = 'none'

            if (this.game.input.keyIsDown('ArrowRight')) {
                if (this.walkDirection !== 'right') this.walkDirection = 'right'
            } else if (this.walkDirection === 'right') this.walkDirection = 'none'

            if (this.game.input.keyIsDown('ArrowUp') && onLadder && this.isLadderAbove) {
                if (this.climbDirection !== 'up') this.climbDirection = 'up'
            } else if (this.climbDirection === 'up') this.climbDirection = 'none'

            if (this.game.input.keyIsDown('ArrowDown') && onLadder) {
                if (this.climbDirection !== 'down') this.climbDirection = 'down'
            } else if (this.climbDirection === 'down') this.climbDirection = 'none'

            if (this.walkDirection === 'left' && !this.canMoveLeft) this.walkDirection = 'none'
            if (this.walkDirection === 'right' && !this.canMoveRight) this.walkDirection = 'none'
        }
    }
}

export default Piggy
