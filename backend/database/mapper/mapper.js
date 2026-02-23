const connectionPool = require("./pools.js");
// DB에서 실행할 SQL문을 별도 파일로 작성
const sqlList = require("../sqls/sqlList.js");

// db에 sql문 보내고 데이터 받아오는 함수 (매 요청마다 connection 획득/반환)
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

// 트랜잭션용: 이미 획득한 connection으로 쿼리 실행 (connection 획득/반환 안 함)
// 박상원 조사지 등록을 위해 필요한 트랜잭션용
const queryWithConn = async (conn, alias, values) => {
  const executeSql = sqlList[alias];
  return conn.query(executeSql, values);
};

const getConnection = () => connectionPool.getConnection();

// services 폴더의 각자 service.js로 넘김
module.exports = query;
module.exports.queryWithConn = queryWithConn;
module.exports.getConnection = getConnection;
