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
    protected environmentalforces: PairXY
    private resourceCache: ResourceCache // might not need this now
    private entityMap: Map<string, Entity>

    constructor(canvas: HTMLCanvasElement) {
        this.canvasEl = canvas
        const context2d = canvas.getContext('2d')
        if (context2d === null) throw new Error('Unabled to get 2D context from canvas.')
        this.context2d = context2d
        this.lastTick = 0
        this.entityMap = new Map()
        this.entityRenderOrder = []
        this.input = new Input(this)
        this.environmentalforces = { x: 0, y: 0 }
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
        this.entityRenderOrder = Array.from(this.entityMap.values()).sort((a, b) => b.zorder - a.zorder)
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
        for (const [name, entity] of this.entityMap.entries()) {
            //this.entityTick(entity, name, timeDelta) // Why do we call this and the one below?
            this.applyEnvironmentalForces(entity)
            entity.tick(timeDelta)
        }
    }

    protected applyEnvironmentalForces(entity: Entity) {
        if (entity.usesGravity) entity.applyForce(this.environmentalforces)
    }

    protected render() {
        for (const entity of this.entityMap.values()) {
            if (entity.visible) entity.render(this.context2d)
        }
    }

}

export default Game