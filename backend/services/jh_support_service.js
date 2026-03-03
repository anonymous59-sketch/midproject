/**
 * 지원(support) 관련 서비스 (jh_support_service.js)
 * ----------------------------------------
 * - getPlanBySupportCode: 한 지원의 계획 목록 조회.
 * - getSupportInfoBySupCode: 한 지원의 기본 정보(헤더용).
 * - insertPlan: 계획 추가. 종료일 미지정 시 시작일+1년을 end_time으로 설정. 반환: 새 plan_code.
 * - updatePlan: 계획 수정(제목·내용·시작일·종료일).
 * - endPlan: 계획 즉시 종료(end_time = NOW()).
 * - decidePlan: 계획 승인/보완/반려. 반려 시 end_time = NOW().
 * - 결과 관련: getResultPlanInfo, getResultByPlanCode, insertResult, updateResult, decideResult 등.
 */
const query = require("../database/mapper/mapper.js");

const svc = {
  /** 지원(sup_code)에 대한 계획 목록 조회. planData 소스 */
  getPlanBySupportCode: async (supportCode) => {
    const rows = await query("supportPlanBySupCode", [supportCode]).catch(
      (err) => {
        console.error(err);
        throw err;
      },
    );
    return rows ?? [];
  },

  // 지원신청(sup_code)에 대한 지원자 정보 조회 (Header용)
  getSupportInfoBySupCode: async (supportCode) => {
    const rows = await query("supportInfo", [supportCode]).catch((err) => {
      console.error(err);
      throw err;
    });
    return rows?.[0] ?? null;
  },

  /**
   * 계획 추가 (승인요청). plan_code는 DB 트리거 자동 부여.
   * 종료일(end_time) 미지정이면 시작일(start_time) + 1년을 end_time으로 설정.
   * @returns {Promise<string|null>} 새 plan_code
   */
  insertPlan: async (
    supportCode,
    { dsbl_no, plan_goal, plan_content, start_time, end_time },
  ) => {
    let end = end_time ?? null;
    const start = start_time ?? null;
    if (!end && start) {
      const d = new Date(start);
      if (!Number.isNaN(d.getTime())) {
        d.setFullYear(d.getFullYear() + 1);
        end = d.toISOString().slice(0, 10);
      }
    }
    await query("supportPlanInsert", [
      supportCode,
      dsbl_no ?? null,
      plan_goal ?? "",
      start,
      end,
      plan_content ?? "",
      null, // plan_cmt
    ]).catch((err) => {
      console.error(err);
      throw err;
    });
    // 방금 추가된 계획의 plan_code 조회 (sup_code 기준 최신 계획)
    const plans = await query("supportPlanBySupCode", [supportCode]).catch(
      (err) => {
        console.error(err);
        throw err;
      },
    );
    const last = Array.isArray(plans) ? plans[plans.length - 1] : null;
    return last?.plan_code ?? null;
  },
  /** 계획 수정. 제목·내용·시작일·종료일 전부 갱신. 보완(e0_80) 상태면 검토대기(e0_00)로 변경 */
  updatePlan: async (planCode, { plan_goal, plan_content, start_time, end_time }) => {
    await query("supportPlanUpdate", [
      plan_goal ?? "",
      plan_content ?? "",
      start_time ?? null,
      end_time ?? null,
      planCode,
    ]).catch((err) => {
      console.error(err);
      throw err;
    });
    return null;
  },
  /** 계획 즉시 종료. end_time을 NOW()로 갱신 (supportPlanEnd 쿼리) */
  endPlan: async (planCode) => {
    await query("supportPlanEnd", [planCode]).catch((err) => {
      console.error(err);
      throw err;
    });
    return null;
  },
  // 계획 승인/보완/반려 (반려 시 지원계획 종료일 end_time을 NOW()로 갱신)
  decidePlan: async (planCode, decision, plan_cmt) => {
    await query("supportPlanDecide", [
      decision,
      plan_cmt ?? null,
      decision,
      planCode,
    ]).catch((err) => {
      console.error(err);
      throw err;
    });
    return null;
  },

  // 결과 조회: plan_code로 해당 계획 1건 (organ_name, manager_name 등)
  getResultPlanInfoByPlanCode: async (planCode) => {
    const rows = await query("supportResultPlanInfo", [planCode]).catch(
      (err) => {
        console.error(err);
        throw err;
      },
    );
    return rows ?? [];
  },
  // 결과 조회: plan_code로 해당 결과 조회
  getResultByPlanCode: async (planCode) => {
    const rows = await query("supportResultByPlanCode", [planCode]).catch(
      (err) => {
        console.error(err);
        throw err;
      },
    );
    return rows ?? [];
  },
  // 결과 추가
  insertResult: async (planCode, result_title, result_content) => {
    await query("supportResultInsert", [
      planCode,
      result_title ?? "",
      result_content ?? "",
    ]).catch((err) => {
      console.error(err);
      throw err;
    });
    // 방금 추가된 결과의 result_code 조회 (plan_code 기준 최신 결과)
    const rows = await query("supportResultByPlanCode", [planCode]).catch(
      (err) => {
        console.error(err);
        throw err;
      },
    );
    const last = Array.isArray(rows) ? rows[rows.length - 1] : null;
    return last?.result_code ?? null;
  },
  // 결과 수정 (제목, 내용만)
  updateResult: async (resultCode, { result_title, result_content }) => {
    await query("supportResultUpdate", [
      result_title ?? "",
      result_content ?? "",
      resultCode,
    ]).catch((err) => {
      console.error(err);
      throw err;
    });
    return null;
  },
  // 결과 승인/보완/반려
  decideResult: async (resultCode, decision, result_cmt) => {
    await query("supportResultDecide", [
      decision,
      result_cmt ?? null,
      resultCode,
    ]).catch((err) => {
      console.error(err);
      throw err;
    });
    return null;
  },
};

module.exports = svc;
