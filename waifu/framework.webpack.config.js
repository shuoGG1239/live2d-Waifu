
var path = require('path');
var glob = require('glob');

var entries = {}; 

glob.sync("./Framework/**/*.ts").map(
    function (file) {
        const regEx = new RegExp(`./Framework`);
        const key = file.replace(regEx, '').replace('.ts', '');
        entries[key] = file;
    }
);


module.exports = {
    mode: 'development',
    entry: entries,

    output: {
        filename : '[name].js',
        path: path.join(__dirname, '../dist/Framework/src')
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