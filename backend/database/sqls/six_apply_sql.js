// backend/database/sqls/six_apply_sql.js

exports.selectSurveyTree = `
  SELECT
    s.sver_code,
    s.sv_name,
    mj.major_code,
    mj.major_name,
    sb.sub_code,
    sb.sub_name,
    q.q_code,
    q.q_no,
    q.q_type,
    q.q_content
  FROM survey s
  JOIN major_category mj ON mj.sver_code = s.sver_code
  JOIN sub_category sb ON sb.major_code = mj.major_code
  JOIN survey_q q ON q.sub_code = sb.sub_code
  WHERE s.sver_code = ?
  ORDER BY mj.major_code, sb.sub_code, q.q_no
`;

// ✅ 지원대상자 목록(셀렉트용)
exports.selectTargets = `
  SELECT
    mc_pn,
    mc_nm,
    mc_bd,
    mc_gender,
    mc_address,
    mc_type,
    gdn_no,
    mc_submitdate
  FROM dsbl_prs
  ORDER BY mc_submitdate DESC
`;

// ✅ support 1건 조회 (sup_code)
exports.selectSupportBySupCode = `
  SELECT sup_code, mem_no, mc_pn, sup_day, mgr_no, req_yn, res_time, supt_rej_cmt, rank_res
  FROM support
  WHERE sup_code = ?
`;

// ✅ 지원대상자 1건 조회 (mc_pn) — review 화면용
exports.selectDsblPrsByMcPn = `
  SELECT mc_pn, mc_nm, mc_bd, mc_gender, mc_address, mc_type, gdn_no, mc_submitdate
  FROM dsbl_prs
  WHERE mc_pn = ?
`;

// ✅ 보호자(gdn_no)별 지원대상자 목록 (review 화면용)
exports.selectDsblPrsByGdnNo = `
  SELECT
    mc_pn,
    mc_nm,
    mc_bd,
    mc_gender,
    mc_address,
    mc_type,
    gdn_no,
    mc_submitdate
  FROM dsbl_prs
  WHERE gdn_no = ?
  ORDER BY mc_submitdate DESC
`;

// ✅ 상담 작성자 후보: member 중 m_auth = a0_30 (counsel form csl_writer select용)
exports.selectMembersByAuth = `
  SELECT m_no, m_nm
  FROM member
  WHERE m_auth = ?
  ORDER BY m_nm
`;

// ✅ 조사지 목록
exports.selectSurveyList = `
  SELECT
    sver_code,
    sv_name,
    sv_time
  FROM survey
  ORDER BY sv_time DESC
`;

// ✅ 조사지 1건 (트리 없을 때 빈 트리 반환용)
exports.selectSurveyBySverCode = `
  SELECT sver_code, sv_name
  FROM survey
  WHERE sver_code = ?
`;

// ✅ 오늘 기준 유효 조사지 1건: sver_ondate <= CURDATE() <= COALESCE(sver_enddate, '2099-12-31')
exports.selectCurrentSurvey = `
  SELECT sver_code, sv_name
  FROM survey
  WHERE sver_ondate <= CURDATE()
    AND CURDATE() <= COALESCE(sver_enddate, '2099-12-31')
  ORDER BY sver_ondate DESC
  LIMIT 1
`;

// 지원신청 메인 INSERT (support)
exports.insertSupport = `
  INSERT INTO support (
    sup_code,
    mem_no,
    mc_pn,
    mgr_no,
    req_yn
  )
  VALUES (?, ?, ?, ?, ?)
`;

// 당일 최대 sup_code 조회 (순번 생성용)
exports.selectMaxSupCodeByDate = `
  SELECT sup_code FROM support
  WHERE sup_code LIKE ?
  ORDER BY sup_code DESC
  LIMIT 1
`;

// 설문 답변 단건 INSERT (survey_a)
exports.insertSurveyAnswer = `
  INSERT INTO survey_a (
    a_code,
    q_code,
    ans_no,
    a_content,
    sup_code
  )
  VALUES (?, ?, ?, ?, ?)
`;

