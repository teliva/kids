const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const kidsDir = path.dirname(require.resolve('kids/package.json'))

module.exports = (env, argv) => {
  // Development compiles the kids TypeScript source in this process, so one
  // `npm run dev` picks up component edits. Production uses the built package
  // (apps/kids/dist), resolved the same way any consumer would.
  const fromSource = argv.mode === 'development'

  return {
    context: __dirname,
    entry: {
      // Registers every kd-* element; loaded by every page
      main: 'kids',
      // Configurator-only script; only configurator.html lists this chunk
      configurator: './configurator-main.js',
    },
    devtool: argv.mode === 'production' ? false : 'source-map',
    module: {
      rules: fromSource
        ? [
            {
              test: /\.ts$/,
              include: path.join(kidsDir, 'src'),
              loader: 'ts-loader',
              options: {
                configFile: path.join(kidsDir, 'tsconfig.json'),
                compilerOptions: { declaration: false },
              },
            },
          ]
        : [],
    },
    resolve: fromSource
      ? {
          alias: { kids$: path.join(kidsDir, 'src/main.ts') },
          // Source imports use the .js extension their compiled output needs
          extensionAlias: { '.js': ['.ts', '.js'] },
        }
      : {},
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './configurator.html',
        filename: 'configurator.html',
        chunks: ['main', 'configurator'],
      }),
      new HtmlWebpackPlugin({
        template: './page.html',
        filename: 'page.html',
        chunks: ['main'],
      }),
      new HtmlWebpackPlugin({
        template: './login.html',
        filename: 'login.html',
        chunks: ['main'],
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: path.join(kidsDir, fromSource ? 'src/css' : 'dist/css'), to: 'css' },
          { from: 'favicon.svg', to: 'favicon.svg' },
          { from: 'data', to: 'data' },
          { from: require.resolve('normalize.css/normalize.css'), to: 'css/normalize.css' },
        ],
      }),
    ],
    devServer: {
      static: path.resolve(__dirname, 'dist'),
      port: 5173,
      open: true,
    },
  }
}
