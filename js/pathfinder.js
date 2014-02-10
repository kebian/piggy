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

function Pathfinder(game) {
    this.game = game;
}

Pathfinder.prototype.shouldConsiderEntity = function(us, them, mystate) {
    if ((!(them instanceof Wall)) && (!(them instanceof Ladder))) return false;
    if (them == mystate.onPlatform) return false;
    if (them == mystate.onTopOfLadder) return false;
    if (them == mystate.onLadder) return false;

    if ((them instanceof Wall) && (them.getCollisionRect().top == us.getCollisionRectAt(mystate.pos[0], mystate.pos[1]).bottom +1)) 
        return false; // We're already a the height of this platform and can use it to move further.

    return true;
};

Pathfinder.prototype.to = function(pos, entity) {
    // Correct to coordinates that are actually reachable by us.
    // We do this by finding a platform or ladder under y and adjusting y
    // to our position if we were to stand on that platform.
    var done = false;
    var x = pos[0];
    var y = pos[1];
    var entityRect = entity.getCollisionRect();
    var entityHeight = (entityRect.bottom - entityRect.top) +1;

    for (var i = y; (i < this.game.canvas.height) && !done; i++) {
        var colliders = entity.collidingEntitiesAt(x, i, false);
        for (var col_index in colliders) {
            var collider = colliders[col_index];
            var colliderRect = collider.getCollisionRect();
            
            if (collider instanceof Wall) {
                y = colliderRect.top - entityHeight -1;
            }
            else if (collider instanceof Ladder) {
                y = colliderRect.top - entityHeight -1;
               
                if (y > entityRect.bottom)
                    y = colliderRect.bottom - entityHeight;
                else if (y - entityHeight < entityRect.top)
                    y = entityRect.top - entityHeight;
            }
            else {
                continue;
            }
         
            done = true;
            break;
        }

    }
    return this._to(x, y, entity);
}

