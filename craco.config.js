module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Resolver problemas de polyfills do Node.js
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "process": false,
        "buffer": false,
        "crypto": false,
        "stream": false,
        "assert": false,
        "http": false,
        "https": false,
        "os": false,
        "url": false,
        "zlib": false
      };

      // Ignorar warnings de módulos não encontrados
      webpackConfig.ignoreWarnings = [
        function ignoreSourcemapsLoaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource.includes("node_modules") &&
            warning.details &&
            warning.details.includes("source-map-loader")
          );
        },
      ];

      return webpackConfig;
    },
  },
};
