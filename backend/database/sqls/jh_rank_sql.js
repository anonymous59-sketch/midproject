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
    d.mc_nm       AS target_name,
    d.mc_type     AS disability_type,
    s.sup_day     AS write_date,
    m_mem.m_nm    AS member_name,
    m_mgr.m_nm    AS manager_name,
    CASE WHEN r.s_rank_res = 'e0_10' THEN sc.s_name ELSE '-' END AS priority,
    r.s_rank_code AS s_rank_code,
    IFNULL(r.rank_cmt, '') AS rank_cmt
  FROM support s
  JOIN dsbl_prs d     ON s.mc_pn  = d.mc_pn
  JOIN member m_mem   ON s.mem_no = m_mem.m_no
  JOIN member m_mgr   ON s.mgr_no = m_mgr.m_no
  LEFT JOIN rank r    ON s.sup_code = r.sup_code
                    AND r.req_code = (SELECT MAX(req_code) FROM rank WHERE sup_code = s.sup_code)
  LEFT JOIN sub_code sc ON r.s_rank_code = sc.s_code
  WHERE s.sup_code = ?`,

  // 우선순위 지정
  rankUpdate: `
  UPDATE rank
  SET s_rank_code = ?,
      rank_cmt = ?
  WHERE req_code = ?
  `,
};

// sqList.js로 넘김
module.exports = qry;
