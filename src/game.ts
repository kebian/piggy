import { PairXY } from './common-types'
import Entity from './entity'
import Input from './input'
import ResourceCache from './resourcecache'

class Game {
    private canvasEl: HTMLCanvasElement
    private lastTick: number
    protected context2d: CanvasRenderingContext2D
    private entityRenderOrder: Entity[]
    public input: Input
    protected gravityForce: PairXY
    private resourceCache: ResourceCache // might not need this now
    protected entityMap: Map<string, Entity>
    private gravityApplied: Map<Entity, boolean>

    constructor(canvas: HTMLCanvasElement) {
        this.canvasEl = canvas
        const context2d = canvas.getContext('2d')
        if (context2d === null) throw new Error('Unabled to get 2D context from canvas.')
        this.context2d = context2d
        this.lastTick = 0
        this.entityMap = new Map()
        this.entityRenderOrder = []
        this.input = new Input(this)
        this.gravityForce = { x: 0, y: 0 }
        this.gravityApplied = new Map()
        this.resourceCache = new ResourceCache()
    }

    get canvas() {
        return this.canvasEl
    }

    get resources() {
        return this.resourceCache
    }

    get entityEntries() {
        return this.entityMap.entries()
    }

    get entities() {
        return Array.from(this.entityMap.values())
    }

    entityByName(name: string) {
        return this.entityMap.get(name)
    }

    addEntity(name: string, entity: Entity) {
        this.entityMap.set(name, entity)
        this.recalcRenderOrder()
    }

    clearEntities() {
        this.entityMap.clear()
        this.entityRenderOrder = [];
    }

    private recalcRenderOrder() {
        // Calculate the render order based on the zorder of the entities
        this.entityRenderOrder = Array.from(this.entityMap.values()).sort((a, b) => a.zorder - b.zorder)
    }

    protected requestResources() {

    }

    run() {
        this.requestResources()
        this.canvas.focus()
        this.resourceCache.on('ready', async () => {
            console.log('All resources loaded.')
            await this.init()
            this.requestAnimFrame()
        })
    }

    protected async init() {
        
    }

    private requestAnimFrame() {
        // https://developer.mozilla.org/en/docs/Web/API/window.requestAnimationFrame
        window.requestAnimationFrame(() => this.loop())
    }

    private loop() {
        const now = Date.now();
        if (!this.lastTick) this.lastTick = now;
        const timeDelta = (now - this.lastTick);
    
        this.tick(timeDelta);
        this.render();
        this.lastTick = now;
    
        this.requestAnimFrame();
    }

    protected tick(timeDelta: number) {
        for (const entity of this.entityMap.values()) {
            this.checkGravityFor(entity)
            entity.tick(timeDelta)
        }
    }

    protected checkGravityFor(entity: Entity) {
        if (entity.usesGravity && !this.gravityAppliedTo(entity)) this.applyGravityTo(entity)
        else if (!entity.usesGravity && this.gravityAppliedTo(entity)) this.removeGravityFrom(entity)
    }

    protected gravityAppliedTo(entity: Entity) {
        return this.gravityApplied.get(entity) === true
    }

    protected applyGravityTo(entity: Entity) {
        if (this.gravityAppliedTo(entity)) return
        entity.applyForce(this.gravityForce)
        this.gravityApplied.set(entity, true)
    }

    protected removeGravityFrom(entity: Entity) {
        if (!this.gravityAppliedTo(entity)) return
        entity.applyReverseForce(this.gravityForce)
        this.gravityApplied.delete(entity)
    }

    protected render() {
        for (const entity of this.entityRenderOrder) {
            if (entity.visible) entity.render(this.context2d)
        }
    }

}

export default Game