module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  }
};

// vue에서 axios를 통해 연결할 때 axios.get('/api/hello') 이렇게 연결하면 http://localhost:3000/hello 이렇게 연결이 된다고 함
// express 폴더(서버)에서는 app.get('/hello', (req, res) => {res.json({ message: 'Hello' }); 이렇게 사용하는 방식 (주소에 /api 없어도 됨)