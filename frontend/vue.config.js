// vue.config.js
const { defineConfig } = require("@vue/cli-service");
const webpack = require("webpack");
const path = require("path");

// 백엔드 서버 주소
const backServer = "http://localhost:3000";

module.exports = defineConfig({
  // 빌드 결과물 경로: index.html → backend/public, js/css 등 → backend/public/assets
  outputDir: path.resolve(__dirname, "../backend/public"),
  assetsDir: "assets",

  // 개발 서버 설정
  devServer: {
    port: 8099, // Vite에서 설정한 포트 그대로
    proxy: {
      "/api": {
        target: backServer,
        changeOrigin: true,
        pathRewrite: { "^/api": "" },
      },
    },
  },

  // Webpack 설정
  configureWebpack: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"), // @ = src
      },
    },
    plugins: [
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: JSON.stringify(true),
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
      }),
    ],
  },
});
