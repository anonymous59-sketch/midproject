<script setup>
import { watch, onBeforeUnmount } from "vue";

/**
 * 단순 알림용 모달 (브라우저 alert 대체)
 * - type: 'success' → ✅ 초록 체크 (승인요청 완료, 작성 취소 완료, 승인 완료)
 * - type: 'error' | 'reject' → ❌ 빨간/핑크 X (반려 완료, 데이터 없음)
 * - type: 'supple' → 📝 보완용 아이콘 (보완 완료)
 * - 표시 후 3초 뒤 자동 닫힘
 */
const props = defineProps({
  show: { type: Boolean, default: false },
  type: {
    type: String,
    default: "success",
    validator: (v) => ["success", "error", "reject", "supple"].includes(v),
  },
  title: { type: String, default: "알림" },
  message: { type: String, default: "" },
});

const emit = defineEmits(["close"]);

let autoCloseTimer = null;

function onClose() {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
  emit("close");
}

watch(
  () => props.show,
  (visible) => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      autoCloseTimer = null;
    }
    if (visible) {
      autoCloseTimer = setTimeout(() => {
        autoCloseTimer = null;
        emit("close");
      }, 3000);
    }
  },
);

onBeforeUnmount(() => {
  if (autoCloseTimer) clearTimeout(autoCloseTimer);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="alert-modal">
      <div
        v-if="show"
        class="alert-modal-backdrop"
        @click.self="onClose"
      >
        <div class="alert-modal rounded">
          <div
            class="alert-modal-header rounded-top"
            :class="
              type === 'success' || type === 'supple'
                ? ''
                : 'alert-modal-header-dark'
            "
          >
            {{ title }}
          </div>
          <div class="alert-modal-body">
            <div
              class="alert-modal-icon-wrap"
              :class="{
                'alert-modal-icon-success': type === 'success',
                'alert-modal-icon-error': type === 'error' || type === 'reject',
                'alert-modal-icon-supple': type === 'supple',
              }"
            >
              <!-- success: 체크마크 ✅ -->
              <svg
                v-if="type === 'success'"
                class="alert-modal-icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <!-- error/reject: X ❌ -->
              <svg
                v-else-if="type === 'error' || type === 'reject'"
                class="alert-modal-icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <!-- supple: 문서/필기 📝 -->
              <svg
                v-else-if="type === 'supple'"
                class="alert-modal-icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <p class="alert-modal-message">{{ message }}</p>
            <div class="alert-modal-actions">
              <button
                type="button"
                class="btn alert-modal-btn-ok rounded"
                @click="onClose"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.alert-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
.alert-modal {
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
.alert-modal-header {
  background: #808080;
  color: #fff;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 1rem;
  text-align: center;
  border-radius: 0.375rem 0.375rem 0 0;
  flex-shrink: 0;
}
.alert-modal-header-dark {
  background: #495057;
  color: #f8f9fa;
}
.alert-modal-body {
  padding: 1.25rem 1rem;
  text-align: center;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.alert-modal-icon-wrap {
  width: 56px;
  height: 56px;
  margin: 0 auto 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
.alert-modal-icon-success {
  background: linear-gradient(180deg, #5cb85c 0%, #4caf50 100%);
  color: #fff;
}
.alert-modal-icon-error {
  background: linear-gradient(180deg, #f06292 0%, #e91e63 100%);
  color: #fff;
}
.alert-modal-icon-supple {
  background: linear-gradient(180deg, #ffb74d 0%, #ff9800 100%);
  color: #fff;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
.alert-modal-icon-svg {
  width: 28px;
  height: 28px;
}
.alert-modal-message {
  margin: 0 0 1.25rem;
  color: #212529;
  font-size: 0.95rem;
  line-height: 1.5;
}
.alert-modal-actions {
  display: flex;
  justify-content: center;
}
.alert-modal-btn-ok {
  background: #6c757d;
  border: 1px solid #5a6268;
  color: #fff;
  padding: 0.4rem 1.5rem;
  min-width: 80px;
}
.alert-modal-btn-ok:hover {
  background: #5a6268;
  border-color: #545b62;
  color: #fff;
}

.alert-modal-enter-active,
.alert-modal-leave-active {
  transition: opacity 0.2s ease;
}
.alert-modal-enter-active .alert-modal,
.alert-modal-leave-active .alert-modal {
  transition: transform 0.2s ease;
}
.alert-modal-enter-from,
.alert-modal-leave-to {
  opacity: 0;
}
.alert-modal-enter-from .alert-modal,
.alert-modal-leave-to .alert-modal {
  transform: scale(0.95);
}
</style>
