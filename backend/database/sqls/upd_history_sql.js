/**
 * upd_history_sql.js
 * 수정이력(upd_history) 관련 SQL 쿼리 모음
 * - 지원신청서(j0_00), 상담내역(j0_10), 지원계획(j0_20), 지원결과(j0_30) 공통 사용
 * - upd_history_router.js → upd_history_service.js → 여기
 */

// 당일 최대 history_no 조회 (HIS + YYYYMMDD + 4자리 순번 채번용)
exports.selectMaxHistoryNoByDate = `
  SELECT history_no FROM upd_history
  WHERE history_no LIKE ?
  ORDER BY history_no DESC
  LIMIT 1
`;

// 수정이력 INSERT
exports.insertUpdHistory = `
  INSERT INTO upd_history (
    history_no, his_category, category_name, upd_date, upd_member, upd_target, content, upd_content
  )
  VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)
`;

// 수정이력 목록 조회 (his_category = sup_code, category_name = j0_00~j0_30, member 조인)
exports.selectUpdHistoryByTarget = `
  SELECT
    h.history_no,
    h.his_category,
    h.category_name,
    h.upd_date,
    h.upd_member,
    h.upd_target,
    h.content,
    h.upd_content,
    m.m_nm,
    m.m_auth
  FROM upd_history h
  LEFT JOIN member m ON m.m_no = h.upd_member
  WHERE h.his_category = ? AND h.category_name = ?
  ORDER BY h.upd_date ASC
`;

// 수정이력 목록 조회 — upd_target(PK: plan_code / result_code) 기준, 해당 건의 수정이력만
exports.selectUpdHistoryByUpdTarget = `
  SELECT
    h.history_no,
    h.his_category,
    h.category_name,
    h.upd_date,
    h.upd_member,
    h.upd_target,
    h.content,
    h.upd_content,
    m.m_nm,
    m.m_auth
  FROM upd_history h
  LEFT JOIN member m ON m.m_no = h.upd_member
  WHERE h.upd_target = ? AND h.category_name = ?
  ORDER BY h.upd_date ASC
`;
