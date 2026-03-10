const query = require("../database/mapper/mapper.js");
const pools = require("../database/mapper/pools");
const surveySql = require("../database/sqls/six_apply_sql");

// 조사지 리스트 선정하기 (mapper query 사용)
exports.getSurveyList = async () => {
  const rows = await query("selectSurveyList");
  const dataRows = Array.isArray(rows)
    ? rows.filter((r) => r && r.sver_code)
    : [];
  return dataRows;
};

// ✅ 오늘 기준 유효 조사지 1건 (apply 페이지용: sver_ondate ~ sver_enddate, enddate null이면 2099-12-31)
exports.getCurrentSurvey = async () => {
  const rows = await query("selectCurrentSurvey");
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
};

// ✅ 지원대상자 목록 (mapper query 사용)
exports.getTargets = async () => {
  const rows = await query("selectTargets");
  const dataRows = Array.isArray(rows) ? rows.filter((r) => r && r.mc_pn) : [];
  return dataRows;
};

// ✅ 보호자(gdn_no)별 지원대상자 목록 (review 화면, 마이페이지)
exports.getDsblPrsByGdnNo = async (gdnNo) => {
  const rows = await query("selectDsblPrsByGdnNo", [gdnNo]);
  return Array.isArray(rows) ? rows.filter((r) => r && r.mc_pn) : [];
};

// ✅ 마이페이지: 회원 프로필 조회 (m_no) — 단일 객체 반환 (mysql2 [rows,fields] 대응)
exports.getMemberByMno = async (mNo) => {
  const raw = await query("selectMemberByMno", [mNo]);
  const rows =
    Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])
      ? raw[0]
      : raw;
  return Array.isArray(rows) && rows.length > 0 && rows[0] ? rows[0] : null;
};

// ✅ 마이페이지: 회원 본인 프로필 수정 (m_tel, m_email, m_add)
exports.updateMemberProfileByMno = async (mNo, payload) => {
  const { m_tel = "", m_email = "", m_add = "" } = payload || {};
  await query("updateMemberProfileByMno", [m_tel, m_email, m_add, mNo]);
  return { ok: true };
};

// ✅ 기관관리자 마이페이지: organ 1건 조회
const getOrganByOrganNo = async (organNo) => {
  if (!organNo) return null;
  const raw = await query("selectOrganByOrganNo", [organNo]);
  const rows =
    Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])
      ? raw[0]
      : raw;
  return Array.isArray(rows) && rows.length > 0 && rows[0] ? rows[0] : null;
};

// ✅ 기관관리자 마이페이지: 해당 기관의 a0_30 담당자 수
const countManagersByOrganNo = async (organNo) => {
  if (!organNo) return 0;
  const raw = await query("countManagersByOrganNo", [organNo]);
  const rows =
    Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])
      ? raw[0]
      : raw;
  const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : raw;
  const cnt = row?.cnt ?? 0;
  return Number(cnt);
};

// 프로필 전용 조회 (sqlList 충돌 회피: selectMemberProfileByMno 사용)
const getMemberProfileByMno = async (mNo) => {
  const raw = await query("selectMemberProfileByMno", [mNo]);
  const rows =
    Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])
      ? raw[0]
      : raw;
  return Array.isArray(rows) && rows.length > 0 && rows[0] ? rows[0] : null;
};

// ✅ 기관관리자 마이페이지: 회원 + 기관 + 담당자 수 한 번에
exports.getOrganManagerMypage = async (mNo) => {
  const member = await getMemberProfileByMno(mNo);
  if (!member) return null;
  const mOrg = member.m_org || null;
  const organ = mOrg ? await getOrganByOrganNo(mOrg) : null;
  const managerCount = mOrg ? await countManagersByOrganNo(mOrg) : 0;
  return { member, organ, managerCount };
};

// ✅ 기관관리자 마이페이지: 기관 정보 수정 (기관명, 주소, 메일, 대표전화)
exports.updateOrganProfileByOrganNo = async (organNo, payload) => {
  const {
    organ_name = "",
    organ_address = "",
    organ_mail = "",
    organ_tel = "",
  } = payload || {};
  await query("updateOrganProfileByOrganNo", [
    (organ_name || "").trim(),
    (organ_address || "").trim(),
    (organ_mail || "").trim(),
    (organ_tel || "").trim(),
    organNo,
  ]);
  return { ok: true };
};

