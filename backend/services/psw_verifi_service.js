// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능인지 알기 쉽게 영문으로 적어주는 걸 권장
// export하고 같은 경로의 svc.js에서 require부분에 해당 폴더 경로를 추가해주기

// service에서 필요에 따라 db에 접속 => mapper
const query = require("../database/mapper/mapper.js"); // mapper가져오기. mapper.js가 모든 서비스 모여있는 곳이라서 이 경로를 가져오면 됨
require("dotenv").config({ path: "./dbConfig.env" });

const nodemailer = require("nodemailer");

async function testMail() {

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: "Test Mail",
        text: "NodeMailer Test Success"
    });

    console.log("메일 전송 성공");
}

testMail().catch(console.error);


// const mapper = require("../database/mapper/mapper.js");
// const memberService = require("./member.service");

// /* =============================
//    Nodemailer 설정
// ============================= */
// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// });

// /* =============================
//    Utility 함수
// ============================= */

// function generateAuthNumber() {
//     return Math.floor(100000 + Math.random() * 900000).toString();
// }

// /* =============================
//    Mail Send Function
// ============================= */

// async function sendAuthMail(email, code) {

//     await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: "인증번호 안내",
//         html: `<p>인증번호 : <b>${code}</b></p> <p>3분 내 입력해주세요.</p>`
//     });
// }
// // 해당하는 기능을 svc라는 변수에 객체 형식으로 넣기
// const svc = {
//

// /* =============================
//    인증번호 발송 (아이디 찾기)
// ============================= */

// async function sendFindIdMail(email) {

//     const member = await memberService.findByEmail(email);

//     if (!member) {
//         throw new Error("존재하지 않는 이메일입니다.");
//     }

//     const code = generateAuthNumber();

//     const createAt = new Date();
//     const endAt = new Date(createAt.getTime() + 3 * 60 * 1000);

//     await mapper.query("insertVerification", [
//         email,
//         member.m_no,
//         code,
//         "FIND_ID"
//     ]);

//     await sendAuthMail(email, code);

//     return { message: "인증번호가 발송되었습니다." };
// }

// /* =============================
//    인증번호 검증
// ============================= */

// async function verifyCode(email, code, purpose) {

//     const result = await mapper.query(
//         "selectValidVerification",
//         [email, code, purpose]
//     );

//     if (!result || result.length === 0) {
//         throw new Error("인증번호가 유효하지 않습니다.");
//     }

//     await mapper.query(
//         "updateVerificationSuccess",
//         [email, code, purpose]
//     );

//     return { message: "인증 성공" };
// }

// };

// /* =============================
//    Export
// ============================= */

// module.exports =  svc;
