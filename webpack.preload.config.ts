import type { Configuration } from 'webpack';

// Custom rules for preload - exclude asset-relocator-loader that injects __dirname
const preloadRules = [
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
      },
    },
  },
];

export const preloadConfig: Configuration = {
  target: 'electron-preload',
  module: {
    rules: preloadRules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  // Preserve Node.js globals - don't let webpack replace them
  node: {
    __dirname: false,
    __filename: false,
  },
};