// mc_pn 생성: DSBL + YYYYMMDD + 4자리 (마이페이지 지원대상자 등록)
const formatYmdForMcPn = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
};

// ✅ 마이페이지: 지원대상자(dsbl_prs) 수정 (gdn_no 일치 시에만)
exports.updateDsblPrs = async (mcPn, gdnNo, payload) => {
  const row = await query("selectDsblPrsByMcPn", [mcPn]);
  const one = Array.isArray(row) && row.length > 0 ? row[0] : null;
  if (!one || (one.gdn_no || "") !== (gdnNo || "")) {
    const err = new Error("해당 지원대상자를 수정할 수 없습니다.");
    err.code = "FORBIDDEN";
    throw err;
  }
  const { mc_nm, mc_bd, mc_gender, mc_address, mc_type, mc_submitdate } =
    payload || {};
  await query("updateDsblPrsByMcPn", [
    mc_nm ?? one.mc_nm,
    mc_bd ?? one.mc_bd,
    mc_gender ?? one.mc_gender,
    mc_address ?? one.mc_address,
    mc_type ?? one.mc_type,
    mc_submitdate ?? one.mc_submitdate,
    mcPn,
    gdnNo,
  ]);
  return { ok: true };
};

// ✅ 마이페이지: 지원대상자(dsbl_prs) 신규 등록 — 등록일은 오늘 날짜로 고정
exports.createDsblPrs = async (gdnNo, payload) => {
  const now = new Date();
  const prefix = `DSBL${formatYmdForMcPn(now)}`;
  const raw = await query("selectMaxMcPnByDate", [`${prefix}%`]);
  const rows =
    Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])
      ? raw[0]
      : raw;
  let next = 1;
  if (Array.isArray(rows) && rows.length > 0 && rows[0] && rows[0].mc_pn) {
    const last = String(rows[0].mc_pn);
    const num = parseInt(last.slice(-4), 10);
    if (!Number.isNaN(num)) next = num + 1;
  }
  const mc_pn = `${prefix}${String(next).padStart(4, "0")}`;
  const { mc_nm, mc_bd, mc_gender, mc_address, mc_type } = payload || {};
  const mc_submitdate = formatYmdForMcPn(now); // 등록일: 항상 오늘(today) 고정
  await query("insertDsblPrs", [
    mc_pn,
    (mc_nm || "").trim(),
    mc_bd || null,
    mc_gender === "b0_10" ? "b0_10" : "b0_00",
    (mc_address || "").trim(),
    (mc_type || "").trim(),
    gdnNo,
    mc_submitdate,
  ]);
  return { ok: true, mc_pn };
};

// ✅ 지원자(mem_no)별 지원신청 목록 — /applicant 대시보드 (support.mem_no = m_no, 본인 신청 건만)
exports.getApplicantSupportList = async (mNo) => {
  if (!mNo) return [];
  const result = await query("selectApplicantSupportList", [mNo]);
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.rows)) return result.rows;
  return [];
};

// ✅ 담당자(mgr_no)별 지원신청 목록 — /manager 홈 (support.mgr_no = m_no)
exports.getManagerSupportList = async (mNo) => {
  if (!mNo) return [];
  const result = await query("selectManagerSupportList", [mNo]);
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.rows)) return result.rows;
  return [];
};

// ✅ 기관(m_org)별 지원신청 목록 — /organmanager 홈
exports.getOrganManagerSupportList = async (mOrg) => {
  if (!mOrg) return [];
  const rows = await query("selectOrganManagerSupportList", [mOrg]);
  return Array.isArray(rows) ? rows : [];
};

// ✅ support.mgr_no 지정/변경 (기관관리자가 담당자 배정)
exports.updateSupportManager = async (supCode, mgrNo) => {
  if (!supCode) throw new Error("sup_code is required");
  await query("updateSupportManager", [mgrNo || null, supCode]);
};

// ✅ support.req_yn 변경 (기관담당자 신청 접수/반려)
exports.updateSupportReqYn = async (supCode, reqYn) => {
  if (!supCode) throw new Error("sup_code is required");
  if (!reqYn) throw new Error("req_yn is required");
  await query("updateSupportReqYn", [reqYn, supCode]);
};

