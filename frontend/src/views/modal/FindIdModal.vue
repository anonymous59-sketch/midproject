<script setup>
import { ref, computed, watch } from "vue";
import axios from "axios";
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import { useVerificationTimer } from "@/composables/useVerificationTimer";

const props = defineProps({
  show: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "go-login", "go-find-password"]);

const name = ref("");
const email = ref("");
const authCode = ref("");
const memberError = ref("");
const authMessage = ref("");
const foundId = ref("");
const isSending = ref(false);
const isVerifying = ref(false);
const hasSentOnce = ref(false);

const {
  countdown,
  startTimer,
  restoreTimer,
  stopTimer,
} = useVerificationTimer("verifi_end_findid", 180);

const sendButtonLabel = computed(() => {
  if (isSending.value) return "발송중...";
  if (hasSentOnce.value && countdown.value === 0) return "재인증";
  return "인증번호 발송";
});
const sendButtonDisabled = computed(
  () => isSending.value || (hasSentOnce.value && countdown.value > 0),
);

watch(
  () => props.show,
  (visible) => {
    if (!visible) {
      name.value = "";
      email.value = "";
      authCode.value = "";
      memberError.value = "";
      authMessage.value = "";
      foundId.value = "";
      hasSentOnce.value = false;
      stopTimer();
      countdown.value = 0;
      localStorage.removeItem("verifi_end_findid");
    } else {
      if (hasSentOnce.value) {
        restoreTimer(() => {
          authMessage.value = "인증시간이 만료되었습니다. 다시 요청해주세요.";
          axios
            .post("/api/verifi/expire", { email: email.value, purpose: "i0_20" })
            .catch(() => {});
        });
      }
    }
  },
);

function goToLogin() {
  emit("go-login");
  emit("close");
}
function goToResetPassword() {
  emit("go-find-password");
  emit("close");
}

const sendVerificationCode = async () => {
  if (!name.value || !email.value) {
    memberError.value = "이름과 이메일을 입력해주세요.";
    return;
  }
  memberError.value = "";
  authMessage.value = "";
  isSending.value = true;
  try {
    authCode.value = "";
    foundId.value = "";
    await axios.post("/api/verifi/find-id", {
      name: name.value,
      email: email.value,
    });
    authMessage.value = "인증번호가 발송되었습니다.";
    hasSentOnce.value = true;
    startTimer(() => {
      authMessage.value = "인증시간이 만료되었습니다. 다시 요청해주세요.";
      axios
        .post("/api/verifi/expire", { email: email.value, purpose: "i0_20" })
        .catch(() => {});
    });
  } catch (err) {
    memberError.value =
      err.response?.data?.message || "회원정보가 일치하지 않습니다.";
  } finally {
    isSending.value = false;
  }
};

const confirmVerificationCode = async () => {
  if (!authCode.value) {
    authMessage.value = "인증번호를 입력해주세요.";
    return;
  }
  authMessage.value = "";
  isVerifying.value = true;
  try {
    const res = await axios.post("/api/verifi/verify", {
      email: email.value,
      code: authCode.value,
      purpose: "i0_20",
    });
    foundId.value = res.data.m_id || "";
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

function onClose() {
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <Transition name="find-id-modal">
      <div v-if="show" class="find-id-modal-backdrop" @click.self="onClose">
        <div class="find-id-modal rounded">
          <div class="find-id-modal-header d-flex align-items-center justify-content-between">
            <span>아이디 찾기</span>
            <button
              type="button"
              class="find-id-modal-close btn-close btn-close-white"
              aria-label="닫기"
              @click="onClose"
            />
          </div>
          <div class="find-id-modal-body">
            <p class="find-id-modal-desc mb-3">가입 시 등록한 정보를 입력해주세요.</p>
            <form role="form" @submit.prevent>
              <div class="mb-3">
                <label class="form-label text-sm">이름</label>
                <ArgonInput
                  v-model="name"
                  type="text"
                  placeholder="성함을 입력하세요"
                  name="name"
                  size="lg"
                  class="rounded-0"
                />
              </div>

              <div class="mb-3">
                <label class="form-label text-sm">등록된 이메일</label>
                <div class="d-flex gap-2">
                  <ArgonInput
                    v-model="email"
                    id="findid-email"
                    type="email"
                    placeholder="example@mail.com"
                    name="email"
                    size="lg"
                    class="rounded-0 flex-grow-1 mb-0"
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

              <div class="mb-3">
                <label class="form-label text-sm">인증번호 입력</label>
                <div class="d-flex gap-2">
                  <ArgonInput
                    v-model="authCode"
                    id="findid-authCode"
                    type="text"
                    placeholder="인증번호 6자리"
                    name="authCode"
                    size="lg"
                    class="rounded-0 flex-grow-1 mb-0"
                  />
                  <ArgonButton
                    type="button"
                    variant="outline"
                    color="dark"
                    size="lg"
                    class="rounded-0 text-nowrap align-self-end"
                    :disabled="isVerifying"
                    @click="confirmVerificationCode"
                  >
                    {{ isVerifying ? "확인중..." : "인증" }}
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
                  v-if="countdown > 0 && !foundId"
                  class="text-danger text-xs mt-1 mb-0 ps-1"
                >
                  남은 시간 :
                  {{ Math.floor(countdown / 60) }}:{{ String(countdown % 60).padStart(2, "0") }}
                </p>
              </div>

              <div v-if="foundId" class="mb-3 text-center">
                <p class="text-sm">회원님의 아이디는 다음과 같습니다.</p>
                <h5 class="font-weight-bolder">{{ foundId }}</h5>
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
              <div class="text-center mt-2">
                <ArgonButton
                  type="button"
                  fullWidth
                  variant="outline"
                  color="success"
                  size="lg"
                  class="rounded-0 py-2"
                  @click="goToResetPassword"
                >
                  비밀번호 찾기
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
.find-id-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
.find-id-modal {
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
.find-id-modal-header {
  background: #495057;
  color: #fff;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 1.1rem;
  flex-shrink: 0;
  border-radius: 0.5rem 0.5rem 0 0;
}
.find-id-modal-close {
  opacity: 0.8;
}
.find-id-modal-close:hover {
  opacity: 1;
}
.find-id-modal-body {
  padding: 1.25rem 1rem;
  text-align: left;
  flex: 1;
  min-height: 0;
}
.find-id-modal-desc {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0;
}

.find-id-modal-enter-active,
.find-id-modal-leave-active {
  transition: opacity 0.2s ease;
}
.find-id-modal-enter-active .find-id-modal,
.find-id-modal-leave-active .find-id-modal {
  transition: transform 0.2s ease;
}
.find-id-modal-enter-from,
.find-id-modal-leave-to {
  opacity: 0;
}
.find-id-modal-enter-from .find-id-modal,
.find-id-modal-leave-to .find-id-modal {
  transform: scale(0.96);
}
</style>