// ✅ sup_code별 조사지 질문+답변 (review 지원신청서) — major_name, sub_name, a_code, q_type 포함 (수정하기용)
exports.selectSurveyAnswersBySupCode = `
  SELECT
    a.a_code,
    a.q_code,
    a.a_content,
    q.q_no,
    q.q_type,
    q.q_content,
    sb.sub_name,
    mj.major_name
  FROM survey_a a
  JOIN survey_q q ON q.q_code = a.q_code
  JOIN sub_category sb ON sb.sub_code = q.sub_code
  JOIN major_category mj ON mj.major_code = sb.major_code
  WHERE a.sup_code = ?
  ORDER BY mj.major_code, sb.sub_code, q.q_no
`;

// ✅ survey_a 답변 단건 수정 (지원신청서 수정하기)
exports.updateSurveyAnswerContent = `
  UPDATE survey_a SET a_content = ? WHERE a_code = ? AND sup_code = ?
`;

// ✅ 수정이력 INSERT (지원신청서 등 수정 시)
exports.selectMaxHistoryNoByDate = `
  SELECT history_no FROM upd_history
  WHERE history_no LIKE ?
  ORDER BY history_no DESC
  LIMIT 1
`;

exports.insertUpdHistory = `
  INSERT INTO upd_history (
    history_no, his_category, category_name, upd_date, upd_member, upd_target, content, upd_content
  )
  VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)
`;

// ✅ sup_code별 상담내역 목록 (review 우측 상담내역) — 작성자명(m_nm) member 조인
exports.selectCounselBySupCode = `
  SELECT
    c.csl_code,
    c.csl_name,
    c.csl_date,
    c.csl_writer,
    m.m_nm AS csl_writer_nm,
    c.csl_write_date,
    c.csl_title,
    c.csl_content,
    c.sup_code
  FROM counsel c
  LEFT JOIN member m ON m.m_no = c.csl_writer
  WHERE c.sup_code = ?
  ORDER BY c.csl_date DESC, c.csl_code DESC
`;

// 당일 최대 csl_code 조회 (순번 생성용, CNSL + YYYYMMDD + 4자리)
exports.selectMaxCslCodeByDate = `
  SELECT csl_code FROM counsel
  WHERE csl_code LIKE ?
  ORDER BY csl_code DESC
  LIMIT 1
`;

// 상담 1건 INSERT
exports.insertCounsel = `
  INSERT INTO counsel (
    csl_code, csl_name, csl_date, csl_writer, csl_write_date, csl_title, csl_content, sup_code
  )
  VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)
`;

// ✅ temp_storage: 당일 최대 tmp_code (TMP + YYYYMMDD + 4자리)
exports.selectMaxTmpCodeByDate = `
  SELECT tmp_code FROM temp_storage
  WHERE tmp_code LIKE ?
  ORDER BY tmp_code DESC
  LIMIT 1
`;

// ✅ temp_storage: 상담등록 임시저장 INSERT
exports.insertTempStorage = `
  INSERT INTO temp_storage (
    tmp_code, tar_category, category_name, save_time, m_no, save_title, save_content
  )
  VALUES (?, ?, ?, NOW(), ?, ?, ?)
`;

// ✅ temp_storage 목록 조회 (tar_category, category_name, m_no 기준 — m_no는 sup_code로 support 조회 후 mgr_no 사용)
exports.selectTempStorageList = `
  SELECT tmp_code, save_time, save_title, save_content
  FROM temp_storage
  WHERE tar_category = ? AND category_name = ? AND m_no = ?
  ORDER BY save_time DESC
`;

// ✅ 수정이력 목록 (his_category = sup_code, category_name = j0_00 지원신청서 등) — member 조인하여 m_nm, m_auth
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
  ORDER BY h.upd_date DESC
`;