Pathfinder.prototype._to = function(dest_x, dest_y, entity, locs, direction, deep) {
    var path = [];
    var state = {
        onPlatform: false,
        onLadder: false,
        onTopOfLadder: false,
        falling: false,
        atDestinationHeight: false,
        pos: [],
    }

    var next_pos = {};
    
    if (!locs) {
        state.pos = entity.pos;
        locs = [state.pos];
    }
    else state.pos = locs[locs.length-1];

    if (!deep)
        deep = 0;

    if ((state.pos[0] == dest_x) && (state.pos[1] == dest_y)) {
        // Already at destination - end recursion
        return locs;
    }
    var collisionRect = entity.getCollisionRectAt(state.pos[0], state.pos[1]);
    
    // Find some basic state info about my position for use in later logic.
    if (state.pos[1] == dest_y)
        state.atDestinationHeight = true;
    
    
    var collisions = entity.collidingEntitiesAt(state.pos[0], state.pos[1], false);
    for (i in collisions) {
        var test = collisions[i];
        if (test instanceof Wall) {
            if (test.getCollisionRect().top == collisionRect.bottom +1) {
                state.onPlatform = test;
            }
        }
        else if (test instanceof Ladder) {
            if (test.getCollisionRect().top == collisionRect.bottom +1) {
                state.onTopOfLadder = test;
            }
            state.onLadder = test;
        }
    }

    if (!state.onPlatform && !state.onLadder && !state.onTopOfLadder) state.falling = true;

    if (!state.falling) { // No point in testing left, right and up if we can't get there from here.

        if (direction != 'right') { // Don't test objects to the right if we're moving the other way
            for (var x = state.pos[0]; x >=0 - collisionRect.right; x--) {

                if ((state.atDestinationHeight) && (x == dest_x)) {
                    next_pos['left'] = [x, state.pos[1]];
                    break;
                }
             

                var collisions = entity.collidingEntitiesAt(x, state.pos[1], false);
                var done = false;
                if (!collisions.length) {
                    // Air.  This is a valid place to move to, to initiate a fall
                    next_pos['left'] = [x, state.pos[1]];
                    break;
                }

                for (i in collisions) {
                    var collider = collisions[i];
                    if (!this.shouldConsiderEntity(entity, collider, state)) continue;

                    var other_rect = collider.getCollisionRect();
                    if (collider instanceof Wall) next_pos['left'] = null; // impassible.
                    else if (collider instanceof Ladder)
                        next_pos['left'] = [other_rect.left + Math.floor((collisionRect.right - collisionRect.left)/2), state.pos[1]];
                    done = true;
                    break;
                }

               if ((state.atDestinationHeight) && (next_pos['right']) && (next_pos['right'][0] < dest_x)) {
                    // Our destination is actually in front of our path.  Proceed straight there.
                    next_pos['left'][0] = dest_x;  
                } 
                if (done) break;
                
            }
        }

        // Look for path to the right
        if (direction != 'left') { 
            for (var x = state.pos[0]; x < this.game.canvas.width; x++) {

                if ((state.atDestinationHeight) && (x == dest_x)) {
                    next_pos['right'] = [x, state.pos[1]];
                    break;
                }

                var collisions = entity.collidingEntitiesAt(x, state.pos[1], false);
                var done = false;
                if (!collisions.length) {
                    // Air.  This is a valid place to move to, to initiate a fall
                    next_pos['right'] = [x, state.pos[1]];
                    break;
                }

                for (i in collisions) {
                    var collider = collisions[i];
                    if (!this.shouldConsiderEntity(entity, collider, state)) continue;

                    var other_rect = collider.getCollisionRect();
                    if (collider instanceof Wall) next_pos['right'] = null; // impassible.
                    else if (collider instanceof Ladder)
                        next_pos['right'] = [other_rect.left + Math.floor((collisionRect.right - collisionRect.left)/2), state.pos[1]];
                    done = true;
                    break;
                }

                if ((state.atDestinationHeight) && (next_pos['right']) && (next_pos['right'][0] > dest_x)) {
                    // Our destination is actually in front of our path.  Proceed straight there.
                    next_pos['right'][0] = dest_x;  
                }
                
                if (done) break;                
            }

        }
        
        // Look for path above
        if (direction != 'down') {
            if (state.onLadder && !state.onTopOfLadder) {
                var ladderRect = state.onLadder.getCollisionRect();

                var rectOnLadder = entity.getCollisionRectAt(dest_x, dest_y);
                if (entity.areRectsIntersecting(ladderRect, rectOnLadder)) 
                    next_pos['up'] = [dest_x, dest_y];
                else
                    next_pos['up'] = [state.pos[0], ladderRect.top -2 - (collisionRect.bottom - collisionRect.top)];
            }   
        }

    }
   
   if (state.falling || state.onLadder) {
        // Look for path below
        if (direction != 'up') {
            for (var y = state.pos[1]; y < this.game.canvas.height; y++) {
                var collisions = entity.collidingEntitiesAt(state.pos[0], y, false);
                for (i in collisions) {
                    var other_entity = collisions[i];

                    if (other_entity instanceof Wall) {
                        next_pos['down'] = [state.pos[0], other_entity.getCollisionRect().top - entity.collisionRect.bottom -1];      
                        break;
                    }
                    else if (other_entity instanceof Ladder) {
                        next_pos['down'] = [state.pos[0], other_entity.getCollisionRect().bottom - entity.collisionRect.bottom -1];  
                    }
                }  
                if (other_entity) break; 
            }
        }
  
    }

    var paths = {}
    for (var dir in next_pos) {
        if (!next_pos[dir]) continue;
        if (this.isLocInList(next_pos[dir], locs)) break;
        

        var test_locs = locs.slice(0);
        test_locs.push(next_pos[dir]);

        paths[dir] = this._to(dest_x, dest_y, entity, test_locs, dir, deep+1);
    }
    return this.choosePath([dest_x, dest_y], paths);
};

Pathfinder.prototype.isLocInList = function(loc, list) {
    for (var i in list) {
        if ((list[i][0] == loc[0]) && (list[i][1] == loc[1])) {
            return true;
        }
    }
    return false;
};

Pathfinder.prototype.choosePath = function(destination, options) {
    var favourite = null;
    var favourite_diff = null;
    for (i in options) {
        var path = options[i];
        if ((!path) || (!path.length)) continue;

        var this_diff = this.posdiff(path[path.length-1], [destination[0], destination[1]]);

        if (favourite) {
            if (this_diff < favourite_diff) {
                favourite = paths[i];
                favourite_diff = this_diff;             
            }
            else if (path.length < favourite.length) {
                favourite = path;
                favourite_diff = this_diff;
            }
        }
        else {
            favourite = path;
            favourite_diff = this_diff;
        }

    }
    if (!favourite) favourite = [];
    return favourite;
};

Pathfinder.prototype.posdiff = function(a, b) {
    var x = Math.abs(b[0] -a[0]);
    var y = Math.abs(b[1] -a[1]);
    return x+y;
};

Pathfinder.prototype.entityAt = function(x, y) {
    for (var n in this.game.entities) {
        var entity = this.game.entities[n];
        var my_rect = {
            left: x,
            right: x,
            top: y,
            bottom: y
        }

        if (entity.areRectsColliding(my_rect, entity.getCollectionRect()))
            return entity;
    }
    return false;
};
