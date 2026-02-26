// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능인지 알기 쉽게 영문으로 적어주는 걸 권장
// export하고 같은 경로의 svc.js에서 require부분에 해당 폴더 경로를 추가해주기

// service에서 필요에 따라 db에 접속 => mapper
const query = require("../database/mapper/mapper.js"); // mapper가져오기. mapper.js가 모든 서비스 모여있는 곳이라서 이 경로를 가져오면 됨

// 해당하는 기능을 svc라는 변수에 객체 형식으로 넣기
const svc = {
  // 지원신청(sup_code)에 대한 계획 조회
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

  // 계획 추가 (승인요청, dsbl_no 없으면 supportInfo에서 조회)
  insertPlan: async (
    supportCode,
    { dsbl_no, plan_goal, plan_content, start_time, end_time },
  ) => {
    await query("supportPlanInsert", [
      supportCode,
      dsbl_no ?? null,
      plan_goal ?? "",
      start_time ?? null,
      end_time ?? null,
      plan_content ?? "",
      null, // plan_cmt
    ]).catch((err) => {
      console.error(err);
      throw err;
    });
    return null;
  },
  // 계획 수정 (제목, 내용만)
  updatePlan: async (planCode, { plan_goal, plan_content }) => {
    await query("supportPlanUpdate", [
      plan_goal ?? "",
      plan_content ?? "",
      planCode,
    ]).catch((err) => {
      console.error(err);
      throw err;
    });
    return null;
  },
  // 계획 임시저장 (tar_category는 SQL에서 당일 plan_code 규칙으로 생성)
  insertPlanTemp: async (supportCode, { save_title, save_content }) => {
    await query("supportPlanTempInsert", [
      save_title ?? "",
      save_content ?? "",
      supportCode,
    ]).catch((err) => {
      console.error(err);
      throw err;
    });
    return null;
  },
  // 계획 승인/보완/반려
  decidePlan: async (planCode, decision, plan_cmt) => {
    await query("supportPlanDecide", [
      decision,
      plan_cmt ?? null,
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
    return null;
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
