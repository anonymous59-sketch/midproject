// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능과 연관된 쿼리문인지 알기 쉽게 영문으로 적어주는 걸 권장
// 백틱 사용
// 하나의 변수를 선언해서 안에 객체로 집어넣는 형식,
// 객체 안에 변수명 : 쿼리문 형식으로 선언해두기
// 예시 변수명은 자유롭게 수정하면 됨
// export하고 sqList.js에서 require부분에 해당 폴더 경로를 추가해주기

const qry = {
  // 조사지 리스트 가져오기
  psw_surveyList: `
    SELECT 
        s.sver_code, 
        s.sv_name, 
        s.sver_ondate, 
        s.sver_enddate, 
        m.m_nm AS writer_name
    FROM 
        survey s
    JOIN 
        member m ON s.sv_writer = m.m_no;
    `,
  psw_surveySearch: `
    SELECT 
      s.sver_code, 
      s.sv_name, 
      s.sver_ondate, 
      s.sver_enddate, 
      m.m_nm AS writer_name
    FROM 
      survey s
    JOIN 
      member m ON s.sv_writer = m.m_no
    WHERE 
      s.sv_name LIKE ?
  `,
  //// 자동입력으로 들어갈 내용이랑 부코드 설정되어있는 것들은 추후 수정 해야됨
  psw_surveyMajorCategoryCreate: `
    INSERT INTO major_category
    VALUES (?, ?, ?);
  `, // VALUES (PK값(자동설정), 조사지버전 특정(선택한 조사지의 코드), 대분류 이름(값을 입력 받아오기))
  psw_surveySubCategoryCreate: `
    INSERT INTO sub_category
    VALUES (?, ?, ?);
  `, // VALUES (PK값(자동설정), 소분류가 속한 대분류 코드(선택한 대분류), 소분류 이름(값을 입력 받아오기))
  psw_surveyQuestionCreate: `
    INSERT INTO survey_q (q_code, sub_code, q_no, q_type, q_content)
    VALUES (?, ?, ?, ?, ?);
  `, //VALUES (PK(자동입력), 선택한 소분류코드를 가져오기, 질문번호?, 질문타입(선택한 값을 부코드로 가져오기), 질문 내용(입력한 값을 가져오기))

  // 수정 (트랜잭션: 3개 모두 성공 시 commit, 하나라도 실패 시 rollback)
  psw_majorCategoryUpdate: `
    UPDATE major_category
    SET major_name = ?
    WHERE major_code = ?;
  `,
  psw_subCategoryUpdate: `
    UPDATE sub_category
    SET sub_name = ?
    WHERE sub_code = ?;
  `,
  psw_surveyQUpdate: `
    UPDATE survey_q
    SET q_content = ?
    WHERE q_code = ?;
  `,
};
// s.sv_name LIKE CONCAT('%', ?, '%')
// sqList.js로 넘김
module.exports = qry;
