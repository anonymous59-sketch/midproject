// MariaDB에 접속할 모듈
const mariadb = require("mariadb");
require('dotenv').config({path:'../dbConfig.env'})
// ConnectionPool 생성
const connectionPool = mariadb.createPool({
  // DB에 접속하는 정보 app.js랑 같은 경로에 dbConfig.env가 있어야함. git으로 공유가 안되는 파일이니까 없으면 조장, 부조장에게 요청
  host:process.env.host,
  port:process.env.port,
  user:process.env.user,
  password:process.env.password,
  database:process.env.database,
  connectionLimit: 5,
  // Object의 필드정보(Entiry)를 Query문에 있는 '?'에 자동변환 설정
  permitSetMultiParamEntries: true,
  // DML(insert, update, delete)를 실행할 경우
  // 반환되는 Object의 insertId 속성을 Number 타입으로 자동 변환
  insertIdAsNumber: true,
  // MariaDB의 데이터 타입 중 bigInt 타입을 Javascript의 Number 타입으로 자동 변환
  // 해당 타입을 Javascript에선 자동으로 변환하지 못함
  bigIntAsNumber: true,
  dateStrings: true,
  // logger 등록
  logger: {
    // 실제 실행되는 SQL문이 console.log로 출력되도록 설정
    query: console.log,
    // error 발생 시 처리함수
    error: console.log,
  },
});

// mapper.js 파일로 넘김
module.exports = connectionPool;