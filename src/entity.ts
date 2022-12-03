import EventEmitter from 'eventemitter3'
import { PairXY, Rect } from './common-types'
import Game from './game'

export interface EntityEvents {
    collision: (other: Entity) => void
}

export type EntityEventKey<T extends EntityEvents> = string & keyof T;

class Entity {
    protected game: Game
    protected _position: PairXY
    protected force: PairXY
    protected forceDelta: PairXY
    protected _collisionRect: Rect
    public solid: boolean // prevents other solids from moving through it
    public visible: boolean
    public zorder: number
    public usesGravity: boolean
    private eventEmmitter: EventEmitter

    constructor(game: Game) {
        this.eventEmmitter = new EventEmitter()
        this.game = game
        this._position = { x: 0, y: 0 }
        this.force = { x: 0, y: 0 }
        this.forceDelta = { x: 0, y: 0 }
        this._collisionRect = { top: 0, left: 0, bottom: 0, right: 0}
        this.solid = false
        this.visible = false
        this.zorder = 0
        this.usesGravity = false
    }

    render(ctx: CanvasRenderingContext2D) {

    }

    protected set position(pos: PairXY) {
        this._position = { ...pos}
    }

    get position() {
        return this._position
    }

    tick(timeDelta: number) {
        if ((this.force.x) || (this.force.y)) {
            this.forceDelta.x += timeDelta;
            this.forceDelta.y += timeDelta;

            const force: PairXY = {
                x: Math.round((this.force.x / 1000) * this.forceDelta.x),
                y: Math.round((this.force.y / 1000) * this.forceDelta.y)
            }

            if (force.x) this.forceDelta.x = 0
            if (force.y) this.forceDelta.y = 0
    
            this.move(force);
    
            // We use a forceDelta to detect miniscule changes.  If the delta > 500ms
            // then we may as well reset it because that's plenty large enough.
            if (this.forceDelta.x > 20) 
                this.forceDelta.x = 0;
            if (this.forceDelta.y > 20) 
                this.forceDelta.y = 0;
    
        }
        else this.forceDelta = {x: 0, y: 0}
    
        this.testCollision();
    }

    /**
     * Returns collection rect in world coords
     * @returns 
     */
    get collisionRect() {
        return this.getCollisionRectAt(this._position);
    }

    getCollisionRectAt(pos: PairXY) : Rect{
        return {
            left: this._collisionRect.left + pos.x,
            right: this._collisionRect.right + pos.x,
            top: this._collisionRect.top + pos.y,
            bottom: this._collisionRect.bottom + pos.y,
        }
    }

    protected handleCollisionWith(other: Entity) {
        this.emit('collision', other)
    }

    private areRectsIntersecting(r1: Rect, r2: Rect) {
        return (r1.left <= r2.right &&
            r2.left <= r1.right &&
            r1.top <= r2.bottom &&
            r2.top <= r1.bottom)
    }

    /**
     * // This is a 2D game and rects are colliding if they're immediately *next* to each other.
     * @param r1 
     * @param r2 
     * @returns 
     */
    private areRectsColliding(r1: Rect, r2: Rect) {
        return (r1.left <= r2.right+1 &&
            r2.left <= r1.right+1 &&
            r1.top <= r2.bottom+1 &&
            r2.top <= r1.bottom+1)
    }

    private testCollision() {
        const others = this.collidingEntitiesAt(this._position, false)
        for (const other of others) this.handleCollisionWith(other)
    }

    // This function is only useful along one movement plane.
    private intersectingSolidsTo(position: PairXY) {
        const destRect = this.getCollisionRectAt(position)
        const myRect = this.collisionRect

        const testRect: Rect = {
            left: myRect.left < destRect.left ? myRect.left : destRect.left,
            right: myRect.right > destRect.right ? myRect.right : destRect.right,
            top: myRect.top < destRect.top ? myRect.top : destRect.top,
            bottom: myRect.bottom > destRect.bottom ? myRect.bottom : destRect.bottom
        }

        return this.game.entities.filter(e => {
            if (e == this) return false
            if (!e.solid) return false
            const otherRect = e.collisionRect
            return this.areRectsIntersecting(testRect, otherRect)
        })
    }

