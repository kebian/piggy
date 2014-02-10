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

function Input(game) {
    this.game = game;
    this.keys = {};
    this.onKeyPress = null;

    var me = this;
    
    document.addEventListener('keydown', function(e) {
        me.setKeyState(e, true);
        if (me.onKeyPress)
            me.onKeyPress.call(e);
        if (document.activeElement == me.game.canvas)
            e.preventDefault();
    });
    
    document.addEventListener('keyup', function(e) {
        me.setKeyState(e, false);
        if (document.activeElement == me.game.canvas)
            e.preventDefault();
    });

    window.addEventListener('blur', function() {
        me.keys = {};
    });
}

Input.prototype.setKeyState = function(event, status) {
    var key_code = event.keyCode;
    switch(key_code) {
        // Convert to useful names
        case 32:
            key = 'SPACE';
            break;
        case 37:
            key = 'LEFT';
            break;
        case 38:
            key = 'UP';
            break;
        case 39:
            key = 'RIGHT';
            break;
        case 40:
            key = 'DOWN';
            break;
        // And convert anything else to their corresponding letters.
        default:
            key = String.fromCharCode(key_code);
            break;
    }
    this.keys[key] = status;
    //console.log(key + ' = ' + status);
};

Input.prototype.keyState = function(key) {
    return this.keys[key];
};