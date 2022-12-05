import { PairXY } from './common-types'
import FrameSequence from './framesequence'
import PiggyGame from './piggygame'
import Sprite from './sprite'

class Kak extends Sprite {
    constructor(game: PiggyGame, position: PairXY) {
        super(game, 'spriteSheet', { x: 0, y: 106 }, { x: 16, y: 23 }, 1)
        this.position = position
        this.solid = true
        this.usesGravity = true
        this.visible = true
        this.addAnimation({
            name: 'stand',
            sequence: new FrameSequence({ frames: [0], fps: 1, repeat: false }),
        })
    }
}

export default Kak
