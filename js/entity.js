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

function Entity(game) {
    this.game = game;
    this.pos = [0, 0];
    this.force = [0, 0]; // in pixels per second
    this.forceDelta;
    this.collisionRect = {left: 0, right: 0, top: 0, bottom: 0}
    this.solid = false; // Prevents other solids moving through it.
    this.visible = false;
    this.zorder = 0;
    this.uses_gravity = false;
}

Entity.prototype.render = function(ctx) {

}

Entity.prototype.setPos = function(pos) {
    this.pos[0] = pos[0];
    this.pos[1] = pos[1];
};

Entity.prototype.tick = function(time_delta) {
    if ((this.force[0]) || (this.force[1])) {
        this.forceDelta += time_delta;
        var force = [];
        force[0] = Math.round((this.force[0] / 1000) * time_delta);
        force[1] = Math.round((this.force[1] / 1000) * time_delta);
        this.move(force[0], force[1]);

        // We use a forceDelta to detect miniscule changes.  If the delta > 500ms
        // then we may as well reset it because that's plenty large enough.
        if (this.forceDelta > 500) this.forceDelta = 0;
    }
    else
        this.forceDelta = 0;

    this.testCollision();
}

Entity.prototype.getCollisionRect = function() { // in world coords so take in to account positioning.
    return this.getCollisionRectAt(this.pos[0], this.pos[1]);
}

Entity.prototype.getCollisionRectAt = function(x, y) {
    var rect = {
        left: this.collisionRect.left + x,
        right: this.collisionRect.right + x,
        top: this.collisionRect.top + y,
        bottom: this.collisionRect.bottom + y
    }
    return rect;
};

Entity.prototype.handleCollisionWith = function(entity) {
    if (this.onCollision) this.onCollision(entity);
}

Entity.prototype.areRectsIntersecting = function(r1, r2) {
    return (r1.left <= r2.right &&
          r2.left <= r1.right &&
          r1.top <= r2.bottom &&
          r2.top <= r1.bottom)
}

// This is a 2D game and rects are colliding if they're immediately *next* to each other.
Entity.prototype.areRectsColliding = function(r1, r2) {
    return (r1.left <= r2.right+1 &&
          r2.left <= r1.right+1 &&
          r1.top <= r2.bottom+1 &&
          r2.top <= r1.bottom+1)
}

Entity.prototype.testCollision = function() {
    var entities = this.collidingEntitiesAt(this.pos[0], this.pos[1], false);
    for (var i=0; i < entities.length; i++) {
        this.handleCollisionWith(entities[i]);
    }
}

// This function is only useful along one movement plane.
Entity.prototype.intersectingSolidsTo = function(x, y) {
    var result = [];

    var dest_rect = this.getCollisionRectAt(x, y);
    var my_rect = this.getCollisionRect();

    var test_rect  = {}
    test_rect.left = my_rect.left < dest_rect.left ? my_rect.left : dest_rect.left;
    test_rect.right = my_rect.right > dest_rect.right ? my_rect.right : dest_rect.right;
    test_rect.top = my_rect.top < dest_rect.top ? my_rect.top : dest_rect.top;
    test_rect.bottom = my_rect.bottom > dest_rect.bottom ? my_rect.bottom : dest_rect.bottom;


    for (var entity_name in this.game.entities) {
        var entity = this.game.entities[entity_name];
        if (entity == this) continue; // don't test against ourself
        if (!entity.solid) continue;

        var other_rect = entity.getCollisionRect();

        if (this.areRectsIntersecting(test_rect, other_rect)) {
            result.push(entity);
        }
    }
    return result;
}

Entity.prototype.collidingEntitiesAt = function(x, y, solidsOnly) {
    var result = [];
    if (solidsOnly === null) solidsOnly = false;
    var my_rect = this.getCollisionRectAt(x, y);

    for (var entity_name in this.game.entities) {
        var entity = this.game.entities[entity_name];
        if (entity == this) continue; // don't test against ourself
        if (solidsOnly && !entity.solid) continue;

        var other_rect = entity.getCollisionRect();

        if (this.areRectsColliding(my_rect, other_rect)) {
            result.push(entity);
        }
    }
    return result;
}

Entity.prototype.isColliding = function(solidsOnly) {
    var solids = this.collidingEntitiesAt(this.pos[0], this.pos[1], solidsOnly);
    return solids.length > 0;
};

Entity.prototype.isIntersecting = function() {
    var solids = this.intersectingSolidsTo(this.pos[0], this.pos[1]);
    return solids.length > 0;
};

