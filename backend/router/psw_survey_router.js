// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능의 라우터인지 알기 쉽게 영문으로 적어주는 걸 권장
// export하고 같은 경로의 router.js에서 require부분에 해당 폴더 경로를 추가해주기
// 라우터 통합은 조금 까다로우니까 router.js 파일 잘 확인하기

// express의 router 모듈
const express = require("express");
const router = express.Router();

const survey = require("../services/svc.js"); // 서비스 가져오기. svc.js가 모든 서비스 모여있는 곳이라서 이 경로를 가져오면 됨
// 조사지 전체 조회
router.get("/surveys", async (req, res) => {
  const result = await survey
    .psw_showSurveyList()
    .catch((err) => console.error(err));
  res.send(result);
});
// 조사지 이름 검색
router.get("/survey", async (req, res) => {
  const searchName = req.query.sv_name || ""; // 만약 검색 내용이 아무것도 없다면 빈 문자열을 기본값으로 받아서 전체 조회가 됨
  const result = await survey
    .psw_searchSurveyName(searchName)
    .catch((err) => console.error(err));
  res.send(result);
});
/* Axios: axios.get('/api/survey', { params: { sv_name: 1 }}) 가능
fetch: fetch('/api/survey?sv_name=1') 형태로 URL에 직접 붙여야 함 */
//// 전체조회와 검색 조회를 하나로 합치는 건데 좀 확인해보고 적용해야할듯
//// 작동 방식은 검색 조회에 값이 안들어오면 전체조회, 값이들어오면 검색 조회, 그리고 검색창에선 vue의 watch를 이용해 값을 계속 감시하는 방식으로 할듯
// router.get("/survey", async (req, res) => {
//   const searchName = req.query.sv_name || "";
//   try {
//     const result = searchName
//       ? await survey.psw_searchSurveyName(searchName)
//       : await survey.psw_showSurveyList();
//     res.send(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({ error: "데이터 조회 실패" });
//   }
// });

// 조사지 대분류 등록
router.post("/survey/majorCategory", async (req, res) => {
  const inputData = req.body;
  // vue 쪽에서 major_code, sver_code, major_name 속성의 값을 받아와야함
  const result = await survey
    .psw_createMajorCategory(inputData)
    .catch((err) => console.error(err));
  res.send(result);
});
// 조사지 소분류 등록
router.post("/survey/subCategory", async (req, res) => {
  const inputData = req.body;
  // vue 쪽에서 sub_code, major_code, sub_name 속성의 값을 받아와야함
  const result = await survey
    .psw_createSubCategory(inputData)
    .catch((err) => console.error(err));
  res.send(result);
});
// 조사지 세부 질문 등록
router.post("/survey/surveyQuestion", async (req, res) => {
  const inputData = req.body;
// vue 쪽에서 q_code, sub_code, q_no, q_type, q_content 속성의 값을 받아와야함
  const result = await survey
    .psw_createSurveyQuestions(inputData)
    .catch((err) => console.error(err));
  res.send(result);
});

// 수정: 대분류·소분류·질문 3곳 한 번에 수정 (트랜잭션, 하나라도 실패 시 rollback)
// body: { major_name, major_code, sub_name, sub_code, q_content, q_code }
router.put("/survey/categories", async (req, res) => {
  const updateData = req.body
  const result = await survey
    .psw_updateSurveyCategories(updateData)
    .catch((err) => console.error(err));
  res.send(result);
});

module.exports = router;
