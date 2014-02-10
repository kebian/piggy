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

function Level(game) {
    this.game = game;
    this.entities = {};
}

Level.prototype.load = function(name, callback) {
    var me = this;
    this.loadJSON(this.game.resPath('levels/' + name + '.json'), function(response) {
        var game = me.game;
        var obj = JSON.parse(response);

        game.clearEntities();

        for(var i in obj) {
            var e = obj[i];
            switch(e.type)  {
                case 'Background':
                    game.addEntity(e.name, new Background(game, game.resPath(e.img))); 
                    break;
                case 'Wall':
                    game.addEntity(e.name, new Wall(game, {
                        left: e.left,
                        right: e.right,
                        top: e.top,
                        bottom: e.bottom
                    }));
                    break;
                case 'Ladder':
                    game.addEntity(e.name, new Ladder(game, {
                        left: e.left,
                        right: e.right,
                        top: e.top,
                        bottom: e.bottom                        
                    }));
                    break;
                case 'Piggy':
                    game.addEntity(e.name, new Piggy(game, e.x, e.y));
                    break;
                case 'Matchstick':
                    game.addEntity(e.name, new Matchstick(game, e.x, e.y));
                    break;
                case 'Kak':
                    game.addEntity(e.name, new Kak(game, e.x, e.y));
                    break;
            }
        }
        if (callback)
            callback.call();
    });
}

Level.prototype.loadJSON = function(file, callback) {   
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', file, true); 
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
        }
    };
    xobj.send(null);  
}
