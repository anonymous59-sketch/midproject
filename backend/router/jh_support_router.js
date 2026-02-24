// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능의 라우터인지 알기 쉽게 영문으로 적어주는 걸 권장
// export하고 같은 경로의 router.js에서 require부분에 해당 폴더 경로를 추가해주기
// 라우터 통합은 조금 까다로우니까 router.js 파일 잘 확인하기

// express의 router 모듈
const express = require("express");
const router = express.Router();

const supportService = require("../services/svc.js"); // 서비스 가져오기. svc.js가 모든 서비스 모여있는 곳이라서 이 경로를 가져오면 됨

// 지원 계획 조회
router.get("/:supportCode", async (req, res) => {
  const supportCode = req.params.supportCode;
  try {
    const supportInfo =
      await supportService.getSupportInfoBySupCode(supportCode);
    // supportInfo가 1건 나왔을 때만 result 조회·응답 (supportInfo 0건이면 아래 실행 안 함)
    if (!supportInfo) {
      res.json({ retCode: "Fail", retMsg: "지원 정보 없음" });
      return;
    }
    const result = await supportService.getPlanBySupportCode(supportCode);
    if (result.length === 0) {
      res.json({ retCode: "Warning", retMsg: "조회 성공(0건)", data: [], infoData: supportInfo });
    } else if (result.length > 0) {
      res.json({ retCode: "Success", retMsg: "조회 성공", data: result, infoData: supportInfo });
    } else {
      res.json({ retCode: "Fail", retMsg: "조회 실패" });
    }
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "조회 중 오류 발생" });
  }
});

// 도서 등록
// router.post("/books", async (req, res) => {
//   const bookInfo = req.body;
//   const result = await bookService
//     .addNewBook(bookInfo)
//     .catch((err) => console.error(err));
//   res.send(result);
// });

// 도서 수정

// 도서 삭제

module.exports = router;
