import { ref } from "vue";
import { defineStore } from "pinia";

export const useSupportStore = defineStore("support", () => {
  const detail = ref([]);
  const infoData = ref([]);
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
        detail.value = [];
        return;
      }
      const supportPlanDetailInfo = await res.json();
      infoData.value = supportPlanDetailInfo?.infoData ?? null;
      detail.value = supportPlanDetailInfo?.data ?? [];
    } catch (err) {
      console.error("지원계획 조회 중 에러 발생", err);
      infoData.value = null;
      detail.value = [];
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
  // 지원결과 조회
  const supportResultDetail = async (supportCode) => {
    try {
      const res = await fetch(`/api/suuport/${supportCode}/result`);
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.error(
          "지원결과 조회 중 에러: JSON이 아님 (HTML 등). 프록시. 백엔드 확인.",
        );
        infoData.value = null;
        detail.value = [];
        return;
      }
      const supportResultDetailInfo = await res.json();
      infoData.value = supportResultDetailInfo?.infoData ?? null;
      detail.value = supportResultDetailInfo?.data ?? [];
    } catch (err) {
      console.error("지원결과 조회 중 에러 발생", err);
      infoData.value = null;
      detail.value = [];
    }
  };
  return {
    detail,
    infoData,
    supportPlanDetail,
    insertPlan,
    updatePlan,
    decidePlan,
    supportResultDetail,
  };
});
