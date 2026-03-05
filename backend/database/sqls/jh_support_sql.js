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

  // 지원신청(sup_code)에 대한 계획 조회: 체인에서 "리프"만 (다른 행이 prev_plan_code로 참조하지 않는 행)
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
      p.plan_updday plan_updday,
      p.prev_plan_code prev_plan_code
    FROM support_plan p 
    WHERE p.sup_code = ?
      AND NOT EXISTS (SELECT 1 FROM support_plan p2 WHERE p2.prev_plan_code = p.plan_code)
    ORDER BY p.plan_date ASC
  `,
  // 계획 추가. prev_plan_code 있으면 보완 재신청(INSERT). plan_code는 트리거 자동 부여
  supportPlanInsert: `
    INSERT INTO support_plan (prev_plan_code, sup_code, dsbl_no, plan_goal, start_time, end_time, plan_content, plan_date, plan_tf, plan_cmt)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'e0_00', ?)
  `,
  // 방금 추가된 계획의 plan_code 조회 (sup_code 기준 최신)
  supportPlanMaxPlanCode: `
    SELECT plan_code FROM support_plan WHERE sup_code = ? ORDER BY plan_code DESC LIMIT 1
  `,
  // 계획 보완이력: sup_code 기준 (전체, 레거시)
  supportPlanSuppleHistory: `
    SELECT plan_code, plan_goal, plan_content, start_time, end_time, plan_cmt
    FROM support_plan
    WHERE sup_code = ? AND plan_tf = 'e0_80'
    ORDER BY plan_code ASC
  `,
  // 계획 보완이력 — 해당 plan_code 체인(자신+prev_plan_code 선조) 중 plan_tf = 'e0_80' 만
  supportPlanSuppleHistoryByPlanCode: `
    WITH RECURSIVE chain AS (
      SELECT plan_code, prev_plan_code FROM support_plan WHERE plan_code = ?
      UNION ALL
      SELECT p.plan_code, p.prev_plan_code
      FROM support_plan p
      INNER JOIN chain c ON p.plan_code = c.prev_plan_code
    )
    SELECT p.plan_code, p.plan_goal, p.plan_content, p.start_time, p.end_time, p.plan_cmt
    FROM support_plan p
    WHERE p.plan_tf = 'e0_80' AND p.plan_code IN (SELECT plan_code FROM chain)
    ORDER BY p.plan_code ASC
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
  // 결과 조회: plan_code 기준 "리프"만 (다른 행이 prev_result_code로 참조하지 않는 행)
  supportResultByPlanCode: `
  SELECT r.result_code    result_code,
         r.result_title   result_title,
         r.result_content result_content,
         r.result_date    result_date,
         r.result_tf      result_tf,
         r.result_cmt     result_cmt,
         r.result_updday  result_updday,
         r.prev_result_code prev_result_code
  FROM support_result r
  JOIN support_plan p USING (plan_code)
  WHERE r.plan_code = ?
    AND NOT EXISTS (SELECT 1 FROM support_result r2 WHERE r2.prev_result_code = r.result_code)
  ORDER BY r.result_date ASC
  `,
  // 결과 추가. prev_result_code 있으면 보완 재신청(INSERT)
  supportResultInsert: `
    INSERT INTO support_result (prev_result_code, plan_code, result_title, result_content, result_tf)
    VALUES (?, ?, ?, ?, 'e0_00')
  `,
  // 방금 추가된 결과의 result_code 조회 (plan_code 기준 최신)
  supportResultMaxResultCode: `
    SELECT result_code FROM support_result WHERE plan_code = ? ORDER BY result_code DESC LIMIT 1
  `,
  // 결과 보완이력: plan_code 기준 (전체, 레거시)
  supportResultSuppleHistory: `
    SELECT result_code, result_title, result_content, result_cmt
    FROM support_result
    WHERE plan_code = ? AND result_tf = 'e0_80'
    ORDER BY result_code ASC
  `,
  // 결과 보완이력 — 해당 result_code 체인(자신+prev_result_code 선조) 중 result_tf = 'e0_80' 만
  supportResultSuppleHistoryByResultCode: `
    WITH RECURSIVE chain AS (
      SELECT result_code, prev_result_code FROM support_result WHERE result_code = ?
      UNION ALL
      SELECT r.result_code, r.prev_result_code
      FROM support_result r
      INNER JOIN chain c ON r.result_code = c.prev_result_code
    )
    SELECT r.result_code, r.result_title, r.result_content, r.result_cmt
    FROM support_result r
    WHERE r.result_tf = 'e0_80' AND r.result_code IN (SELECT result_code FROM chain)
    ORDER BY r.result_code ASC
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
