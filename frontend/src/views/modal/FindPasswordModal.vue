<script setup>
import { ref, computed, watch } from "vue";
import axios from "axios";
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import { useVerificationTimer } from "@/composables/useVerificationTimer";

const props = defineProps({
  show: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "go-login"]);

const userId = ref("");
const email = ref("");
const authCode = ref("");
const memberError = ref("");
const authMessage = ref("");
const isVerified = ref(false);
const newPassword = ref("");
const confirmPassword = ref("");
const pwErrorMessage = ref("");
const isSending = ref(false);
const isVerifying = ref(false);
const isResetting = ref(false);
const hasSentOnce = ref(false);

const {
  countdown,
  startTimer,
  restoreTimer,
  stopTimer,
} = useVerificationTimer("verifi_end_findpw", 180);

const sendButtonLabel = computed(() => {
  if (isSending.value) return "발송중...";
  if (hasSentOnce.value && countdown.value === 0 && !isVerified.value)
    return "재인증";
  return "인증번호 발송";
});
const sendButtonDisabled = computed(
  () =>
    isVerified.value ||
    isSending.value ||
    (hasSentOnce.value && countdown.value > 0),
);

watch(
  () => props.show,
  (visible) => {
    if (!visible) {
      userId.value = "";
      email.value = "";
      authCode.value = "";
      memberError.value = "";
      authMessage.value = "";
      isVerified.value = false;
      newPassword.value = "";
      confirmPassword.value = "";
      pwErrorMessage.value = "";
      hasSentOnce.value = false;
      stopTimer();
    } else {
      restoreTimer(() => {
        authMessage.value = "인증시간이 만료되었습니다. 다시 요청해주세요.";
        isVerified.value = false;
        axios
          .post("/api/verifi/expire", { email: email.value, purpose: "i0_30" })
          .catch(() => {});
      });
    }
  },
);

function goToLogin() {
  emit("go-login");
  emit("close");
}

const sendVerificationCode = async () => {
  if (!userId.value || !email.value) {
    memberError.value = "아이디와 이메일을 입력해주세요.";
    return;
  }
  memberError.value = "";
  authMessage.value = "";
  isSending.value = true;
  try {
    authCode.value = "";
    isVerified.value = false;
    await axios.post("/api/verifi/reset-pw", {
      id: userId.value,
      email: email.value,
    });
    authMessage.value = "인증번호가 발송되었습니다.";
    hasSentOnce.value = true;
    startTimer(() => {
      authMessage.value = "인증시간이 만료되었습니다. 다시 요청해주세요.";
      isVerified.value = false;
      axios
        .post("/api/verifi/expire", { email: email.value, purpose: "i0_30" })
        .catch(() => {});
    });
  } catch (err) {
    memberError.value =
      err.response?.data?.message || "회원정보가 일치하지 않습니다.";
  } finally {
    isSending.value = false;
  }
};

const confirmVerification = async () => {
  if (!authCode.value) {
    authMessage.value = "인증번호를 입력해주세요.";
    return;
  }
  authMessage.value = "";
  isVerifying.value = true;
  try {
    await axios.post("/api/verifi/verify", {
      email: email.value,
      code: authCode.value,
      purpose: "i0_30",
    });
    isVerified.value = true;
    authMessage.value = "인증이 완료되었습니다.";
    stopTimer();
  } catch (err) {
    authMessage.value =
      err.response?.data?.message ||
      "인증번호가 일치하지 않습니다. 인증 번호를 다시 발급받아주세요.";
    stopTimer();
    countdown.value = 0;
  } finally {
    isVerifying.value = false;
  }
};

const handleResetPassword = async () => {
  if (!newPassword.value) {
    pwErrorMessage.value = "새 비밀번호를 입력해주세요.";
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    pwErrorMessage.value = "비밀번호가 일치하지 않습니다.";
    return;
  }
  pwErrorMessage.value = "";
  isResetting.value = true;
  try {
    await axios.post("/api/verifi/reset-password", {
      id: userId.value,
      email: email.value,
      newPw: newPassword.value,
    });
    alert("비밀번호가 변경되었습니다.");
    emit("go-login");
    emit("close");
  } catch (err) {
    pwErrorMessage.value =
      err.response?.data?.message || "비밀번호 변경에 실패했습니다.";
  } finally {
    isResetting.value = false;
  }
};

