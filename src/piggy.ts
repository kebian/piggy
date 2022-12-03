
import { PairXY } from "./common-types";
import { EntityEventKey, EntityEvents } from "./entity";
import FrameSequence from "./framesequence";
import Ladder from "./ladder";
import PiggyGame from "./piggygame";
import { AudioResource } from "./resourcecache";
import Sprite from "./sprite";

type WalkDirection = 'left' | 'right' | 'none'
type ClimbDirection = 'up' | 'down' | 'none'

interface PiggyEvents extends EntityEvents {
    dead: () => void
}

class Piggy extends Sprite {
    private walkSpeed: number
    private climbSpeed: number
    private walkDirection: WalkDirection
    private climbDirection: ClimbDirection
    private falling: boolean
    private dead: boolean
    private sounds: {
        footsteps: AudioResource['audio'],
        fire:  AudioResource['audio'],
    }
    private piggyGame: PiggyGame
    
    constructor(game: PiggyGame, position: PairXY) {
        super(game, game.resPath('img/sprites.png'), { x: 0, y: 0 }, { x: 24, y: 24 }, 26)
        this.piggyGame = game
        this.solid = true
        this.usesGravity = true
        this.position = position
        this.walkSpeed = 70
        this.climbSpeed = 70
        this.walkDirection = 'none'
        this.climbDirection = 'none'
        this.falling = false
        this.dead = false
        this._collisionRect = { left: 7, top: 1, right: 17, bottom: 22 }

        this.addAnimation({ name: 'stand', sequence: new FrameSequence({
            frames: [6],
            fps: 1,
            repeat: false
        })})
        this.addAnimation({ name: 'left', sequence: new FrameSequence({
            frames: [5, 4, 3, 2, 1, 0],
            fps: 10,
            repeat: true
        })})
        this.addAnimation({ name: 'right', sequence: new FrameSequence({
            frames: [7, 8, 9, 10, 11, 12],
            fps: 10,
            repeat: true  
        })})
        this.addAnimation({ name: 'fall', sequence: new FrameSequence({
            frames: [13, 14],
            fps: 10,
            repeat: true
        })})
        this.addAnimation({ name: 'climb-up', sequence: new FrameSequence({
            frames: [15, 16, 17, 18, 19, 20],
            fps: 16,
            repeat: true   
        })})
        this.addAnimation({ name: 'climb-down', sequence: new FrameSequence({
            frames: [20, 19, 18, 17, 16, 15],
            fps: 16,
            repeat: true    
        })})
        this.addAnimation({ name: 'fire', sequence: new FrameSequence({
            frames: [21, 22, 23, 24, 25],
            fps: 24,
            repeat: false   
        })})

        this.getAnimation('fire').sequence.on('complete', () => {
            this.visible = false
            this.emit('dead')
        })

        this.sounds = {
            footsteps: game.getAudioResource('audio/footsteps.mp3').audio,
            fire: game.getAudioResource('audio/fire.mp3').audio
        }
        this.sounds.footsteps.volume = 0.1;

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

    private footsteps(play: boolean) {
        if (play) this.sounds.footsteps.play()
        else this.sounds.footsteps.pause()
    }

    public die() {
        this.dead = true
        this.setAnimation('fire')
        this.sounds.fire.play()
    }

    public tick(timeDelta: number): void {
        super.tick(timeDelta)
        if (this.dead) return

        if (!this.isColliding && !this.piggyGame.isEntityOnLadder(this)) {
            this.falling = true
            this.setAnimation('fall')
        }
        else this.falling = false

        this.handleInput()
    }

    get isLadderAbove() {
        return this.collidingEntitiesAt({ x: this._position.x, y: this._position.y -1}, false)
            .some(entity => entity instanceof Ladder)
    };
    

    private handleInput() {
        if (!this.piggyGame.ingame) {
            this.footsteps(false)
            if (!this.falling) this.setAnimation('stand')
            return
        }

        if (this.falling) {
            // We're falling.  Don't allow steering in the air.
            if (this.walkDirection === 'left') this.applyForce({ x: this.walkSpeed, y: 0 })
            if (this.walkDirection === 'right') this.applyForce({ x: -this.walkSpeed, y: 0 })
            this.walkDirection = 'none'
            
            // And if we're falling, we can't be climbing
            if (this.climbDirection === 'up') this.applyForce( { x: 0, y: this.climbSpeed })
            if (this.climbDirection === 'down') this.applyForce( { x: 0, y: -this.climbSpeed })
            this.climbDirection = 'none'
        }
        else {
            if (this.game.input.keyIsDown('LEFT') && this.walkDirection !== 'left') {
                this.walkDirection = 'left'
                if (this.climbDirection === 'none') this.setAnimation('left')
                this.applyForce({ x: -this.walkSpeed, y: 0})
            }
            else if (this.walkDirection === 'left') {
                this.walkDirection = 'none'
                this.applyForce({ x: this.walkSpeed, y: 0 })
            }

            if (this.game.input.keyIsDown('RIGHT') && this.walkDirection !== 'right') {
                this.walkDirection = 'right'
                if (this.climbDirection === 'none') this.setAnimation('right')
                this.applyForce({ x: this.walkSpeed, y: 0 })
            }
            else if (this.walkDirection === 'right') {
                this.walkDirection = 'none'
                this.applyForce({ x: -this.walkSpeed, y: 0 })
            }

            const onLadder = this.piggyGame.isEntityOnLadder(this)

            if (this.game.input.keyIsDown('UP') && onLadder && this.isLadderAbove && this.climbDirection !== 'up') {
                this.climbDirection = 'up'
                this.setAnimation('climb-up')
                this.applyForce({ x: 0, y: -this.climbSpeed })
            }
            else if (this.climbDirection === 'up') {
                this.climbDirection = 'none'
                this.applyForce({ x: 0, y: this.climbSpeed })
            }
    
            if (this.game.input.keyIsDown('DOWN') && onLadder && this.climbDirection !== 'down') {
                this.climbDirection = 'down'
                this.setAnimation('climb-down')
                this.applyForce({ x: 0, y: this.climbSpeed })
            }
            else if (this.climbDirection === 'down') {
                this.climbDirection = 'none'
                this.applyForce({ x: 0, y: -this.climbSpeed })
            }

            /*
            // Stop him doing a climbing animation when not on a ladder
            if ((!this.onLadder) && (('climb-up' == this.getAnimation()) || ('climb-down' == this.getAnimation()))) {
                if (this.walkingLeft) this.setAnimation('left');
                else if (this.walkingRight) this.setAnimation('right');
            }
            
            // Prevent moonwalking
            if (('left' == this.getAnimation()) && (this.walkingRight))
                this.setAnimation('left');
            else if (('right' == this.getAnimation()) && (this.walkingLeft))
                this.setAnimation('right');
    
            if ((!this.walkingLeft) && (!this.walkingRight) && (!this.climbingUp) && (!this.climbingDown))
                this.setAnimation('stand');
            */

            if (this.walkDirection === 'none' && this.climbDirection === 'none') this.setAnimation('stand')
        }
        this.footsteps(this.walkDirection === 'left' || this.walkDirection === 'right')
    }
}

export default Piggy

