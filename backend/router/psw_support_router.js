// backend/router/psw_support_router.js
// 박상원 - 지원대상자별 지원 이력(상담일지/지원계획/지원결과) 조회 라우터

const express = require("express");
const router = express.Router();

const supportService = require("../services/svc.js");

// GET /psw/support-history/:supCode
// 기준 sup_code 로 같은 지원대상자의 전체 support 이력을 조회
router.get("/support-history/:supCode", async (req, res) => {
  const { supCode } = req.params;
  try {
    const data = await supportService.psw_getSupportHistoryBySupCode(supCode);
    if (!data) {
      res.status(404).json({
        retCode: "Fail",
        retMsg: "지원 이력을 찾을 수 없습니다.",
      });
      return;
    }
    res.json({
      retCode: "Success",
      retMsg: "조회 완료",
      ...data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      retCode: "Error",
      retMsg: "지원 이력 조회 중 오류가 발생했습니다.",
    });
  }
});

module.exports = router;

