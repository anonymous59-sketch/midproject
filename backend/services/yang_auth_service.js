// 회원 인증 관련 서비스 (비밀번호는 bcrypt로 암호화 저장·비교)
const query = require("../database/mapper/mapper.js");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10; // 해시 비용 (숫자 높을수록 안전, 느려짐. 학습용 10)

const svc = {
  // 회원 아이디로 조회 (로그인용, m_pw는 DB에 해시된 값)
  getUserById: async (m_id) => {
    if (!m_id) {
      console.error("m_id가 필요합니다.");
      return null;
    }

    try {
      const list = await query("psw_login_with_organ", [m_id]);

      if (!list || list.length === 0) return null;

      const user = list[0];
      return {
        m_no: user.m_no,
        m_id: user.m_id,
        m_pw: user.m_pw,
        m_nm: user.m_nm,
        m_email: user.m_email,
        m_tel: user.m_tel,
        m_bd: user.m_bd,
        m_add: user.m_add,
        m_auth: user.m_auth,
        m_org: user.m_org,
        organ_name: user.organ_name ?? null,
      };
    } catch (err) {
      console.error("psw_login 오류:", err);
      return null;
    }
  },

  // 비밀번호 확인: 사용자 입력(평문) vs DB 저장값(해시)
  verifyPassword: async (plainPw, hashedPw) => {
    if (!hashedPw) return false;
    return bcrypt.compare(plainPw, hashedPw);
  },

  // 회원가입: 평문 비밀번호를 bcrypt로 해시한 뒤 DB 저장
  signUpUser: async (userInfo) => {
    try {
      const hashedPw = await bcrypt.hash(userInfo.m_pw, SALT_ROUNDS);

      const keys = [
        "m_id",
        "m_pw",
        "m_nm",
        "m_email",
        "m_tel",
        "m_bd",
        "m_add",
        "m_auth",
        "m_org",
      ];
      const values = keys.map((k) => {
        if (k === "m_pw") return hashedPw;
        return userInfo[k] ?? null;
      });

      const result = await query("signUpUser", values);
      return { success: true, insertId: result.insertId || null };
    } catch (err) {
      console.error("회원가입 오류:", err);
      return { success: false, message: err.message };
    }
  },

  // 아이디 존재 여부 체크
  checkIdExists: async (m_id) => {
    try {
      const rows = await query("checkIdExists", [m_id]);
      return rows && rows.length > 0;
    } catch (err) {
      console.error("checkIdExists 오류:", err);
      return false;
    }
  },

  // 이메일 존재 여부 체크 / psw수정
  checkEmailExists: async (m_email) => {
    try {
      const rows = await query("checkEmailExists", [m_email]);
      return rows && rows.length > 0;
    } catch (err) {
      console.error("checkEmailExists 오류:", err);
      return false;
    }
  },

  // 기관 목록 조회
  getOrganList: async () => {
    try {
      const rows = await query("getOrganList", []);
      return rows; // [{organ_no, organ_name}, ...]
    } catch (err) {
      console.error("getOrganList 오류:", err);
      return [];
    }
  },
};

// svc 내보내기
module.exports = svc;
