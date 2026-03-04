<script setup>
import { onBeforeUnmount, onBeforeMount, ref, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import axios from "axios";
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonButton from "@/components/ArgonButton.vue";

const body = document.getElementsByTagName("body")[0];
const store = useStore();
const routes = useRouter();

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
const countdown = ref(0);
let timerInterval = null;

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

onBeforeMount(() => {
  store.state.hideConfigButton = true;
  store.state.showNavbar = false;
  store.state.showSidenav = false;
  store.state.showFooter = false;
  body.classList.remove("bg-gray-100");
});

onBeforeUnmount(() => {
  store.state.hideConfigButton = false;
  store.state.showNavbar = true;
  store.state.showSidenav = true;
  store.state.showFooter = true;
  body.classList.add("bg-gray-100");
  if (timerInterval) clearInterval(timerInterval);
});

const goToLogin = () => routes.push("/signin");

// 인증번호 발송
const sendVerificationCode = async () => {
  if (!userId.value || !email.value) {
    memberError.value = "아이디와 이메일을 입력해주세요.";
    return;
  }
  memberError.value = "";
  authMessage.value = "";
  isSending.value = true;
  try {
    // 재인증 시도를 위해 기존 상태 초기화
    authCode.value = "";
    isVerified.value = false;
    await axios.post("/api/verifi/reset-pw", {
      id: userId.value,
      email: email.value,
    });
    authMessage.value = "인증번호가 발송되었습니다.";
    hasSentOnce.value = true;
    startTimer();
  } catch (err) {
    memberError.value =
      err.response?.data?.message || "회원정보가 일치하지 않습니다.";
  } finally {
    isSending.value = false;
  }
};

// 인증번호 타이머
const startTimer = () => {
  countdown.value = 180; // 3분

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      authMessage.value = "인증시간이 만료되었습니다. 다시 요청해주세요.";
      isVerified.value = false;
    }
  }, 1000);
};

// 인증번호 확인
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

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  } catch (err) {
    authMessage.value =
      err.response?.data?.message || "인증번호가 일치하지 않습니다 인증 번호를 다시 발급받아주세요.";
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    countdown.value = 0;
  } finally {
    isVerifying.value = false;
  }
};

// 비밀번호 재설정
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
    routes.push("/signin");
  } catch (err) {
    pwErrorMessage.value =
      err.response?.data?.message || "비밀번호 변경에 실패했습니다.";
  } finally {
    isResetting.value = false;
  }
};
</script>

<template>
  <main class="mt-0 main-content">
    <section>
      <div
        class="page-header min-vh-100"
        style="
          background-image: url(&quot;https://www.ibabynews.com&quot;);
          background-size: cover;
          background-position: center;
        "
      >
        <span class="mask bg-gradient-dark opacity-6"></span>
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-xl-4 col-lg-5 col-md-7">
              <div class="card bg-white shadow-lg rounded-0 p-4 z-index-2">
                <div
                  class="pb-0 card-header text-center bg-transparent border-0"
                >
                  <h4 class="font-weight-bolder">비밀번호 재설정</h4>
                  <p class="mb-0 text-sm">
                    본인 확인을 위해 정보를 입력해주세요.
                  </p>
                </div>
                <div class="card-body">
                  <form role="form" @submit.prevent>
                    <!-- 아이디 입력 -->
                    <div class="mb-3">
                      <label class="form-label text-sm">아이디</label>
                      <argon-input
                        v-model="userId"
                        type="text"
                        placeholder="아이디를 입력하세요"
                        name="userid"
                        size="lg"
                        class="rounded-0"
                        :disabled="isVerified"
                      />
                    </div>

                    <!-- 이메일 입력 + 인증번호 발송 -->
                    <div class="mb-3">
                      <label class="form-label text-sm">등록된 이메일</label>
                      <div class="d-flex gap-2">
                        <argon-input
                          v-model="email"
                          id="email"
                          type="email"
                          placeholder="example@mail.com"
                          name="email"
                          size="lg"
                          class="rounded-0 flex-grow-1 mb-0"
                          :disabled="isVerified"
                        />
                        <argon-button
                          type="button"
                          variant="outline"
                          color="success"
                          size="sm"
                          class="rounded-0 text-nowrap px-3"
                          style="height: 46px"
                          :disabled="sendButtonDisabled"
                          @click="sendVerificationCode"
                        >
                          {{ sendButtonLabel }}
                        </argon-button>
                      </div>
                      <p
                        v-if="memberError"
                        class="text-danger text-xs mt-1 mb-0 ps-1"
                      >
                        {{ memberError }}
                      </p>
                    </div>

                    <!-- 인증번호 확인란 -->
                    <div class="mb-4">
                      <label
                        class="form-label text-sm"
                        :disabled="isVerified || countdown === 0"
                        >인증번호 입력</label
                      >
                      <div class="d-flex gap-2">
                        <argon-input
                          v-model="authCode"
                          id="authCode"
                          type="text"
                          placeholder="인증번호 6자리"
                          name="authCode"
                          size="lg"
                          class="rounded-0 flex-grow-1 mb-0"
                          :disabled="isVerified"
                        />
                        <argon-button
                          type="button"
                          variant="outline"
                          color="dark"
                          size="sm"
                          class="rounded-0 text-nowrap px-3"
                          style="height: 46px"
                          :disabled="isVerified || isVerifying"
                          @click="confirmVerification"
                        >
                          {{ isVerifying ? "확인중..." : "인증확인" }}
                        </argon-button>
                      </div>
                      <p
                        v-if="authMessage"
                        :class="[
                          'text-xs mt-1 mb-0 ps-1',
                          authMessage.includes('완료') ||
                          authMessage.includes('발송')
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
                        {{ Math.floor(countdown / 60) }}:
                        {{ String(countdown % 60).padStart(2, "0") }}
                      </p>
                    </div>

                    <!-- 인증 성공 시 새 비밀번호 입력 -->
                    <div v-if="isVerified" class="mb-4">
                      <div class="mb-3">
                        <label class="form-label text-sm">새 비밀번호</label>
                        <argon-input
                          v-model="newPassword"
                          type="password"
                          placeholder="새 비밀번호"
                          size="lg"
                          class="rounded-0"
                        />
                      </div>
                      <div class="mb-3">
                        <label class="form-label text-sm">비밀번호 확인</label>
                        <argon-input
                          v-model="confirmPassword"
                          type="password"
                          placeholder="비밀번호 확인"
                          size="lg"
                          class="rounded-0"
                        />
                        <p
                          v-if="pwErrorMessage"
                          class="text-danger text-xs mt-1 mb-0 ps-1"
                        >
                          {{ pwErrorMessage }}
                        </p>
                      </div>
                      <argon-button
                        type="button"
                        fullWidth
                        variant="gradient"
                        color="success"
                        class="rounded-0 py-2 mb-3"
                        size="lg"
                        :disabled="isResetting"
                        @click="handleResetPassword"
                      >
                        {{ isResetting ? "처리중..." : "비밀번호 재설정" }}
                      </argon-button>
                    </div>

                    <div class="text-center mt-4">
                      <argon-button
                        type="button"
                        fullWidth
                        variant="outline"
                        color="secondary"
                        class="rounded-0 py-2"
                        size="lg"
                        @click="goToLogin"
                      >
                        로그인 화면으로
                      </argon-button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
