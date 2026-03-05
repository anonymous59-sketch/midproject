/**
 * verification 테이블 (DB 정의 기준)
 * - verifi_purpose : i0_10 이메일인증, i0_20 아이디찾기, i0_30 패스워드찾기
 * - verifi_success : h0_00 미인증, h0_10 인증성공, h0_99 인증실패
 */
const qry = {
  // 새 인증 행 추가. verifi_no는 트리거로 자동 생성되므로 제외.
  insertVerification: `
    INSERT INTO verification
    (verifi_mail, m_no, verifi_num, verifi_purpose, verifi_create_at, verifi_end_at, verifi_success)
    VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 3 MINUTE), 'h0_00')
  `,

  // 이메일+용도 기준 최근 미인증(h0_00) 1건 조회 (코드/만료 검사는 서비스에서 수행 후 성공·실패 업데이트)
  selectLatestPendingByEmailPurpose: `
    SELECT verifi_no, verifi_mail, m_no, verifi_num, verifi_purpose, verifi_create_at, verifi_end_at, verifi_success
    FROM verification
    WHERE verifi_mail = ?
      AND verifi_purpose = ?
      AND verifi_success = 'h0_00'
    ORDER BY verifi_create_at DESC
    LIMIT 1
  `,

  // 인증 성공: verifi_success = h0_10
  updateVerificationSuccessByNo: `
    UPDATE verification
    SET verifi_success = 'h0_10'
    WHERE verifi_no = ?
  `,

  // 인증 실패(오입력/만료): verifi_success = h0_99
  updateVerificationFailByNo: `
    UPDATE verification
    SET verifi_success = 'h0_99'
    WHERE verifi_no = ?
  `,

  // 재인증 요청 시: 같은 이메일·용도의 미인증(h0_00) 건을 인증 실패(h0_99)로 변경
  updatePendingToFailByEmailPurpose: `
    UPDATE verification
    SET verifi_success = 'h0_99'
    WHERE verifi_mail = ?
      AND verifi_purpose = ?
      AND verifi_success = 'h0_00'
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

  psw_selectMemberByMno: `
    SELECT m_no, m_id, m_nm, m_email
    FROM member
    WHERE m_no = ?
  `,
};

module.exports = qry;
