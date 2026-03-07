const path = require('path');

/**
 * CRACO config: disable ForkTsCheckerWebpackPlugin in development to avoid
 * "config.logger.log is not a function" (react-dev-utils nested plugin + Webpack 5).
 * Type checking still runs via tsc in the IDE; build keeps the plugin.
 */
module.exports = {
  webpack: {
    configure: (config) => {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'lucide-react': path.resolve(__dirname, 'src/icons/flaticonsCompat.tsx')
      };

      if (process.env.NODE_ENV === 'development') {
        config.plugins = config.plugins.filter(
          (plugin) => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
        );
      }
      return config;
    }
  }
};
