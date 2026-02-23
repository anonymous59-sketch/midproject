const express = require("express");
const app = express(); 

app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); 

// 라우팅 등록 영역
app.get("/", (req, res) => {
  res.send("Welcome!");
});

// 프록시 테스트용 (Vue devServer proxy: /api -> localhost:3000, pathRewrite /api 제거)
app.get("/hello", (req, res) => {
  res.json({ message: "Hello from Express", proxy: "ok", timestamp: new Date().toISOString() });
});

const Router = require("./router/router.js"); // 모든 라우터가 모여있는 파일이 router.js
app.use("/", Router);

// 서버 실행
const port = 3000;
app.listen(port, () => console.log(`서버 실행 http://localhost:${port}`));