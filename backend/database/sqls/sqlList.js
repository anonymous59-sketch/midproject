// table <==> file
// 자신이 추가한 경로를 변수 선언과 함께 여기에 추가해줘야함.
// 이건 조원들이 계속 추가하는 구조라서 merge할 때 conflict가 나게 됨
const ex_login = require("./ex_login.sql.js");
const support_sql = require("./jh_support_sql.js");
const rank_sql = require("./jh_rank_sql.js");
const psw_survey = require("./psw_survey_sql.js");

// 선언한 변수를 ...과 함께 아래에 추가해줘야함.
// mapper 폴더의 mappers.js로 넘김
module.exports = {
  // spread operator을 활용
  ...ex_login,
  ...support_sql,
  ...rank_sql,
  ...psw_survey,
};
