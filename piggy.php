<?php
/**
 * Plugin Name: Piggy in Search of Kak
 * Plugin URI: http://void7.net/piggy
 * Description: Embeds the Piggy in Search of Kak game using a short code.
 * Version: 1.0
 * Author: Rob Stiles
 * Author URI: http://void7.net
 * License: MIT
 

Copyright (c) 2014 Rob Stiles (email : kebian@void7.net)

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

add_action( 'wp_enqueue_scripts', function() {
    wp_enqueue_style('piggy-game', plugins_url('css/piggy.css', __FILE__));
});


add_shortcode('piggy', function() {
    $real_url = function($url) {
        return plugins_url($url, __FILE__);
    };

    $scripts = array(
        'js/resourcecache.js',
        'js/framesequence.js',
        'js/entity.js',
        'js/sprite.js',
        'js/piggy.js',
        'js/matchstick.js',
        'js/kak.js',
        'js/wall.js',
        'js/ladder.js',
        'js/text.js',
        'js/background.js',
        'js/titlescreen.js',
        'js/game.js',
        'js/piggygame.js',
        'js/input.js',
        'js/level.js',       
    );
    $output = '';
    foreach($scripts as $script) {
        $output .= '<script src="' . $real_url($script) . '"></script>' . PHP_EOL;
    }
    $output .= '<canvas id="piggy_canvas" tabindex="1"></canvas>' . PHP_EOL;
    $output .= <<< EOF
        <script type="text/javascript">
            var canvas = document.getElementById('piggy_canvas');
            new PiggyGame(canvas, '{$real_url('/')}').run();
            canvas.focus();
        </script>
EOF;
    return $output;

});