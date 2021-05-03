const webpack = require('webpack');
let path = require("path");
let BundleTracker = require('webpack-bundle-tracker');
const BundleClean = require('webpack-bundle-clean');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
let LiveReloadPlugin = require('webpack-livereload-plugin');

module.exports = {
  mode: 'development',
  context: __dirname,

  node: {
    fs: 'empty'
  },

  entry: {
    main: ['./app/static/app/js/main.jsx'],
    Console: ['./app/static/app/js/Console.jsx'],
    Dashboard: ['./app/static/app/js/Dashboard.jsx'],
    MapView: ['./app/static/app/js/MapView.jsx'],
    ModelView: ['./app/static/app/js/ModelView.jsx']
  },

  output: {
      path: path.join(__dirname, './app/static/app/bundles/'),
      filename: "[name]-[hash].js"
  },

  plugins: [
    new LiveReloadPlugin({appendScriptTag: true}),
    new BundleClean({filename: './webpack-stats.json'}),
    new BundleTracker({filename: './webpack-stats.json'}),
    new MiniCssExtractPlugin({filename: 'css/[name]-[hash].css'})
  ],

  module: {
    rules: [
      { 
        test: /\.jsx?$/, 
        exclude: /(node_modules|bower_components)/, 
        use: [
          {
            loader: 'babel-loader',
            query: {
              plugins: [
                 '@babel/syntax-class-properties',
                 '@babel/proposal-class-properties'
              ],
              presets: [
                '@babel/preset-env',
                '@babel/preset-react'
              ]
            }
          }
        ],
      },
      {
        test: /\.s?css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              implementation: require("sass")
            }
          }
        ]
      },
      {
        test: /\.(png|jpg|jpeg|svg)/,
        loader: "url-loader?limit=100000"
      },
      {
        // shaders
        test: /\.(frag|vert|glsl)$/,
        loader: 'raw-loader'
      }
    ]
  },

  resolve: {
    modules: ['node_modules', 'bower_components'],
    extensions: ['.js', '.jsx']
  },

  externals: {
    // require("jquery") is external and available
    //  on the global let jQuery
    "jquery": "jQuery",
    "SystemJS": "SystemJS",
    "THREE": "THREE",
    "React": "React",
    "ReactDOM": "ReactDOM"
  },

  watchOptions: {
    ignored: ['node_modules', './**/*.py'],
    aggregateTimeout: 300,
    poll: 1000
  }
}