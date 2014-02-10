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

Sprite.prototype = Object.create(Entity.prototype);
Sprite.prototype.constructor = Sprite;

function Sprite(game, url, sheet_pos, size, num_frames) {
    Entity.call(this, game);
    this.sheet_pos = sheet_pos;
    this.size = size;
    this.sheet = game.resources.get(url);
    this.frames_per_row = Math.floor(this.sheet.width / size[1]);
    this.animations = {};
    this.current_animation = null;
    this.visible = true;
    this.collisionRect = {
        left: 0,
        top: 0,
        right: size[0] -1,
        bottom: size[1] -1
    }
}

Sprite.prototype.render = function(ctx) {
    var current_frame = this.currentFrame();
    var row = Math.floor(current_frame / this.frames_per_row);
    var col = current_frame % this.frames_per_row

    cr = this.getCollisionRect();
    
    // Temporarily render collision rect
    /*
    ctx.fillStyle="blue";
    ctx.fillRect(cr.left, cr.top, cr.right - cr.left +1, cr.bottom - cr.top +1);
    */
    ctx.drawImage(this.sheet, this.sheet_pos[0] + (col * this.size[0]), this.sheet_pos[1] + (row * this.size[1]), this.size[0], this.size[1], this.pos[0], this.pos[1], this.size[0], this.size[1]);
}

Sprite.prototype.addAnimation = function(name, sequence) {
    if (!this.current_animation)
        this.current_animation = name;

    this.animations[name] = sequence;
};

Sprite.prototype.setAnimation = function(name) {
    if (this.current_animation == name) return;

    this.current_animation = name;
    this.animations[name].reset();
};

Sprite.prototype.getAnimation = function() {
    return this.current_animation;
};

Sprite.prototype.currentFrame = function() {
    return this.animations[this.current_animation].frame();
};

Sprite.prototype.tick = function(time_delta) {
    Entity.prototype.tick.call(this, time_delta);
    this.animations[this.current_animation].tick(time_delta);
}
