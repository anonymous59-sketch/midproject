/**
 * useHistory.js
 * 수정이력(upd_history) 공통 composable
 * - 모달 열기/닫기 + 이력 조회 (support 기준 또는 upd_target(PK) 기준)
 * - 이력 INSERT (수정 성공 후 fire-and-forget)
 *
 * content / upd_content 포맷: JSON.stringify([{ field: "필드명", value: "값" }, ...])
 */
import { ref } from "vue";

export function useHistory() {
  const historyModal = ref({
    show: false,
    title: "",
    list: [],
    loading: false,
  });

  /** 수정이력 모달 열기 — his_category(sup_code) 기준 (j0_00, j0_10 등) */
  async function openHistoryModal(supCode, categoryName, title) {
    historyModal.value = { show: true, title: title ?? "수정이력", list: [], loading: true };
    if (!supCode?.trim()) {
      historyModal.value.loading = false;
      return;
    }
    try {
      const res = await fetch(
        `/api/history/support/${encodeURIComponent(supCode)}?category_name=${encodeURIComponent(categoryName)}`,
      );
      if (!res.ok) throw new Error("수정이력 조회 실패");
      const data = await res.json();
      historyModal.value.list = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("[useHistory] 수정이력 조회 실패:", e);
      historyModal.value.list = [];
    } finally {
      historyModal.value.loading = false;
    }
  }

  /**
   * 수정이력 모달 열기 — upd_target(PK) 기준. plan_code(j0_20) / result_code(j0_30) 해당 건만 조회.
   * 이력이 없으면 show = false 로 두어, 호출부에서 alert 띄우기용.
   */
  async function openHistoryModalByTarget(targetPk, categoryName, title) {
    historyModal.value = { show: false, title: title ?? "수정이력", list: [], loading: true };
    if (!targetPk?.trim()) {
      historyModal.value.loading = false;
      return;
    }
    try {
      const res = await fetch(
        `/api/history/target/${encodeURIComponent(targetPk)}?category_name=${encodeURIComponent(categoryName)}`,
      );
      if (!res.ok) throw new Error("수정이력 조회 실패");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      historyModal.value.list = list;
      historyModal.value.show = list.length > 0;
    } catch (e) {
      console.error("[useHistory] 수정이력 조회 실패:", e);
      historyModal.value.list = [];
      historyModal.value.show = false;
    } finally {
      historyModal.value.loading = false;
    }
  }

  function closeHistoryModal() {
    historyModal.value.show = false;
  }

  /**
   * 수정이력 INSERT (fire-and-forget; 실패해도 사용자 흐름에 영향 없음)
   * - 지원계획(j0_20): his_category = plan_code
   * - 지원결과(j0_30): his_category = result_code
   * @param {string} supCode - 지원코드 (URL 경로용)
   * @param {string} categoryName - j0_10 | j0_20 | j0_30
   * @param {object} opts - updTarget(plan_code|result_code), updMember, beforeFields, afterFields
   */
  async function insertHistory(supCode, categoryName, { updTarget, updMember, beforeFields, afterFields }) {
    if (!supCode?.trim()) return;
    const isPlanOrResult = categoryName === "j0_20" || categoryName === "j0_30";
    const isCounsel = categoryName === "j0_10";
    const hisCategory = isPlanOrResult && updTarget ? updTarget : isCounsel && updTarget ? updTarget : supCode;
    const res = await fetch(`/api/history/support/${encodeURIComponent(supCode)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_name: categoryName,
        his_category: hisCategory,
        upd_member: updMember ?? "",
        upd_target: updTarget ?? "",
        content: JSON.stringify(Array.isArray(beforeFields) ? beforeFields : []),
        upd_content: JSON.stringify(Array.isArray(afterFields) ? afterFields : []),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "수정이력 저장 실패");
    }
  }

  return {
    historyModal,
    openHistoryModal,
    openHistoryModalByTarget,
    closeHistoryModal,
    insertHistory,
  };
}
