/**
 * review 공통 수정이력 composable
 * 지원신청서(j0_00), 상담내역(j0_10), 지원계획(j0_20), 지원결과(j0_30) 등에서 재사용
 *
 * @param {import('vue').Ref<string>|() => string} supCodeRef - 지원번호 (ref 또는 getter)
 * @param {string} categoryName - j0_00 지원신청서 | j0_10 상담 | j0_20 지원계획 | j0_30 지원결과
 */
import { ref } from "vue";

export function useUpdHistory(supCodeRef, categoryName) {
  const getSupCode = typeof supCodeRef === "function" ? supCodeRef : () => supCodeRef?.value ?? "";

  const showModal = ref(false);
  const historyList = ref([]);
  const historyLoading = ref(false);

  /** 수정이력 목록 조회 (upd_history + member m_nm, m_auth) */
  async function loadHistory() {
    const supCode = getSupCode();
    if (!supCode?.trim()) {
      return;
    }
    historyLoading.value = true;
    historyList.value = [];
    try {
      const res = await fetch(
        `/api/apply/support/${encodeURIComponent(supCode)}/upd-history?category_name=${encodeURIComponent(categoryName)}`,
      );
      if (!res.ok) throw new Error("수정이력 조회 실패");
      const data = await res.json();
      historyList.value = Array.isArray(data) ? data : [];
    } catch (e) {
      historyList.value = [];
    } finally {
      historyLoading.value = false;
    }
  }

  /** 수정이력 모달 열기 (목록 로드 후 표시) */
  async function openModal() {
    await loadHistory();
    showModal.value = true;
  }

  function closeModal() {
    showModal.value = false;
  }

  return {
    showModal,
    historyList,
    historyLoading,
    loadHistory,
    openModal,
    closeModal,
  };
}
