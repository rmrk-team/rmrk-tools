module.exports = (api) => {
  if (api) api.cache(true);
  return {
    presets: [
      "@babel/typescript",
      [
        "@babel/preset-env",
        {
          targets: { browsers: "defaults, not ie 11", node: 'current' },
          modules: false,
          useBuiltIns: false,
          loose: true,
        },
      ],
    ],
    plugins: [
      "@babel/plugin-proposal-optional-chaining",
      "@babel/plugin-transform-modules-commonjs",
    ],
  };
};
