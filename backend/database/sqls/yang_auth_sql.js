// 회원 인증 관련 쿼리
const qry = {
  // 로그인용 (비밀번호 포함)
  psw_login: `
    SELECT 
      m_no,
      m_id,
      m_pw,  
      m_nm,
      m_email,
      m_tel,
      m_bd,
      m_add,
      m_auth,
      m_org
    FROM member
    WHERE m_id = ?
  `,
  // 로그인용 + 기관명 조인 (organ_name 표시용)
  psw_login_with_organ: `
    SELECT 
      m.m_no,
      m.m_id,
      m.m_pw,
      m.m_nm,
      m.m_email,
      m.m_tel,
      m.m_bd,
      m.m_add,
      m.m_auth,
      m.m_org,
      o.organ_name
    FROM member m
    LEFT JOIN organ o ON o.organ_no = m.m_org
    WHERE m.m_id = ?
  `,
  // 회원 가입용 (비밀번호 포함)
  signUpUser: `
    INSERT INTO member
    (m_id, m_pw, m_nm, m_email, m_tel, m_bd, m_add, m_auth, m_org)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  // ID 중복 확인용
  checkIdExists: `
  SELECT 1
  FROM member
  WHERE m_id = ?
  LIMIT 1
`,
  // 이메일 중복 확인용 psw수정
  checkEmailExists: `
  SELECT 1
  FROM member
  WHERE m_email = ?
  LIMIT 1
`,
  // 기관 리스트 조회용
  getOrganList: `
  SELECT organ_no, organ_name, organ_address, organ_mail, organ_tel, start_time, end_time, org_status
  FROM organ
  ORDER BY organ_name ASC
`,
};

// sqList.js로 내보내기
module.exports = qry;
