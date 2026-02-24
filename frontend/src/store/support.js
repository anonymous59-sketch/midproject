import { ref } from "vue";
import { defineStore } from "pinia";

export const useSupportStore = defineStore("support", () => {
  const detail = ref([]);
  const infoData = ref([]);
  const supportPlanDetail = async (supportCode) => {
    try {
      const res = await fetch(`/api/support/${supportCode}`);
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.error("지원계획 조회 중 에러: JSON이 아님(HTML 등). 프록시·백엔드 확인.");
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
  return { detail, infoData, supportPlanDetail };
});