    collidingEntitiesAt(position: PairXY, solidsOnly: boolean = false) {
        const myRect = this.getCollisionRectAt(position)
        return this.game.entities.filter(e => {
            if (e === this) return false // don't test against self
            if (solidsOnly && !e.solid) return false

            const otherRect = e.collisionRect
            return this.areRectsColliding(myRect, otherRect)
        })
    }

    collidingEntities(solidsOnly: boolean = false) {
        return this.collidingEntitiesAt(this._position, solidsOnly)
    }

    isColliding(solidsOnly: boolean) {
        return this.collidingEntitiesAt(this._position, solidsOnly).length > 0
    }

    isIntersecting() {
        return this.intersectingSolidsTo(this._position).length > 0
    }

    applyForce(force: PairXY) {
        this.force.x += force.x
        this.force.y += force.y
    }

    resetForce() {
        this.force = { x: 0, y: 0}
    }

    private correctForCollisionX(deltaX: number, other: Entity) {
        let newX = this._position.x + deltaX
        const otherRect = other.collisionRect
        if (deltaX > 0) newX = otherRect.left - this._collisionRect.right -1
        else if (deltaX < 0) newX = otherRect.right - this._collisionRect.left + 1
        return newX
    }

    private correctForCollisionY(deltaY: number, other: Entity) {
        let newY = this._position.y + deltaY
        const otherRect = other.collisionRect
        if (deltaY > 0) newY = otherRect.top - this._collisionRect.bottom -1
        else if (deltaY < 0) newY = otherRect.bottom - this._collisionRect.top +1
        return newY
    }

    move(offset: PairXY) {
        const newPosition: PairXY = {
            x: this._position.x + offset.x,
            y: this._position.y + offset.y
        }

        if (this.solid) {
            // Check for collision along horizontal plane
            if (offset.x) {
                newPosition.x = this.intersectingSolidsTo({ x: newPosition.x, y: this._position.y })
                    .map(other => this.correctForCollisionX(offset.x, other))
                    .reduce((previousX, currentX) => {
                        if (offset.x > 0) 
                            // Moving right so find the furthest left collision point
                            return currentX < previousX ? currentX : previousX
                        else
                            // Moving left so find the right most collision point
                            return currentX > previousX ? currentX : previousX
                    }, newPosition.x)   
            }
            if (offset.y) {
                // And now check long the vertical plane
                newPosition.y = this.intersectingSolidsTo({ x: newPosition.x, y: newPosition.y })
                    .map(other => this.correctForCollisionY(offset.y, other))
                    .reduce((previousY, currentY) => {
                        if (offset.y > 0)
                            // moving down so correct to highest
                            return currentY < previousY ? currentY : previousY
                        else
                            // moving up so correct to lowest
                            return currentY > previousY ? currentY : previousY
                    }, newPosition.y)
            }
        }
        this.position = newPosition
    }

    // TypeScript makes it very difficult / impossible to extend from classes that extend
    // EventEmitter3 if you want to define new events in the extended classes, so we wrap 
    // the functions with our own generics.

    protected _emit(eventName: string, ...params: any[]) {
        return this.eventEmmitter.emit(eventName, ...params)
    }

    protected _on(eventName: string, fn: (...args:any[]) => any) {
        return this.eventEmmitter.on(eventName, fn) 
    }

    protected _once(eventName: string, fn: (...args:any[]) => any) {
        return this.eventEmmitter.once(eventName, fn) 
    }

    protected _removeAllListeners(eventName: string) {
        return this.eventEmmitter.removeAllListeners(eventName)
    }

    emit<K extends EntityEventKey<EntityEvents>>(eventName: K, ...params: Parameters<EntityEvents[K]>) {
        return this._emit(eventName, ...params)
    }

    on<K extends EntityEventKey<EntityEvents>>(eventName: K, fn: EntityEvents[K]) {
        return this._on(eventName, fn)
    }

    once<K extends EntityEventKey<EntityEvents>>(eventName: K, fn: EntityEvents[K]) {
        return this._once(eventName, fn)
    }

    removeAllListeners<K extends EntityEventKey<EntityEvents>>(eventName: K) {
        return this._removeAllListeners(eventName)
    }
}




export default Entity

