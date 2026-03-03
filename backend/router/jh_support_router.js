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
    res.json({ retCode: "Success", retMsg: "처리 완료" });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "처리 실패" });
  }
});

// 계획 즉시 종료 (end_time = NOW())
router.put("/plan/:planCode/end", async (req, res) => {
  const { planCode } = req.params;
  try {
    await supportService.endPlan(planCode);
    res.json({ retCode: "Success", retMsg: "계획이 종료되었습니다." });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "종료 처리 실패" });
  }
});

// 계획 수정
router.put("/plan/:planCode", async (req, res) => {
  const { planCode } = req.params;
  const { plan_goal, plan_content, start_date, end_date } = req.body || {};
  try {
    await supportService.updatePlan(planCode, {
      plan_goal,
      plan_content,
      start_time: start_date ?? null,
      end_time: end_date ?? null,
    });
    res.json({ retCode: "Success", retMsg: "수정 완료" });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "수정 실패" });
  }
});

// 계획 추가 (승인요청). plan_code는 트리거 자동 부여
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
    const planCode = await supportService.insertPlan(supportCode, {
      dsbl_no: dsblNo,
      plan_goal,
      plan_content,
      start_time: start_date ?? null,
      end_time: end_date ?? null,
    });
    res.json({ retCode: "Success", retMsg: "등록 완료", plan_code: planCode });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "등록 실패" });
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
        retMsg: "지원계획 없음",
        data: [],
        infoData: supportInfo,
      });
    } else {
      res.json({
        retCode: "Success",
        data: result,
        infoData: supportInfo,
      });
    }
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "조회 실패" });
  }
});

// 지원결과 추가 (plan_code, result_title, result_content)
router.post("/:supportCode/result", async (req, res) => {
  const { plan_code, result_title, result_content } = req.body || {};
  try {
    if (!plan_code) {
      res.json({ retCode: "Fail", retMsg: "plan_code 필요" });
      return;
    }
    const resultCode = await supportService.insertResult(
      plan_code,
      result_title,
      result_content,
    );
    res.json({
      retCode: "Success",
      retMsg: "등록 완료",
      result_code: resultCode,
    });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "등록 실패" });
  }
});

// 지원결과 조회 (infoData: supportCode, planData: planCode로 해당 계획 1건)
router.get("/:supportCode/result", async (req, res) => {
  const supportCode = req.params.supportCode;
  const planCode = req.query.planCode;
  try {
    // 지원자 정보 조회
    const supportInfo =
      await supportService.getSupportInfoBySupCode(supportCode);
    if (!supportInfo) {
      res.json({ retCode: "Fail", retMsg: "지원 정보 없음" });
      return;
    }
    const planData = planCode
      ? await supportService.getResultPlanInfoByPlanCode(planCode)
      : [];
    const resultData = planCode
      ? await supportService.getResultByPlanCode(planCode)
      : [];
    res.json({
      retCode: "Success",
      infoData: supportInfo,
      planData: planData ?? [],
      resultData: resultData ?? [],
    });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "조회 실패" });
  }
});

// 지원결과 수정 (result_title, result_content)
router.put("/result/:resultCode", async (req, res) => {
  const { resultCode } = req.params;
  const { result_title, result_content } = req.body || {};
  try {
    await supportService.updateResult(resultCode, {
      result_title,
      result_content,
    });
    res.json({ retCode: "Success", retMsg: "수정 완료" });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "수정 실패" });
  }
});

// 지원결과 승인/보완/반려 (result_tf: e0_10 승인, e0_80 보완, e0_99 반려, result_cmt에 사유, result_updday 강제 유지)
router.put("/result/:resultCode/decide", async (req, res) => {
  const { resultCode } = req.params;
  const { decision, result_cmt } = req.body || {};
  try {
    await supportService.decideResult(resultCode, decision, result_cmt);
    res.json({ retCode: "Success", retMsg: "처리 완료" });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "처리 실패" });
  }
});
module.exports = router;
