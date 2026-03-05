const express = require("express");
const router = express.Router();
const adminOrganService = require("../services/admin_organ_service");
const memberService = require("../services/member_service");

// GET /admin/managers - 담당자 목록 (a0_30 승인됨 + a0_31 승인요청), query: searchBy, searchValue, m_org
router.get("/managers", async (req, res) => {
  try {
    const searchBy = req.query.searchBy || null;
    const searchValue = req.query.searchValue || null;
    const mOrg = req.query.m_org || null;
    const data = await memberService.getManagersList("a0_30", searchBy, searchValue, mOrg, true);
    return res.json(data);
  } catch (err) {
    console.error("[GET /admin/managers]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /admin/applicants - 지원자 목록 (a0_20 승인됨 + a0_21 승인요청), query: searchBy, searchValue, m_org(기관관리자용)
router.get("/applicants", async (req, res) => {
  try {
    const searchBy = req.query.searchBy || null;
    const searchValue = req.query.searchValue || null;
    const mOrg = req.query.m_org || null;
    const data = await memberService.getMembersByAuthIn(["a0_20", "a0_21"], searchBy, searchValue, mOrg);
    return res.json(data);
  } catch (err) {
    console.error("[GET /admin/applicants]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /admin/organ-managers-list - 기관관리자 목록 (a0_40 승인됨 + a0_41 승인요청)
router.get("/organ-managers-list", async (req, res) => {
  try {
    const searchBy = req.query.searchBy || null;
    const searchValue = req.query.searchValue || null;
    const data = await memberService.getMembersByAuthIn(["a0_40", "a0_41"], searchBy, searchValue, null);
    return res.json(data);
  } catch (err) {
    console.error("[GET /admin/organ-managers-list]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /admin/members/:mNo/approve - 승인요청(a0_31) → 승인(a0_30)
router.put("/members/:mNo/approve", async (req, res) => {
  try {
    const { mNo } = req.params;
    await memberService.approveManager(mNo);
    return res.json({ message: "ok" });
  } catch (err) {
    console.error("[PUT /admin/members/:mNo/approve]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /admin/members/:mNo/approve-applicant - 승인요청(a0_21) → 승인(a0_20)
router.put("/members/:mNo/approve-applicant", async (req, res) => {
  try {
    const { mNo } = req.params;
    await memberService.updateMemberAuth(mNo, "a0_21", "a0_20");
    return res.json({ message: "ok" });
  } catch (err) {
    console.error("[PUT /admin/members/:mNo/approve-applicant]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /admin/members/:mNo/approve-organ-manager - 승인요청(a0_41) → 승인(a0_40)
router.put("/members/:mNo/approve-organ-manager", async (req, res) => {
  try {
    const { mNo } = req.params;
    await memberService.updateMemberAuth(mNo, "a0_41", "a0_40");
    return res.json({ message: "ok" });
  } catch (err) {
    console.error("[PUT /admin/members/:mNo/approve-organ-manager]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /admin/members/:mNo - 회원 삭제 (반려 시 등), body: { reject_reason } (향후 m_email 발송용)
router.delete("/members/:mNo", async (req, res) => {
  try {
    const { mNo } = req.params;
    const rejectReason = (req.body && req.body.reject_reason) || "";
    await memberService.deleteMember(mNo, rejectReason);
    return res.json({ message: "ok" });
  } catch (err) {
    console.error("[DELETE /admin/members/:mNo]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /admin/members/:mNo - 담당자 프로필 수정 (m_nm, m_tel, m_email)
router.put("/members/:mNo", async (req, res) => {
  try {
    const { mNo } = req.params;
    const payload = req.body || {};
    await memberService.updateManagerProfile(mNo, payload);
    return res.json({ message: "ok" });
  } catch (err) {
    console.error("[PUT /admin/members/:mNo]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /admin/organs - 기관 목록 (admin 기간관리 화면용)
router.get("/organs", async (req, res) => {
  try {
    const data = await adminOrganService.getOrganList();
    return res.json(data);
  } catch (err) {
    console.error("[GET /admin/organs]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /admin/organs/check-name?organ_name=xxx&exclude_organ_no=xxx - 기관명 중복 체크 (수정 시 제외)
router.get("/organs/check-name", async (req, res) => {
  try {
    const organName = req.query.organ_name ?? "";
    const excludeOrganNo = req.query.exclude_organ_no ?? null;
    const exists = await adminOrganService.checkOrganNameExists(organName, excludeOrganNo || undefined);
    return res.json({ exists });
  } catch (err) {
    console.error("[GET /admin/organs/check-name]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /admin/organs/check-organ-no?organ_no=xxx - 기관번호(사업자번호) 중복 체크
router.get("/organs/check-organ-no", async (req, res) => {
  try {
    const organNo = req.query.organ_no ?? "";
    const exists = await adminOrganService.checkOrganNoExists(organNo);
    return res.json({ exists });
  } catch (err) {
    console.error("[GET /admin/organs/check-organ-no]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /admin/organs - 신규 기관 등록
router.post("/organs", async (req, res) => {
  try {
    const result = await adminOrganService.createOrgan(req.body);
    return res.status(201).json(result);
  } catch (err) {
    if (err.code === "INVALID_ORGAN_NO") {
      return res.status(400).json({ message: err.message });
    }
    console.error("[POST /admin/organs]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /admin/organs/:organNo - 기관 수정
router.put("/organs/:organNo", async (req, res) => {
  try {
    const { organNo } = req.params;
    const result = await adminOrganService.updateOrgan(organNo, req.body);
    return res.json(result);
  } catch (err) {
    console.error("[PUT /admin/organs/:organNo]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /admin/organs/bulk-delete - 선택 기관 일괄 삭제
router.post("/organs/bulk-delete", async (req, res) => {
  try {
    const organNos = req.body?.organ_nos ?? [];
    const result = await adminOrganService.deleteOrgans(organNos);
    return res.json(result);
  } catch (err) {
    console.error("[POST /admin/organs/bulk-delete]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
