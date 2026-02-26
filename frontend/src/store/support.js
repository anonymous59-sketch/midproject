import { ref } from "vue";
import { defineStore } from "pinia";

export const useSupportStore = defineStore("support", () => {
  // 지원계획 정보
  const planData = ref([]);
  // 지원자 정보
  const infoData = ref([]);
  // 지원결과 정보
  const resultData = ref([]);

  // 지원계획 조회
  const supportPlanDetail = async (supportCode) => {
    try {
      const res = await fetch(`/api/support/${supportCode}`);
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.error(
          "지원계획 조회 중 에러: JSON이 아님(HTML 등). 프록시·백엔드 확인.",
        );
        infoData.value = null;
        planData.value = [];
        return;
      }
      const supportPlanDetailInfo = await res.json();
      infoData.value = supportPlanDetailInfo?.infoData ?? null;
      planData.value = supportPlanDetailInfo?.data ?? [];
    } catch (err) {
      console.error("지원계획 조회 중 에러 발생", err);
      infoData.value = null;
      planData.value = [];
    }
  };
  // 지원계획 추가
  const insertPlan = async (supportCode, body) => {
    try {
      const res = await fetch(`/api/support/${supportCode}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      return data;
    } catch (err) {
      console.error("계획 추가 중 에러", err);
      return null;
    }
  };
  // 지원계획 임시저장
  const tempSavePlan = async (supportCode, { save_title, save_content }) => {
    try {
      const res = await fetch(`/api/support/${supportCode}/plan/temp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          save_title: save_title ?? "",
          save_content: save_content ?? "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      return data;
    } catch (err) {
      console.error("계획 임시저장 중 에러", err);
      return null;
    }
  };
  // 지원계획 수정
  const updatePlan = async (planCode, body) => {
    try {
      const res = await fetch(`/api/support/plan/${planCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      return data;
    } catch (err) {
      console.error("계획 수정 중 에러", err);
      return null;
    }
  };
  // 지원계획 승인/보완/반려
  const decidePlan = async (planCode, decision, planCmt) => {
    try {
      const res = await fetch(`/api/support/plan/${planCode}/decide`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, plan_cmt: planCmt }),
      });
      const data = await res.json().catch(() => ({}));
      return data;
    } catch (err) {
      console.error("계획 승인/보완/반려 처리 중 에러", err);
      return null;
    }
  };

  // 지원결과 조회 (planCode 있으면 해당 계획 1건만 조회)
  const supportResultDetail = async (supportCode, planCode) => {
    try {
      const url = planCode
        ? `/api/support/${supportCode}/result?planCode=${encodeURIComponent(planCode)}`
        : `/api/support/${supportCode}/result`;
      const res = await fetch(url);
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.error(
          "지원결과 조회 중 에러: JSON이 아님 (HTML 등). 프록시. 백엔드 확인.",
        );
        infoData.value = null;
        planData.value = [];
        resultData.value = [];
        return;
      }
      const supportResultDetailInfo = await res.json();
      infoData.value = supportResultDetailInfo?.infoData ?? null;
      planData.value = supportResultDetailInfo?.planData ?? [];
      resultData.value = supportResultDetailInfo?.resultData ?? [];
    } catch (err) {
      console.error("지원결과 조회 중 에러 발생", err);
      infoData.value = null;
      planData.value = [];
      resultData.value = [];
    }
  };

  // 지원결과 추가 (plan_code, result_title, result_content)
  const insertResult = async (
    supportCode,
    planCode,
    resultTitle,
    resultContent,
  ) => {
    try {
      const res = await fetch(`/api/support/${supportCode}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_code: planCode,
          result_title: resultTitle ?? "",
          result_content: resultContent ?? "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      return data;
    } catch (err) {
      console.error("지원결과 추가 중 에러", err);
      return null;
    }
  };
  // 지원결과 수정
  const updateResult = async (resultCode, body) => {
    try {
      const res = await fetch(`/api/support/result/${resultCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      return data;
    } catch (err) {
      console.error("결과 수정 중 에러", err);
      return null;
    }
  };
  // 지원결과 승인/보완/반려
  const decideResult = async (resultCode, decision, resultCmt) => {
    try {
      const res = await fetch(`/api/support/result/${resultCode}/decide`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, result_cmt: resultCmt }),
      });
      const data = await res.json().catch(() => ({}));
      return data;
    } catch (err) {
      console.error("결과 승인/보완/반려 처리 중 에러", err);
      return null;
    }
  };

  return {
    planData,
    infoData,
    resultData,
    supportPlanDetail,
    insertPlan,
    tempSavePlan,
    updatePlan,
    decidePlan,
    supportResultDetail,
    insertResult,
    updateResult,
    decideResult,
  };
});
