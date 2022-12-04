import Entity from "./entity"
import Game from "./game"
import Kak from "./kak"
import Ladder from "./ladder"
import Level from "./level"
import Matchstick from "./matchstick"
import Piggy from "./piggy"
import { AudioResource } from "./resourcecache"
import TitleScreen from "./titlescreen"
import originalLevel from '../levels/original.json'

class PiggyGame extends Game {
    private _ingame: boolean
    private resourceRootPath : string
    private level: Level

    constructor(canvas: HTMLCanvasElement, resourceRootPath: string = '') {
        super(canvas)

        // This was the original resolution of the game & we scale it up using css.
        canvas.width=320;
        canvas.height=200;

        this._ingame = false
        this.gravityForce = { x: 0, y: 100} // gravity
        this.level = new Level(this)
        this.resourceRootPath = resourceRootPath
        if (resourceRootPath !== '' && !this.resourceRootPath.endsWith('/')) this.resourceRootPath += '/'
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
        //await this.level.load('original')
        this.level.loadFromData(originalLevel)
        
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
                setTimeout(() => this.init(), 3000)
            })

        this.input.on('keypress', () => {
            if (!this._ingame) this.startGame()
        })
        this.addEntity('title', new TitleScreen(this))
        console.log('Game ready')
    }

    private startGame() {
        this._ingame = true
        console.log('Starting game')

    }

    private endGame() {
        this._ingame = false
        console.log('Ending game')
    }

    protected checkGravityFor(entity: Entity) {
        if (entity.usesGravity && this.isEntityOnLadder(entity)) this.removeGravityFrom(entity)
        else super.checkGravityFor(entity)
    }

    public isEntityOnLadder(entity: Entity) {
        const other = entity.collidingEntities(false).find( e => {
            return e instanceof Ladder
        })
        if (other === undefined) return false
        return other as Ladder
    }

    protected render(): void {
        this.context2d.fillStyle = 'black'
        this.context2d.fillRect(0, 0, this.canvas.width, this.canvas.height)
        super.render()
    }

}

export default PiggyGame