// 우선순위(rank) API (구체 경로 /request, /update를 /:supCode 보다 먼저 등록)
const express = require("express");
const router = express.Router();

const rankService = require("../services/svc.js");

// 승인요청: rank 테이블 INSERT. prev_req_code 있으면 재신청(보완 후)
router.post("/request", async (req, res) => {
  try {
    const { prev_req_code, sup_code, s_rank_code, mgr_no, apply_for } = req.body;
    if (!sup_code || !s_rank_code) {
      res.json({ retCode: "Fail", retMsg: "sup_code, s_rank_code 필요" });
      return;
    }
    await rankService.insertRank(
      prev_req_code ?? null,
      sup_code,
      s_rank_code,
      mgr_no ?? null,
      apply_for ?? null
    );
    res.json({ retCode: "Success", retMsg: "등록 완료" });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "등록 실패" });
  }
});

// 승인(e0_10) / 반려(e0_99): rank 판정 업데이트 후 support.rank_res에 req_code 반영
router.put("/decide", async (req, res) => {
  try {
    const { req_code, sup_code, decision, rank_cmt } = req.body;
    if (!req_code || !sup_code || !decision) {
      res.json({ retCode: "Fail", retMsg: "req_code, sup_code, decision 필요" });
      return;
    }
    const decisionStr = String(decision).trim();
    if (decisionStr !== "e0_10" && decisionStr !== "e0_99") {
      res.json({ retCode: "Fail", retMsg: "decision 오류" });
      return;
    }
    await rankService.decideRank(req_code, sup_code, decisionStr, rank_cmt ?? null);
    res.json({ retCode: "Success", retMsg: "처리 완료" });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "처리 실패" });
  }
});

// 보완: s_rank_res e0_80, rank_cmt(보완 사유) 저장
router.put("/supple", async (req, res) => {
  try {
    const { req_code, rank_cmt } = req.body;
    if (!req_code) {
      res.json({ retCode: "Fail", retMsg: "req_code 필요" });
      return;
    }
    const result = await rankService.suppleRank(req_code, rank_cmt ?? null);
    const retMsg = result && result.emailSent === false
      ? "처리 완료. 단, 결과 안내 메일 발송에 실패했거나 수신 이메일이 없습니다."
      : "처리 완료";
    res.json({ retCode: "Success", retMsg });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "처리 실패" });
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
    res.json({ retCode: "Error", retMsg: "수정 실패" });
  }
});

// 보완이력 조회: sup_code 기준으로 e0_80(보완) 판정 기록 목록 반환
router.get("/:supCode/supple-history", async (req, res) => {
  const supCode = req.params.supCode;
  try {
    const list = await rankService.getRankSuppleHistory(supCode);
    res.json({ retCode: "Success", data: list });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "조회 실패" });
  }
});

// 우선순위 헤더/정보 조회 (sup_code 기준) — /:supCode는 마지막에
router.get("/:supCode", async (req, res) => {
  const supCode = req.params.supCode;
  try {
    const info = await rankService.getRankInfo(supCode);
    if (!info || (Array.isArray(info) && info.length === 0)) {
      res.json({ retCode: "Warning", retMsg: "조회 결과 없음", data: null });
      return;
    }
    const data = Array.isArray(info) ? info[0] : info;
    res.json({ retCode: "Success", data });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "조회 실패" });
  }
});

module.exports = router;
