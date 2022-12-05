import EventEmitter from 'eventemitter3'
import { PairXY } from './common-types'
import Game from './game'

type KeyState = 'up' | 'down'

interface Events {
    ready: () => void
    keypress: (e: KeyboardEvent) => void
    touch: (e: TouchEvent) => void
}

class Input extends EventEmitter<Events> {
    private game: Game
    private keys: Map<string, KeyState>
    private _relativeTouchPoint: PairXY
    private currentTouchPoint: PairXY | undefined

    constructor(game: Game) {
        super()
        this.game = game
        this.keys = new Map()
        this._relativeTouchPoint = {
            x: Math.round(game.canvas.width / 2),
            y: Math.round(game.canvas.height / 2),
        }

        document.addEventListener('keydown', e => {
            this.handleKeyEvent(e, 'down')
            this.emit('keypress', e)
            if (document.activeElement === this.game.canvas) e.preventDefault()
        })

        document.addEventListener('keyup', e => {
            this.handleKeyEvent(e, 'up')
            if (document.activeElement === this.game.canvas) e.preventDefault()
        })

        window.addEventListener('blur', e => {
            this.keys.clear()
        })

        const handleTouchEvent = (e: TouchEvent) => {
            const touches = e.touches.item(0)
            if (touches?.target !== this.game.canvas) return

            this.emit('touch', e)

            const canvasPos = this.touchPositionToCanvas({
                x: touches.clientX,
                y: touches.clientY,
            })
            this.handleCanvasTouch(canvasPos)

            if (e.cancelable) {
                e.stopPropagation()
                e.preventDefault()
            }
        }

        game.canvas.addEventListener('touchstart', handleTouchEvent)
        game.canvas.addEventListener('touchmove', handleTouchEvent)

        game.canvas.addEventListener('touchend', e => {
            this.keys.clear()
            this.currentTouchPoint = undefined
            if (e.cancelable) {
                e.stopPropagation()
                e.preventDefault()
            }
        })
    }

    get relativeTouchPoint() {
        return this._relativeTouchPoint
    }

    set relativeTouchPoint(newPoint: PairXY) {
        this._relativeTouchPoint = { ...newPoint }
        if (this.currentTouchPoint) this.handleCanvasTouch(this.currentTouchPoint)
    }

    private touchPositionToCanvas(touchPos: PairXY): PairXY {
        const c = this.game.canvas
        return {
            x: Math.round(((touchPos.x - c.offsetLeft) / c.clientWidth) * c.width),
            y: Math.round(((touchPos.y - c.offsetTop) / c.clientHeight) * c.height),
        }
    }

    private handleCanvasTouch(canvasPos: PairXY) {
        this.keys.clear()

        if (canvasPos.x < this.relativeTouchPoint.x) this.keys.set('ArrowLeft', 'down')
        else if (canvasPos.x > this.relativeTouchPoint.x) this.keys.set('ArrowRight', 'down')

        if (canvasPos.y < this.relativeTouchPoint.y) this.keys.set('ArrowUp', 'down')
        else if (canvasPos.y > this.relativeTouchPoint.y) this.keys.set('ArrowDown', 'down')
        this.currentTouchPoint = canvasPos
    }

    private handleKeyEvent(e: KeyboardEvent, state: KeyState) {
        if (e.repeat === true || e.metaKey === true) return
        if (e.key === 'Meta' && state === 'up') this.keys.clear()
        this.keys.set(e.code, state)
        e.stopPropagation()
    }

    public key(name: string): KeyState {
        let state = this.keys.get(name)
        if (state === undefined) return 'up'
        return state
    }

    public keyIsDown(name: string) {
        return this.key(name) === 'down'
    }
}

export default Input
