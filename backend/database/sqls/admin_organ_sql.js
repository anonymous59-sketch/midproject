// admin 기간관리: organ 테이블 조회/등록 (ERD 기준)

exports.selectOrganList = `
  SELECT
    organ_no,
    organ_name,
    organ_address,
    organ_mail,
    organ_tel,
    start_time,
    end_time,
    org_status
  FROM organ
  ORDER BY start_time DESC
`;

/** 기관명 중복 체크 (수정 시 제외할 organ_no 지정 가능) */
exports.selectCountOrganByName = `
  SELECT COUNT(*) AS cnt FROM organ WHERE organ_name = ?
`;
exports.selectCountOrganByNameExclude = `
  SELECT COUNT(*) AS cnt FROM organ WHERE organ_name = ? AND organ_no <> ?
`;

/** 기관번호(사업자번호) 중복 체크 - organ_no는 하이픈 없이 10자리 저장 */
exports.selectCountOrganByNo = `
  SELECT COUNT(*) AS cnt FROM organ WHERE organ_no = ?
`;

/** 기관 등록 */
exports.insertOrgan = `
  INSERT INTO organ (
    organ_no, organ_name, organ_address, organ_mail, organ_tel,
    start_time, end_time, org_status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

/** 기관 수정 */
exports.updateOrgan = `
  UPDATE organ SET
    organ_name = ?,
    organ_address = ?,
    organ_mail = ?,
    organ_tel = ?,
    start_time = ?,
    end_time = ?,
    org_status = ?
  WHERE organ_no = ?
`;

/** 기관 일괄 삭제 (organ_no 목록) */
exports.deleteOrgan = `
  DELETE FROM organ WHERE organ_no = ?
`;
