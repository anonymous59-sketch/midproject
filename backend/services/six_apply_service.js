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
  const dataRows = Array.isArray(rows)
    ? rows.filter((r) => r && r.mc_pn)
    : [];
  return dataRows;
};

// ✅ 보호자(gdn_no)별 지원대상자 목록 (review 화면, 마이페이지)
exports.getDsblPrsByGdnNo = async (gdnNo) => {
  const rows = await query("selectDsblPrsByGdnNo", [gdnNo]);
  return Array.isArray(rows) ? rows.filter((r) => r && r.mc_pn) : [];
};

// ✅ 마이페이지: 회원 프로필 조회 (m_no)
exports.getMemberByMno = async (mNo) => {
  const rows = await query("selectMemberByMno", [mNo]);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
};

// ✅ 마이페이지: 회원 본인 프로필 수정 (m_tel, m_email, m_add)
exports.updateMemberProfileByMno = async (mNo, payload) => {
  const { m_tel = "", m_email = "", m_add = "" } = payload || {};
  await query("updateMemberProfileByMno", [m_tel, m_email, m_add, mNo]);
  return { ok: true };
};

// ✅ 마이페이지: 지원대상자 수정 (gdn_no 일치 시에만)
exports.updateDsblPrs = async (mcPn, gdnNo, payload) => {
  const row = await query("selectDsblPrsByMcPn", [mcPn]);
  const one = Array.isArray(row) && row.length > 0 ? row[0] : null;
  if (!one || (one.gdn_no || "") !== (gdnNo || "")) {
    const err = new Error("해당 지원대상자를 수정할 수 없습니다.");
    err.code = "FORBIDDEN";
    throw err;
  }
  const { mc_nm, mc_bd, mc_gender, mc_address, mc_type, mc_submitdate } = payload || {};
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

// mc_pn 생성: DSBL + YYYYMMDD + 4자리 (마이페이지 지원대상자 등록)
const formatYmdForMcPn = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
};

// ✅ 마이페이지: 지원대상자(dsbl_prs) 신규 등록
exports.createDsblPrs = async (gdnNo, payload) => {
  const now = new Date();
  const prefix = `DSBL${formatYmdForMcPn(now)}`;
  const rows = await query("selectMaxMcPnByDate", [`${prefix}%`]);
  let next = 1;
  if (Array.isArray(rows) && rows.length > 0 && rows[0].mc_pn) {
    const last = String(rows[0].mc_pn);
    const num = parseInt(last.slice(-4), 10);
    if (!Number.isNaN(num)) next = num + 1;
  }
  const mc_pn = `${prefix}${String(next).padStart(4, "0")}`;
  const { mc_nm, mc_bd, mc_gender, mc_address, mc_type, mc_submitdate } = payload || {};
  const subDate = mc_submitdate ? String(mc_submitdate).slice(0, 10) : formatYmdForMcPn(now);
  await query("insertDsblPrs", [
    mc_pn,
    (mc_nm || "").trim(),
    mc_bd || subDate,
    mc_gender === "b0_10" ? "b0_10" : "b0_00",
    (mc_address || "").trim(),
    (mc_type || "").trim(),
    gdnNo,
    subDate,
  ]);
  return { ok: true, mc_pn };
};

// ✅ 지원자(mem_no)별 지원신청 목록 — /applicant 대시보드
exports.getApplicantSupportList = async (mNo) => {
  if (!mNo) return [];
  const rows = await query("selectApplicantSupportList", [mNo]);
  return Array.isArray(rows) ? rows : [];
};

// ✅ 담당자(mgr_no)별 지원신청 목록 — /manager 홈
exports.getManagerSupportList = async (mNo) => {
  if (!mNo) return [];
  const rows = await query("selectManagerSupportList", [mNo]);
  return Array.isArray(rows) ? rows : [];
};

// ✅ 기관(m_org)별 지원신청 목록 — /organmanager 홈
exports.getOrganManagerSupportList = async (mOrg) => {
  if (!mOrg) return [];
  const rows = await query("selectOrganManagerSupportList", [mOrg]);
  return Array.isArray(rows) ? rows : [];
};

