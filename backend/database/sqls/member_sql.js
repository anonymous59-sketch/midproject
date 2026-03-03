// member_sql.js
module.exports = {
  getMemberById: "SELECT * FROM member WHERE m_id = ?",

  // 담당자 관리: m_auth = a0_30, organ 조인하여 소속기관명 표시
  selectManagersWithOrgan: `
    SELECT m.m_no, m.m_id, m.m_nm, m.m_tel, m.m_email, m.m_org, o.organ_name
    FROM member m
    LEFT JOIN organ o ON o.organ_no = m.m_org
    WHERE m.m_auth = ?
    ORDER BY m.m_nm
  `,

  // 담당자 정보 수정 (m_nm, m_tel, m_email만, m_auth=a0_30인 경우만)
  updateManagerProfile: `
    UPDATE member SET m_nm = ?, m_tel = ?, m_email = ?
    WHERE m_no = ? AND m_auth = 'a0_30'
  `,
};
