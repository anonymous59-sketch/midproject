const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')

module.exports = defineConfig({
  devServer: {
    proxy: {
      // /api/support/xxx → http://localhost:3000/support/xxx
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  },

  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: JSON.stringify(true),
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false)
      })
    ]
  }
})
// vue에서 axios를 통해 연결할 때 axios.get('/api/hello') 이렇게 연결하면 http://localhost:3000/hello 이렇게 연결이 된다고 함
// express 폴더(서버)에서는 app.get('/hello', (req, res) => {res.json({ message: 'Hello' }); 이렇게 사용하는 방식 (주소에 /api 없어도 됨)
