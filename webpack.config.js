module.exports = {
  entry: {
    index: [
      // Fix https://github.com/babel/babel/issues/9873
      "core-js/modules/es.array.iterator",
      "./src/index.js"
    ],
    worker: "./src/worker.js"
  },
  output: {
    path: __dirname + "/web/",
    filename: "[name].js",
    chunkFilename: "[name].js"
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
        test: /\.(html|svg)$/,
        loader: "raw-loader"
      }
    ]
  }
}
