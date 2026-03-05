/**
 * tmp_router.js
 * 임시저장(temp_storage) 라우터
 * - 마운트 위치: /api/tmp
 * - GET  /support/:supCode?category_name=j0_10|j0_20|j0_30  → 목록 조회
 * - POST /support/:supCode                                   → 임시저장 INSERT
 */
const express = require("express");
const router = express.Router();
const tmpService = require("../services/tmp_service");

// 임시저장 목록 조회
router.get("/support/:supCode", async (req, res) => {
  try {
    const { supCode } = req.params;
    const categoryName = req.query.category_name || "j0_10";
    const data = await tmpService.getTempStorageList(supCode, categoryName);
    return res.json(data);
  } catch (err) {
    console.error("[GET /tmp/support/:supCode]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// 임시저장 INSERT
router.post("/support/:supCode", async (req, res) => {
  try {
    const { supCode } = req.params;
    const payload = req.body || {};
    const categoryName = payload.category_name || "j0_10";
    const result = await tmpService.saveTempStorage(supCode, categoryName, payload);
    return res.status(201).json({
      message: "ok",
      tmp_code: result.tmp_code,
    });
  } catch (err) {
    if (err.message && err.message.includes("찾을 수 없거나")) {
      return res.status(400).json({ message: err.message });
    }
    console.error("[POST /tmp/support/:supCode]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// 임시저장 1건 갱신 (불러온 후 재임시저장 시)
router.put("/:tmpCode", async (req, res) => {
  try {
    const { tmpCode } = req.params;
    if (!tmpCode?.trim()) {
      return res.status(400).json({ message: "tmp_code가 없습니다." });
    }
    const payload = req.body || {};
    await tmpService.updateTempStorage(tmpCode, payload);
    return res.json({ message: "ok", tmp_code: tmpCode });
  } catch (err) {
    console.error("[PUT /tmp/:tmpCode]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// 임시저장 1건 삭제 (불러오기 후 등록 완료 시)
router.delete("/:tmpCode", async (req, res) => {
  try {
    const { tmpCode } = req.params;
    if (!tmpCode?.trim()) {
      return res.status(400).json({ message: "tmp_code가 없습니다." });
    }
    await tmpService.deleteTempStorage(tmpCode);
    return res.json({ message: "ok" });
  } catch (err) {
    console.error("[DELETE /tmp/:tmpCode]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

module.exports = router;
