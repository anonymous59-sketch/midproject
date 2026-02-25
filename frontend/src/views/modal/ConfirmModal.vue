<script setup>
defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: "승인 요청" },
  message: { type: String, default: "승인 요청을 하시겠습니까?" },
  warningMessage: { type: String, default: "" },
});

const emit = defineEmits(["confirm", "close"]);

function onConfirm() {
  emit("confirm");
}

function onClose() {
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-modal">
      <div
        v-if="show"
        class="confirm-modal-backdrop"
        @click.self="onClose"
      >
        <div class="confirm-modal rounded">
          <div class="confirm-modal-header rounded-top">
            {{ title }}
          </div>
          <div class="confirm-modal-body">
            <p class="confirm-modal-message">{{ message }}</p>
            <p v-if="warningMessage" class="confirm-modal-warning">{{ warningMessage }}</p>
            <div class="confirm-modal-actions">
              <button
                type="button"
                class="btn btn-confirm-yes rounded"
                @click="onConfirm"
              >
                네
              </button>
              <button
                type="button"
                class="btn btn-confirm-no rounded"
                @click="onClose"
              >
                아니오
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
.confirm-modal {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  min-width: 320px;
  max-width: 90vw;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}
.confirm-modal-header {
  background: #808080;
  color: #fff;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 1rem;
}
.confirm-modal-body {
  padding: 1.25rem 1rem;
  text-align: center;
}
.confirm-modal-message {
  margin: 0 0 0.5rem;
  color: #212529;
  font-size: 0.95rem;
}
.confirm-modal-warning {
  margin: 0 0 1.25rem;
  color: #dc3545;
  font-size: 0.9rem;
}
.confirm-modal-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}
.btn-confirm-yes {
  background: #28a745;
  border: 1px solid #1e7e34;
  color: #fff;
  padding: 0.35rem 1.25rem;
}
.btn-confirm-yes:hover {
  background: #218838;
  border-color: #1e7e34;
  color: #fff;
}
.btn-confirm-no {
  background: #dc3545;
  border: 1px solid #c82333;
  color: #fff;
  padding: 0.35rem 1.25rem;
}
.btn-confirm-no:hover {
  background: #c82333;
  border-color: #bd2130;
  color: #fff;
}

.confirm-modal-enter-active,
.confirm-modal-leave-active {
  transition: opacity 0.2s ease;
}
.confirm-modal-enter-active .confirm-modal,
.confirm-modal-leave-active .confirm-modal {
  transition: transform 0.2s ease;
}
.confirm-modal-enter-from,
.confirm-modal-leave-to {
  opacity: 0;
}
.confirm-modal-enter-from .confirm-modal,
.confirm-modal-leave-to .confirm-modal {
  transform: scale(0.95);
}
</style>
