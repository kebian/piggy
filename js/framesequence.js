/*
Copyright (c) 2014 Rob Stiles

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

function FrameSequence(sequence, fps, repeat) {
    if (repeat !== false) repeat = true;

    this.sequence = sequence;
    this.repeat = repeat;
    this.fps = fps;
    this.total_delta = 0;
    this.index = 0;
    this.onComplete = null;
    this.handledComplete = false;
}

FrameSequence.prototype.tick = function(time_delta) {
    this.total_delta += time_delta;
  
    var time_per_frame = 1000 / this.fps;
    var frames_passed = Math.floor(this.total_delta / time_per_frame);
    if (frames_passed) {
        if (this.index + frames_passed  > this.sequence.length -1) {
            if (this.repeat) {
                this.index = (this.index + frames_passed) % this.sequence.length;
            }
            this.handleComplete();
        }
        else this.index += frames_passed;
        this.total_delta = 0;
    }
}

FrameSequence.prototype.frame = function() {
    return this.sequence[this.index];
}

FrameSequence.prototype.reset = function() {
    this.index = 0;
    this.handledComplete = false;
};

FrameSequence.prototype.handleComplete = function() {
    if (this.handledComplete) return;
    if (this.onComplete) this.onComplete();
    this.handledComplete = true;
};