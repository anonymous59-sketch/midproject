// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능과 연관된 쿼리문인지 알기 쉽게 영문으로 적어주는 걸 권장
// 백틱 사용
// 하나의 변수를 선언해서 안에 객체로 집어넣는 형식,
// 객체 안에 변수명 : 쿼리문 형식으로 선언해두기
// 예시 변수명은 자유롭게 수정하면 됨
// export하고 sqList.js에서 require부분에 해당 폴더 경로를 추가해주기

const qry = {
  // 지원신청의 지원자 정보 조회
  supportInfo: `
  SELECT s.sup_code, s.mem_no, d.disability_name, s.sup_day, s.mgr_no, s.res_time, s.rank_res
  FROM support s 
  INNER JOIN disability_person d
  ON s.mc_pn = d.disability_code
  WHERE s.sup_code = ?`,

  // 지원신청(sup_code)에 대한 계획 조회
  supportPlanBySupCode: `
    SELECT 
    p.plan_code, 
    p.sup_code, 
    p.plan_goal,
    p.plan_content,
    p.plan_date,
    p.plan_tf,
    p.plan_rej_cmt,
    p.plan_updday,
    f.file_code, 
    f.origin_file_name,
    f.server_file_name, 
    f.file_path,
    f.file_ext
FROM support_plan p 
LEFT JOIN file f ON p.plan_code = f.file_category
WHERE p.sup_code = ?
ORDER BY p.plan_date ASC
  `,
};

// sqList.js로 넘김
module.exports = qry;
