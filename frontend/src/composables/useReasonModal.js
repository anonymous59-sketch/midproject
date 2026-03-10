import { ref } from "vue";

/**
 * 보완/반려 등 사유 입력용 모달 공통 로직
 *
 * 사용 예:
 * const { reasonModal, openReasonModal, closeReasonModal, onReasonConfirm } = useReasonModal();
 *
 * openReasonModal({
 *   context: { type: 'plan', decision: 'e0_80', planCode },
 *   title: '보완 사유',
 *   message: '보완 사유를 입력해 주세요.',
 *   reasonPlaceholder: '보완 사유를 입력해 주세요.',
 *   onConfirm: async ({ context, reason }) => { ... }
 * });
 */
export function useReasonModal() {
  const reasonModal = ref({
    show: false,
    title: "",
    message: "",
    showReason: true,
    reasonPlaceholder: "사유를 입력해 주세요.",
    reasonLabel: "사유",
    context: null,
  });

  const confirmHandler = ref(null);

  function openReasonModal({
    context,
    title,
    message,
    reasonPlaceholder = "사유를 입력해 주세요.",
    onConfirm,
  }) {
    reasonModal.value = {
      show: true,
      title,
      message,
      showReason: true,
      reasonPlaceholder,
      reasonLabel: "사유",
      context: context ? { ...context } : null,
    };
    confirmHandler.value = typeof onConfirm === "function" ? onConfirm : null;
  }

  function closeReasonModal() {
    reasonModal.value.show = false;
    reasonModal.value.context = null;
    confirmHandler.value = null;
  }

  async function onReasonConfirm(reason) {
    const handler = confirmHandler.value;
    const ctx = reasonModal.value.context;
    const trimmed = (reason || "").trim();
    closeReasonModal();
    if (handler) {
      await handler({ context: ctx, reason: trimmed });
    }
  }

  return {
    reasonModal,
    openReasonModal,
    closeReasonModal,
    onReasonConfirm,
  };
}

