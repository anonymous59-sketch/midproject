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

const name = ref("");
const email = ref("");
const authCode = ref("");
const memberError = ref(""); // 회원정보 불일치 경고
const authMessage = ref(""); // 인증 성공/실패 메시지
const foundId = ref(""); // 인증 성공 시 찾은 아이디
const isSending = ref(false);
const isVerifying = ref(false);
const hasSentOnce = ref(false); // 한 번이라도 발송한 적 있으면 true (재인증 라벨용)

// 인증번호 타이머
const countdown = ref(0);
let timerInterval = null;

const sendButtonLabel = computed(() => {
  if (isSending.value) return "발송중...";
  if (hasSentOnce.value && countdown.value === 0) return "재인증";
  return "인증번호 발송";
});
const sendButtonDisabled = computed(
  () => isSending.value || (hasSentOnce.value && countdown.value > 0),
);
onBeforeMount(() => {
  store.state.hideConfigButton = true;
  store.state.showNavbar = false;
  store.state.showSidenav = false;
  store.state.showFooter = false;
  body.classList.remove("bg-gray-100");

  if (timerInterval) clearInterval(timerInterval);
});

onBeforeUnmount(() => {
  store.state.hideConfigButton = false;
  store.state.showNavbar = true;
  store.state.showSidenav = true;
  store.state.showFooter = true;
  body.classList.add("bg-gray-100");
});

const goToLogin = () => routes.push("/signin");
const goToResetPassword = () => routes.push("/find-password");
// 인증번호 발송
const sendVerificationCode = async () => {
  if (!name.value || !email.value) {
    memberError.value = "이름과 이메일을 입력해주세요.";
    return;
  }
  memberError.value = "";
  authMessage.value = "";
  isSending.value = true;
  try {
    // 재인증 시도를 위해 기존 상태 초기화
    authCode.value = "";
    foundId.value = "";
    await axios.post("/api/verifi/find-id", {
      name: name.value,
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
// 타이머 함수
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
    }
  }, 1000);
};

// 인증번호 확인
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

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  } catch (err) {
    authMessage.value =
      err.response?.data?.message ||
      "인증번호가 일치하지 않습니다 인증 번호를 다시 발급받아주세요.";
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    countdown.value = 0;
  } finally {
    isVerifying.value = false;
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
                  <h4 class="font-weight-bolder">아이디 찾기</h4>
                  <p class="mb-0 text-sm">
                    가입 시 등록한 정보를 입력해주세요.
                  </p>
                </div>
                <div class="card-body">
                  <form role="form" @submit.prevent>
                    <!-- 이름 입력 -->
                    <div class="mb-3">
                      <label class="form-label text-sm">이름</label>
                      <argon-input
                        v-model="name"
                        type="text"
                        placeholder="성함을 입력하세요"
                        name="name"
                        size="lg"
                        class="rounded-0"
                      />
                    </div>

                    <!-- 이메일 입력 + 인증번호 발송 버튼 -->
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

                    <!-- 인증번호 입력 + 확인 버튼 -->
                    <div class="mb-3">
                      <label
                        class="form-label text-sm"
                        :disabled="countdown === 0"
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
                        />
                        <argon-button
                          type="button"
                          variant="outline"
                          color="dark"
                          size="sm"
                          class="rounded-0 text-nowrap px-3"
                          style="height: 46px"
                          :disabled="isVerifying"
                          @click="confirmVerificationCode"
                        >
                          {{ isVerifying ? "확인중..." : "확인" }}
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
                        v-if="countdown > 0 && !foundId"
                        class="text-danger text-xs mt-1 mb-0 ps-1"
                      >
                        남은 시간 :
                        {{ Math.floor(countdown / 60) }}:
                        {{ String(countdown % 60).padStart(2, "0") }}
                      </p>
                      <!-- 인증 성공 시 아이디 표시 -->
                      <div v-if="foundId" class="mt-2 p-3 bg-light rounded">
                        <p class="text-sm mb-0 font-weight-bold">회원 아이디</p>
                        <p class="text-dark mb-0">{{ foundId }}</p>
                      </div>
                    </div>

                    <div class="text-center mt-4">
                      <argon-button
                        type="button"
                        fullWidth
                        variant="outline"
                        color="secondary"
                        class="rounded-0 mb-3 py-2"
                        size="lg"
                        @click="goToLogin"
                      >
                        로그인 화면으로
                      </argon-button>
                      <argon-button
                        type="button"
                        fullWidth
                        variant="outline"
                        color="secondary"
                        class="rounded-0 mb-3 py-2"
                        size="lg"
                        @click="goToResetPassword"
                      >
                        비밀번호 재설정
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

<style scoped>
/* 커스텀 스타일이 필요할 경우 여기에 작성 */
</style>
