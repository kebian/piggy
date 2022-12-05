const path = require('path')

module.exports = {
    entry: './src/index.ts',
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            { test: /\.png$/, loader: 'url-loader' },
            { test: /\.mp3$/, loader: 'url-loader' },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),

        library: {
            name: 'PiggyGame',
            type: 'var',
            export: 'default',
        },
    },
}