Entity.prototype.applyForce = function(x, y) {
    this.force[0] += x;
    this.force[1] += y;
}

Entity.prototype.resetForce = function() {
    this.force = [0,0];
}

Entity.prototype.correctForCollisionX = function(delta_x, obj) {
    var new_x = this.pos[0] + delta_x;
    var other_rect = obj.getCollisionRect();

    if (delta_x > 0) 
        new_x = other_rect.left - this.collisionRect.right-1;
    else if (delta_x < 0) 
        new_x = other_rect.right - this.collisionRect.left +1;

    return new_x;
};

Entity.prototype.correctForCollisionY = function(delta_y, obj) {
    var new_y = this.pos[1] + delta_y;
    var other_rect = obj.getCollisionRect();
        
    if (delta_y > 0)
        new_y = other_rect.top - this.collisionRect.bottom -1; 
    else if (delta_y < 0)
        new_y = other_rect.bottom - this.collisionRect.top +1;
 
    return new_y;
}

Entity.prototype.move = function(x, y) {
    var new_x = this.pos[0] + x;
    var new_y = this.pos[1] + y;
    if (this.solid) {
        // Check for collisions with horizontal movement.
        if (x) {
            var objs = this.intersectingSolidsTo(new_x, this.pos[1]);
            for (var i = 0; i < objs.length; i++) {
                var old_x = new_x;
                new_x = this.correctForCollisionX(x, objs[i]);
                if ((x > 0) && (old_x < new_x))
                    new_x = old_x;
                else if ((x < 0) && (old_x > new_x))
                    new_x = old_x;
            }
        }
        // And vertical
        if (y) {
            var objs = this.intersectingSolidsTo(this.pos[0], new_y);
            for (var i = 0; i < objs.length; i++) {
                var old_y = new_y;
                new_y = this.correctForCollisionY(y, objs[i]);
                if ((y > 0) && (old_y < new_y)) // if moving downwards then correct to highest.
                    new_y = old_y;
                else if ((y < 0) && (old_y > new_y))
                    new_y = old_y; // if moving upwards then correct to lowest
            }          
        }
       
    }
    this.pos[0] = new_x;
    this.pos[1] = new_y;
}

Entity.prototype.hasLOS = function(target, offset) {

    // TODO: cull this test list to likely candidates - i.e. anything in the same direction as the target
    var entities = [];
    for (var n in this.game.entities) {
        var entity = this.game.entities[n];
        if ((entity == target) || (entity == this) || (!entity.solid))
            continue;
        entities.push(entity);
    }

    // check to top left and bottom right of target
    var points = [
        target.pos,
        [target.pos[0] + (target.collisionRect.right /2), target.pos[1] + (target.collisionRect.bottom /2)]
    ];

    var from = [
        this.pos[0] + offset[0],
        this.pos[1] + offset[1]
    ];

    for (var i=0; i < points.length; i++) {
        if (this.hasLOStoPoint(from, points[i], entities)) return true;   
    }

    return false;
};

Entity.prototype.hasLOStoPoint = function(from, to, entities) {
    var xdiff = to[0] - from[0];
    var ydiff = to[1] - from[1];

    if ((!xdiff) && (!ydiff)) return false; // they're in the same place

    var xstep = xdiff >= 0 ? 1 : -1;
    var ystep = ydiff >= 0 ? 1 : -1;

    var axdiff = Math.abs(xdiff);
    var aydiff = Math.abs(ydiff);

    if (axdiff > aydiff) {
        ystep = aydiff / axdiff;
        if (ydiff < 0) ystep *= -1;
    }
    else if (aydiff > axdiff) {
        xstep = axdiff / aydiff;
        if (xdiff < 0) xstep *= -1;
    }

    var x = from[0]
    var y = from[1];

    while (1) {
        var my_rect = {
            left: x,
            right: x,
            top: y,
            bottom: y
        }
        for (var i = 0; i < entities.length; i++) {
            if (this.areRectsColliding(my_rect, entities[i].getCollisionRect())) {
                return false;
            }
        }
        x += xstep;
        y += ystep;

        // Avoid Math.abs (expensive)
        if ((xstep < 0) && (x < to[0])) break;
        if ((xstep > 0) && (x > to[0])) break;
        if ((ystep < 0) && (y < to[1])) break;
        if ((ystep > 0) && (y > to[1])) break;
        

    }
    return true;
};



