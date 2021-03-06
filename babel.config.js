module.exports = function (api) {
  api.cache(true)

  return {
    presets: [
      [
        "@babel/preset-env",
        { useBuiltIns: "usage", corejs: 3, exclude: ["es.promise"] }
      ]
    ],
    plugins: [
      "@babel/plugin-transform-runtime",
      "@babel/plugin-syntax-dynamic-import"
    ],
    sourceType: "unambiguous"
  }
}
