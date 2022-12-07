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
    private _enabled: boolean
    private keydownEventHandler: (e: KeyboardEvent) => void
    private keyupEventHandler: (e: KeyboardEvent) => void
    private blurEventHandler: (e: FocusEvent) => void
    private touchEventHandler: (e: TouchEvent) => void
    private touchendEventHandler: (e: TouchEvent) => void

    constructor(game: Game) {
        super()
        this.game = game
        this._enabled = false

        this.keys = new Map()
        this._relativeTouchPoint = {
            x: Math.round(game.canvas.width / 2),
            y: Math.round(game.canvas.height / 2),
        }

        this.keydownEventHandler = e => {
            this.handleKeyEvent(e, 'down')
            this.emit('keypress', e)
            if (document.activeElement === this.game.canvas) e.preventDefault()
        }
        this.keyupEventHandler = e => {
            this.handleKeyEvent(e, 'up')
            if (document.activeElement === this.game.canvas) e.preventDefault()
        }
        this.blurEventHandler = e => this.keys.clear()

        this.touchEventHandler = e => {
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

        this.touchendEventHandler = e => {
            this.keys.clear()
            this.currentTouchPoint = undefined
            if (e.cancelable) {
                e.stopPropagation()
                e.preventDefault()
            }
        }
        this.enabled = true
    }

    set enabled(newVal: boolean) {
        if (newVal === this._enabled) return
        if (newVal) this.addListeners()
        else this.removeListeners()

        this._enabled = newVal
    }

    private addListeners() {
        console.log('adding listeners')
        document.addEventListener('keydown', this.keydownEventHandler)
        document.addEventListener('keyup', this.keyupEventHandler)
        window.addEventListener('blur', this.blurEventHandler)
        this.game.canvas.addEventListener('touchstart', this.touchEventHandler)
        this.game.canvas.addEventListener('touchmove', this.touchEventHandler)
        this.game.canvas.addEventListener('touchend', this.touchendEventHandler)
    }

    private removeListeners() {
        console.log('removing listeners')
        document.removeEventListener('keydown', this.keydownEventHandler)
        document.removeEventListener('keyup', this.keyupEventHandler)
        window.removeEventListener('blur', this.blurEventHandler)
        this.game.canvas.removeEventListener('touchstart', this.touchEventHandler)
        this.game.canvas.removeEventListener('touchmove', this.touchEventHandler)
        this.game.canvas.removeEventListener('touchend', this.touchendEventHandler)
    }

    get relativeTouchPoint() {
        return this._relativeTouchPoint
    }

    set relativeTouchPoint(newPoint: PairXY) {
        this._relativeTouchPoint = { ...newPoint }
        if (this.currentTouchPoint) this.handleCanvasTouch(this.currentTouchPoint)
    }

    private getHtmlElementOffset(el: HTMLElement): PairXY {
        const rect = el.getBoundingClientRect()
        return {
            x: rect.left,
            y: rect.top,
        }
    }

    private touchPositionToCanvas(touchPos: PairXY): PairXY {
        const c = this.game.canvas
        const offset = this.getHtmlElementOffset(c)
        return {
            x: Math.round(((touchPos.x - offset.x) / c.clientWidth) * c.width),
            y: Math.round(((touchPos.y - offset.y) / c.clientHeight) * c.height),
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
