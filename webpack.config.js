var path = require('path');
var webpack = require('webpack');
var fs = require('fs');
var nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/index.ts',
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'app.js',
    libraryExport: '',
    library: '',
    libraryTarget: 'commonjs'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        loaders: ['babel-loader', 'ts-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.js/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  stats: {
    colors: true
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  externals: [nodeExternals()]
};
