const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = (env, argv) => ({
  entry: './src/main.ts',
  devtool: argv.mode === 'production' ? false : 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/configurator.html',
      filename: 'configurator.html',
    }),
    new HtmlWebpackPlugin({
      template: './src/page.html',
      filename: 'page.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'css', to: 'css' },
        { from: 'src/favicon.svg', to: 'favicon.svg' },
        { from: 'node_modules/normalize.css/normalize.css', to: 'css/normalize.css' },
      ],
    }),
  ],
  devServer: {
    static: './dist',
    port: 5173,
    open: true,
  },
})
