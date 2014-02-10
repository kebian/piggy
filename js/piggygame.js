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

PiggyGame.prototype = Object.create(Game.prototype);
PiggyGame.prototype.constructor = PiggyGame;

function PiggyGame(canvas, resource_path) {
    Game.call(this, canvas);

    // This was the original resolution of the game & we scale it up using css.
    canvas.width=320;
    canvas.height=200;

    this.force_x = 0;
    this.force_y = 100; // Gravity
    this.level = new Level(this);

    this.ingame = false;
    this.resource_path = (resource_path != null) ? resource_path : '';
}

PiggyGame.prototype.resPath = function(url) {
    if (url) return this.resource_path + url;
    else return this.resource_path;
};

PiggyGame.prototype.requestResources = function(resources) {
    Game.prototype.requestResources.call(this, resources);

    var files = [
        'img/sprites.png',
        'img/level1.png',
        'img/title.png',
        'audio/burp.mp3',
        'audio/fire.mp3',
        'audio/footsteps.mp3'    
    ];
    for (var i in files) {
        files[i] = this.resPath(files[i]);
    }
    this.resources.load(files);
}

PiggyGame.prototype.getResource = function(url) {
    return this.resources.get(this.resPath(url));
}

PiggyGame.prototype.init = function(resources) {
    Game.prototype.init.call(this, resources);
    this.ingame = false;
    var game = this;
    this.level.load('original', function() {
        var piggy = game.entities['piggy'];

        piggy.onCollision = function(entity) {
            if (entity instanceof Matchstick) {
                piggy.die();
            }
            else if ((entity instanceof Kak) && (game.ingame)) {
                game.endGame();
                console.log('Piggy reached the Kakacola!');
                game.getResource('audio/burp.mp3').play();
                window.setTimeout(function() {
                    game.init();
                }, 5000);
            }
           
        }
        piggy.onDead = function() {
            console.log('Game sees piggy has died.');
            game.init();
        }

        game.input.onKeyPress = function() {
            game.startGame();
        }
        game.addEntity('title', new TitleScreen(game));
        console.log('Level loaded');
    });
}


PiggyGame.prototype.startGame = function() {
    this.ingame = true;
};

PiggyGame.prototype.endGame = function() {
    this.ingame = false;
    this.input.onKeyPress = null;
}

PiggyGame.prototype.tick = function(time_delta) {
    Game.prototype.tick.call(this, time_delta);
}

PiggyGame.prototype.entityTick = function(entity, name, time_delta) {
    if (entity.uses_gravity) {
        var onLadder = this.isEntityOnLadder(entity);
        entity.onLadder = onLadder; // Saves the entity also calculating it.
        if (onLadder && entity.gravity_applied) {
            entity.applyForce(-this.force_x, -this.force_y);
            entity.gravity_applied = false;
        }
        else if (!onLadder && !entity.gravity_applied) {
            entity.applyForce(this.force_x, this.force_y); 
            entity.gravity_applied = true; 
        }

    }
}

PiggyGame.prototype.isEntityOnLadder = function(entity) {
    var entities = entity.collidingEntitiesAt(entity.pos[0], entity.pos[1], false);
    for (var i = 0; i < entities.length; i++) {
        if (entities[i] instanceof Ladder)
            return entities[i];
    }
    return false;
};


PiggyGame.prototype.render = function() {
    var ctx = this.context2d;
    ctx.fillStyle="black";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    Game.prototype.render.call(this);
}