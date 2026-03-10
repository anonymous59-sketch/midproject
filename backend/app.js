const express = require("express");
const app = express();

const path = require("path");
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// 개발 시 프론트(8080)에서 우선순위 API 직접 요청 허용
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (
    origin &&
    (origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:"))
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 라우팅 등록 영역
app.get("/", function (req, res, next) {
  res.sendFile(path.join(__dirname, "./public", "index.html"));
});

const Router = require("./router/router.js"); // 모든 라우터가 모여있는 파일이 router.js
app.use("/api", Router);

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "./public", "index.html"));
});

// 서버 실행
const port = 3000;
app.listen(port, () => console.log(`서버 실행 http://localhost:${port}`));
