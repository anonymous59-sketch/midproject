const express = require("express");
const router = express.Router();
const sixApplyService = require("../services/six_apply_service");

// ✅ GET /surveys  (목록)
router.get("/surveys", async (req, res) => {
  try {
    const data = await sixApplyService.getSurveyList();
    return res.json(data);
  } catch (err) {
    console.error("[GET /surveys]", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ 지원대상자 목록: GET /targets
router.get("/targets", async (req, res) => {
  try {
    const data = await sixApplyService.getTargets();
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// 질문지 트리 조회
router.get("/surveys/:sverCode", async (req, res) => {
  try {
    const { sverCode } = req.params;
    const data = await sixApplyService.getSurveyTree(sverCode);

    if (!data) {
      return res.status(404).json({
        message: "Survey not found",
        sver_code: sverCode,
      });
    }
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// 지원신청 저장
router.post("/applications", async (req, res) => {
  try {
    const {
      mc_pn,
      sver_code,
      write_date,
      mem_no,
      mgr_no,
      req_yn,
      answers,
    } = req.body;

    if (!mc_pn || !sver_code || !mem_no || !mgr_no || !req_yn) {
      return res.status(400).json({ message: "필수 값이 누락되었습니다." });
    }

    const result = await sixApplyService.createApplication({
      mc_pn,
      sver_code,
      write_date,
      mem_no,
      mgr_no,
      req_yn,
      answers,
    });

    return res.status(201).json({
      message: "ok",
      sup_code: result.sup_code,
    });
  } catch (err) {
    console.error("[POST /apply/applications] error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
