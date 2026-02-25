// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능의 라우터인지 알기 쉽게 영문으로 적어주는 걸 권장
// export하고 같은 경로의 router.js에서 require부분에 해당 폴더 경로를 추가해주기
// 라우터 통합은 조금 까다로우니까 router.js 파일 잘 확인하기

// express의 router 모듈
const express = require("express");
const router = express.Router();

const supportService = require("../services/svc.js"); // 서비스 가져오기. svc.js가 모든 서비스 모여있는 곳이라서 이 경로를 가져오면 됨

// 계획 승인/보완/반려 (순서: /plan/:planCode/decide 가 /:supportCode 보다 먼저 매칭되도록)
router.put("/plan/:planCode/decide", async (req, res) => {
  const { planCode } = req.params;
  const { decision, plan_cmt } = req.body || {};
  try {
    await supportService.decidePlan(planCode, decision, plan_cmt);
    res.json({ retCode: "Success", retMsg: "처리되었습니다." });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "처리 중 오류가 발생했습니다." });
  }
});

// 계획 수정
router.put("/plan/:planCode", async (req, res) => {
  const { planCode } = req.params;
  const { plan_goal, plan_content } = req.body || {};
  try {
    await supportService.updatePlan(planCode, { plan_goal, plan_content });
    res.json({ retCode: "Success", retMsg: "수정되었습니다." });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "수정 중 오류가 발생했습니다." });
  }
});

// 계획 추가 (승인요청, dsbl_no 없으면 supportInfo에서 조회)
router.post("/:supportCode/plan", async (req, res) => {
  const supportCode = req.params.supportCode;
  const { dsbl_no, plan_goal, plan_content, start_date, end_date } =
    req.body || {};
  try {
    let dsblNo = dsbl_no;
    if (dsblNo == null) {
      const info = await supportService.getSupportInfoBySupCode(supportCode);
      dsblNo = info?.dsbl_no ?? null;
    }
    await supportService.insertPlan(supportCode, {
      dsbl_no: dsblNo,
      plan_goal,
      plan_content,
      start_time: start_date ?? null,
      end_time: end_date ?? null,
    });
    res.json({ retCode: "Success", retMsg: "등록되었습니다." });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "등록 중 오류가 발생했습니다." });
  }
});

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
      res.json({
        retCode: "Warning",
        retMsg: "조회 성공(0건)",
        data: [],
        infoData: supportInfo,
      });
    } else if (result.length > 0) {
      res.json({
        retCode: "Success",
        retMsg: "조회 성공",
        data: result,
        infoData: supportInfo,
      });
    } else {
      res.json({ retCode: "Fail", retMsg: "조회 실패" });
    }
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "조회 중 오류 발생" });
  }
});

// 지원결과 조회 (infoData + planData + resultData)
router.get("/:supportCode/result", async (req, res) => {
  const supportCode = req.params.supportCode;
  try {
    const supportInfo =
      await supportService.getSupportInfoBySupCode(supportCode);
    if (!supportInfo) {
      res.json({ retCode: "Fail", retMsg: "지원 정보 없음" });
      return;
    }
    // 계획이 없으면 결과도 없음 → planData/resultData 빈 배열
    const plans = await supportService.getPlanBySupportCode(supportCode);
    if (plans.length === 0) {
      res.json({
        retCode: "Warning",
        retMsg: "계획이 없습니다.",
        infoData: supportInfo,
        planData: [],
        resultData: [],
      });
      return;
    }
    const result = await supportService.getResultBySupportCode(supportCode);
    res.json({
      retCode: "Success",
      retMsg: "조회 성공",
      infoData: supportInfo,
      planData: plans,
      resultData: result ?? [],
    });
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
