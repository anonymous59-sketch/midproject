const express = require("express");
const router = express.Router();
const authService = require("../services/yang_auth_service");
const jwt = require("jsonwebtoken");

// 로그인 처리 (단순 문자열 비교)
router.post("/sign-in", async (req, res) => {
  const { m_id, m_pw } = req.body;

  if (!m_id || !m_pw)
    return res.json({ success: false, message: "ID/PW 입력" });

  try {
    const rows = await authService.getUserById(m_id);
    if (!rows || rows.length === 0)
      return res.json({ success: false, message: "존재하지 않는 아이디" });

    const user = rows[0]; // 첫 번째 계정 정보

    // bcrypt 대신 단순 문자열 비교 (테스트용)
    if (user.m_pw !== m_pw)
      return res.json({ success: false, message: "비밀번호 틀림" });

    const token = jwt.sign(
      { m_no: user.m_no, m_id: user.m_id },
      process.env.JWT_SECRET,
      { expiresIn: "2h" },
    );

    return res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "서버 오류" });
  }
});

// DB 연결 테스트
router.get("/db-test", async (req, res) => {
  try {
    const rows = await authService.getUserById("seoul_stf1"); // 실제 DB 계정
    if (!rows || rows.length === 0) {
      return res.json({ success: false, message: "DB에 계정이 없습니다." });
    }
    res.json({ success: true, user: rows[0] }); // 첫 번째 계정 정보 반환
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "DB 연결 실패" });
  }
});

module.exports = router;
