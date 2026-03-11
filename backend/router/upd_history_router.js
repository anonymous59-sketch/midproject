/**
 * upd_history_router.js
 * 수정이력(upd_history) 라우터
 * - 마운트 위치: /api/history
 * - GET  /support/:supCode?category_name=...   → 목록 조회 (his_category 기준)
 * - GET  /target/:targetPk?category_name=j0_20|j0_30 → 목록 조회 (upd_target = plan_code/result_code 기준)
 * - POST /support/:supCode                     → 수정이력 INSERT
 */
const express = require("express");
const router = express.Router();
const updHistoryService = require("../services/upd_history_service");

// 수정이력 목록 조회 (his_category = sup_code 기준)
router.get("/support/:supCode", async (req, res) => {
  try {
    const { supCode } = req.params;
    const categoryName = req.query.category_name || "j0_00";
    const data = await updHistoryService.getUpdHistoryByTarget(supCode, categoryName);
    return res.json(data);
  } catch (err) {
    console.error("[GET /history/support/:supCode]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// 수정이력 목록 조회 — upd_target(PK) 기준. plan_code → j0_20, result_code → j0_30, 상담 → j0_10
router.get("/target/:targetPk", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    const { targetPk } = req.params;
    const categoryName = req.query.category_name || "j0_20";
    const data = await updHistoryService.getUpdHistoryByUpdTarget(targetPk, categoryName);
    return res.json(data);
  } catch (err) {
    console.error("[GET /history/target/:targetPk]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// 수정이력 INSERT
// 지원계획(j0_20) → his_category = plan_code, 지원결과(j0_30) → his_category = result_code
// body.his_category 가 있으면 사용, 없으면 supCode 사용
router.post("/support/:supCode", async (req, res) => {
  try {
    const { supCode } = req.params;
    const { category_name, his_category, upd_member, upd_target, content, upd_content } =
      req.body || {};
    const categoryName = category_name || "j0_00";
    const hisCategory = (his_category && String(his_category).trim()) ? String(his_category).trim() : supCode;
    const result = await updHistoryService.insertUpdHistory({
      hisCategory,
      categoryName,
      updMember: upd_member || "",
      updTarget: upd_target || "",
      content: content || "",
      updContent: upd_content || "",
    });
    return res.status(201).json({ message: "ok", history_no: result.history_no });
  } catch (err) {
    console.error("[POST /history/support/:supCode]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

module.exports = router;
