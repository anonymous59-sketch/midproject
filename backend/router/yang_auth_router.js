const express = require("express");
const router = express.Router();
const authService = require("../services/yang_auth_service"); // 서비스 가져오기

// 로그인 처리
router.post("/sign-in", async (req, res) => {
  try {
    const { m_id, m_pw } = req.body;

    if (!m_id || !m_pw) {
      return res.json({ success: false, message: "ID/PW 입력" });
    }

    const user = await authService.getUserById(m_id);

    if (!user) {
      return res.json({ success: false, message: "존재하지 않는 아이디" });
    }

    // 단순 문자열 비교
    if (user.m_pw !== m_pw) {
      return res.json({ success: false, message: "비밀번호 틀림" });
    }

    // JWT 없이 로그인 성공 처리 (m_org로 organ 조인한 organ_name 포함)
    return res.json({
      success: true,
      message: "로그인 성공!",
      user: {
        m_no: user.m_no,
        m_id: user.m_id,
        m_nm: user.m_nm,
        m_email: user.m_email,
        m_tel: user.m_tel,
        m_bd: user.m_bd,
        m_add: user.m_add,
        m_auth: user.m_auth,
        m_org: user.m_org,
        organ_name: user.organ_name ?? null,
      },
    });
  } catch (err) {
    console.error("로그인 라우터 오류:", err);
    return res.json({ success: false, message: "서버 오류" });
  }
});

// 회원가입 API
router.post("/sign-up", async (req, res) => {
  try {
    const userInfo = req.body; // Vue에서 넘어온 데이터

    // 필수값 체크
    if (
      !userInfo.m_id ||
      !userInfo.m_pw ||
      !userInfo.m_nm ||
      !userInfo.m_email
    ) {
      return res.json({ success: false, message: "필수 입력값 누락" });
    }

    // ID 중복 확인
    const existUser = await authService.getUserById(userInfo.m_id);
    if (existUser)
      return res.json({ success: false, message: "이미 존재하는 아이디" });

    // Email 중복 확인 /psw 수정
    const emailExists = await authService.checkEmailExists(userInfo.m_email);
    if (emailExists) {
      return res.json({
        success: false,
        message: "해당 이메일은 이미 가입되어있습니다.",
      });
    }

    // 회원가입
    const result = await authService.signUpUser(userInfo);
    return res.json(result);
  } catch (err) {
    console.error("회원가입 라우터 오류:", err);
    return res.json({ success: false, message: "서버 오류" });
  }
});

router.get("/organ/list", async (req, res) => {
  const rows = await authService.getOrganList();
  res.json(rows);
});

// 아이디 중복 체크 API
router.get("/check-id/:m_id", async (req, res) => {
  const m_id = req.params.m_id;
  if (!m_id) return res.json({ exists: false });

  try {
    const exists = await authService.checkIdExists(m_id);
    res.json({ exists });
  } catch (err) {
    console.error("ID 중복 체크 오류:", err);
    res.json({ exists: false });
  }
});

// 이메일 중복 체크 API
// GET /api/auth/check-email?email=xxx
router.get("/check-email", async (req, res) => {
  const email = (req.query?.email ?? "").toString().trim();
  if (!email) return res.json({ exists: false });

  try {
    const exists = await authService.checkEmailExists(email);
    res.json({ exists });
  } catch (err) {
    console.error("Email 중복 체크 오류:", err);
    res.json({ exists: false });
  }
});

// 회원 정보 조회 예시
router.get("/users/:m_id", async (req, res) => {
  try {
    const m_id = req.params.m_id;
    const user = await authService.getUserById(m_id);
    res.json(user || {});
  } catch (err) {
    console.error(err);
    res.json({});
  }
});

module.exports = router;