// ✅ sup_code로 support + dsbl_prs 조회 (review 화면)
exports.getSupportWithDsbl = async (supCode) => {
  const supRows = await query("selectSupportBySupCode", [supCode]);
  const support = Array.isArray(supRows) && supRows.length > 0 ? supRows[0] : null;
  if (!support || !support.mc_pn) return { support: null, dsbl_prs: null };
  const dsblRows = await query("selectDsblPrsByMcPn", [support.mc_pn]);
  const dsbl_prs = Array.isArray(dsblRows) && dsblRows.length > 0 ? dsblRows[0] : null;
  return { support, dsbl_prs };
};

// ✅ sup_code별 조사지 질문+답변 목록 (review 지원신청서)
exports.getSurveyAnswersBySupCode = async (supCode) => {
  const rows = await query("selectSurveyAnswersBySupCode", [supCode]);
  return Array.isArray(rows) ? rows : [];
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

// ✅ 수정이력 목록 (his_category = sup_code, category_name = j0_00 지원신청서 | j0_10 상담 | j0_20 지원계획 | j0_30 지원결과)
exports.getUpdHistoryByTarget = async (supCode, categoryName) => {
  const rows = await query("selectUpdHistoryByTarget", [supCode, categoryName]);
  return Array.isArray(rows) ? rows : [];
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

// tmp_code 형식: TMP + yyyymmdd(8자) + 4자리 순번
const generateTmpCode = async (conn) => {
  const now = new Date();
  const prefix = `TMP${formatYmd(now)}`;
  const rows = await conn.query(surveySql.selectMaxTmpCodeByDate, [`${prefix}%`]);
  let next = 1;
  if (Array.isArray(rows) && rows.length > 0 && rows[0].tmp_code) {
    const last = String(rows[0].tmp_code);
    const num = parseInt(last.slice(-4), 10);
    if (!Number.isNaN(num)) next = num + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
};

// 코드테이블: 상담내역 j0_10, 지원계획 j0_20, 지원결과 j0_30 → tar_category 접두어 CNSL*, PLAN*, RES*
const TEMP_CATEGORY_PREFIX = { j0_10: "CNSL", j0_20: "PLAN", j0_30: "RES" };
function getTarCategory(supCode, categoryCode) {
  const prefix = TEMP_CATEGORY_PREFIX[categoryCode] || "CNSL";
  return `${prefix}-${supCode}`;
}

/**
 * temp_storage 목록 조회 (review 임시저장 모달용)
 * m_no = support.mgr_no (sup_code 기준), tar_category = CNSL-{supCode} | PLAN-{supCode} | RES-{supCode}, category_name = j0_10 | j0_20 | j0_30
 */
exports.getTempStorageList = async (supCode, categoryName) => {
  const supRows = await query("selectSupportBySupCode", [supCode]);
  const support = Array.isArray(supRows) && supRows.length > 0 ? supRows[0] : null;
  const mNo = support?.mgr_no;
  if (!mNo) return [];
  const tarCategory = getTarCategory(supCode, categoryName);
  const rows = await query("selectTempStorageList", [tarCategory, categoryName, mNo]);
  return Array.isArray(rows) ? rows : [];
};

/**
 * 임시저장 INSERT (temp_storage)
 * category_name = j0_10 | j0_20 | j0_30 (코드테이블), tar_category = CNSL-{supCode} | PLAN-{supCode} | RES-{supCode}
 */
exports.saveTempStorage = async (supCode, categoryName, payload) => {
  const { save_title, save_content } = payload || {};
  let conn;
  try {
    conn = await pools.getConnection();
    const supRows = await conn.query(surveySql.selectSupportBySupCode, [supCode]);
    const support = Array.isArray(supRows) && supRows.length > 0 ? supRows[0] : null;
    const mNo = support?.mgr_no;
    if (!mNo) {
      throw new Error("해당 지원건(sup_code)을 찾을 수 없거나 담당자 정보가 없습니다.");
    }
    const tmpCode = await generateTmpCode(conn);
    const tarCategory = getTarCategory(supCode, categoryName);
    await conn.query(surveySql.insertTempStorage, [
      tmpCode,
      tarCategory,
      categoryName,
      mNo,
      save_title ?? "",
      save_content ?? "",
    ]);
    await conn.commit();
    return { tmp_code: tmpCode };
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
    const survey = Array.isArray(surveyRows) && surveyRows.length > 0 ? surveyRows[0] : null;
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
    });
  }

  result.majors.forEach((m) => delete m._subMap);

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
  const rows = await conn.query(surveySql.selectMaxSupCodeByDate, [`${prefix}%`]);
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
    /constraint fails \(`[^`]+`\.`([^`]+)`[^)]*FOREIGN KEY \(`([^`]+)`\) REFERENCES `([^`]+)` \(`([^`]+)`\)/
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
  const rows = await conn.query(surveySql.selectMaxCslCodeByDate, [`${prefix}%`]);
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
  const { csl_title, csl_date, csl_content, csl_writer, csl_name } = payload || {};
  if (!csl_title || !csl_date) {
    throw new Error("제목과 상담일은 필수입니다.");
  }
  let conn;
  try {
    conn = await pools.getConnection();
    const supRows = await conn.query(surveySql.selectSupportBySupCode, [supCode]);
    const support = Array.isArray(supRows) && supRows.length > 0 ? supRows[0] : null;
    const mgrNo = support?.mgr_no;
    if (!mgrNo) {
      throw new Error("해당 지원건(sup_code)을 찾을 수 없거나 담당자 정보가 없습니다.");
    }
    const writer = csl_writer && csl_writer !== "SYS" ? csl_writer : mgrNo;
    const name = csl_name && csl_name !== "SYS" ? csl_name : mgrNo;

    const dateForCode = new Date(csl_date);
    const cslCode = await generateCslCode(conn, dateForCode);
    const cslDateVal = csl_date.length <= 10 ? `${csl_date} 00:00:00` : csl_date;
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

exports.createApplication = async ({
  mc_pn,
  sver_code,
  write_date,
  mem_no,
  mgr_no,
  req_yn,
  answers,
}) => {
  let conn;
  let supCode;
  try {
    conn = await pools.getConnection();
    supCode = await generateSupCode(conn);

    // 1) support INSERT 후 즉시 커밋 → FK에서 참조 가능하도록 함
    await conn.query(surveySql.insertSupport, [
      supCode,
      mem_no,
      mc_pn,
      mgr_no,
      req_yn,
    ]);
    await conn.commit();

    // 2) survey_a INSERT (위에서 커밋된 sup_code 기준으로 FK 통과)
    const now = new Date();
    const datePrefix = formatYmd(now);
    const aCodeRows = await conn.query(
      "SELECT a_code FROM survey_a WHERE a_code LIKE ? ORDER BY a_code DESC LIMIT 1",
      [`ANS${datePrefix}%`]
    );
    let aCodeNext = 1;
    if (Array.isArray(aCodeRows) && aCodeRows.length > 0 && aCodeRows[0].a_code) {
      const last = String(aCodeRows[0].a_code);
      const num = parseInt(last.slice(-4), 10);
      if (!Number.isNaN(num)) aCodeNext = num + 1;
    }

    const entries = Object.entries(answers || {});
    for (let i = 0; i < entries.length; i++) {
      const [qCode, ansVal] = entries[i];
      const ansCode = generateAnsCode(now, aCodeNext + i);
      await conn.query(surveySql.insertSurveyAnswer, [
        ansCode,
        qCode,
        mem_no,
        ansVal,
        supCode,
      ]);
    }

    return { sup_code: supCode };
  } catch (err) {
    // survey_a 단계에서 실패한 경우, 이미 넣은 support 행 정리
    if (conn && supCode) {
      try {
        await conn.query("DELETE FROM support WHERE sup_code = ?", [supCode]);
      } catch (delErr) {
        console.error("[createApplication] orphan support delete failed:", delErr);
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
