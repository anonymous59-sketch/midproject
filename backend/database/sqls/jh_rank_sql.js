// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능과 연관된 쿼리문인지 알기 쉽게 영문으로 적어주는 걸 권장
// 백틱 사용
// 하나의 변수를 선언해서 안에 객체로 집어넣는 형식,
// 객체 안에 변수명 : 쿼리문 형식으로 선언해두기
// 예시 변수명은 자유롭게 수정하면 됨
// export하고 sqList.js에서 require부분에 해당 폴더 경로를 추가해주기

const qry = {
  // 우선순위 헤더 내용 (Info 영역 = support와 동일한 컬럼/조인, priority만 미승인 시 '-' 처리)
  rankInfo: `
  SELECT
    s.sup_code    AS sup_code,
    s.mgr_no      AS mgr_no,
    d.mc_nm       AS target_name,
    d.mc_type     AS disability_type,
    s.sup_day     AS write_date,
    m_mem.m_nm    AS member_name,
    m_mgr.m_nm    AS manager_name,
    CASE WHEN r.s_rank_code IS NOT NULL THEN sc.s_name ELSE '-' END AS priority,
    r.s_rank_code    AS s_rank_code,
    r.apply_for      AS apply_for,
    IFNULL(r.rank_cmt, '') AS rank_cmt,
    r.s_rank_res     AS s_rank_res,
    r.req_code       AS req_code,
    r.prev_req_code  AS prev_req_code
  FROM support s
  JOIN dsbl_prs d     ON s.mc_pn  = d.mc_pn
  JOIN member m_mem   ON s.mem_no = m_mem.m_no
  JOIN member m_mgr   ON s.mgr_no = m_mgr.m_no
  LEFT JOIN \`rank\` r    ON s.sup_code = r.sup_code
                    AND r.req_code = (SELECT MAX(req_code) FROM \`rank\` WHERE sup_code = s.sup_code)
  LEFT JOIN sub_code sc ON r.s_rank_code = sc.s_code
  WHERE s.sup_code = ?`,

  // 승인요청 시 rank 테이블 INSERT. prev_req_code 있으면 재신청(보완 후 재요청)
  rankInsert: `
  INSERT INTO \`rank\` (prev_req_code, sup_code, s_rank_code, mgr_no, apply_for, adm_no, s_rank_res)
  VALUES (?, ?, ?, ?, ?, (SELECT m_no FROM member WHERE m_org = (SELECT m_org FROM member WHERE m_no = ?) AND m_auth = 'a0_40' LIMIT 1), 'e0_00')
  `,

  // 승인(e0_10) / 반려(e0_99) 판정: rank s_rank_res 업데이트
  rankDecide: `UPDATE \`rank\` SET s_rank_res = ? WHERE req_code = ?`,
  // 반려(e0_99) 시 rank_cmt(반려 사유) 함께 저장
  rankDecideReject: `UPDATE \`rank\` SET s_rank_res = 'e0_99', rank_cmt = ? WHERE req_code = ?`,

  // 승인/반려 시 support.rank_res에 해당 req_code 반영
  supportRankResUpdate: `UPDATE support SET rank_res = ? WHERE sup_code = ?`,

  // 보완: s_rank_res = e0_80, rank_cmt에 보완 사유 저장
  rankSupple: `UPDATE \`rank\` SET s_rank_res = 'e0_80', rank_cmt = ? WHERE req_code = ?`,

  // 보완이력 조회: 해당 sup_code의 모든 보완판정(e0_80) 기록
  rankSuppleHistory: `
  SELECT
    r.req_code     AS req_code,
    r.s_rank_code  AS s_rank_code,
    IFNULL(sc.s_name, '-') AS rank_name,
    IFNULL(r.apply_for, '') AS apply_for,
    IFNULL(r.rank_cmt,  '') AS rank_cmt
  FROM \`rank\` r
  LEFT JOIN sub_code sc ON r.s_rank_code = sc.s_code
  WHERE r.sup_code = ?
    AND r.s_rank_res = 'e0_80'
  ORDER BY r.req_code ASC`,

  // 우선순위 지정
  rankUpdate: `
  UPDATE \`rank\`
  SET s_rank_code = ?,
      rank_cmt = ?
  WHERE req_code = ?
  `,

  // 우선순위 판정 결과 회신: support 신청자(mem_no)의 이메일 조회
  selectMemberEmailBySupCode: `
  SELECT m.m_no, m.m_email, m.m_nm
  FROM support s
  JOIN member m ON s.mem_no = m.m_no
  WHERE s.sup_code = ?
  LIMIT 1
  `,

  // req_code로 sup_code 조회 (보완 시 이메일 발송용)
  selectSupCodeByReqCode: `SELECT sup_code FROM \`rank\` WHERE req_code = ? LIMIT 1`,
};

// sqList.js로 넘김
module.exports = qry;
