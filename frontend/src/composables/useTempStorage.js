/**
 * review 공통 임시저장 composable
 * 상담내역(j0_10), 지원계획(j0_20), 지원결과(j0_30), 지원신청 등에서 재사용
 *
 * @param {import('vue').Ref<string>|() => string} supCodeRef - 지원번호 (ref 또는 getter)
 * @param {string} categoryName - j0_10 | j0_20 | j0_30
 * @param {{ getPayload: () => { save_title: string, save_content: string },
 *           setPayload: (item: { save_title?: string, save_content?: string }) => void,
 *           validate?: (payload: { save_title: string, save_content: string }) => { valid: boolean, message?: string },
 *           onAlert?: (type: string, title: string, message: string) => void }} options
 */
import { ref } from "vue";

export function useTempStorage(supCodeRef, categoryName, options = {}) {
  const { getPayload, setPayload, validate, onAlert } = options;

  /** onAlert 콜백이 없으면 브라우저 alert 사용 (하위 호환) */
  const notify = (type, message) => {
    if (typeof onAlert === "function") {
      onAlert(type, "알림", message);
    } else {
      // eslint-disable-next-line no-alert
      window.alert(message);
    }
  };

  const getSupCode =
    typeof supCodeRef === "function"
      ? supCodeRef
      : () => supCodeRef?.value ?? "";

  const showModal = ref(false);
  const tempList = ref([]);
  const tempListLoading = ref(false);
  const tempSaveLoading = ref(false);
  /** 불러온 임시저장 항목의 tmp_code (등록 완료 후 삭제에 사용) */
  const selectedTmpCode = ref(null);

  /** 임시저장: 현재 폼 내용을 temp_storage에 저장. 빈값이면 validate에서 알림 */
  async function saveTemp() {
    const supCode = getSupCode();
    if (!supCode?.trim()) {
      notify("error", "지원번호가 없습니다.");
      return;
    }
    const payload = getPayload();
    if (!payload || typeof payload !== "object") {
      notify("error", "저장할 내용을 불러올 수 없습니다.");
      return;
    }
    const { save_title = "", save_content = "" } = payload;
    if (typeof validate === "function") {
      const result = validate({ save_title, save_content });
      if (!result.valid) {
        notify("error", result.message || "필수 항목을 입력해주세요.");
        return;
      }
    } else {
      if (!String(save_title ?? "").trim()) {
        notify("error", "제목을 입력해주세요.");
        return;
      }
    }
    tempSaveLoading.value = true;
    try {
      const existingCode = selectedTmpCode.value;
      let fetchRes;

      if (existingCode) {
        // 불러온 항목이 있으면 해당 tmp_code로 갱신(PUT)
        fetchRes = await fetch(`/api/tmp/${encodeURIComponent(existingCode)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            save_title: String(save_title ?? "").trim(),
            save_content: String(save_content ?? ""),
          }),
        });
      } else {
        // 신규 임시저장(POST)
        fetchRes = await fetch(
          `/api/tmp/support/${encodeURIComponent(supCode)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category_name: categoryName,
              save_title: String(save_title ?? "").trim(),
              save_content: String(save_content ?? ""),
            }),
          },
        );
      }

      if (!fetchRes.ok) {
        const err = await fetchRes.json().catch(() => ({}));
        throw new Error(err.message || "임시저장에 실패했습니다.");
      }
      notify("success", "임시저장되었습니다.");
    } catch (e) {
      notify("error", e.message || "임시저장에 실패했습니다.");
    } finally {
      tempSaveLoading.value = false;
    }
  }

  /** 임시저장 목록 조회 (m_no = support.mgr_no 기준) */
  async function loadTempList() {
    const supCode = getSupCode();
    if (!supCode?.trim()) {
      notify("error", "지원번호가 없습니다.");
      return;
    }
    tempListLoading.value = true;
    tempList.value = [];
    try {
      const res = await fetch(
        `/api/tmp/support/${encodeURIComponent(supCode)}?category_name=${encodeURIComponent(categoryName)}`,
      );
      if (!res.ok) throw new Error("목록 조회 실패");
      const data = await res.json();
      tempList.value = Array.isArray(data) ? data : [];
    } catch (e) {
      notify("error", e.message || "임시저장 목록을 불러오지 못했습니다.");
      tempList.value = [];
    } finally {
      tempListLoading.value = false;
    }
  }

  /** 불러오기 모달 열기 (목록 로드 후 표시) */
  async function openLoadModal() {
    await loadTempList();
    showModal.value = true;
  }

  function closeModal() {
    showModal.value = false;
  }

  /** 목록에서 한 건 선택 시 폼에 반영 후 모달 닫기 (tmp_code 기억) */
  function applyItem(item) {
    if (item && setPayload) setPayload(item);
    selectedTmpCode.value = item?.tmp_code ?? null;
    closeModal();
  }

  /** 기억해 둔 tmp_code로 임시저장 1건 삭제 (등록 완료 후 호출) */
  async function deleteSelectedTemp() {
    const code = selectedTmpCode.value;
    if (!code) return;
    try {
      await fetch(`/api/tmp/${encodeURIComponent(code)}`, { method: "DELETE" });
    } catch (e) {
      console.warn("[useTempStorage] 임시저장 삭제 실패:", e);
    } finally {
      selectedTmpCode.value = null;
    }
  }

  return {
    showModal,
    tempList,
    tempListLoading,
    tempSaveLoading,
    selectedTmpCode,
    saveTemp,
    loadTempList,
    openLoadModal,
    closeModal,
    applyItem,
    deleteSelectedTemp,
  };
}
