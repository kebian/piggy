import Background from "./background";
import Kak from "./kak";
import Ladder from "./ladder";
import Matchstick from "./matchstick";
import Piggy from "./piggy";
import PiggyGame from "./piggygame";
import Wall from "./wall";

class Level {
    game: PiggyGame

    constructor (game: PiggyGame) {
        this.game = game
    }

    async load(name: string) {
        const json = await import(this.game.resPath('levels/' + name + '.json'))
        this.loadFromData(json)
    }

    private loadFromData(data: any) {
        this.game.clearEntities()

        for (const e of data) {
            switch(e.type) {
                case 'Background':
                    this.game.addEntity(e.name, new Background(this.game, this.game.resPath(e.img)))
                    break
                case 'Wall':
                    this.game.addEntity(e.name, new Wall(this.game, {
                        left: e.left,
                        right: e.right,
                        top: e.top,
                        bottom: e.bottom
                    }))
                    break
                case 'Ladder':
                    this.game.addEntity(e.name, new Ladder(this.game, {
                        left: e.left,
                        right: e.right,
                        top: e.top,
                        bottom: e.bottom    
                    }))
                    break
                case 'Piggy':
                    this.game.addEntity(e.name, new Piggy(this.game, { x: e.x, y: e.y }))
                    break
                case 'Matchstick':
                    this.game.addEntity(e.name, new Matchstick(this.game, { x: e.x, y: e.y }))
                    break
                case 'Kak':
                    this.game.addEntity(e.name, new Kak(this.game, { x: e.x, y: e.y }))
                    break
            }
        }
    }
}

export default Level

/*

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
*/