/**
 * 지원(support) 관련 SQL 모음 (jh_support_sql.js)
 * ----------------------------------------
 * - supportInfo: 지원 1건의 기본 정보(대상자명, 담당자, 우선순위 등). rank 승인(e0_10)된 건만.
 * - supportPlanBySupCode: 한 지원의 계획 목록(plan_goal, plan_content, start_time, end_time, plan_tf 등). 첨부는 별도 file API.
 * - supportPlanInsert: 계획 추가. plan_code는 DB 트리거 자동 부여. plan_tf 기본 'e0_00'(검토대기).
 * - supportPlanUpdate: 계획 수정(제목·내용·시작일·종료일). 보완(e0_80)이면 검토대기(e0_00)로 변경.
 * - supportPlanEnd: 계획 즉시 종료. end_time = NOW().
 * - supportPlanDecide: 승인(e0_10)/보완(e0_80)/반려(e0_99). 반려 시 end_time = NOW().
 * - supportResultPlanInfo: 결과 페이지 헤더용 계획 1건 정보(기간, 담당기관, 첨부 등).
 * - supportResultByPlanCode: 한 계획에 대한 결과 목록. 결과별 첨부는 별도 file API.
 * - supportResultInsert / supportResultUpdate / supportResultDecide: 결과 추가·수정·승인/보완/반려.
 */
const qry = {
  /** 지원 1건의 기본 정보. rank 승인(s_rank_res='e0_10')된 요청 기준 우선순위·대상자·담당자 등 */
  supportInfo: `
    SELECT
      d.mc_pn       dsbl_no,
      d.mc_nm       target_name,
      d.mc_type     disability_type,
      s.sup_day     write_date,
      m_mem.m_nm    member_name,
      m_mgr.m_nm    manager_name,
      m_mgr.m_no    mgr_no,
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

  // 지원신청(sup_code)에 대한 계획 조회 (첨부파일은 별도 조회)
  supportPlanBySupCode: `
    SELECT 
      p.plan_code plan_code, 
      p.sup_code sup_code, 
      p.plan_goal plan_goal,
      p.plan_content plan_content,
      p.start_time start_time,
      p.end_time end_time,
      p.plan_date plan_date,
      p.plan_tf plan_tf,
      p.plan_cmt plan_cmt,
      p.plan_updday plan_updday
    FROM support_plan p 
    WHERE p.sup_code = ?
    ORDER BY p.plan_date ASC
  `,
  // 계획 추가. plan_code는 트리거 자동 부여
  supportPlanInsert: `
    INSERT INTO support_plan (sup_code, dsbl_no, plan_goal, start_time, end_time, plan_content, plan_date, plan_tf, plan_cmt)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), 'e0_00', ?)
  `,
  // 계획 수정 (제목, 내용, 시작일, 종료일). 보완(e0_80) 상태면 수정 시 검토대기(e0_00)로 변경
  supportPlanUpdate: `
    UPDATE support_plan
    SET plan_goal = ?,
        plan_content = ?,
        start_time = ?,
        end_time = ?,
        plan_tf = IF(plan_tf = 'e0_80', 'e0_00', plan_tf)
    WHERE plan_code = ?
  `,
  // 계획 즉시 종료 (end_time을 NOW()로 갱신)
  supportPlanEnd: `
    UPDATE support_plan SET end_time = NOW() WHERE plan_code = ?
  `,
  // 계획 승인/보완/반려
  // - plan_tf: e0_10 승인, e0_80 보완, e0_99 반려
  // - plan_cmt에 사유
  // - plan_updday 강제 유지
  // - 반려(e0_99) 시 종료일 end_time을 NOW()로 갱신
  supportPlanDecide: `
    UPDATE support_plan
    SET plan_tf = ?, plan_cmt = ?, plan_updday = plan_updday,
        end_time = IF(? = 'e0_99', NOW(), end_time)
    WHERE plan_code = ?
  `,

  // 지원 계획 결과 조회 (결과조회 클릭 시 해당 계획 1건, plan_code만 사용)
  // - plan_date: 계획 작성일자
  // - start_time / end_time: 지원계획 기간
  // - origin_file_name 등: 계획에 첨부된 파일 정보 (있을 경우)
  supportResultPlanInfo: `
    SELECT
      p.plan_code        plan_code,
      p.plan_date        plan_date,
      p.start_time       start_time,
      p.end_time         end_time,
      p.plan_content     plan_content,
      manager.m_nm       manager_name,
      org.organ_name     organ_name,
      p.plan_goal        plan_goal,
      f.file_code        file_code,
      f.origin_file_name origin_file_name,
      f.server_file_name server_file_name,
      f.file_path        file_path,
      f.file_ext         file_ext
    FROM \`support\` s
    JOIN \`member\` manager ON s.mgr_no = manager.m_no
    JOIN support_plan p ON p.sup_code = s.sup_code
    JOIN organ org ON org.organ_no = manager.m_org
    LEFT JOIN file f ON p.plan_code = f.file_category
    WHERE p.plan_code = ?
      AND p.plan_tf = 'e0_10'
    ORDER BY p.plan_date ASC
  `,
  // 결과 조회: plan_code로 해당 결과 조회 (첨부파일은 별도 조회)
  supportResultByPlanCode: `
  SELECT r.result_code    result_code,
         r.result_title   result_title,
         r.result_content result_content,
         r.result_date    result_date,
         r.result_tf      result_tf,
         r.result_cmt     result_cmt,
         r.result_updday  result_updday
  FROM support_result r
  JOIN support_plan p USING (plan_code)
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
