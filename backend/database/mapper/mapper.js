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

/*
박상원 조사지 수정을 한꺼번에 하기 위해서 사용하는 것
여러 쿼리를 한 트랜잭션으로 실행 (트랜잭션 >> 전부 성공 시 commit, 하나라도 실패 시 rollback, 작업 결과가 어떻게 되든 마지막은 연결상태를 항상 release)
*/
const runInTransaction = async (objData) => {
  let conn = null;
  try {
    conn = await connectionPool.getConnection();
    await conn.beginTransaction(); // 트랜잭션 만들기 시작
    for (const ob of objData) {
      await conn.query(sqlList[ob.alias], ob.values);
    }
    await conn.commit();
    return { success: true };
  } catch (err) {
    if (conn) await conn.rollback();
    console.log(`==========SQL ERR (transaction rollback) ==========`);
    console.error(err);
    return { success: false, error: err };
  } finally {
    if (conn) conn.release();
  }
};
query.runInTransaction = runInTransaction; // export를 query만 하니까 query에 속성을 하나 추가하는 형식

// services 폴더의 각자 service.js로 넘김
module.exports = query;
