// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능의 라우터인지 알기 쉽게 영문으로 적어주는 걸 권장
// export하고 같은 경로의 router.js에서 require부분에 해당 폴더 경로를 추가해주기
// 라우터 통합은 조금 까다로우니까 router.js 파일 잘 확인하기

// express의 router 모듈
const express = require("express");
const router = express.Router();

const verifi = require("../services/svc.js"); // 서비스 가져오기. svc.js가 모든 서비스 모여있는 곳이라서 이 경로를 가져오면 됨

// 작동하지 않는 예시
/* 아이디 찾기 인증번호 발송 */
// router.post("/find-id/send-mail", verifi.sendFindIdMail);

// /* 인증번호 검증 */
// router.post("/verify-code", verifi.verifyCode);

// /* 비밀번호 재설정 */
// router.post("/reset-password", verifi.resetPassword);

// router.post("/send_test_email", verifi.testMail);

module.exports = router;