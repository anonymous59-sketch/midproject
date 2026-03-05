/**
 * tmp_sql.js
 * 임시저장(temp_storage) 관련 SQL 쿼리 모음
 * - 상담내역(j0_10), 지원계획(j0_20), 지원결과(j0_30) 공통 사용
 * - tmp_router.js → tmp_service.js → 여기
 */

// 당일 최대 tmp_code 조회 (TMP + YYYYMMDD + 4자리 순번 채번용)
exports.selectMaxTmpCodeByDate = `
  SELECT tmp_code FROM temp_storage
  WHERE tmp_code LIKE ?
  ORDER BY tmp_code DESC
  LIMIT 1
`;

// 임시저장 INSERT
exports.insertTempStorage = `
  INSERT INTO temp_storage (
    tmp_code, tar_category, category_name, save_time, m_no, save_title, save_content
  )
  VALUES (?, ?, ?, NOW(), ?, ?, ?)
`;

// 임시저장 목록 조회 (tar_category + category_name + m_no 기준, 최신순)
exports.selectTempStorageList = `
  SELECT tmp_code, save_time, save_title, save_content
  FROM temp_storage
  WHERE tar_category = ? AND category_name = ? AND m_no = ?
  ORDER BY save_time DESC
`;

// support 1건 조회 (mgr_no 추출용 — sup_code 기준)
exports.selectSupportBySupCodeForTmp = `
  SELECT sup_code, mgr_no
  FROM support
  WHERE sup_code = ?
  LIMIT 1
`;

// 임시저장 1건 갱신 (tmp_code 기준 — 불러온 후 재저장 시)
exports.updateTempStorage = `
  UPDATE temp_storage
  SET save_title = ?, save_content = ?, save_time = NOW()
  WHERE tmp_code = ?
`;

// 임시저장 1건 삭제 (tmp_code 기준)
exports.deleteTempStorage = `
  DELETE FROM temp_storage
  WHERE tmp_code = ?
`;
