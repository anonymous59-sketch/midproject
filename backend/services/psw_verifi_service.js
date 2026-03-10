// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능인지 알기 쉽게 영문으로 적어주는 걸 권장
// export하고 같은 경로의 svc.js에서 require부분에 해당 폴더 경로를 추가해주기

// service에서 필요에 따라 db에 접속 => mapper
// mapper 가져오기
const query = require("../database/mapper/mapper.js");
require("dotenv").config({ path: "./dbConfig.env" });
const bcrypt = require("bcrypt");

const nodemailer = require("nodemailer");

const SALT_ROUNDS = 10; // 비밀번호 해시 비용 (회원가입·로그인과 동일하게)

//    1. 메일 설정
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
//    2. 인증번호 생성 함수
function generateAuthNumber() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
//    3. 메일 발송 함수
async function sendAuthMail(email, code) {

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "인증번호 안내",
        html: `
            <h3>인증번호 안내 ${email}</h3>
            <p>인증번호 : <b>${code}</b></p>
            <p>3분 내에 입력해주세요.</p>
        `
    });
}

//    4. 인증번호 저장 + 메일 발송 (공통 함수). 재인증 시 기존 대기 건은 실패(h0_99)로 변경
async function createAndSendVerification(email, m_no, purpose) {

    // 재인증 시: 같은 이메일·용도로 대기중(h0_00)인 건을 먼저 인증 실패(h0_99)로 변경
    await query("updatePendingToFailByEmailPurpose", [email, purpose]);

    const code = generateAuthNumber();

    // DB에 인증정보 저장 (새 행은 미인증 h0_00)
    await query("insertVerification", [
        email,
        m_no,      // 회원가입일 경우 null 가능
        code,
        purpose
    ]);

    // 메일 발송
    await sendAuthMail(email, code);

    return { message: "인증번호가 발송되었습니다." };
}
// ------------ 전역 함수 -------------


// ------------ 이메일 인증 서비스 -------------
// verifi_purpose: i0_10 이메일인증, i0_20 아이디찾기, i0_30 패스워드찾기
// verifi_success: h0_00 미인증, h0_10 인증성공, h0_99 인증실패
const svc = {
    // 회원가입 이메일 인증 (용도 i0_10, m_no 없음)
    sendJoinMail: async (email) => {
        return await createAndSendVerification(email, null, "i0_10");
    },

    // 아이디 찾기 인증번호 발송 (용도 i0_20, member에서 m_no 사용)
    sendFindIdMail: async (name, email) => {
        const result = await query("selectMemberByNameEmail", [name, email]);
        if (!result || result.length === 0) {
            throw new Error("일치하는 회원 정보가 없습니다.");
        }
        const member = result[0];
        return await createAndSendVerification(email, member.m_no, "i0_20");
    },

    // 비밀번호 재설정 인증번호 발송 (용도 i0_30, member에서 m_no 사용)
    sendResetPwMail: async (id, email) => {
        const result = await query("selectMemberByIdEmail", [id, email]);
        if (!result || result.length === 0) {
            throw new Error("일치하는 회원 정보가 없습니다.");
        }
        const member = result[0];
        return await createAndSendVerification(email, member.m_no, "i0_30");
    },

    // 인증번호 검증: 만료/오입력 시 verifi_success = h0_99, 성공 시 h0_10
    verifyCode: async (email, code, purpose) => {
    // 1) 이메일+용도로 가장 최근 "미인증(h0_00)" 건만 조회 (입력 코드는 아래에서 비교)
    const result = await query("selectLatestPendingByEmailPurpose", [email, purpose]);

    if (!result || result.length === 0) {
        throw new Error("인증번호가 올바르지 않거나 만료되었습니다. 재인증을 요청해주세요.");
    }

    const verifiRow = result[0];
    const { verifi_no, verifi_num, verifi_end_at, m_no } = verifiRow;

    // 2) 만료 여부 체크 → 만료면 DB 상태를 인증 실패(h0_99)로 변경
    const now = new Date();
    const endAt = new Date(verifi_end_at);
    if (now > endAt) {
        await query("updateVerificationFailByNo", [verifi_no]);
        throw new Error("인증시간이 만료되었습니다. 다시 요청해주세요.");
    }

    // 3) 인증번호 불일치 → DB 상태를 인증 실패(h0_99)로 변경 후 재인증 유도
    if (String(code) !== String(verifi_num)) {
        await query("updateVerificationFailByNo", [verifi_no]);
        throw new Error("인증번호가 일치하지 않습니다. 인증 번호를 다시 발급받아주세요.");
    }

    // 4) 인증 성공 → h0_10
    await query("updateVerificationSuccessByNo", [verifi_no]);

    const res = { message: "인증 성공" };
    if (purpose === "i0_20" && m_no) {
        const member = await query("psw_selectMemberByMno", [m_no]);
        if (member && member[0]) res.m_id = member[0].m_id;
    }
    if (purpose === "i0_30" && m_no) {
        res.m_no = m_no;
    }
    return res;
},

// 프론트 3분 타이머 만료 시 호출 → 해당 이메일·용도의 최신 미인증 건을 h0_99로 변경
    expirePendingVerification: async (email, purpose) => {
    const result = await query("selectLatestPendingByEmailPurpose", [email, purpose]);
    if (result && result.length > 0) {
        const verifi_no = result[0].verifi_no;
        await query("updateVerificationFailByNo", [verifi_no]);
    }
    return { message: "만료 처리되었습니다." };
    },

    // 비밀번호 변경 (m_no 사용). 새 비밀번호는 평문으로 받아 bcrypt 해시 후 저장
    updatePassword: async (m_no, newPw) => {
        const hashedPw = await bcrypt.hash(newPw, SALT_ROUNDS);
        await query("updateMemberPassword", [hashedPw, m_no]);
        return { message: "비밀번호가 변경되었습니다." };
    },

    // 비밀번호 재설정 (id, email로 회원 조회 후 m_no로 변경). 새 비밀번호 bcrypt 해시 후 저장
    resetPasswordByIdEmail: async (id, email, newPw) => {
        const result = await query("selectMemberByIdEmail", [id, email]);
        if (!result || result.length === 0) {
            throw new Error("일치하는 회원 정보가 없습니다.");
        }
        const member = result[0];
        const hashedPw = await bcrypt.hash(newPw, SALT_ROUNDS);
        await query("updateMemberPassword", [hashedPw, member.m_no]);
        return { message: "비밀번호가 변경되었습니다." };
    },
};

module.exports = svc;