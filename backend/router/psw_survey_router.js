// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능의 라우터인지 알기 쉽게 영문으로 적어주는 걸 권장
// export하고 같은 경로의 router.js에서 require부분에 해당 폴더 경로를 추가해주기
// 라우터 통합은 조금 까다로우니까 router.js 파일 잘 확인하기

// express의 router 모듈
const express = require("express");
const router = express.Router();

const survey = require("../services/svc.js"); // 서비스 가져오기. svc.js가 모든 서비스 모여있는 곳이라서 이 경로를 가져오면 됨

// 조사지 검색 & 전체조회
router.get("/survey", async (req, res) => {
  const searchName = req.query.sv_name || ""; // 만약 검색 내용이 아무것도 없다면 빈 문자열을 기본값으로 받아서 전체 조회가 됨
  const result = await survey
    .psw_searchSurveyName(searchName)
    .catch((err) => console.error(err));
  res.send(result);
});

router.get("/majCate", async (req, res) => {
  const result = await survey.psw_majCateList(req.query.sver_code).catch(err => console.error(err));
  res.send(result);
});
router.get("/subCate", async (req, res) => {
  const result = await survey.psw_subCateList(req.query.sver_code).catch(err => console.error(err));
  res.send(result);
});
router.get("/surveyQ", async (req, res) => {
  const result = await survey.psw_surveyQList(req.query.sver_code).catch(err => console.error(err));
  res.send(result);
});

// 조사지 전체 저장(등록/수정) – 한 버전 전체를 저장
router.post("/survey", async (req, res) => {
  try {
    const payload = req.body;
    const result = await survey.psw_saveSurveyAll(payload);
    res.status(result.isSuccessed ? 200 : 400).send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ isSuccessed: false, message: "server error" });
  }
});

// 조사지 전체 수정(버전 코드가 URL에 있는 경우)
router.put("/survey/:sver_code", async (req, res) => {
  try {
    const payload = req.body;
    const result = await survey.psw_saveSurveyAll(payload);
    res.status(result.isSuccessed ? 200 : 400).send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ isSuccessed: false, message: "server error" });
  }
});

module.exports = router;
