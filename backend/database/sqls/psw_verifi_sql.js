const qry = {
  // 새 인증 생성: 기본 상태는 미인증(h0_00), 종료 시간은 현재 시각 + 3분
  insertVerification: `
    INSERT INTO verification
    (verifi_mail, m_no, verifi_num,
      verifi_purpose, verifi_create_at,
      verifi_end_at, verifi_success)
    VALUES (?, ?, ?, ?, NOW(),
    DATE_ADD(NOW(), INTERVAL 3 MINUTE), 'h0_00')
  `,

  // 가장 최근 "대기중(미인증)" 인증 1건 조회 (코드 비교/만료 체크는 서비스 단에서 처리)
  selectLatestPendingVerification: `
    SELECT *
    FROM verification
    WHERE verifi_mail = ?
      AND verifi_purpose = ?
      AND verifi_success = 'h0_00'
    ORDER BY verifi_create_at DESC
    LIMIT 1
  `,

  // 인증 성공 처리
  updateVerificationSuccessByNo: `
    UPDATE verification
    SET verifi_success = 'h0_10'
    WHERE verifi_no = ?
  `,

  // 인증 실패 처리 (오입력/만료 등)
  updateVerificationFailByNo: `
    UPDATE verification
    SET verifi_success = 'h0_99'
    WHERE verifi_no = ?
  `,
  selectMemberByNameEmail: `
    SELECT *
    FROM member
    WHERE m_nm = ?
    AND m_email = ?
  `,

  selectMemberByIdEmail: `
    SELECT *
    FROM member
    WHERE m_id = ?
    AND m_email = ?
  `,

  updateMemberPassword: `
    UPDATE member
    SET m_pw = ?
    WHERE m_no = ?
  `,

  selectMemberByMno: `
    SELECT m_no, m_id, m_nm, m_email
    FROM member
    WHERE m_no = ?
  `,
};

module.exports = qry;
