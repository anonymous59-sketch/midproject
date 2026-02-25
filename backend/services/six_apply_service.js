const pools = require("../database/mapper/pools");
const surveySql = require("../database/sqls/six_apply_sql");

// 조사지 리스트 선정하기
exports.getSurveyList = async () => {
  let conn;
  try {
    conn = await pools.getConnection();
    const rows = await conn.query(surveySql.selectSurveyList);

    const dataRows = Array.isArray(rows)
      ? rows.filter((r) => r && r.sver_code)
      : [];
    return dataRows;
  } finally {
    if (conn) conn.release();
  }
};

// ✅ 지원대상자 목록
exports.getTargets = async () => {
  let conn;
  try {
    conn = await pools.getConnection();
    const rows = await conn.query(surveySql.selectTargets);
    const dataRows = Array.isArray(rows)
      ? rows.filter((r) => r && r.mc_pn)
      : [];
    return dataRows;
  } finally {
    if (conn) conn.release();
  }
};

exports.getSurveyTree = async (sverCode) => {
  let conn;
  try {
    conn = await pools.getConnection();

    const rows = await conn.query(surveySql.selectSurveyTree, [sverCode]);

    const dataRows = Array.isArray(rows)
      ? rows.filter((r) => r && r.sver_code)
      : [];

    if (dataRows.length === 0) return null;

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
  } finally {
    if (conn) conn.release();
  }
};

// ===== 지원신청 저장 =====
const formatYmdHis = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
};

const generateSupCode = () => {
  const now = new Date();
  const base = formatYmdHis(now);
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `SUPT${base}${rand}`;
};

const generateAnsCode = () => {
  const now = new Date();
  const base = formatYmdHis(now);
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `ANS${base}${rand}`;
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
  try {
    conn = await pools.getConnection();
    await conn.beginTransaction();

    const supCode = generateSupCode();

    await conn.query(surveySql.insertSupport, [
      supCode,
      mem_no,
      mc_pn,
      mgr_no,
      req_yn,
    ]);

    // 에러체크 임시저장
    const [dbRow] = await conn.query("SELECT DATABASE() AS db");
    console.log("CURRENT DB:", dbRow?.db);

    const chk = await conn.query(
      "SELECT sup_code FROM support WHERE sup_code = ?",
      [supCode],
    );
    console.log("SUPPORT EXISTS IN TX?:", chk);

    const entries = Object.entries(answers || {});
    for (const [qCode, ansVal] of entries) {
      const ansCode = generateAnsCode();
      await conn.query(surveySql.insertSurveyAnswer, [
        ansCode,
        qCode,
        mem_no,
        ansVal,
        supCode,
      ]);
    }

    await conn.commit();
    return { sup_code: supCode };
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) conn.release();
  }
};
