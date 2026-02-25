// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능과 연관된 쿼리문인지 알기 쉽게 영문으로 적어주는 걸 권장
// 백틱 사용
// 하나의 변수를 선언해서 안에 객체로 집어넣는 형식,
// 객체 안에 변수명 : 쿼리문 형식으로 선언해두기
// 예시 변수명은 자유롭게 수정하면 됨
// export하고 sqList.js에서 require부분에 해당 폴더 경로를 추가해주기

const qry = {
// 조사지 리스트 및 검색(검색값이 없으면 전체 조회)
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
    ORDER BY 1 DESC
  `,

// 조사지 등록 기능 중에 해당 항목 선택했을 시 조회를 위한 쿼리문
// 조사지 버전 클릭시 해당 버전에 맞는 대분류 조회
  psw_majCateSelect: `
  SELECT major_code, major_name FROM major_category WHERE sver_code = ?;
  `,
// 조사지 버전 기준 해당 대분류와 JOIN을 해서 소분류 조회
  psw_subCateSelect: `
    SELECT
    sc.sub_code,
    sc.major_code,
    sc.sub_name
    FROM sub_category sc
    JOIN major_category mc ON sc.major_code = mc.major_code
    WHERE mc.sver_code = ?;
  `,
// 조사지 버전 기준 해당 대분류에 JOIN된 소분류에 JOIN된 질문들 조회
  psw_surveyQSelect: `
    SELECT
    q.q_code,
    q.sub_code,
    q.q_no,
    q.q_type,
    q.q_content
    FROM survey_q q
    JOIN sub_category sc ON q.sub_code = sc.sub_code
    JOIN major_category mc ON sc.major_code = mc.major_code
    WHERE mc.sver_code = ?;
  `,


  //////////////////////// 여기 아래 쿼리 대폭 수정해야됨, 등록이랑 업데이트 제대로 구분하기

  psw_surveyMajorCategoryCreate: `
INSERT INTO major_category (sver_code, major_name)
VALUES (?, ?);
  `, // VALUES (PK값(자동설정), 조사지버전 특정(선택한 조사지의 코드), 대분류 이름(값을 입력 받아오기))
  psw_surveySubCategoryCreate: `
INSERT INTO sub_category (major_code, sub_name)
VALUES (?, ?);
  `, // VALUES (PK값(자동설정), 소분류가 속한 대분류 코드(선택한 대분류), 소분류 이름(값을 입력 받아오기))
  psw_surveyQuestionCreate: `
INSERT INTO survey_q (sub_code, q_no, q_type, q_content)
VALUES (?, ?, ?, ?);
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

  
  // 조사지 INSERT (트리거로 sver_code 생성된다고 가정)
  psw_surveyInsert: `
    INSERT INTO survey (sv_name, sv_writer, sv_time, sver_ondate, sver_enddate)
    VALUES (?, ?, NOW(), ?, ?);
  `,

  // 조사지 UPDATE
  psw_surveyUpdate: `
    UPDATE survey
       SET sv_name = ?,
           sver_ondate = ?,
           sver_enddate = ?
     WHERE sver_code = ?;
  `,

  // 특정 버전의 모든 대분류 삭제
  psw_majorCategoryDeleteByVersion: `
    DELETE FROM major_category
     WHERE sver_code = ?;
  `,

  // 특정 버전의 모든 소분류 삭제
  psw_subCategoryDeleteByVersion: `
    DELETE sc
      FROM sub_category sc
      JOIN major_category mc ON sc.major_code = mc.major_code
     WHERE mc.sver_code = ?;
  `,

  // 특정 버전의 모든 질문 삭제
  psw_surveyQDeleteByVersion: `
    DELETE sq
      FROM survey_q sq
      JOIN sub_category sc ON sq.sub_code = sc.sub_code
      JOIN major_category mc ON sc.major_code = mc.major_code
     WHERE mc.sver_code = ?;
  `,

  // 기존에 있던 것 재사용 (PK 자리는 NULL 전달한다고 가정)
  psw_surveyMajorCategoryCreate: `
UPDATE major_category
SET major_name = "테스트 대분류 수정값"
WHERE major_code = "MAJ0001";
  `,
  psw_surveySubCategoryCreate: `
INSERT INTO sub_category (major_code, sub_name)
VALUES (?, ?);
  `,
  psw_surveyQuestionCreate: `
INSERT INTO survey_q (sub_code, q_no, q_type, q_content)
VALUES (?, ?, ?, ?);
  `,
  //// 조회용
};
// s.sv_name LIKE CONCAT('%', ?, '%')
// sqList.js로 넘김
module.exports = qry;
