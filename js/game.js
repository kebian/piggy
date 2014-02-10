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

var Game = function(canvas) {
    this.canvas = canvas;
    this.context2d = canvas.getContext('2d');
    this.level = 1;
    this.last_time = null;
    this.entities = {} // indexed by name
    this.renderOrder = [];
    this.input = new Input(this);
    this.force_x = 0;
    this.force_y = 0;
    this.resources = null;
}

Game.prototype.addEntity = function(name, entity) {
    this.entities[name] = entity;
    this.recalcRenderOrder();
};

Game.prototype.clearEntities = function() {
    this.entities = [];
    this.renderOrder = [];
};

Game.prototype.recalcRenderOrder = function() {
    // Calculate the render order based on the zorder of the entities
    var order = [];
    for (var name in this.entities) {
        var added = false;
        var entity = this.entities[name];

        for (var i =0; i < order.length; i++) {
            if (entity.zorder < order[i].zorder) {
                order.splice(i, 0, entity);
                added = true;
                break;
            }
        }

        if (!added) {
            order.push(entity);    
        }
    }
    this.renderOrder = order;
};

Game.prototype.requestResources = function(resources) {

}

Game.prototype.run = function() {
    var resources = new ResourceCache();
    var me = this;

    this.canvas.focus();

    resources.onReady = function() {
        console.log('All resources loaded.');
        me.init();
    }
    this.resources = resources; 
    this.requestResources(resources);      
};

Game.prototype.init = function() {
    this.requestAnimFrame();
}

Game.prototype.requestAnimFrame = function() {
    // https://developer.mozilla.org/en/docs/Web/API/window.requestAnimationFrame
    var me = this;
    return window.requestAnimationFrame(function() {
        me.loop();
    })
};

Game.prototype.loop = function() {
    var now = Date.now();
    if (!this.last_time) this.last_time = now;
    var time_delta = (now - this.last_time);

    this.tick(time_delta);
    this.render();
    this.last_time = now;

    this.requestAnimFrame();
};

Game.prototype.entityTick = function(entity, name, time_delta) {
    // Using this override will save having to make your own
    // entity loops
}

Game.prototype.tick = function(time_delta) {
    for (var name in this.entities) {
        var entity = this.entities[name];
        this.entityTick(entity, name, time_delta);
        entity.tick(time_delta);
    } 
};

Game.prototype.render = function() {
    for (var i=0; i < this.renderOrder.length; i++) {
        var entity = this.renderOrder[i];
        if (entity.visible)
            entity.render(this.context2d);
    }
};
