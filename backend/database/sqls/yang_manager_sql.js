// 기관 담당자

const qry = {
  getManagerList: `
  SELECT
    m_no,
    m_nm,
    m_id,
    m_tel,
    m_email,
    m_org,
    m_auth
  FROM member
  WHERE m_auth = 'a0_30'
  ORDER BY m_no DESC
`,
};

// sqList.js로 내보내기
module.exports = qry;
