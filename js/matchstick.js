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

Matchstick.prototype = Object.create(Sprite.prototype);
Matchstick.prototype.constructor = Matchstick;

function Matchstick(game, x, y) {
    Sprite.call(this, game, game.resPath('img/sprites.png'), [0, 48], [28, 29], 26);
    this.solid = true;
    this.uses_gravity = true;

    this.walkSpeed = 60;
    this.climbSpeed = 40;
    this.timeLastPath = 0;

    this.pos[0] = x;
    this.pos[1] = y;

    this.last_pos = [];

    this.collisionRect = {
        left: 14,
        top: 1,
        right: 16,
        bottom: 28
    }

    this.addAnimation('stand', new FrameSequence(
            [6, 7],
            20,
            true
        )
    );    

    this.addAnimation('down', new FrameSequence(
            [21, 20, 19, 18, 17, 16],
            10,
            true
        )
    ); 

    this.addAnimation('up', new FrameSequence(
            [16, 17, 18, 19, 20, 21],
            10,
            true
        )
    ); 

    this.addAnimation('fall', new FrameSequence(
            [14, 15],
            10,
            true
        )
    );   

    this.addAnimation('right', new FrameSequence(
            [8, 9, 10, 11, 12, 13],
            10,
            true
        )
    );

    this.addAnimation('left', new FrameSequence(
            [5, 4, 3, 2, 1, 0],
            10,
            true
        )
    );
    this.moveDir('stand');
    
}

Matchstick.prototype.handleCollisionWith = function(entity) {
    Sprite.prototype.handleCollisionWith(entity);

    if (entity instanceof Piggy) {
        this.moveDir('stand');
        this.current_path = null;
    }
}

Matchstick.prototype.moveDir = function(dir) { 
    if (this.moving == dir) return;  // Already doing that.

    // First unapply all movement forces
    switch(this.moving) {
        case 'right':
            this.applyForce(-this.walkSpeed, 0);
            break;
        case 'left':
            this.applyForce(this.walkSpeed, 0);
            break;
        case 'up':
            this.applyForce(0, this.climbSpeed);
            break;
        case 'down':
            this.applyForce(0, -this.climbSpeed);
            break;
    }

    switch(dir) {
        case 'right':
            this.applyForce(this.walkSpeed, 0);
            break;
        case 'left':
            this.applyForce(-this.walkSpeed, 0);
            break;
        case 'up':
            this.applyForce(0, -this.climbSpeed);
            break;
        case 'down':
            this.applyForce(0, this.climbSpeed);
            break;
        case 'fall':
            break;   
    }
    this.moving = dir;
    this.setAnimation(dir);
};

Matchstick.prototype.doMovement = function() {
    if (!this.game.ingame)
        this.current_path = null

    if ((this.current_path) && (this.current_path.length)) {
        var target_pos = this.current_path[0];

        if (target_pos != this.last_pos) {
            this.last_pos = target_pos;
        }

        if ((this.pos[0] == target_pos[0]) && (this.pos[1] == target_pos[1])) {
            this.current_path.shift();  
        }
        else {
            switch(this.moving) {
                default:
                    if ((this.pos[1] > target_pos[1]) && (this.onLadder)) {
                        // We're on a ladder and we can move up.
                        this.moveDir('up');
                    }
                    else if ((this.pos[1] < target_pos[1]) && (this.onLadder)) {
                        this.moveDir('down');
                    }
                    else if (this.pos[0] > target_pos[0]) {
                        this.moveDir('left');
                    }
                    else if  (this.pos[0] < target_pos[0]) {
                        this.moveDir('right');
                    }
                    break;
                case 'left':
                    if (this.pos[0] < target_pos[0]) {
                        //this.setPos(target_pos);
                        this.pos[0] = target_pos[0];
                        this.current_path.shift();
                        this.moveDir('stand');
               
                    }
                    break;
                case 'right':
                    if (this.pos[0] > target_pos[0]) {
                        //this.setPos(target_pos);
                        this.pos[0] = target_pos[0];
                        this.current_path.shift();
                        this.moveDir('stand');
               
                    }
                    break;                    
                case 'up':
                    if (this.pos[1] < target_pos[1]) {
                        this.pos[1] = target_pos[1];
                        this.current_path.shift();
                        this.moveDir('stand');  
                    }

            }
        }
    }
    else {
        this.moveDir('stand');
    }
    if (this.falling) {
        this.moveDir('fall');
    }
};

Matchstick.prototype.chasePiggy = function() {
    var now = Date.now();
    if ((!this.timeLastPath) || (now > this.timeLastPath + 500 )) {
        var piggy = this.game.entities['piggy'];
        this.current_path = this.game.pathfinder.to(piggy.pos, this);
        this.timeLastPath = now;

        if (this.current_path.length > 10) {
            // meh too far..
            this.current_path = null;
        }
    }
};


Matchstick.prototype.canSeePiggy = function() {
    return this.hasLOS(this.game.entities['piggy'], [13, 8]);
};

Matchstick.prototype.tick = function(time_delta) {
    Sprite.prototype.tick.call(this, time_delta);

    if ((!this.isLadderAbove()) && (this.onLadder) && (this.force[1] < 0)) {
        this.moveDir('stand');  
    }


    if (!this.isColliding() && !this.onLadder) {
        this.falling = true;
        this.setAnimation('fall');
    }
    else {
        this.falling = false;
        if (this.getAnimation() == 'fall')
            this.moveDir('stand');
    }


    if (this.canSeePiggy()) {
        this.chasePiggy();
    }

    this.doMovement();
}

Matchstick.prototype.isLadderAbove = function() {
    entities = this.collidingEntitiesAt(this.pos[0], this.pos[1]-1, false);
    for (var i = 0; i < entities.length; i++) {
        if (entities[i] instanceof Ladder)
            return true;
    }
    return false;
};

