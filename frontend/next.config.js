/* eslint @typescript-eslint/no-var-requires: 0 */
const withPlugins = require('next-compose-plugins');

const webpack = require('webpack');
const withSourceMap = require('@zeit/next-source-maps');
const optimizedImages = require('next-optimized-images');
const withBundleAnalyzer = require('@zeit/next-bundle-analyzer');
const withTM = require('next-transpile-modules');

const nextConf = {
  analyzeServer: ['server', 'both'].includes(process.env.BUNDLE_ANALYZE),
  analyzeBrowser: ['browser', 'both'].includes(process.env.BUNDLE_ANALYZE),
  bundleAnalyzerConfig: {
    server: {
      analyzerMode: 'static',
      // reportFilename: '../bundles/server.html'
    },
    browser: {
      analyzerMode: 'static',
      // reportFilename: '../bundles/client.html'
    },
  },

  env: {
    MOMO_API_ORIGIN:
      process.env.MOMO_API_ORIGIN ||
      // 'http://192.168.2.120:3001' || // pinkie-dev
      /* dev */ 'http://127.0.0.1:3001',

    OAUTH_DISCORD_CLIENT_ID: process.env.OAUTH_DISCORD_CLIENT_ID,
    OAUTH_GOOGLE_CLIENT_ID: process.env.OAUTH_GOOGLE_CLIENT_ID,
  },

  devIndicators: {
    autoPrerender: false,
  },

  // see https://nextjs.org/docs/#customizing-webpack-config
  webpack(config, { buildId, dev, isServer }) {
    config.plugins.push(
      new webpack.DefinePlugin({
        // becomes process.env.NEXT_DEV : boolean
        'process.env.NEXT_DEV': JSON.stringify(!!dev),
      }),
    );

    config.plugins = config.plugins.map((p) => {
      return p;
    });

    config.node = {
      // allow use of __file / __dirname
      ...config.node,
      __filename: true,
    };

    return config;
  },
};

module.exports = withPlugins(
  [
    [optimizedImages, { optimizeImages: false }],
    [withBundleAnalyzer],
    // [withSourceMap],  // this does not work
    withTM([/* ES modules used in server code */ 'lodash-es', '@jokester/ts-commonutil']),
  ],
  withSourceMap(nextConf),
);
