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
      const sup = encodeURIComponent(supportCode ?? "");
      const res = await fetch(`/api/support/${sup}`);
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.error(
          "지원계획 조회 중 에러: JSON이 아님(HTML 등). 프록시·백엔드 확인.",
        );
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("지원계획 조회 실패", err);
        return;
      }
      const supportPlanDetailInfo = await res.json().catch(() => ({}));
      infoData.value = supportPlanDetailInfo?.infoData ?? null;
      planData.value = supportPlanDetailInfo?.data ?? [];
    } catch (err) {
      console.error("지원계획 조회 중 에러 발생", err);
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

  // 지원계획 즉시 종료 (end_time = NOW())
  const endPlan = async (planCode) => {
    try {
      const res = await fetch(`/api/support/plan/${planCode}/end`, {
        method: "PUT",
      });
      const data = await res.json().catch(() => ({}));
      return data;
    } catch (err) {
      console.error("계획 종료 처리 중 에러", err);
      return null;
    }
  };

  // 특정 계획의 결과 목록만 조회 (store 갱신 없이 반환만, 결과조회 전 0건 여부 확인용)
  const fetchResultListForPlan = async (supportCode, planCode) => {
    try {
      const url = `/api/support/${supportCode}/result?planCode=${encodeURIComponent(planCode)}`;
      const res = await fetch(url);
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) return [];
      const data = await res.json().catch(() => ({}));
      return data?.resultData ?? [];
    } catch (err) {
      console.error("지원결과 조회(건수 확인) 중 에러", err);
      return [];
    }
  };

  // 지원결과 조회 (planCode 있으면 해당 계획 1건만 조회)
  const supportResultDetail = async (supportCode, planCode) => {
    try {
      const sup = encodeURIComponent(supportCode ?? "");
      const url = planCode
        ? `/api/support/${sup}/result?planCode=${encodeURIComponent(planCode)}`
        : `/api/support/${sup}/result`;
      const res = await fetch(url);
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.error(
          "지원결과 조회 중 에러: JSON이 아님 (HTML 등). 프록시. 백엔드 확인.",
        );
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("지원결과 조회 실패", err);
        return;
      }
      const supportResultDetailInfo = await res.json().catch(() => ({}));
      infoData.value = supportResultDetailInfo?.infoData ?? null;
      planData.value = supportResultDetailInfo?.planData ?? [];
      resultData.value = supportResultDetailInfo?.resultData ?? [];
    } catch (err) {
      console.error("지원결과 조회 중 에러 발생", err);
    }
  };

  // 지원결과 추가. prev_result_code 있으면 보완 재신청(INSERT)
  const insertResult = async (
    supportCode,
    planCode,
    resultTitle,
    resultContent,
    prevResultCode = null,
  ) => {
    try {
      const res = await fetch(`/api/support/${supportCode}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_code: planCode,
          result_title: resultTitle ?? "",
          result_content: resultContent ?? "",
          prev_result_code: prevResultCode ?? undefined,
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
    updatePlan,
    decidePlan,
    endPlan,
    fetchResultListForPlan,
    supportResultDetail,
    insertResult,
    updateResult,
    decideResult,
  };
});
