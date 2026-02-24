// 우선순위(rank) API
const express = require("express");
const router = express.Router();

const rankService = require("../services/svc.js");

// 우선순위 헤더/정보 조회 (sup_code 기준)
router.get("/:supCode", async (req, res) => {
  const supCode = req.params.supCode;
  try {
    const info = await rankService.getRankInfo(supCode);
    if (!info || (Array.isArray(info) && info.length === 0)) {
      res.json({ retCode: "Warning", retMsg: "조회 결과 없음", data: null });
      return;
    }
    const data = Array.isArray(info) ? info[0] : info;
    res.json({ retCode: "Success", retMsg: "조회 성공", data });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "조회 중 오류 발생" });
  }
});

// 우선순위 지정 (s_rank_code, rank_cmt 수정)
router.put("/update", async (req, res) => {
  try {
    const { req_code, s_rank_code, rank_cmt } = req.body;
    if (!req_code) {
      res.json({ retCode: "Fail", retMsg: "req_code 필요" });
      return;
    }
    await rankService.updateRank(req_code, s_rank_code ?? null, rank_cmt ?? null);
    res.json({ retCode: "Success", retMsg: "수정 완료" });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "수정 중 오류 발생" });
  }
});

module.exports = router;
