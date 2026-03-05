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

// ✅ 조사지별 설문 보기 목록 (체크박스/라디오 옵션용)
exports.selectSurveyViewBySverCode = `
  SELECT
    qv.q_code,
    qv.q_view_code,
    qv.q_view_content
  FROM survey_view qv
  JOIN survey_q q ON qv.q_code = q.q_code
  JOIN sub_category sb ON q.sub_code = sb.sub_code
  JOIN major_category mj ON sb.major_code = mj.major_code
  WHERE mj.sver_code = ?
  ORDER BY qv.q_code, qv.q_view_code
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

// ✅ support 1건 조회 (sup_code) — 신청상태(req_yn) 한글명(sub_code.s_name) 포함
exports.selectSupportBySupCode = `
  SELECT
    s.sup_code,
    s.mem_no,
    s.mc_pn,
    s.sup_day,
    s.mgr_no,
    s.req_yn,
    sc.s_name AS req_name,
    s.res_time,
    s.supt_rej_cmt,
    s.rank_res
  FROM support s
  LEFT JOIN sub_code sc ON s.req_yn = sc.s_code
  WHERE s.sup_code = ?
`;

// ✅ 지원자(mem_no)별 지원신청 목록 — 대기단계: rank.s_rank_res 한글명, 없으면 support.req_yn 한글명 (e0_00 검토, e0_10 승인 등)
exports.selectApplicantSupportList = `
  SELECT
    s.sup_code,
    s.sup_day,
    s.req_yn,
    d.mc_nm       AS target_name,
    m_app.m_nm    AS applicant_name,
    m_mgr.m_nm    AS manager_name,
    COALESCE(
      (SELECT sc2.s_name FROM \`rank\` r2
       LEFT JOIN sub_code sc2 ON r2.s_rank_res = sc2.s_code
       WHERE r2.sup_code = s.sup_code
       ORDER BY r2.req_code DESC LIMIT 1),
      (SELECT sc_req.s_name FROM sub_code sc_req WHERE sc_req.s_code = s.req_yn)
    ) AS stage_name,
    (SELECT COUNT(*) FROM \`rank\` r WHERE r.sup_code = s.sup_code AND r.s_rank_res = 'e0_00') AS review_cnt,
    (SELECT COUNT(*) FROM \`rank\` r WHERE r.sup_code = s.sup_code AND r.s_rank_res = 'e0_10') AS approve_cnt,
    (SELECT COUNT(*) FROM \`rank\` r WHERE r.sup_code = s.sup_code AND r.s_rank_res = 'e0_99') AS reject_cnt,
    (SELECT COUNT(*) FROM support_result sr
     INNER JOIN support_plan p ON sr.plan_code = p.plan_code
     WHERE p.sup_code = s.sup_code) AS result_cnt,
    (SELECT 1 FROM support_plan p WHERE p.sup_code = s.sup_code LIMIT 1) AS has_plan,
    (SELECT 1 FROM support_result sr
     INNER JOIN support_plan p ON sr.plan_code = p.plan_code
     WHERE p.sup_code = s.sup_code LIMIT 1) AS has_result
  FROM support s
  INNER JOIN dsbl_prs d      ON s.mc_pn = d.mc_pn
  INNER JOIN member m_app    ON s.mem_no = m_app.m_no
  LEFT JOIN  member m_mgr    ON s.mgr_no = m_mgr.m_no
  WHERE s.mem_no = ?
  ORDER BY s.sup_day DESC
`;

// ✅ 담당자(mgr_no)별 지원신청 목록 — 대기단계: rank.s_rank_res 한글명, 없으면 support.req_yn 한글명 (e0_00 검토, e0_10 승인 등)
exports.selectManagerSupportList = `
  SELECT
    s.sup_code,
    s.sup_day,
    s.req_yn,
    d.mc_nm       AS target_name,
    m_app.m_nm    AS applicant_name,
    m_mgr.m_nm    AS manager_name,
    COALESCE(
      (SELECT sc2.s_name FROM \`rank\` r2
       LEFT JOIN sub_code sc2 ON r2.s_rank_res = sc2.s_code
       WHERE r2.sup_code = s.sup_code
       ORDER BY r2.req_code DESC LIMIT 1),
      (SELECT sc_req.s_name FROM sub_code sc_req WHERE sc_req.s_code = s.req_yn)
    ) AS stage_name,
    (SELECT COUNT(*) FROM \`rank\` r WHERE r.sup_code = s.sup_code AND r.s_rank_res = 'e0_00') AS review_cnt,
    (SELECT COUNT(*) FROM \`rank\` r WHERE r.sup_code = s.sup_code AND r.s_rank_res = 'e0_10') AS approve_cnt,
    (SELECT COUNT(*) FROM \`rank\` r WHERE r.sup_code = s.sup_code AND r.s_rank_res = 'e0_99') AS reject_cnt,
    (SELECT COUNT(*) FROM support_result sr
     INNER JOIN support_plan p ON sr.plan_code = p.plan_code
     WHERE p.sup_code = s.sup_code) AS result_cnt,
    (SELECT 1 FROM support_plan p WHERE p.sup_code = s.sup_code LIMIT 1) AS has_plan,
    (SELECT 1 FROM support_result sr
     INNER JOIN support_plan p ON sr.plan_code = p.plan_code
     WHERE p.sup_code = s.sup_code LIMIT 1) AS has_result
  FROM support s
  INNER JOIN dsbl_prs d      ON s.mc_pn = d.mc_pn
  INNER JOIN member m_app    ON s.mem_no = m_app.m_no
  LEFT JOIN  member m_mgr    ON s.mgr_no = m_mgr.m_no
  WHERE s.mgr_no = ?
  ORDER BY s.sup_day DESC
`;

// ✅ 기관(m_org)별 지원신청 목록 — 대기단계: rank.s_rank_res 한글명, 없으면 support.req_yn 한글명 (e0_00 검토, e0_10 승인 등)
exports.selectOrganManagerSupportList = `
  SELECT
    s.sup_code,
    s.sup_day,
    s.req_yn,
    d.mc_nm       AS target_name,
    m_app.m_nm    AS applicant_name,
    m_mgr.m_nm    AS manager_name,
    COALESCE(
      (SELECT sc2.s_name FROM \`rank\` r2
       LEFT JOIN sub_code sc2 ON r2.s_rank_res = sc2.s_code
       WHERE r2.sup_code = s.sup_code
       ORDER BY r2.req_code DESC LIMIT 1),
      (SELECT sc_req.s_name FROM sub_code sc_req WHERE sc_req.s_code = s.req_yn)
    ) AS stage_name,
    (SELECT COUNT(*) FROM \`rank\` r WHERE r.sup_code = s.sup_code AND r.s_rank_res = 'e0_00') AS review_cnt,
    (SELECT COUNT(*) FROM \`rank\` r WHERE r.sup_code = s.sup_code AND r.s_rank_res = 'e0_10') AS approve_cnt,
    (SELECT COUNT(*) FROM \`rank\` r WHERE r.sup_code = s.sup_code AND r.s_rank_res = 'e0_99') AS reject_cnt,
    (SELECT COUNT(*) FROM support_result sr
     INNER JOIN support_plan p ON sr.plan_code = p.plan_code
     WHERE p.sup_code = s.sup_code) AS result_cnt,
    (SELECT 1 FROM support_plan p WHERE p.sup_code = s.sup_code LIMIT 1) AS has_plan,
    (SELECT 1 FROM support_result sr
     INNER JOIN support_plan p ON sr.plan_code = p.plan_code
     WHERE p.sup_code = s.sup_code LIMIT 1) AS has_result
  FROM support s
  INNER JOIN dsbl_prs d      ON s.mc_pn = d.mc_pn
  INNER JOIN member m_app    ON s.mem_no = m_app.m_no
  LEFT JOIN  member m_mgr    ON s.mgr_no = m_mgr.m_no
  WHERE m_app.m_org = ?
  ORDER BY s.sup_day DESC
`;

// ✅ 지원대상자 1건 조회 (mc_pn) — review 화면용
exports.selectDsblPrsByMcPn = `
  SELECT mc_pn, mc_nm, mc_bd, mc_gender, mc_address, mc_type, gdn_no, mc_submitdate
  FROM dsbl_prs
  WHERE mc_pn = ?
`;

// ✅ 보호자(gdn_no)별 지원대상자 목록 (review 화면용, 마이페이지용)
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

// ✅ 마이페이지: 회원 본인 프로필 조회 (m_no) — 담당자용 기관명 포함 (alias 충돌 회피용 별도 키)
exports.selectMemberProfileByMno = `
  SELECT m.m_no, m.m_id, m.m_nm, m.m_email, m.m_tel, m.m_bd, m.m_add, m.m_org, o.organ_name
  FROM member m
  LEFT JOIN organ o ON o.organ_no = m.m_org
  WHERE m.m_no = ?
`;
// (selectMemberByMno는 psw_verifi_sql에서 덮어쓰므로, 프로필 전용은 selectMemberProfileByMno 사용)
exports.selectMemberByMno = `
  SELECT m.m_no, m.m_id, m.m_nm, m.m_email, m.m_tel, m.m_bd, m.m_add, m.m_org, o.organ_name
  FROM member m
  LEFT JOIN organ o ON o.organ_no = m.m_org
  WHERE m.m_no = ?
`;

// ✅ 마이페이지: 회원 본인 프로필 수정 (m_tel, m_email, m_add)
exports.updateMemberProfileByMno = `
  UPDATE member SET m_tel = ?, m_email = ?, m_add = ?
  WHERE m_no = ?
`;

// ✅ 마이페이지: 지원대상자(dsbl_prs) 수정 — gdn_no 일치 시에만
exports.updateDsblPrsByMcPn = `
  UPDATE dsbl_prs
  SET mc_nm = ?, mc_bd = ?, mc_gender = ?, mc_address = ?, mc_type = ?, mc_submitdate = ?
  WHERE mc_pn = ? AND gdn_no = ?
`;

// ✅ 당일 최대 mc_pn 조회 (DSBL+YYYYMMDD+시퀀스 생성용)
exports.selectMaxMcPnByDate = `
  SELECT mc_pn FROM dsbl_prs
  WHERE mc_pn LIKE ?
  ORDER BY mc_pn DESC
  LIMIT 1
`;

// ✅ 마이페이지: 지원대상자(dsbl_prs) 신규 등록
exports.insertDsblPrs = `
  INSERT INTO dsbl_prs (mc_pn, mc_nm, mc_bd, mc_gender, mc_address, mc_type, gdn_no, mc_submitdate)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
  WHERE sver_ondate <= CURDATE() + INTERVAL 1 DAY
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
    req_yn
  )
  VALUES (?, ?, ?, ?)
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

// ✅ support 담당자 배정/변경
exports.updateSupportManager = `
  UPDATE support
  SET mgr_no = ?
  WHERE sup_code = ?
`;

// ✅ support 신청 상태(req_yn) 변경
exports.updateSupportReqYn = `
  UPDATE support
  SET req_yn = ?
  WHERE sup_code = ?
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

// ✅ 기관관리자 마이페이지: organ 1건 조회 (organ_no)
exports.selectOrganByOrganNo = `
  SELECT organ_no, organ_name, organ_address, organ_mail, organ_tel, start_time, end_time, org_status
  FROM organ WHERE organ_no = ?
`;

// ✅ 기관관리자 마이페이지: 해당 기관(organ_no)의 a0_30 담당자 수
exports.countManagersByOrganNo = `
  SELECT COUNT(*) AS cnt FROM member WHERE m_org = ? AND m_auth = 'a0_30'
`;

// ✅ 기관관리자 마이페이지: 기관 정보 수정 (기관명, 주소, 메일, 대표전화)
exports.updateOrganProfileByOrganNo = `
  UPDATE organ SET organ_name = ?, organ_address = ?, organ_mail = ?, organ_tel = ?
  WHERE organ_no = ?
`;
