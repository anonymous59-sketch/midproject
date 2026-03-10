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

  // 승인요청: rank 테이블 INSERT. prev_req_code 있으면 재신청(보완 후)
  const requestApproval = async (
    sup_code,
    s_rank_code,
    mgr_no,
    apply_for,
    prev_req_code = null
  ) => {
    try {
      const res = await fetch(`/api/rank/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prev_req_code: prev_req_code ?? null,
          sup_code,
          s_rank_code,
          mgr_no: mgr_no ?? null,
          apply_for: apply_for ?? null,
        }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.error("승인요청: JSON이 아님.");
        return null;
      }
      const json = await res.json();
      return json;
    } catch (err) {
      console.error("승인요청 중 에러", err);
      return null;
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

  // 보완: s_rank_res e0_80, rank_cmt(보완 사유) 저장
  const suppleRank = async (req_code, rank_cmt) => {
    try {
      const res = await fetch(`/api/rank/supple`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ req_code, rank_cmt: rank_cmt ?? null }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) return null;
      return await res.json();
    } catch (err) {
      console.error("보완 처리 중 에러", err);
      return null;
    }
  };

  // 승인(e0_10) / 반려(e0_99): rank 판정 + support.rank_res 반영
  const decideRank = async (req_code, sup_code, decision) => {
    try {
      const res = await fetch(`/api/rank/decide`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ req_code, sup_code, decision }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) return null;
      return await res.json();
    } catch (err) {
      console.error("판정 처리 중 에러", err);
      return null;
    }
  };

  return { rankInfo, getRankInfo, requestApproval, rankUpdate, suppleRank, decideRank };
});
