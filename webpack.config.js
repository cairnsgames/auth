const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require('copy-webpack-plugin');

/*We are basically telling webpack to take index.js from entry. Then check for all file extensions in resolve. 
After that apply all the rules in module.rules and produce the output and place it in main.js in the public folder.*/

module.exports = (env) => {
    // target identifies which .env file to use
  if (env.target === "production") {
    console.log("production");
    process.env.NODE_ENV = "production";
  }
  const environment = process.env.NODE_ENV || "";

  const envpath = "./.env" + (environment !== "" ? "." + environment : "");

  // Load the .env file
  require("dotenv").config({ path: envpath });
  process.env.ENV = process.env.NODE_ENV || "development";
  process.env.envpath = envpath;

  return {
    /** "mode"
     * the environment - development, production, none. tells webpack
     * to use its built-in optimizations accordingly. default is production
     */
    mode: "development",
    /** "entry"
     * the entry point
     */
    entry: "./src/index.js",
    plugins: [
      new webpack.DefinePlugin({
        "process.env": JSON.stringify(process.env),
      }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'public' }
            ]
        })
    ],
    /** "target"
     * setting "node" as target app (server side), and setting it as "web" is
     * for browser (client side). Default is "web"
     */
    target: "web",
    devServer: {
      /** "port"
       * port of dev server
       */
      port: "3000",
      /** "static"
       * This property tells Webpack what static file it should serve
       */
      static: ["./public"],
      /** "open"
       * opens the browser after server is successfully started
       */
      open: true,
      /** "hot"
       * enabling and disabling HMR. takes "true", "false" and "only".
       * "only" is used if enable Hot Module Replacement without page
       * refresh as a fallback in case of build failures
       */
      hot: true,
      /** "liveReload"
       * disable live reload on the browser. "hot" must be set to false for this to work
       */
      liveReload: true,
    },
    resolve: {
      /** "extensions"
       * If multiple files share the same name but have different extensions, webpack will
       * resolve the one with the extension listed first in the array and skip the rest.
       * This is what enables users to leave off the extension when importing
       */
      extensions: [".js", ".jsx", ".json"],
    },
    module: {
      /** "rules"
       * This says - "Hey webpack compiler, when you come across a path that resolves to a '.js or .jsx'
       * file inside of a require()/import statement, use the babel-loader to transform it before you
       * add it to the bundle. And in this process, kindly make sure to exclude node_modules folder from
       * being searched"
       */
      rules: [
        {
          test: /\.(js|jsx)$/, //kind of file extension this rule should look for and apply in test
          exclude: /node_modules/, //folder to be excluded
          use: "babel-loader", //loader which we are going to use
        },
        {
          test: /\.(s(a|c)ss)$/,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
      ],
    },
  };
};
