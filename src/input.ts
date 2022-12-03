import EventEmitter from 'eventemitter3'
import Game from './game'

type KeyState = 'up' | 'down'

interface Events {
    ready: () => void
    keypress: (e: KeyboardEvent) => void
}

class Input extends EventEmitter<Events> {
    private game: Game
    private keys: Map<string, KeyState>

    constructor(game: Game) {
        super()
        this.game = game
        this.keys = new Map()

        document.addEventListener('keydown', e => {
            this.handleKeyEvent(e, 'down')
            this.emit('keypress', e)
            if (document.activeElement == this.game.canvas)
                e.preventDefault();
        })
        
        document.addEventListener('keyup', e => {
            this.handleKeyEvent(e, 'up')
            if (document.activeElement == this.game.canvas)
                e.preventDefault();
        })
    
        window.addEventListener('blur',e => {
            this.keys.clear()
        })

    }

    private handleKeyEvent(e: KeyboardEvent, state: KeyState) {
        const keyCode = e.keyCode // TODO: keyCode is deprecated
        let key = ''
        switch(keyCode) {
            // Convert to useful names
            case 32:
                key = 'SPACE';
                break;
            case 37:
                key = 'LEFT';
                break;
            case 38:
                key = 'UP';
                break;
            case 39:
                key = 'RIGHT';
                break;
            case 40:
                key = 'DOWN';
                break;
            // And convert anything else to their corresponding letters.
            default:
                key = String.fromCharCode(keyCode);
                break;
        }
        this.keys.set(key, state)
    }

    public key(name: string): KeyState{
        let state = this.keys.get(name)
        if (state === undefined) return 'up'
        return state
    }

    public keyIsDown(name: string) {
        return this.key(name) === 'down'
    }

}

export default Input