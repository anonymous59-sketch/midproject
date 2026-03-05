<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  show: { type: Boolean, default: false },
  /** 'reject' | 'supple' — 제목·플레이스홀더·버튼 문구/스타일 결정 */
  type: {
    type: String,
    default: "reject",
    validator: (v) => ["reject", "supple"].includes(v),
  },
  /** 제목 오버라이드 (예: '반려 사유', '보완 사유') */
  titleOverride: { type: String, default: "" },
  /** 기존 사유(plan_cmt 등) 읽기 전용 표시 */
  displayContent: { type: String, default: "" },
});

const emit = defineEmits(["close", "confirm"]);

const reasonText = ref("");

const typeConfig = computed(() => {
  const base =
    props.type === "supple"
      ? {
          title: "보완 사유",
          placeholder: "보완 사유는 반드시 입력해야 합니다.",
          buttonText: "보완",
          buttonClass: "btn-warning",
          requiredMessage: "보완 사유를 입력해 주세요.",
        }
      : {
          title: "반려 사유",
          placeholder: "반려 사유는 반드시 입력해야 합니다.",
          buttonText: "반려",
          buttonClass: "btn-danger",
          requiredMessage: "반려 사유를 입력해 주세요.",
        };
  return { ...base, title: props.titleOverride || base.title };
});

watch(
  () => props.show,
  (visible) => {
    if (!visible) reasonText.value = "";
  },
);

function close() {
  emit("close");
}

function submit() {
  const trimmed = (reasonText.value || "").trim();
  if (!trimmed) {
    alert(typeConfig.value.requiredMessage);
    return;
  }
  emit("confirm", trimmed);
  reasonText.value = "";
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <Transition name="reason-modal">
      <div v-if="show" class="reason-modal-backdrop" @click.self="close">
        <div class="reason-modal rounded">
          <div class="reason-modal-header rounded-top">
            {{ typeConfig.title }}
          </div>
          <div class="reason-modal-body">
            <template v-if="props.displayContent">
              <label class="reason-modal-label">{{ typeConfig.title }}</label>
              <textarea
                :value="props.displayContent"
                class="form-control reason-modal-textarea reason-modal-readonly mb-2"
                readonly
              />
            </template>
            <label class="reason-modal-label">사유</label>
            <textarea
              v-model="reasonText"
              class="form-control reason-modal-textarea"
              :placeholder="typeConfig.placeholder"
            />
          </div>
          <div class="reason-modal-footer">
            <button
              type="button"
              class="btn rounded"
              :class="typeConfig.buttonClass"
              @click="submit"
            >
              {{ typeConfig.buttonText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.reason-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
.reason-modal {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  width: min(90vw, 440px);
  min-height: 260px;
  max-height: min(80vh, 360px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.reason-modal-header {
  background: #808080;
  color: #fff;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}
.reason-modal-body {
  padding: 1rem 1rem 1.25rem;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.reason-modal-label {
  display: block;
  margin-bottom: 0.35rem;
  font-weight: 500;
  color: #212529;
  flex-shrink: 0;
}
.reason-modal-textarea {
  border: 1px solid #212529;
  width: 100%;
  height: 9rem;
  min-height: 9rem;
  max-height: 9rem;
  resize: none;
  flex-shrink: 0;
}
.reason-modal-readonly {
  background-color: var(--bs-gray-100, #f8f9fa);
  height: 5rem;
  min-height: 5rem;
  max-height: 5rem;
}
.reason-modal-footer {
  padding: 0 1rem 1rem;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}
.reason-modal-footer .btn {
  min-width: 5rem;
}

.reason-modal-enter-active,
.reason-modal-leave-active {
  transition: opacity 0.2s ease;
}
.reason-modal-enter-active .reason-modal,
.reason-modal-leave-active .reason-modal {
  transition: transform 0.2s ease;
}
.reason-modal-enter-from,
.reason-modal-leave-to {
  opacity: 0;
}
.reason-modal-enter-from .reason-modal,
.reason-modal-leave-to .reason-modal {
  transform: scale(0.95);
}
</style>
