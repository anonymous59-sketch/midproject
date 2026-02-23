// 이건 조원들이 계속 추가하는 구조라서 merge할 때 conflict가 나게 됨
const express = require("express");
const router = express.Router();

// 라우터 변수를 따로 설정하고 자신이 만든 파일의 경로를 가져와야함
const login_router = require("./ex_login_router");
const support_router = require("./jh_support_router");
const psw_survey = require("./psw_survey_router");

// 라우터 주소가 최대한 겹치지 않도록 유의할 필요가 있음
// 만약 login_router로 불러오는 파일에서 라우터 예시 주소를 URL이라고 설정을 했을 경우
// 여기서 주소를 추가한다면 /login/URL 이렇게 적어야 접속하게됨
// 주소가 없다면 /URL로 접속하게 되는데 URL이 다른사람과 겹치게 되면 문제가 발생함
// 이 파일은 개별적으로 작성한 URL을 다시 한 곳으로 모으는 역할이라서
// 개별적으로 파일 생성 후 작성한 url을 자신만의 특별한 규칙으로 적는다면 아래 router.use안의 url을 따로 적을 필요 없이 "/"으로 둬도 됨
// 대신 router.use("임의의 주소", 자신이 선언한 변수); 이 형태의 코드는 있어야 적용이 정상적으로 진행
router.use("/login", login_router);
router.use("/support", support_router);
router.use('/', psw_survey);

module.exports = router;
