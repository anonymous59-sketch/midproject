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
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// ✅ 오늘 기준 유효 조사지 1건: GET /surveys/current (apply 페이지용)
router.get("/surveys/current", async (req, res) => {
  try {
    const data = await sixApplyService.getCurrentSurvey();
    return res.json(data || {});
  } catch (err) {
    console.error("[GET /surveys/current]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// ✅ 상담 작성자 후보: GET /members?m_auth=a0_30 (review 상담등록 csl_writer select)
router.get("/members", async (req, res) => {
  try {
    const mAuth = req.query.m_auth || "a0_30";
    const data = await sixApplyService.getMembersByAuth(mAuth);
    return res.json(data);
  } catch (err) {
    console.error("[GET /members]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// ✅ 지원대상자 목록: GET /targets
router.get("/targets", async (req, res) => {
  try {
    const data = await sixApplyService.getTargets();
    return res.json(data);
  } catch (err) {
    console.error("[GET /targets]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// ✅ 보호자별 지원대상자 목록: GET /dsbl-prs?gdn_no=xxx (review 화면, 마이페이지)
router.get("/dsbl-prs", async (req, res) => {
  try {
    const gdnNo = req.query.gdn_no || "";
    const data = await sixApplyService.getDsblPrsByGdnNo(gdnNo);
    return res.json(data);
  } catch (err) {
    console.error("[GET /dsbl-prs]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// ✅ 마이페이지: 회원 프로필 조회 GET /mypage/profile?m_no=xxx
router.get("/mypage/profile", async (req, res) => {
  try {
    const mNo = req.query.m_no || "";
    const data = await sixApplyService.getMemberByMno(mNo);
    return res.json(data || {});
  } catch (err) {
    console.error("[GET /mypage/profile]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ 마이페이지: 회원 프로필 수정 PUT /mypage/profile (body: m_no, m_tel, m_email, m_add)
router.put("/mypage/profile", async (req, res) => {
  try {
    const { m_no, m_tel, m_email, m_add } = req.body || {};
    if (!m_no) return res.status(400).json({ message: "m_no 필요" });
    await sixApplyService.updateMemberProfileByMno(m_no, { m_tel, m_email, m_add });
    return res.json({ message: "ok" });
  } catch (err) {
    console.error("[PUT /mypage/profile]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ 마이페이지: 지원대상자 수정 PUT /dsbl-prs/:mcPn (body: gdn_no, mc_nm, mc_bd, mc_gender, mc_address, mc_type, mc_submitdate)
router.put("/dsbl-prs/:mcPn", async (req, res) => {
  try {
    const mcPn = req.params.mcPn || "";
    const { gdn_no, mc_nm, mc_bd, mc_gender, mc_address, mc_type, mc_submitdate } = req.body || {};
    if (!mcPn || !gdn_no) return res.status(400).json({ message: "mc_pn, gdn_no 필요" });
    await sixApplyService.updateDsblPrs(mcPn, gdn_no, {
      mc_nm,
      mc_bd,
      mc_gender,
      mc_address,
      mc_type,
      mc_submitdate,
    });
    return res.json({ message: "ok" });
  } catch (err) {
    if (err.code === "FORBIDDEN")
      return res.status(403).json({ message: err.message });
    console.error("[PUT /dsbl-prs/:mcPn]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ 마이페이지: 지원대상자 신규 등록 POST /dsbl-prs (body: gdn_no, mc_nm, mc_bd, mc_gender, mc_address, mc_type, mc_submitdate)
router.post("/dsbl-prs", async (req, res) => {
  try {
    const { gdn_no, mc_nm, mc_bd, mc_gender, mc_address, mc_type, mc_submitdate } = req.body || {};
    if (!gdn_no || !mc_nm) return res.status(400).json({ message: "gdn_no, mc_nm 필요" });
    const result = await sixApplyService.createDsblPrs(gdn_no, {
      mc_nm,
      mc_bd,
      mc_gender,
      mc_address,
      mc_type,
      mc_submitdate,
    });
    return res.status(201).json({ message: "ok", mc_pn: result.mc_pn });
  } catch (err) {
    console.error("[POST /dsbl-prs]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ 지원자 대시보드 목록: GET /applicant-list?m_no=xxx (login한 지원자 mem_no)
router.get("/applicant-list", async (req, res) => {
  try {
    const mNo = req.query.m_no || "";
    const data = await sixApplyService.getApplicantSupportList(mNo);
    return res.json(data);
  } catch (err) {
    console.error("[GET /applicant-list]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// ✅ 담당자 홈 목록: GET /manager-list?m_no=xxx (login한 담당자 mgr_no)
router.get("/manager-list", async (req, res) => {
  try {
    const mNo = req.query.m_no || "";
    const data = await sixApplyService.getManagerSupportList(mNo);
    return res.json(data);
  } catch (err) {
    console.error("[GET /manager-list]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// ✅ 기관관리자 홈 목록: GET /organmanager-list?m_org=xxx (login한 기관관리자 m_org)
router.get("/organmanager-list", async (req, res) => {
  try {
    const mOrg = req.query.m_org || "";
    const data = await sixApplyService.getOrganManagerSupportList(mOrg);
    return res.json(data);
  } catch (err) {
    console.error("[GET /organmanager-list]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// ✅ 지원 1건 + 대상자 정보: GET /support/:supCode (review 화면)
router.get("/support/:supCode", async (req, res) => {
  try {
    const { supCode } = req.params;
    const data = await sixApplyService.getSupportWithDsbl(supCode);
    return res.json(data);
  } catch (err) {
    console.error("[GET /support/:supCode]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// ✅ 수정이력 목록: GET /support/:supCode/upd-history?category_name=j0_00|j0_10|j0_20|j0_30 (지원신청서 j0_00 등)
router.get("/support/:supCode/upd-history", async (req, res) => {
  try {
    const { supCode } = req.params;
    const categoryName = req.query.category_name || "j0_00";
    const data = await sixApplyService.getUpdHistoryByTarget(supCode, categoryName);
    return res.json(data);
  } catch (err) {
    console.error("[GET /support/:supCode/upd-history]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// ✅ 조사지 질문+답변 목록: GET /support/:supCode/survey-answers (review 지원신청서)
router.get("/support/:supCode/survey-answers", async (req, res) => {
  try {
    const { supCode } = req.params;
    const data = await sixApplyService.getSurveyAnswersBySupCode(supCode);
    return res.json(data);
  } catch (err) {
    console.error("[GET /support/:supCode/survey-answers]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// ✅ 지원신청서 수정하기: PUT /support/:supCode/survey-answers (body: { answers: [{ a_code, a_content }], upd_member? })
router.put("/support/:supCode/survey-answers", async (req, res) => {
  try {
    const { supCode } = req.params;
    const payload = req.body || {};
    await sixApplyService.updateSurveyAnswers(supCode, payload);
    return res.json({ message: "ok" });
  } catch (err) {
    console.error("[PUT /support/:supCode/survey-answers]", err);
    return res.status(500).json({
      message: err.message || "Server error",
      error: err.message || String(err),
    });
  }
});

// ✅ 상담내역 목록: GET /support/:supCode/counsels (review 우측 상담내역)
router.get("/support/:supCode/counsels", async (req, res) => {
  try {
    const { supCode } = req.params;
    const data = await sixApplyService.getCounselBySupCode(supCode);
    return res.json(data);
  } catch (err) {
    console.error("[GET /support/:supCode/counsels]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// ✅ 상담 1건 등록: POST /support/:supCode/counsels
router.post("/support/:supCode/counsels", async (req, res) => {
  try {
    const { supCode } = req.params;
    const payload = req.body || {};
    const result = await sixApplyService.createCounsel(supCode, payload);
    return res.status(201).json({
      message: "ok",
      csl_code: result.csl_code,
    });
  } catch (err) {
    if (err.message === "제목과 상담일은 필수입니다.") {
      return res.status(400).json({ message: err.message });
    }
    console.error("[POST /support/:supCode/counsels]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// ✅ 임시저장 목록 조회: GET /support/:supCode/temp-storage?category_name=j0_10|j0_20|j0_30
router.get("/support/:supCode/temp-storage", async (req, res) => {
  try {
    const { supCode } = req.params;
    const categoryName = req.query.category_name || "j0_10";
    const data = await sixApplyService.getTempStorageList(supCode, categoryName);
    return res.json(data);
  } catch (err) {
    console.error("[GET /support/:supCode/temp-storage]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
  }
});

// ✅ 임시저장 INSERT: POST /support/:supCode/temp-storage (body: category_name=j0_10|j0_20|j0_30, save_title, save_content)
router.post("/support/:supCode/temp-storage", async (req, res) => {
  try {
    const { supCode } = req.params;
    const payload = req.body || {};
    const categoryName = payload.category_name || "j0_10";
    const result = await sixApplyService.saveTempStorage(supCode, categoryName, payload);
    return res.status(201).json({
      message: "ok",
      tmp_code: result.tmp_code,
    });
  } catch (err) {
    if (err.message && err.message.includes("찾을 수 없거나")) {
      return res.status(400).json({ message: err.message });
    }
    console.error("[POST /support/:supCode/temp-storage]", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message || String(err),
    });
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
    if (err.message === "FK_REFERENCE_MISSING" && err.fkDetail) {
      const d = err.fkDetail;
      return res.status(400).json({
        message:
          "참조 오류: 저장하려는 데이터가 다른 테이블에 존재하지 않습니다.",
        detail: {
          table: d.table,
          column: d.column,
          referencedTable: d.referencedTable,
          referencedColumn: d.referencedColumn,
          hint: `${d.referencedTable} 테이블에 ${d.referencedColumn} 값이 먼저 있어야 합니다. 해당 테이블에 데이터를 입력한 뒤 다시 저장해 주세요.`,
        },
      });
    }
    console.error("[POST /apply/applications] error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
