// member_sql.js
module.exports = {
  getMemberById: "SELECT * FROM member WHERE m_id = ?",

  // 담당자 관리: m_auth = a0_30 또는 a0_31, organ 조인, 목록용
  selectManagersWithOrgan: `
    SELECT m.m_no, m.m_id, m.m_nm, m.m_tel, m.m_email, m.m_org, m.m_auth, o.organ_name
    FROM member m
    LEFT JOIN organ o ON o.organ_no = m.m_org
    WHERE m.m_auth = ?
    ORDER BY m.m_no desc
  `,

  // 담당자 목록: 승인(a0_30) + 승인요청(a0_31) 동시 조회
  selectManagersWithOrganIn: `
    SELECT m.m_no, m.m_id, m.m_nm, m.m_tel, m.m_email, m.m_org, m.m_auth, o.organ_name
    FROM member m
    LEFT JOIN organ o ON o.organ_no = m.m_org
    WHERE m.m_auth IN (?, ?)
    ORDER BY m.m_no desc
  `,

  // 담당자 정보 수정 (m_nm, m_tel, m_email만, m_auth=a0_30인 경우만)
  updateManagerProfile: `
    UPDATE member SET m_nm = ?, m_tel = ?, m_email = ?
    WHERE m_no = ? AND m_auth = 'a0_30'
  `,

  // 승인요청 → 승인: m_auth를 a0_31에서 a0_30으로 변경
  updateManagerApprove: `
    UPDATE member SET m_auth = 'a0_30'
    WHERE m_no = ? AND m_auth = 'a0_31'
  `,

  // 회원 권한 변경 (승인요청→승인 등). toAuth, m_no, fromAuth 순
  updateMemberAuth: `
    UPDATE member SET m_auth = ?
    WHERE m_no = ? AND m_auth = ?
  `,

  // 담당자 삭제 (반려 시 등)
  deleteMember: `
    DELETE FROM member WHERE m_no = ?
  `,

  // 회원 이메일/이름 조회 (반려 메일 발송용)
  selectMemberEmailByNo: `
    SELECT m_email, m_nm
    FROM member
    WHERE m_no = ?
  `,
};
