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

Piggy.prototype = Object.create(Sprite.prototype);
Piggy.prototype.constructor = Piggy;

function Piggy(game, x, y) {
    Sprite.call(this, game, game.resPath('img/sprites.png'), [0, 0], [24, 24], 26);
    this.solid = true;
    this.uses_gravity = true;

    this.pos[0] = x;
    this.pos[1] = y;

    this.walkSpeed = 70;
    this.climbSpeed = 70;

    this.walkingLeft = false;
    this.walkingRight = false;
    this.climbingUp = false;
    this.climbingDown = false;
    this.falling = false;

    this.dead = false;
    this.onDead = null;

    this.collisionRect = {
        left: 7,
        top: 1,
        right: 17,
        bottom: 22
    }

    this.addAnimation('stand', new FrameSequence(
            [6],
            1,
            false
        )
    );

    this.addAnimation('left', new FrameSequence(
            [5, 4, 3, 2, 1, 0],
            10,
            true
        )
    );

    this.addAnimation('right', new FrameSequence(
            [7, 8, 9, 10, 11, 12],
            10,
            true
        )
    );
    this.addAnimation('fall', new FrameSequence(
            [13, 14],
            10,
            true
        )
    );

    this.addAnimation('climb-up', new FrameSequence(
            [15, 16, 17, 18, 19, 20],
            16,
            true
        )
    );

    this.addAnimation('climb-down', new FrameSequence(
            [20, 19, 18, 17, 16, 15],
            16,
            true
        )
    );

    this.addAnimation('fire', new FrameSequence(
            [21, 22, 23, 24, 25],
            24,
            false
        )
    );

    var me = this;
    this.animations['fire'].onComplete = function() {
        // Ouch, we've burned to death :(
        me.visible = false;
        if (me.onDead) me.onDead();
    }

    this.sounds = {
        footsteps: this.game.getResource('audio/footsteps.mp3'),
        fire: this.game.getResource('audio/fire.mp3')
    }

    this.sounds.footsteps.volume = 0.1;
}

Piggy.prototype.footsteps = function(toggle) {
    if (toggle) 
        this.sounds.footsteps.play();
    else this.sounds.footsteps.pause();
}

Piggy.prototype.isLadderAbove = function() {
    entities = this.collidingEntitiesAt(this.pos[0], this.pos[1]-1, false);
    for (var i = 0; i < entities.length; i++) {
        if (entities[i] instanceof Ladder)
            return true;
    }
    return false;
};

Piggy.prototype.die = function() {
    this.dead = true;
    this.setAnimation('fire');
    this.sounds.fire.play();
};

Piggy.prototype.tick = function(time_delta) {
    Sprite.prototype.tick.call(this, time_delta);
    if (this.dead) return;

    if (!this.isColliding() && !this.onLadder) {
        this.falling = true;
        this.setAnimation('fall');
    }
    else {
        this.falling = false;
    }

    this.handleInput();
}

Piggy.prototype.handleInput = function() {
    if (!this.game.ingame) {
        this.footsteps(false);
        if (!this.falling)
            this.setAnimation('stand');
        return;
    }

    var anim = this.getAnimation();

    if (!this.falling) {
        if (this.game.input.keyState('LEFT')) {
            if (!this.walkingLeft) {
                this.walkingLeft = true;
                if ((!this.climbingUp) && (!this.climbingDown)) this.setAnimation('left');
                this.applyForce(-this.walkSpeed, 0);
            }
        }
        else if (this.walkingLeft) {
            this.walkingLeft = false;
            this.applyForce(this.walkSpeed, 0);
        }
        
        if (this.game.input.keyState('RIGHT')) {
            if (!this.walkingRight) {
                this.walkingRight = true;
                if ((!this.climbingUp) && (!this.climbingDown)) this.setAnimation('right');
                this.applyForce(this.walkSpeed, 0);
            }
        }
        else if (this.walkingRight) {
            this.walkingRight = false;
            this.applyForce(-this.walkSpeed, 0);
        }

        if (this.game.input.keyState('UP') && this.onLadder && this.isLadderAbove()) {
            if (!this.climbingUp) {
                this.climbingUp = true;
                this.setAnimation('climb-up');
                this.applyForce(0, -this.climbSpeed);
            }
        }
        else if (this.climbingUp) {
            this.climbingUp = false;
            this.applyForce(0, this.climbSpeed);
        }

        if (this.game.input.keyState('DOWN') && this.onLadder) {
            if (!this.climbingDown) {
                this.climbingDown = true;
                this.setAnimation('climb-down');
                this.applyForce(0, this.climbSpeed);
            }
        }
        else if (this.climbingDown) {
            this.climbingDown = false;
            this.applyForce(0, -this.climbSpeed);
        }

        // Stop him doing a climbing animation when not on a ladder
        if ((!this.onLadder) && (('climb-up' == this.getAnimation()) || ('climb-down' == this.getAnimation()))) {
            if (this.walkingLeft) this.setAnimation('left');
            else if (this.walkingRight) this.setAnimation('right');
        }
        
        // Prevent moonwalking
        if (('left' == this.getAnimation()) && (this.walkingRight))
            this.setAnimation('left');
        else if (('right' == this.getAnimation()) && (this.walkingLeft))
            this.setAnimation('right');

        if ((!this.walkingLeft) && (!this.walkingRight) && (!this.climbingUp) && (!this.climbingDown))
            this.setAnimation('stand');
    }
    else {
        // We're falling.  Don't allow steering in the air.
        if (this.walkingLeft) {
            this.walkingLeft = false;
            this.applyForce(this.walkSpeed, 0);  
        }

        if (this.walkingRight) {
            this.walkingRight = false;
            this.applyForce(-this.walkSpeed, 0);
        }

        // And if we're falling, we can't be climbing
        if (this.climbingUp) {
            this.climbingUp = false;
            this.applyForce(0, this.climbSpeed);
        }
        if (this.climbingDown) {
            this.climbingDown = false;
            this.applyForce(0, -this.climbSpeed);
        }
    }   

    if (this.walkingLeft || this.walkingRight)
        this.footsteps(true);
    else this.footsteps(false);
};

