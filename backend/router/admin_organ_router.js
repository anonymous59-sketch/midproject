const express = require("express");
const router = express.Router();
const adminOrganService = require("../services/admin_organ_service");
const memberService = require("../services/member_service");

// GET /admin/managers - 담당자 목록 (m_auth=a0_30), query: searchBy=m_nm|m_org|m_id, searchValue=
router.get("/managers", async (req, res) => {
  try {
    const searchBy = req.query.searchBy || null;
    const searchValue = req.query.searchValue || null;
    const data = await memberService.getManagersList("a0_30", searchBy, searchValue);
    return res.json(data);
  } catch (err) {
    console.error("[GET /admin/managers]", err);
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