// ✅ sup_code로 support + dsbl_prs 조회 (review 화면)
exports.getSupportWithDsbl = async (supCode) => {
  const supRows = await query("selectSupportBySupCode", [supCode]);
  const support =
    Array.isArray(supRows) && supRows.length > 0 ? supRows[0] : null;
  if (!support || !support.mc_pn) return { support: null, dsbl_prs: null };
  const dsblRows = await query("selectDsblPrsByMcPn", [support.mc_pn]);
  const dsbl_prs =
    Array.isArray(dsblRows) && dsblRows.length > 0 ? dsblRows[0] : null;
  return { support, dsbl_prs };
};

// ✅ sup_code별 조사지 질문+답변 목록 (review 지원신청서)
// survey_view 전체(모든 문항)를 보여주고, 그중 지원자가 체크한 survey_a 값을 함께 반환
exports.getSurveyAnswersBySupCode = async (supCode) => {
  const sverRows = await query("selectSverCodeBySupCode", [supCode]);
  const sverCode =
    Array.isArray(sverRows) && sverRows.length > 0 && sverRows[0]?.sver_code
      ? sverRows[0].sver_code
      : null;
  if (!sverCode) return { surveyName: "", items: [] };

  const tree = await exports.getSurveyTree(sverCode);
  if (!tree || !tree.majors || tree.majors.length === 0) return { surveyName: tree?.sv_name ?? "", items: [] };

  const answerRows = await query("selectSurveyAnswersBySupCode", [supCode]);
  const answerMap = new Map();
  for (const r of Array.isArray(answerRows) ? answerRows : []) {
    if (r?.q_code) answerMap.set(r.q_code, { a_code: r.a_code, a_content: r.a_content ?? "" });
  }

  const list = [];
  for (const mj of tree.majors) {
    for (const sb of mj.subs || []) {
      for (const q of sb.questions || []) {
        const ans = answerMap.get(q.q_code);
        list.push({
          a_code: ans?.a_code ?? "",
          q_code: q.q_code,
          major_name: mj.major_name ?? "",
          sub_name: sb.sub_name ?? "",
          q_no: q.q_no,
          q_type: q.q_type ?? "f0_00",
          q_content: q.q_content ?? "",
          a_content: ans?.a_content ?? "",
          views: Array.isArray(q.views) ? q.views : [],
        });
      }
    }
  }
  return { surveyName: tree.sv_name ?? "", items: list };
};

// ✅ sup_code별 상담내역 목록 (review 우측 상담내역)
exports.getCounselBySupCode = async (supCode) => {
  const rows = await query("selectCounselBySupCode", [supCode]);
  return Array.isArray(rows) ? rows : [];
};

// ✅ m_auth별 회원 목록 (상담등록 csl_writer select용, 예: a0_30)
exports.getMembersByAuth = async (mAuth) => {
  const rows = await query("selectMembersByAuth", [mAuth]);
  return Array.isArray(rows) ? rows.filter((r) => r && r.m_no) : [];
};

