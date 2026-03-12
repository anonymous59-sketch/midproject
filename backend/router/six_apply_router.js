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

// ✅ 기관관리자 마이페이지: 회원 + 기관 + 기관담당자 수 GET /mypage/organmanager?m_no=xxx
router.get("/mypage/organmanager", async (req, res) => {
  try {
    const mNo = req.query.m_no || "";
    if (!mNo) return res.status(400).json({ message: "m_no 필요" });
    const data = await sixApplyService.getOrganManagerMypage(mNo);
    return res.json(data || { member: null, organ: null, managerCount: 0 });
  } catch (err) {
    console.error("[GET /mypage/organmanager]", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ 기관관리자 마이페이지: 기관 정보 수정 PUT /mypage/organmanager/organ (body: m_no, organ_name, organ_address, organ_mail, organ_tel)
router.put("/mypage/organmanager/organ", async (req, res) => {
  try {
    const { m_no, organ_name, organ_address, organ_mail, organ_tel } = req.body || {};
    if (!m_no) return res.status(400).json({ message: "m_no 필요" });
    const data = await sixApplyService.getOrganManagerMypage(m_no);
    if (!data || !data.member || !data.member.m_org) return res.status(403).json({ message: "해당 기관을 수정할 수 없습니다." });
    await sixApplyService.updateOrganProfileByOrganNo(data.member.m_org, {
      organ_name: organ_name ?? "",
      organ_address: organ_address ?? "",
      organ_mail: organ_mail ?? "",
      organ_tel: organ_tel ?? "",
    });
    return res.json({ message: "ok" });
  } catch (err) {
    console.error("[PUT /mypage/organmanager/organ]", err);
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

// 상담 1건 경로에 GET이 오면 405 (프록시가 PUT→GET으로 바꿀 때 원인 확인용)
router.get("/support/:supCode/counsels/:cslCode", (req, res) => {
  console.warn("[GET counsels/:cslCode] method not allowed (expected PUT)", req.originalUrl || req.url);
  res.setHeader("Allow", "PUT");
  return res.status(405).json({ message: "Method Not Allowed", expected: "PUT" });
});

// ✅ 상담 1건 수정: PUT /support/:supCode/counsels/:cslCode
router.put("/support/:supCode/counsels/:cslCode", async (req, res) => {
  // 배포 서버 404 디버깅: 요청이 여기까지 오면 로그가 찍힘 (메서드·경로 확인용)
  console.log("[PUT counsels/:cslCode] reached", req.method, req.originalUrl || req.url);
  try {
    const { cslCode } = req.params;
    const payload = req.body || {};
    await sixApplyService.updateCounsel(cslCode, payload);
    return res.json({ message: "ok", csl_code: cslCode });
  } catch (err) {
    if (err.message === "제목과 상담일은 필수입니다.") {
      return res.status(400).json({ message: err.message });
    }
    console.error("[PUT /support/:supCode/counsels/:cslCode]", err);
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

// 지원신청 저장: support INSERT(지원대상자 mc_pn, 로그인 회원 mem_no) → PK(sup_code) → survey_a INSERT(ans_no=mem_no, sup_code)
router.post("/applications", async (req, res) => {
  try {
    const { mc_pn, sver_code, write_date, mem_no, req_yn, answers } = req.body;

    if (!mc_pn || !sver_code || !mem_no || !req_yn) {
      return res.status(400).json({ message: "필수 값이 누락되었습니다." });
    }

    const result = await sixApplyService.createApplication({
      mc_pn,
      mem_no,
      req_yn,
      answers,
    });

    return res.status(201).json({
      message: "ok",
      sup_code: result.sup_code,
      a_codes: result.a_codes || [],
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

// ✅ 기관관리자: 지원신청 담당자 배정/변경 (support.mgr_no)
router.put("/support/:supCode/manager", async (req, res) => {
  try {
    const { supCode } = req.params;
    const { mgr_no } = req.body || {};
    if (!supCode) {
      return res.status(400).json({ message: "sup_code가 없습니다." });
    }
    await sixApplyService.updateSupportManager(supCode, mgr_no || null);
    return res.json({ message: "ok" });
  } catch (err) {
    console.error("[PUT /support/:supCode/manager]", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message || String(err) });
  }
});

// ✅ 기관담당자: 신청 접수/반려 (support.req_yn 변경)
router.put("/support/:supCode/req-yn", async (req, res) => {
  try {
    const { supCode } = req.params;
    const { req_yn } = req.body || {};
    if (!supCode || !req_yn) {
      return res
        .status(400)
        .json({ message: "sup_code와 req_yn이 필요합니다." });
    }
    await sixApplyService.updateSupportReqYn(supCode, req_yn);
    return res.json({ message: "ok" });
  } catch (err) {
    console.error("[PUT /support/:supCode/req-yn]", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message || String(err) });
  }
});

module.exports = router;
