// backend/services/psw_support_history_service.js
// 박상원 - 지원대상자별 전체 지원 이력(상담일지 / 지원계획 / 지원결과) 조회 서비스

const query = require("../database/mapper/mapper");

/**
 * 기준 sup_code 로 해당 지원대상자(mc_pn)를 찾고,
 * 같은 대상자의 모든 support 이력을 지원신청일자(sup_day) 역순으로 반환한다.
 *
 * 반환 구조:
 * {
 *   target: { mc_pn, mc_nm, ... },    // dsbl_prs 1건
 *   supports: [
 *     {
 *       sup_code,
 *       sup_day,
 *       mem_no,
 *       mem_name,
 *       mgr_no,
 *       mgr_name,
 *       priority_code,
 *       priority_name,
 *       counsels: [...],              // counsel 목록 (selectCounselBySupCode)
 *       plans: [...],                 // support_plan 목록 (supportPlanBySupCode)
 *       results: [                    // support_result 목록 (plan 코드별 결과)
 *         {
 *           plan_code,
 *           result_code,
 *           result_title,
 *           result_content,
 *           result_date,
 *           result_tf,
 *           result_cmt,
 *           result_updday,
 *         },
 *       ],
 *     },
 *   ],
 * }
 */
async function psw_getSupportHistoryBySupCode(supCode) {
  // 기준 sup_code 로 대상자 및 support 목록 조회
  const rows = await query("psw_supportHistoryBaseBySupCode", [supCode]);

  if (!rows || rows.length === 0) {
    return null;
  }

  const first = rows[0];

  const target = {
    mc_pn: first.mc_pn,
    mc_nm: first.mc_nm,
    mc_bd: first.mc_bd,
    mc_gender: first.mc_gender,
    mc_address: first.mc_address,
    mc_type: first.mc_type,
    gdn_no: first.gdn_no,
    mc_submitdate: first.mc_submitdate,
  };

  // sup_code 기준으로 그룹핑
  const bySupCode = new Map();
  for (const row of rows) {
    if (!bySupCode.has(row.sup_code)) {
      bySupCode.set(row.sup_code, {
        sup_code: row.sup_code,
        sup_day: row.sup_day,
        mem_no: row.mem_no,
        mem_name: row.mem_name,
        mgr_no: row.mgr_no,
        mgr_name: row.mgr_name,
        priority_code: row.s_rank_res,
        priority_name: row.rank_name,
      });
    }
  }

  const supports = [];

  // 각 support 별로 상담/계획/결과 조회 (필요 시 추후 성능 최적화 가능)
  for (const [, base] of bySupCode) {
    const { sup_code } = base;

    // 상담내역
    const counsels =
      (await query("selectCounselBySupCode", [sup_code])) ?? [];

    // 계획 목록
    const plans =
      (await query("supportPlanBySupCode", [sup_code])) ?? [];

    // 각 계획별 결과를 모아서 하나의 배열로 flatten
    const results = [];
    for (const plan of plans) {
      const planResults =
        (await query("supportResultByPlanCode", [plan.plan_code])) ?? [];
      for (const r of planResults) {
        results.push({
          plan_code: plan.plan_code,
          result_code: r.result_code,
          result_title: r.result_title,
          result_content: r.result_content,
          result_date: r.result_date,
          result_tf: r.result_tf,
          result_cmt: r.result_cmt,
          result_updday: r.result_updday,
        });
      }
    }

    supports.push({
      ...base,
      counsels,
      plans,
      results,
    });
  }

  // 신청일자 최신 순으로 정렬 (SQL 에서도 정렬하지만, Map 순서 안전하게 재정렬)
  supports.sort((a, b) => {
    if (!a.sup_day || !b.sup_day) return 0;
    return new Date(b.sup_day) - new Date(a.sup_day);
  });

  return { target, supports };
}

module.exports = {
  psw_getSupportHistoryBySupCode,
};

