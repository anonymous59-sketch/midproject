/**
 * tmp_service.js
 * 임시저장(temp_storage) 서비스 계층
 * - 상담내역(j0_10), 지원계획(j0_20), 지원결과(j0_30) 공통
 * - category_name: j0_10 | j0_20 | j0_30
 * - tar_category : CNSL-{supCode} | PLAN-{supCode} | RES-{supCode}
 */
const pools = require("../database/mapper/pools");
const tmpSql = require("../database/sqls/tmp_sql");

// ─── 헬퍼 ───────────────────────────────────────────────
function formatYmd(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

/** tmp_code 채번: TMP + yyyymmdd + 4자리 순번 */
async function generateTmpCode(conn) {
  const now = new Date();
  const prefix = `TMP${formatYmd(now)}`;
  const rows = await conn.query(tmpSql.selectMaxTmpCodeByDate, [
    `${prefix}%`,
  ]);
  let next = 1;
  if (Array.isArray(rows) && rows.length > 0 && rows[0].tmp_code) {
    const num = parseInt(String(rows[0].tmp_code).slice(-4), 10);
    if (!Number.isNaN(num)) next = num + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
}

/** category_name → tar_category 접두어 변환 */
const TEMP_CATEGORY_PREFIX = { j0_10: "CNSL", j0_20: "PLAN", j0_30: "RES" };
function getTarCategory(supCode, categoryCode) {
  const prefix = TEMP_CATEGORY_PREFIX[categoryCode] || "CNSL";
  return `${prefix}-${supCode}`;
}

// ─── 서비스 함수 ──────────────────────────────────────────

/**
 * 임시저장 목록 조회
 * @param {string} supCode - 지원 코드
 * @param {string} categoryName - j0_10 | j0_20 | j0_30
 */
exports.getTempStorageList = async (supCode, categoryName) => {
  let conn;
  try {
    conn = await pools.getConnection();
    const supRows = await conn.query(tmpSql.selectSupportBySupCodeForTmp, [
      supCode,
    ]);
    const support =
      Array.isArray(supRows) && supRows.length > 0 ? supRows[0] : null;
    const mNo = support?.mgr_no;
    if (!mNo) return [];
    const tarCategory = getTarCategory(supCode, categoryName);
    const rows = await conn.query(tmpSql.selectTempStorageList, [
      tarCategory,
      categoryName,
      mNo,
    ]);
    return Array.isArray(rows) ? rows : [];
  } finally {
    if (conn) conn.release();
  }
};

/**
 * 임시저장 INSERT
 * @param {string} supCode - 지원 코드
 * @param {string} categoryName - j0_10 | j0_20 | j0_30
 * @param {{ save_title?: string, save_content?: string }} payload
 */
exports.saveTempStorage = async (supCode, categoryName, payload) => {
  const { save_title, save_content } = payload || {};
  let conn;
  try {
    conn = await pools.getConnection();
    const supRows = await conn.query(tmpSql.selectSupportBySupCodeForTmp, [
      supCode,
    ]);
    const support =
      Array.isArray(supRows) && supRows.length > 0 ? supRows[0] : null;
    const mNo = support?.mgr_no;
    if (!mNo) {
      throw new Error(
        "해당 지원건(sup_code)을 찾을 수 없거나 담당자 정보가 없습니다.",
      );
    }
    const tmpCode = await generateTmpCode(conn);
    const tarCategory = getTarCategory(supCode, categoryName);
    await conn.query(tmpSql.insertTempStorage, [
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

/**
 * 임시저장 1건 갱신 (불러온 후 재임시저장 시)
 * @param {string} tmpCode - 갱신할 tmp_code
 * @param {{ save_title?: string, save_content?: string }} payload
 */
exports.updateTempStorage = async (tmpCode, payload) => {
  const { save_title, save_content } = payload || {};
  let conn;
  try {
    conn = await pools.getConnection();
    await conn.query(tmpSql.updateTempStorage, [
      save_title ?? "",
      save_content ?? "",
      tmpCode,
    ]);
    await conn.commit();
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

/**
 * 임시저장 1건 삭제 (불러오기 후 등록 완료 시 호출)
 * @param {string} tmpCode - 삭제할 tmp_code
 */
exports.deleteTempStorage = async (tmpCode) => {
  let conn;
  try {
    conn = await pools.getConnection();
    await conn.query(tmpSql.deleteTempStorage, [tmpCode]);
    await conn.commit();
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) conn.release();
  }
};
