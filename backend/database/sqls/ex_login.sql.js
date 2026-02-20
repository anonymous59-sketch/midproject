// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능과 연관된 쿼리문인지 알기 쉽게 영문으로 적어주는 걸 권장
// 백틱 사용
// 하나의 변수를 선언해서 안에 객체로 집어넣는 형식,
// 객체 안에 변수명 : 쿼리문 형식으로 선언해두기
// 예시 변수명은 자유롭게 수정하면 됨
// export하고 sqList.js에서 require부분에 해당 폴더 경로를 추가해주기

const qry = {
  abc/* 예시 변수명 대신 이 변수명은 수정할때 자신이 만든 변수라는 걸 구별할수 있게 수정 필요. 예시) psw_login
  다른사람이랑 이 변수명이 겹치면 누군가는 덮어씌워질 수 있음 */
  : `
SELECT no 
        , name 
        , writer 
        , publisher 
        , publication_date 
        , info 
FROM t_book_01 
ORDER BY 1
` /* 예시 쿼리문임 */,

  cde /* 예시 변수명 */: `
SELECT no 
        , name 
        , writer 
        , publisher 
        , publication_date 
        , info 
FROM t_book_01 
WHERE no = ?
`,

};

// sqList.js로 넘김
module.exports = qry;
