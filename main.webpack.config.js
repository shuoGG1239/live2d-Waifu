
var path = require('path');

module.exports = {

    mode: 'development',

    entry: './src/main.ts',

    output: {
        filename : 'index.js',
        path: path.join(__dirname, './dist')
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader'
            }
        ]
    },
    devtool: 'inline-source-map',
    resolve: {
        extensions: [
            '.ts',
        ]
    }
}