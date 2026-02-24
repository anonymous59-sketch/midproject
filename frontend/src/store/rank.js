import { ref } from "vue";
import { defineStore } from "pinia";

export const useRankStore = defineStore("rank", () => {
  const rankInfo = ref(null);

  // 우선순위 헤더/정보 조회
  const getRankInfo = async (supCode) => {
    try {
      const res = await fetch(`/api/rank/${supCode}`);
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.error("우선순위 조회: JSON이 아님. 프록시·백엔드 확인.");
        rankInfo.value = null;
        return;
      }
      const json = await res.json();
      rankInfo.value = json?.data ?? null;
    } catch (err) {
      console.error("우선순위 조회 중 에러", err);
      rankInfo.value = null;
    }
  };

  // 우선순위 지정(수정)
  const rankUpdate = async (req_code, s_rank_code, rank_cmt) => {
    try {
      const res = await fetch(`/api/rank/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          req_code,
          s_rank_code: s_rank_code ?? null,
          rank_cmt: rank_cmt ?? null,
        }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.error("우선순위 업데이트: JSON이 아님.");
        return;
      }
      const json = await res.json();
      if (json?.retCode === "Success" && rankInfo.value) {
        rankInfo.value = { ...rankInfo.value, s_rank_code, rank_cmt };
      }
    } catch (err) {
      console.error("우선순위 업데이트 중 에러", err);
    }
  };

  return { rankInfo, getRankInfo, rankUpdate };
});