// ✅ 지원신청서 수정하기: survey_a만 업데이트 (수정이력 미사용)
exports.updateSurveyAnswers = async (supCode, payload) => {
  const { answers = [] } = payload || {};
  let conn;
  try {
    conn = await pools.getConnection();
    await conn.beginTransaction();

    for (const item of answers) {
      if (item.a_code && item.a_content !== undefined) {
        await conn.query(surveySql.updateSurveyAnswerContent, [
          String(item.a_content),
          item.a_code,
          supCode,
        ]);
      }
    }

    await conn.commit();
    return { ok: true };
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

// 질문지 트리 조회 (mapper query 사용)
// 조사지에 대분류/질문이 없으면 빈 majors로 반환 (404 대신 200)
exports.getSurveyTree = async (sverCode) => {
  const rows = await query("selectSurveyTree", [sverCode]);
  const dataRows = Array.isArray(rows)
    ? rows.filter((r) => r && r.sver_code)
    : [];

  if (dataRows.length === 0) {
    const surveyRows = await query("selectSurveyBySverCode", [sverCode]);
    const survey =
      Array.isArray(surveyRows) && surveyRows.length > 0 ? surveyRows[0] : null;
    if (survey) {
      return {
        sver_code: survey.sver_code,
        sv_name: survey.sv_name ?? "",
        majors: [],
      };
    }
    return null;
  }

  const result = {
    sver_code: sverCode,
    sv_name: dataRows[0].sv_name,
    majors: [],
  };

  const majorMap = new Map();

  for (const r of dataRows) {
    if (!majorMap.has(r.major_code)) {
      majorMap.set(r.major_code, {
        major_code: r.major_code,
        major_name: r.major_name,
        subs: [],
        _subMap: new Map(),
      });
      result.majors.push(majorMap.get(r.major_code));
    }

    const major = majorMap.get(r.major_code);

    if (!major._subMap.has(r.sub_code)) {
      major._subMap.set(r.sub_code, {
        sub_code: r.sub_code,
        sub_name: r.sub_name,
        questions: [],
      });
      major.subs.push(major._subMap.get(r.sub_code));
    }

    major._subMap.get(r.sub_code).questions.push({
      q_code: r.q_code,
      q_no: Number(r.q_no),
      q_type: r.q_type,
      q_content: r.q_content,
      views: [],
    });
  }

  result.majors.forEach((m) => delete m._subMap);

  // 설문 보기(체크박스/라디오 옵션) 조회 후 각 질문에 첨부
  const viewRows = await query("selectSurveyViewBySverCode", [sverCode]);
  const viewList = Array.isArray(viewRows) ? viewRows : [];
  const viewMap = new Map();
  for (const v of viewList) {
    if (!v?.q_code) continue;
    if (!viewMap.has(v.q_code)) viewMap.set(v.q_code, []);
    viewMap.get(v.q_code).push({
      q_view_code: v.q_view_code,
      q_view_content: v.q_view_content,
    });
  }
  for (const mj of result.majors) {
    for (const sb of mj.subs || []) {
      for (const q of sb.questions || []) {
        if (q.q_code && viewMap.has(q.q_code)) q.views = viewMap.get(q.q_code);
      }
    }
  }

  return result;
};

// ===== 지원신청 저장 =====
// sup_code 형식: SUPT + yyyymmdd(8자) + 4자리 순번 (예: SUPT202602240001)
const formatYmd = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
};

/**
 * 당일 기준 다음 sup_code 생성 (conn 필요)
 * @param {object} conn - DB connection
 * @returns {Promise<string>} 예: SUPT202602260001
 */
const generateSupCode = async (conn) => {
  const now = new Date();
  const prefix = `SUPT${formatYmd(now)}`;
  const rows = await conn.query(surveySql.selectMaxSupCodeByDate, [
    `${prefix}%`,
  ]);
  let next = 1;
  if (Array.isArray(rows) && rows.length > 0 && rows[0].sup_code) {
    const last = String(rows[0].sup_code);
    const num = parseInt(last.slice(-4), 10);
    if (!Number.isNaN(num)) next = num + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
};

// a_code 형식: ANS + yyyymmdd + 4자리 (동일 요청 내에서 구분 위해 인덱스 사용)
const generateAnsCode = (date, index) => {
  const base = formatYmd(date);
  const seq = String(index).padStart(4, "0");
  return `ANS${base}${seq}`;
};

/**
 * MariaDB FK 에러(1452) 메시지 파싱
 * @param {Error} err - err.sqlMessage 사용
 * @returns {{ table, column, referencedTable, referencedColumn } | null}
 */
function parseFkError(err) {
  if (!err || err.errno !== 1452) return null;
  const msg = err.sqlMessage || "";
  const m = msg.match(
    /constraint fails \(`[^`]+`\.`([^`]+)`[^)]*FOREIGN KEY \(`([^`]+)`\) REFERENCES `([^`]+)` \(`([^`]+)`\)/,
  );
  if (!m) return null;
  return {
    table: m[1],
    column: m[2],
    referencedTable: m[3],
    referencedColumn: m[4],
  };
}

// csl_code 형식: CNSL + yyyymmdd(8자) + 4자리 순번
const generateCslCode = async (conn, date) => {
  const prefix = `CNSL${formatYmd(date)}`;
  const rows = await conn.query(surveySql.selectMaxCslCodeByDate, [
    `${prefix}%`,
  ]);
  let next = 1;
  if (Array.isArray(rows) && rows.length > 0 && rows[0].csl_code) {
    const last = String(rows[0].csl_code);
    const num = parseInt(last.slice(-4), 10);
    if (!Number.isNaN(num)) next = num + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
};

/**
 * 상담 1건 등록 (review 상담추가 저장)
 * csl_name, csl_writer는 member.m_no FK이므로 support.mgr_no를 사용함.
 * @param {string} supCode - 지원코드
 * @param {{ csl_title: string, csl_date: string, csl_content: string, csl_writer?: string, csl_name?: string }} payload
 */
exports.createCounsel = async (supCode, payload) => {
  const { csl_title, csl_date, csl_content, csl_writer, csl_name } =
    payload || {};
  if (!csl_title || !csl_date) {
    throw new Error("제목과 상담일은 필수입니다.");
  }
  let conn;
  try {
    conn = await pools.getConnection();
    const supRows = await conn.query(surveySql.selectSupportBySupCode, [
      supCode,
    ]);
    const support =
      Array.isArray(supRows) && supRows.length > 0 ? supRows[0] : null;
    const mgrNo = support?.mgr_no;
    if (!mgrNo) {
      throw new Error(
        "해당 지원건(sup_code)을 찾을 수 없거나 담당자 정보가 없습니다.",
      );
    }
    const writer = csl_writer && csl_writer !== "SYS" ? csl_writer : mgrNo;
    const name = csl_name && csl_name !== "SYS" ? csl_name : mgrNo;

    const dateForCode = new Date(csl_date);
    const cslCode = await generateCslCode(conn, dateForCode);
    const cslDateVal =
      csl_date.length <= 10 ? `${csl_date} 00:00:00` : csl_date;
    await conn.query(surveySql.insertCounsel, [
      cslCode,
      name,
      cslDateVal,
      writer,
      csl_title,
      csl_content || "",
      supCode,
    ]);
    await conn.commit();
    return { csl_code: cslCode };
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

// 지원신청 저장: support INSERT(mc_pn=지원대상자, mem_no=로그인 회원) → sup_code(PK) → survey_a INSERT(ans_no=mem_no, sup_code), a_code(PK) 수집 반환
exports.createApplication = async ({ mc_pn, mem_no, req_yn, answers }) => {
  let conn;
  let supCode;
  const aCodes = [];
  try {
    conn = await pools.getConnection();
    supCode = await generateSupCode(conn);

    // 1) support INSERT: 지원대상자 mc_pn, 로그인 회원 mem_no → PK(sup_code) 저장
    await conn.query(surveySql.insertSupport, [supCode, mem_no, mc_pn, req_yn]);
    await conn.commit();

    // 2) survey_a INSERT: 조사지 답변, ans_no=로그인 회원(mem_no), sup_code(support PK) 함께 저장
    const now = new Date();
    const datePrefix = formatYmd(now);
    const aCodeRows = await conn.query(
      "SELECT a_code FROM survey_a WHERE a_code LIKE ? ORDER BY a_code DESC LIMIT 1",
      [`ANS${datePrefix}%`],
    );
    let aCodeNext = 1;
    if (
      Array.isArray(aCodeRows) &&
      aCodeRows.length > 0 &&
      aCodeRows[0].a_code
    ) {
      const last = String(aCodeRows[0].a_code);
      const num = parseInt(last.slice(-4), 10);
      if (!Number.isNaN(num)) aCodeNext = num + 1;
    }

    const entries = Object.entries(answers || {});
    for (let i = 0; i < entries.length; i++) {
      const [qCode, ansVal] = entries[i];
      const ansCode = generateAnsCode(now, aCodeNext + i);
      const aContent = Array.isArray(ansVal)
        ? ansVal.join(",")
        : String(ansVal ?? "");
      await conn.query(surveySql.insertSurveyAnswer, [
        ansCode,
        qCode,
        mem_no,
        aContent,
        supCode,
      ]);
      aCodes.push(ansCode);
    }

    return { sup_code: supCode, a_codes: aCodes };
  } catch (err) {
    // survey_a 단계에서 실패한 경우, 이미 넣은 support 행 정리
    if (conn && supCode) {
      try {
        await conn.query("DELETE FROM support WHERE sup_code = ?", [supCode]);
      } catch (delErr) {
        console.error(
          "[createApplication] orphan support delete failed:",
          delErr,
        );
      }
    }
    const fk = parseFkError(err);
    if (fk) {
      const customErr = new Error("FK_REFERENCE_MISSING");
      customErr.statusCode = 400;
      customErr.fkDetail = fk;
      throw customErr;
    }
    throw err;
  } finally {
    if (conn) conn.release();
  }
};
