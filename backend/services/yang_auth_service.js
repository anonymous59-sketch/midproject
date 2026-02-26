// 회원 인증 관련 서비스
const query = require("../database/mapper/mapper.js"); // mapper 가져오기
// bcrypt 사용 시 필요
// const bcrypt = require("bcrypt");

const svc = {
  // 회원 아이디로 조회 (로그인용)
  getUserById: async (m_id) => {
    if (!m_id) {
      console.error("m_id가 필요합니다.");
      return null;
    }

    try {
      //  쿼리 이름 psw_login 사용
      const list = await query("psw_login", [m_id]);

      if (!list || list.length === 0) return null;

      // 단순 문자열 비교용 비밀번호 필드 포함
      const user = list[0];
      return {
        m_no: user.m_no,
        m_id: user.m_id,
        m_pw: user.m_pw, //  여기서 비밀번호 가져오기
        m_nm: user.m_nm,
        m_email: user.m_email,
        m_tel: user.m_tel,
        m_bd: user.m_bd,
        m_add: user.m_add,
        m_auth: user.m_auth,
        m_org: user.m_org,
      };
    } catch (err) {
      console.error("psw_login 오류:", err);
      return null;
    }
  },

  //  비밀번호 확인 함수
  verifyPassword: (plainPw, hashedPw) => {
    // 테스트용: 단순 문자열 비교
    return plainPw === hashedPw;

    // bcrypt 사용 시
    // return await bcrypt.compare(plainPw, hashedPw);
  },

  // 회원가입 기능
  signUpUser: async (userInfo) => {
    try {
      // m_no 생성 (MEM + YYYYMMDD + 시퀀스)
      const date = new Date();
      const seq = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      userInfo.m_no = `MEM${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}${seq}`;

      const keys = [
        "m_no",
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
      const values = keys.map((k) => userInfo[k] || null);

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
