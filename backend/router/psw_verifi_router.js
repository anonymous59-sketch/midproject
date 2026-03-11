// verification 테이블 기준: verifi_purpose i0_10/i0_20/i0_30, verifi_success h0_00/h0_10/h0_99

const express = require("express");
const router = express.Router();

const verifi = require("../services/svc.js");

/* ============================
   1. 회원가입 이메일 인증번호 발송 (verifi_purpose: i0_10)
   POST /verifi/join
   body: { email, m_no? }
============================ */
router.post("/join", async (req, res) => {
    try {
        const { email, m_no } = req.body;

        if (!email) {
            return res.status(400).json({ message: "이메일을 입력하세요." });
        }

        const result = await verifi.sendJoinMail(email, m_no);

        res.json(result);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ============================
   2. 아이디 찾기 인증번호 발송 (verifi_purpose: i0_20)
   POST /verifi/find-id
   body: { name, email }
============================ */
router.post("/find-id", async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: "이름과 이메일을 입력하세요." });
        }

        const result = await verifi.sendFindIdMail(name, email);

        res.json(result);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/* ============================
   3. 비밀번호 재설정 인증번호 발송 (verifi_purpose: i0_30)
   POST /verifi/reset-pw
   body: { id, email }
============================ */
router.post("/reset-pw", async (req, res) => {
    try {
        const { id, email } = req.body;

        if (!id || !email) {
            return res.status(400).json({ message: "아이디와 이메일을 입력하세요." });
        }

        const result = await verifi.sendResetPwMail(id, email);

        res.json(result);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/* ============================
   3-1. 인증 만료 처리 (프론트 3분 만료 시 verifi_success → h0_99)
   POST /verifi/expire
   body: { email, purpose }  // purpose: i0_10 | i0_20 | i0_30
============================ */
router.post("/expire", async (req, res) => {
    try {
        const { email, purpose } = req.body;
        if (!email || !purpose) {
            return res.status(400).json({ message: "이메일과 용도(purpose)가 필요합니다." });
        }
        const result = await verifi.expirePendingVerification(email, purpose);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ============================
   4. 인증번호 검증 (성공 h0_10 / 실패·만료 h0_99)
   POST /verifi/verify
   body: { email, code, purpose }
============================ */
router.post("/verify", async (req, res) => {
    try {
        const { email, code, purpose } = req.body;

        if (!email || !code || !purpose) {
            return res.status(400).json({ message: "필수 값이 누락되었습니다." });
        }

        const result = await verifi.verifyCode(email, code, purpose);

        res.json(result);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/* ============================
   5. 비밀번호 변경 (m_no 사용)
   POST /verifi/update-password
   body: { m_no, newPw }
============================ */
router.post("/update-password", async (req, res) => {
    try {
        const { m_no, newPw } = req.body;

        if (!m_no || !newPw) {
            return res.status(400).json({ message: "필수 값이 누락되었습니다." });
        }

        const result = await verifi.updatePassword(m_no, newPw);

        res.json(result);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ============================
   6. 비밀번호 재설정 (id, email 사용 - 인증 완료 후 호출)
   POST /verifi/reset-password
   body: { id, email, newPw }
============================ */
router.post("/reset-password", async (req, res) => {
    try {
        const { id, email, newPw } = req.body;

        if (!id || !email || !newPw) {
            return res.status(400).json({ message: "아이디, 이메일, 새 비밀번호를 모두 입력하세요." });
        }

        const result = await verifi.resetPasswordByIdEmail(id, email, newPw);

        res.json(result);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;