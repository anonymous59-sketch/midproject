// 자신이 추가한 경로를 변수 선언과 함께 여기에 추가해줘야함.
// 이건 조원들이 계속 추가하는 구조라서 merge할 때 conflict가 나게 됨
const login_service = require("./ex_login_service");
const support_service = require("./jh_support_service");
const rank_service = require("./jh_rank_service");
const psw_survey = require("./psw_survey_service.js");
const auth_service = require("./yang_auth_service");
const upload_service = require("./upload_service");
const psw_verifi = require("./psw_verifi_service");
const psw_support_history = require("./psw_support_history_service");
const manager_service = require("./yang_manager_service");

// 선언한 변수를 ...과 함께 아래에 추가해줘야함.
// mapper 폴더의 개인_mappers.js로 넘김
module.exports = {
  // spread operator을 활용
  ...login_service,
  ...support_service,
  ...rank_service,
  ...psw_survey,
  ...auth_service,
  ...upload_service,
  ...psw_verifi,
  ...psw_support_history,
  ...manager_service,
};
