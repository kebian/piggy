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

function ResourceCache() {
    this.cache = {};
}

ResourceCache.prototype.checkReady = function() {
    if (this.isReady() && this.onReady) {
        this.onReady();
    }
}

ResourceCache.prototype.loadSingle = function(url) {
    if (this.cache[url]) return; // Already loaded.

    var me = this;

    switch(this.fileExt(url)) {
        case 'png':
            var img = new Image();
            img.onload = function() {
                me.cache[url] = this;
                console.log('Image loaded: ' + url);
                me.checkReady();
            }
            this.cache[url] = false;
            img.src = url;
            break;

        case 'mp3':
            var audio = new Audio();
            // It would be nice to wait for the sound
            // files to load but this seems to be unreliable in Chrome.
            /*
            audio.oncanplaythrough = function() {
                this.oncanplaythrough = null;
                me.cache[url] = this;
                console.log('Audio loaded: ' +url);
                me.checkReady();
            }
            this.cache[url] = false;
            */
            this.cache[url] = audio;
            audio.preload = 'auto';   
            audio.src = url;
            break;
    }
}

ResourceCache.prototype.load = function(urls) {
    var x = this;
    if (urls instanceof Array) {
        urls.forEach(function(url) {
            x.loadSingle(url);
        });
    }
    else x.loadSingle(urls);
}

ResourceCache.prototype.isReady = function() {
    for(var i in this.cache) {
        if (!this.cache.hasOwnProperty(i) || !this.cache[i])
            return false;
    }
    return true;
}

ResourceCache.prototype.get = function(url) {
    return this.cache[url];
}

ResourceCache.prototype.fileExt = function(filename) {
    return filename.split('.').pop();
};