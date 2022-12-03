import EventEmitter from "eventemitter3";
import { PairXY } from "./common-types"
import { EntityEventKey, EntityEvents } from "./entity";
import FrameSequence from "./framesequence"
import PiggyGame from "./piggygame"
import Sprite from "./sprite";

interface KakEvents extends EntityEvents {
    constructed: (s:string) => void
    whatever: (i: number) => void
}

class Kak extends Sprite {
    constructor(game: PiggyGame, position: PairXY) {
        super(game, game.resPath('img/sprites.png'), { x: 0, y: 106 }, { x: 16, y: 23 }, 1)
        this.position = position
        this.solid = true
        this.usesGravity = true
        this.addAnimation({
            name: 'stand', 
            sequence: new FrameSequence({ frames: [0], fps: 1, repeat: false })
        })

        this.emit('constructed', 'hello')
        this.on('constructed', s => {})
    }

    emit<K extends EntityEventKey<KakEvents>>(eventName: K, ...params: Parameters<KakEvents[K]>) {
        return this._emit(eventName, ...params)
    }

    on<K extends EntityEventKey<KakEvents>>(eventName: K, fn: KakEvents[K]) {
        return this._on(eventName, fn)
    }


}

export default Kak