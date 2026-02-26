// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능과 연관된 쿼리문인지 알기 쉽게 영문으로 적어주는 걸 권장
// 백틱 사용
// 하나의 변수를 선언해서 안에 객체로 집어넣는 형식,
// 객체 안에 변수명 : 쿼리문 형식으로 선언해두기
// 예시 변수명은 자유롭게 수정하면 됨
// export하고 sqList.js에서 require부분에 해당 폴더 경로를 추가해주기

const qry = {
  // 지원신청의 지원자 정보 조회 (Info 영역 = support/rank 공통 구조, 우선순위 승인된 건만)
  supportInfo: `
    SELECT
      d.mc_pn       dsbl_no,
      d.mc_nm       target_name,
      d.mc_type     disability_type,
      s.sup_day     write_date,
      m_mem.m_nm    member_name,
      m_mgr.m_nm    manager_name,
      sc.s_name     priority
    FROM support s
    JOIN dsbl_prs d     ON s.mc_pn  = d.mc_pn
    JOIN member m_mem   ON s.mem_no = m_mem.m_no
    JOIN member m_mgr   ON s.mgr_no = m_mgr.m_no
    LEFT JOIN \`rank\` r    ON s.sup_code = r.sup_code
                      AND r.req_code = (SELECT MAX(req_code) FROM \`rank\` WHERE sup_code = s.sup_code)
    LEFT JOIN sub_code sc ON r.s_rank_code = sc.s_code
    WHERE s.sup_code = ?
    AND r.s_rank_res = 'e0_10'`,

  // 지원신청(sup_code)에 대한 계획 조회
  supportPlanBySupCode: `
    SELECT 
      p.plan_code plan_code, 
      p.sup_code sup_code, 
      p.plan_goal plan_goal,
      p.plan_content plan_content,
      p.plan_date plan_date,
      p.plan_tf plan_tf,
      p.plan_cmt plan_cmt,
      p.plan_updday plan_updday,
      f.file_code file_code, 
      f.origin_file_name origin_file_name,
      f.server_file_name server_file_name, 
      f.file_path file_path,
      f.file_ext file_ext
    FROM support_plan p 
    LEFT JOIN file f ON p.plan_code = f.file_category
    WHERE p.sup_code = ?
    ORDER BY p.plan_date ASC
  `,
  // 지원계획 임시저장(등록용). tar_category = 당일 support_plan PK 규칙(PLAN+yyyymmdd+일련번호), 당일 글이 없으면 1번
  supportPlanTempInsert: `
    INSERT INTO temp_storage (tar_category, category_name, m_no, save_title, save_content)
    SELECT
      CONCAT('PLAN', DATE_FORMAT(NOW(), '%Y%m%d'), LPAD(IFNULL(t.seq, 0) + 1, 4, '0')),
      'j0_20',
      s.mgr_no,
      ?,
      ?
    FROM support s
    LEFT JOIN (
      SELECT MAX(CAST(SUBSTRING(plan_code, 13) AS UNSIGNED)) AS seq
      FROM support_plan
      WHERE plan_code LIKE CONCAT('PLAN', DATE_FORMAT(NOW(), '%Y%m%d'), '%')
    ) t ON 1=1
    WHERE s.sup_code = ?
  `,
  // 계획 추가 (dsbl_no는 Header supportInfo에서 조회한 값 사용)
  supportPlanInsert: `
    INSERT INTO support_plan (sup_code, dsbl_no, plan_goal, start_time, end_time, plan_content, plan_date, plan_tf, plan_cmt)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), 'e0_00', ?)
  `,
  // 계획 수정 (제목, 내용만). 보완(e0_80) 상태면 수정 시 검토대기(e0_00)로 변경해 재검토 버튼 노출
  supportPlanUpdate: `
    UPDATE support_plan
    SET plan_goal = ?,
        plan_content = ?,
        plan_tf = IF(plan_tf = 'e0_80', 'e0_00', plan_tf)
    WHERE plan_code = ?
  `,
  // 계획 승인/보완/반려 (plan_tf: e0_10 승인, e0_80 보완, e0_99 반려, plan_cmt에 사유, plan_updday 강제 유지)
  supportPlanDecide: `
    UPDATE support_plan SET plan_tf = ?, plan_cmt = ?, plan_updday = plan_updday WHERE plan_code = ?
  `,

  // 지원 계획 결과 조회 (결과조회 클릭 시 해당 계획 1건, plan_code만 사용)
  supportResultPlanInfo: `
    SELECT p.plan_code plan_code,
          p.plan_date plan_date,
          manager.m_nm manager_name,
          org.organ_name organ_name,
          p.plan_goal plan_goal
    FROM \`support\` s
    JOIN \`member\` manager ON s.mgr_no = manager.m_no
    JOIN support_plan p ON p.sup_code = s.sup_code
    JOIN organ org ON org.organ_no = manager.m_org
    WHERE p.plan_code = ?
      AND p.plan_tf = 'e0_10'
    ORDER BY p.plan_date ASC
  `,
  // 결과 조회: plan_code로 해당 결과 조회
  supportResultByPlanCode: `
  SELECT r.result_code result_code,
         r.result_title result_title,
         r.result_content result_content,
         r.result_date result_date,
         r.result_tf result_tf,
         r.result_cmt result_cmt,
         r.result_updday result_updday,
         f.file_code file_code, 
         f.origin_file_name origin_file_name,
         f.server_file_name server_file_name, 
         f.file_path file_path,
         f.file_ext file_ext
  FROM support_result r
  JOIN support_plan p USING (plan_code)
  LEFT JOIN file f ON r.result_code = f.file_category
  WHERE r.plan_code = ?
  ORDER BY r.result_date ASC
  `,
  // 결과 추가
  supportResultInsert: `
    INSERT INTO support_result (plan_code, result_title, result_content, result_tf)
    VALUES (?, ?, ?, 'e0_00')
  `,
  // 결과 수정 (제목, 내용만). 보완(e0_80) 상태면 수정 시 검토대기(e0_00)로 변경해 재검토 버튼 노출
  supportResultUpdate: `
    UPDATE support_result
    SET result_title = ?,
        result_content = ?,
        result_tf = IF(result_tf = 'e0_80', 'e0_00', result_tf)
    WHERE result_code = ?
  `,
  // 결과 승인/보완/반려 (result_tf: e0_10 승인, e0_80 보완, e0_99 반려, result_cmt에 사유, result_updday 강제 유지)
  supportResultDecide: `
    UPDATE support_result SET result_tf = ?, result_cmt = ?, result_updday = result_updday WHERE result_code = ?
  `,
};

// sqList.js로 넘김
module.exports = qry;
