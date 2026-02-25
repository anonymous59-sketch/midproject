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

// ✅ 조사지 목록
exports.selectSurveyList = `
  SELECT
    sver_code,
    sv_name,
    sv_time
  FROM survey
  ORDER BY sv_time DESC
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
