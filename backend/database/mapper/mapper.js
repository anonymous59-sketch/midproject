const connectionPool = require("./pools.js");
// DB에서 실행할 SQL문을 별도 파일로 작성
const sqlList = require("../sqls/sqlList.js");

// db에 sql문 보내고 데이터 받아오는 함수
const query = async (alias, values) => {
  // values = SQL문 안에 선언한 '?' param을 대체할 값
  let conn = null;
  try {
    conn = await connectionPool.getConnection();
    let executeSql = sqlList[alias];
    let result = await conn.query(executeSql, values);
    return result;
  } catch (err) {
    console.log(`==========SQL ERR ==========`);
    console.error(err);
  } finally {
    if (conn) {
      conn.release();
    }
  }
};

// services 폴더의 각자 service.js로 넘김
module.exports = query;
