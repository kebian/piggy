import Entity from "./entity"
import Game from "./game"
import Kak from "./kak"
import Ladder from "./ladder"
import Level from "./level"
import Matchstick from "./matchstick"
import Piggy from "./piggy"
import { AudioResource } from "./resourcecache"
import TitleScreen from "./titlescreen"

class PiggyGame extends Game {
    private _ingame: boolean
    private resourceRootPath : string
    private level: Level

    constructor(canvas: HTMLCanvasElement, resourceRootPath: string) {
        super(canvas)

        // This was the original resolution of the game & we scale it up using css.
        canvas.width=320;
        canvas.height=200;

        this._ingame = false
        this.environmentalforces = { x: 0, y: 100} // gravity
        this.level = new Level(this)
        this.resourceRootPath = resourceRootPath
        if (!this.resourceRootPath.endsWith('/')) this.resourceRootPath += '/'
    }

    get ingame() {
        return this._ingame
    }

    resPath(url: string) {
        return this.resourceRootPath + url
    }

    protected requestResources() {
        super.requestResources()

        const files = [
            'img/sprites.png',
            'img/level1.png',
            'img/title.png',
            'audio/burp.mp3',
            'audio/fire.mp3',
            'audio/footsteps.mp3'    
        ].map(f => this.resPath(f))

        this.resources.load(files)
    }

    getResource(url: string) {
        return this.resources.get(this.resPath(url))
    }

    getAudioResource(url: string) {
        const resource = this.resources.get(this.resPath(url))
        if (resource.type !== 'audio') throw new Error(`Not an audio resource: ${url}`)
        return resource as AudioResource
    }

    protected async init() {
        super.init()

        this._ingame = false
        await this.level.load('original')
        
        const piggy = this.entityByName('piggy') as Piggy
        if (piggy === undefined) throw new Error("Can't play Piggy without a Piggy!")
        piggy
            .on('collision', entity => {
                if (!this.ingame) return
                if (entity instanceof Matchstick) piggy.die()
                else if (entity instanceof Kak) {
                    this.endGame()
                    console.log('Piggy reached the Kakacola!')
                    this.getAudioResource('audio/burp.mp3').audio.play();
                    setTimeout(() => this.init(), 5000)
                }
            })
            .on('dead', () => {
                console.log('Piggy died :(')
                this.init()
            })

        this.input.on('keypress', () => this.startGame())
        this.addEntity('title', new TitleScreen(this))
        console.log('Game ready')
    }

    private startGame() {
        this._ingame = true
    }

    private endGame() {
        this._ingame = false
        // TODO: this.input.onKeyPress = null; // What was this doing?
    }

    protected applyEnvironmentalForces(entity: Entity): void {
        if (this.isEntityOnLadder(entity)) return
        super.applyEnvironmentalForces(entity)
    }

    public isEntityOnLadder(entity: Entity) {
        const ladder = entity.collidingEntities(false).find( e => e instanceof Ladder)
        if (ladder === undefined) return false
        return ladder as Ladder
    }

    protected render(): void {
        this.context2d.fillStyle = 'black'
        this.context2d.fillRect(0, 0, this.canvas.width, this.canvas.height)
        super.render()
    }

}

export default PiggyGame