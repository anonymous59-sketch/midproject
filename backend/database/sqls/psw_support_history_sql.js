// backend/database/sqls/psw_support_history_sql.js
// 박상원 - 지원대상 히스토리(상담일지/지원계획/지원결과) 조회용 쿼리

// 기준 sup_code 로 해당 지원대상자(mc_pn)를 찾은 뒤,
// 같은 대상자의 전체 support 이력을 지원신청일자(sup_day) 역순으로 가져온다.
// - 지원대상 기본정보(dsbl_prs)
// - 지원신청(support)
// - 지원자/담당자 이름(member)
// - 우선순위 / 진행상태(rank + sub_code) - 있을 경우만

const qry = {
 psw_supportHistoryBaseBySupCode: `
  SELECT
    d.mc_pn,
    d.mc_nm,
    d.mc_bd,
    d.mc_gender,
    d.mc_address,
    d.mc_type,
    d.gdn_no,
    d.mc_submitdate,
    s.sup_code,
    s.sup_day,
    s.mem_no,
    m_mem.m_nm  AS mem_name,
    s.mgr_no,
    m_mgr.m_nm  AS mgr_name,
    r.s_rank_res,
    sc.s_name   AS rank_name
  FROM support s
  JOIN dsbl_prs d
    ON s.mc_pn = d.mc_pn
  JOIN member m_mem
    ON s.mem_no = m_mem.m_no
  LEFT JOIN member m_mgr
    ON s.mgr_no = m_mgr.m_no
  LEFT JOIN \`rank\` r
    ON r.sup_code = s.sup_code
   AND r.req_code = (
      SELECT MAX(req_code)
      FROM \`rank\`
      WHERE sup_code = s.sup_code
    )
  LEFT JOIN sub_code sc
    ON r.s_rank_code = sc.s_code
  WHERE d.mc_pn = (
    SELECT mc_pn
    FROM support
    WHERE sup_code = ?
    LIMIT 1
  )
  ORDER BY s.sup_day DESC, s.sup_code DESC
`,
};

module.exports = qry;
