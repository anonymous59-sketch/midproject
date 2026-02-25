const express = require("express");
const router = express.Router();
const authService = require("../services/yang_auth_service");

// 테스트용 계정 입력: 실제 DB에 존재하는 ID로 바꿔주세요
const TEST_USER_ID = "seoul_stf1";

// DB 연결 테스트
router.get("/db-test", async (req, res) => {
  try {
    const result = await authService.getUserById(TEST_USER_ID);

    if (!result || result.length === 0) {
      return res.json({
        success: false,
        message: "DB 연결은 됐지만, 해당 계정 없음",
      });
    }

    res.json({ success: true, user: result });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "DB 연결 실패", error: err.message });
  }
});

module.exports = router;