function onClose() {
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <Transition name="find-pw-modal">
      <div v-if="show" class="find-pw-modal-backdrop" @click.self="onClose">
        <div class="find-pw-modal rounded">
          <div class="find-pw-modal-header d-flex align-items-center justify-content-between">
            <span>비밀번호 재설정</span>
            <button
              type="button"
              class="find-pw-modal-close btn-close btn-close-white"
              aria-label="닫기"
              @click="onClose"
            />
          </div>
          <div class="find-pw-modal-body">
            <p class="find-pw-modal-desc mb-3">본인 확인을 위해 정보를 입력해주세요.</p>
            <form role="form" @submit.prevent>
              <div class="mb-3">
                <label class="form-label text-sm">아이디</label>
                <ArgonInput
                  v-model="userId"
                  type="text"
                  placeholder="아이디를 입력하세요"
                  name="userid"
                  size="lg"
                  class="rounded-0"
                  :disabled="isVerified"
                />
              </div>

              <div class="mb-3">
                <label class="form-label text-sm">등록된 이메일</label>
                <div class="d-flex gap-2">
                  <ArgonInput
                    v-model="email"
                    id="findpw-email"
                    type="email"
                    placeholder="example@mail.com"
                    name="email"
                    size="lg"
                    class="rounded-0 flex-grow-1 mb-0"
                    :disabled="isVerified"
                  />
                  <ArgonButton
                    type="button"
                    variant="outline"
                    color="success"
                    size="lg"
                    class="rounded-0 text-nowrap align-self-end"
                    :disabled="sendButtonDisabled"
                    @click="sendVerificationCode"
                  >
                    {{ sendButtonLabel }}
                  </ArgonButton>
                </div>
                <p v-if="memberError" class="text-danger text-xs mt-1 mb-0 ps-1">
                  {{ memberError }}
                </p>
              </div>

              <div class="mb-4">
                <label class="form-label text-sm">인증번호 입력</label>
                <div class="d-flex gap-2">
                  <ArgonInput
                    v-model="authCode"
                    id="findpw-authCode"
                    type="text"
                    placeholder="인증번호 6자리"
                    name="authCode"
                    size="lg"
                    class="rounded-0 flex-grow-1 mb-0"
                    :disabled="isVerified"
                  />
                  <ArgonButton
                    type="button"
                    variant="outline"
                    color="dark"
                    size="lg"
                    class="rounded-0 text-nowrap align-self-end"
                    :disabled="isVerified || isVerifying"
                    @click="confirmVerification"
                  >
                    {{ isVerifying ? "확인중..." : "인증확인" }}
                  </ArgonButton>
                </div>
                <p
                  v-if="authMessage"
                  :class="[
                    'text-xs mt-1 mb-0 ps-1',
                    authMessage.includes('완료') || authMessage.includes('발송')
                      ? 'text-success'
                      : 'text-danger',
                  ]"
                >
                  {{ authMessage }}
                </p>
                <p
                  v-if="countdown > 0 && !isVerified"
                  class="text-danger text-xs mt-1 mb-0 ps-1"
                >
                  남은 시간 :
                  {{ Math.floor(countdown / 60) }}:{{ String(countdown % 60).padStart(2, "0") }}
                </p>
              </div>

              <div v-if="isVerified" class="mb-4">
                <div class="mb-3">
                  <label class="form-label text-sm">새 비밀번호</label>
                  <ArgonInput
                    v-model="newPassword"
                    type="password"
                    placeholder="새 비밀번호"
                    size="lg"
                    class="rounded-0"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label text-sm">비밀번호 확인</label>
                  <ArgonInput
                    v-model="confirmPassword"
                    type="password"
                    placeholder="비밀번호 확인"
                    size="lg"
                    class="rounded-0"
                  />
                  <p v-if="pwErrorMessage" class="text-danger text-xs mt-1 mb-0 ps-1">
                    {{ pwErrorMessage }}
                  </p>
                </div>
                <ArgonButton
                  type="button"
                  fullWidth
                  variant="gradient"
                  color="success"
                  size="lg"
                  class="rounded-0 py-2 mb-3"
                  :disabled="isResetting"
                  @click="handleResetPassword"
                >
                  {{ isResetting ? "처리중..." : "비밀번호 재설정" }}
                </ArgonButton>
              </div>

              <div class="text-center mt-4">
                <ArgonButton
                  type="button"
                  fullWidth
                  variant="outline"
                  color="secondary"
                  size="lg"
                  class="rounded-0 py-2"
                  @click="goToLogin"
                >
                  로그인 화면으로
                </ArgonButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.find-pw-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
.find-pw-modal {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  width: min(90vw, 420px);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}
.find-pw-modal-header {
  background: #495057;
  color: #fff;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 1.1rem;
  flex-shrink: 0;
  border-radius: 0.5rem 0.5rem 0 0;
}
.find-pw-modal-close {
  opacity: 0.8;
}
.find-pw-modal-close:hover {
  opacity: 1;
}
.find-pw-modal-body {
  padding: 1.25rem 1rem;
  text-align: left;
  flex: 1;
  min-height: 0;
}
.find-pw-modal-desc {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0;
}

.find-pw-modal-enter-active,
.find-pw-modal-leave-active {
  transition: opacity 0.2s ease;
}
.find-pw-modal-enter-active .find-pw-modal,
.find-pw-modal-leave-active .find-pw-modal {
  transition: transform 0.2s ease;
}
.find-pw-modal-enter-from,
.find-pw-modal-leave-to {
  opacity: 0;
}
.find-pw-modal-enter-from .find-pw-modal,
.find-pw-modal-leave-to .find-pw-modal {
  transform: scale(0.96);
}
</style>
