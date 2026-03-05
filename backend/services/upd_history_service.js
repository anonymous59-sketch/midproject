/**
 * upd_history_service.js
 * 수정이력(upd_history) 서비스 계층
 * - 지원신청서(j0_00), 상담내역(j0_10), 지원계획(j0_20), 지원결과(j0_30) 공통
 * - category_name: j0_00 | j0_10 | j0_20 | j0_30
 * - his_category : sup_code (지원 코드)
 */
const pools = require("../database/mapper/pools");
const updHistorySql = require("../database/sqls/upd_history_sql");

// ─── 헬퍼 ───────────────────────────────────────────────
function formatYmd(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

/** history_no 채번: HIS + yyyymmdd + 4자리 순번 */
async function generateHistoryNo(conn) {
  const now = new Date();
  const prefix = `HIS${formatYmd(now)}`;
  const rows = await conn.query(updHistorySql.selectMaxHistoryNoByDate, [
    `${prefix}%`,
  ]);
  let next = 1;
  if (Array.isArray(rows) && rows.length > 0 && rows[0].history_no) {
    const num = parseInt(String(rows[0].history_no).slice(-4), 10);
    if (!Number.isNaN(num)) next = num + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
}

// ─── 서비스 함수 ──────────────────────────────────────────

/**
 * 수정이력 목록 조회 (his_category = sup_code 기준)
 * @param {string} supCode - 지원 코드 (his_category)
 * @param {string} categoryName - j0_00 | j0_10 | j0_20 | j0_30
 */
exports.getUpdHistoryByTarget = async (supCode, categoryName) => {
  let conn;
  try {
    conn = await pools.getConnection();
    const rows = await conn.query(updHistorySql.selectUpdHistoryByTarget, [
      supCode,
      categoryName,
    ]);
    return Array.isArray(rows) ? rows : [];
  } finally {
    if (conn) conn.release();
  }
};

/**
 * 수정이력 목록 조회 — upd_target(PK) 기준. plan_code(j0_20) 또는 result_code(j0_30) 해당 건만.
 * @param {string} targetPk - plan_code | result_code
 * @param {string} categoryName - j0_20 | j0_30
 */
exports.getUpdHistoryByUpdTarget = async (targetPk, categoryName) => {
  if (!targetPk?.trim()) return [];
  let conn;
  try {
    conn = await pools.getConnection();
    const rows = await conn.query(updHistorySql.selectUpdHistoryByUpdTarget, [
      targetPk,
      categoryName,
    ]);
    return Array.isArray(rows) ? rows : [];
  } finally {
    if (conn) conn.release();
  }
};

/**
 * 수정이력 INSERT
 * @param {object} params
 * @param {string} params.hisCategory - his_category (= sup_code)
 * @param {string} params.categoryName - j0_00 | j0_10 | j0_20 | j0_30
 * @param {string} params.updMember - 수정자 m_no
 * @param {string} params.updTarget - 수정 대상 코드 (plan_code, result_code 등)
 * @param {string} [params.content] - 변경 전 내용 요약
 * @param {string} [params.updContent] - 변경 후 내용 요약
 */
exports.insertUpdHistory = async ({
  hisCategory,
  categoryName,
  updMember,
  updTarget,
  content = "",
  updContent = "",
}) => {
  let conn;
  try {
    conn = await pools.getConnection();
    const historyNo = await generateHistoryNo(conn);
    await conn.query(updHistorySql.insertUpdHistory, [
      historyNo,
      hisCategory,
      categoryName,
      updMember,
      updTarget,
      content,
      updContent,
    ]);
    await conn.commit();
    return { history_no: historyNo };
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) conn.release();
  }
};
