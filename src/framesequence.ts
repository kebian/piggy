import EventEmitter from "eventemitter3";

interface Events {
    complete: () => void
}

class FrameSequence extends EventEmitter<Events> {
    private frames: number[]
    private fps: number
    private repeat: boolean
    private totalDelta: number
    private index: number
    private emittedComplete: boolean

    constructor({ frames, fps, repeat} : { frames: number[], fps: number, repeat: boolean}) {
        super()
        this.frames = frames
        this.fps = fps
        this.repeat = repeat
        this.totalDelta = 0
        this.index = 0
        this.emittedComplete = false
    }

    tick(timeDelta: number) {
        this.totalDelta += timeDelta
        const timePerFrame = 1000 / this.fps
        const framesElapsed = Math.floor(this.totalDelta / timePerFrame)
        if (!framesElapsed) return

        let newFrameIndex = this.index + framesElapsed
        if (newFrameIndex > this.frames.length -1) {
            if (this.repeat) this.index = newFrameIndex % this.frames.length
            this.handleComplete()
        }
        else this.index = newFrameIndex
        this.totalDelta = 0
    }

    get frame() {
        return this.frames[this.index]
    }

    reset() {
        this.index = 0
        this.emittedComplete = false
    }

    handleComplete() {
        if (this.emittedComplete) return
        this.emit('complete')
        this.emittedComplete = true
    }
}

export default FrameSequence