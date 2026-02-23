<script setup>
import {
  onBeforeUnmount,
  onBeforeMount,
  ref,
  computed,
  onUnmounted,
} from "vue";
import { useStore } from "vuex";
import Navbar from "@/examples/PageLayout/Navbar.vue";
import AppFooter from "@/examples/PageLayout/Footer.vue";
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonCheckbox from "@/components/ArgonCheckbox.vue";
import ArgonButton from "@/components/ArgonButton.vue";

const body = document.getElementsByTagName("body")[0];
const store = useStore();

// --- [상태 관리 변수] ---
const userid = ref("");
const isIdChecked = ref(false);
const idErrorMessage = ref("");

const password = ref("");
const confirmPassword = ref("");

const email = ref("");
const isEmailVerified = ref(false);
const authCodeInput = ref("");
const showEmailModal = ref(false);

const timer = ref(180); // 3분
const timerInterval = ref(null);

const showModal = ref(false);
const modalMessage = ref("");

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
});

// --- [검증 로직] ---

// 1. 아이디 실시간 체크
const idValidationMessage = computed(() => {
  if (userid.value.length === 0) return "";
  if (userid.value.length < 4 || userid.value.length > 15)
    return "아이디는 4~15글자로 입력해주세요.";
  return "";
});

// 2. 비밀번호 일치 실시간 체크
const passwordValidationMessage = computed(() => {
  if (confirmPassword.value.length === 0) return "";
  if (password.value !== confirmPassword.value)
    return "비밀번호가 일치하지 않습니다.";
  return "";
});

// 3. 이메일 타이머 포맷 (03:00)
const formattedTime = computed(() => {
  const m = Math.floor(timer.value / 60);
  const s = timer.value % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});

// --- [주요 기능 함수] ---

const checkIdDuplication = () => {
  if (idValidationMessage.value) {
    modalMessage.value = idValidationMessage.value;
    showModal.value = true;
    return;
  }
  const existingIds = ["admin", "test", "user1"];
  if (existingIds.includes(userid.value)) {
    idErrorMessage.value = "이미 등록된 아이디입니다.";
    isIdChecked.value = false;
  } else {
    idErrorMessage.value = "";
    isIdChecked.value = true;
    modalMessage.value = "사용 가능한 아이디입니다.";
    showModal.value = true;
  }
};

const startTimer = () => {
  if (timerInterval.value) clearInterval(timerInterval.value);
  timer.value = 180;
  timerInterval.value = setInterval(() => {
    if (timer.value > 0) timer.value--;
    else {
      clearInterval(timerInterval.value);
      alert("인증 시간이 만료되었습니다.");
      showEmailModal.value = false;
    }
  }, 1000);
};

const verifyEmail = () => {
  if (!email.value) {
    alert("이메일을 입력해주세요.");
    return;
  }
  alert("인증번호가 발송되었습니다.");
  showEmailModal.value = true;
  startTimer();
};

const confirmAuthCode = () => {
  if (authCodeInput.value === "123456") {
    // 테스트용 번호
    alert("인증되었습니다.");
    isEmailVerified.value = true;
    showEmailModal.value = false;
    clearInterval(timerInterval.value);
  } else {
    alert("인증번호가 틀렸습니다.");
  }
};

const handleSignUp = () => {
  if (!isIdChecked.value) {
    modalMessage.value = "아이디 중복 검사를 해주세요.";
    showModal.value = true;
    return;
  }
  if (!isEmailVerified.value) {
    modalMessage.value = "이메일 인증을 완료해주세요.";
    showModal.value = true;
    return;
  }
  if (password.value !== confirmPassword.value) {
    alert("비밀번호 확인 요망");
    return;
  }
  alert("회원가입 완료!");
};

const searchAddress = () => alert("주소 검색 실행");

onUnmounted(() => {
  if (timerInterval.value) clearInterval(timerInterval.value);
});
</script>

<template>
  <div
    v-if="store.state.showNavbar"
    class="container top-0 position-sticky z-index-sticky"
  >
    <div class="row">
      <div class="col-12"><navbar isBtn="bg-gradient-light" /></div>
    </div>
  </div>

  <main class="main-content mt-0">
    <div
      class="page-header align-items-start min-vh-50 pt-5 pb-11 m-3 border-radius-lg bg-gradient-success"
    >
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-5 text-center mx-auto">
            <h1 class="text-white mb-2 mt-5">Welcome!</h1>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="row mt-lg-n12 mt-md-n11 mt-n10 justify-content-center">
        <div class="col-xl-6 col-lg-8 col-md-10 mx-auto">
          <div class="card z-index-0 rounded-0 shadow-lg p-md-5 p-3 mb-5">
            <div class="card-header text-center pt-4 bg-transparent border-0">
              <h5 class="font-weight-bolder">회원 가입</h5>
            </div>

            <!-- 회원 유형 선택 -->
            <div class="row px-xl-5 px-sm-4 px-3 mb-4 text-center">
              <div class="col-4 px-1">
                <argon-button
                  variant="outline"
                  color="success"
                  fullWidth
                  class="rounded-0 py-2 text-nowrap"
                  style="font-size: 0.7rem; height: 46px"
                  >일반 회원</argon-button
                >
              </div>
              <div class="col-4 px-1">
                <argon-button
                  variant="outline"
                  color="success"
                  fullWidth
                  class="rounded-0 py-2 text-nowrap"
                  style="font-size: 0.7rem; height: 46px"
                  >기관 담당자</argon-button
                >
              </div>
              <div class="col-4 px-1">
                <argon-button
                  variant="outline"
                  color="success"
                  fullWidth
                  class="rounded-0 py-2 text-nowrap"
                  style="font-size: 0.7rem; height: 46px"
                  >기관 관리자</argon-button
                >
              </div>
              <p class="text-xs font-weight-bold mt-3 mb-0 text-secondary">
                회원 유형을 선택해주세요
              </p>
            </div>

            <div class="card-body pt-0">
              <form role="form" @submit.prevent="handleSignUp">
                <!-- 이름 -->
                <div class="mb-3">
                  <argon-input
                    v-model="name"
                    placeholder="이름"
                    size="lg"
                    class="rounded-0"
                  />
                </div>

                <!-- 아이디 중복 체크 -->
                <div class="mb-3">
                  <div class="d-flex gap-2">
                    <argon-input
                      v-model="userid"
                      placeholder="아이디 (4~15자)"
                      size="lg"
                      class="rounded-0 flex-grow-1 mb-0"
                      @input="
                        isIdChecked = false;
                        idErrorMessage = '';
                      "
                    />
                    <argon-button
                      type="button"
                      variant="outline"
                      color="success"
                      class="rounded-0 text-nowrap"
                      style="height: 46px"
                      @click="checkIdDuplication"
                      >중복검사</argon-button
                    >
                  </div>
                  <p
                    v-if="idValidationMessage || idErrorMessage"
                    class="text-danger text-xs mt-1 mb-0 ps-1"
                  >
                    {{ idValidationMessage || idErrorMessage }}
                  </p>
                  <p
                    v-if="isIdChecked && !idValidationMessage"
                    class="text-success text-xs mt-1 mb-0 ps-1"
                  >
                    사용 가능한 아이디입니다.
                  </p>
                </div>

                <!-- 비밀번호 -->
                <div class="mb-3">
                  <argon-input
                    v-model="password"
                    type="password"
                    placeholder="비밀번호"
                    size="lg"
                    class="rounded-0"
                  />
                </div>
                <div class="mb-3">
                  <argon-input
                    v-model="confirmPassword"
                    type="password"
                    placeholder="비밀번호 확인"
                    size="lg"
                    class="rounded-0 mb-0"
                  />
                  <p
                    v-if="passwordValidationMessage"
                    class="text-danger text-xs mt-1 mb-0 ps-1"
                  >
                    {{ passwordValidationMessage }}
                  </p>
                </div>

                <!-- 이메일 인증 -->
                <div class="mb-3">
                  <div class="d-flex gap-2">
                    <argon-input
                      v-model="email"
                      type="email"
                      placeholder="이메일"
                      size="lg"
                      class="rounded-0 flex-grow-1 mb-0"
                    />
                    <argon-button
                      type="button"
                      variant="outline"
                      color="success"
                      class="rounded-0 text-nowrap"
                      style="height: 46px"
                      @click="verifyEmail"
                    >
                      {{ isEmailVerified ? "인증완료" : "이메일 인증" }}
                    </argon-button>
                  </div>
                </div>

                <div class="mb-3">
                  <argon-input
                    type="tel"
                    placeholder="연락처"
                    size="lg"
                    class="rounded-0"
                  />
                </div>
                <div class="mb-3">
                  <argon-input type="date" size="lg" class="rounded-0" />
                </div>

                <div class="mb-3">
                  <div class="d-flex gap-2">
                    <argon-input
                      placeholder="주소"
                      size="lg"
                      class="rounded-0 flex-grow-1 mb-0"
                    />
                    <argon-button
                      type="button"
                      variant="outline"
                      color="success"
                      class="rounded-0 text-nowrap"
                      style="height: 46px"
                      @click="searchAddress"
                      >주소 검색</argon-button
                    >
                  </div>
                </div>

                <div class="mb-4">
                  <label class="form-label text-sm">기관 선택</label>
                  <select
                    class="form-select form-select-lg rounded-0 border-gray-300"
                    style="height: 46px; font-size: 0.875rem"
                  >
                    <option disabled selected>기관을 선택해주세요</option>
                    <option>기관 A</option>
                  </select>
                </div>

                <argon-checkbox checked
                  ><label class="form-check-label text-sm"
                    >이용약관 동의</label
                  ></argon-checkbox
                >

                <div class="text-center mt-4">
                  <argon-button
                    fullWidth
                    color="success"
                    variant="gradient"
                    class="rounded-0"
                    size="lg"
                    >가입하기</argon-button
                  >
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- [모달 1] 이메일 인증용 -->
  <div
    v-if="showEmailModal"
    class="modal fade show d-block"
    style="background: rgba(0, 0, 0, 0.5); z-index: 10000"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content rounded-0 border-0 shadow-lg">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title font-weight-bolder">이메일 인증</h5>
        </div>
        <div class="modal-body py-4 text-center">
          <p class="text-sm mb-3">
            인증번호 6자리를 입력해주세요 (테스트: 123456)
          </p>
          <argon-input
            v-model="authCodeInput"
            placeholder="인증번호"
            class="rounded-0 text-center mb-2"
            maxlength="6"
          />
          <span class="text-danger font-weight-bold">{{ formattedTime }}</span>
        </div>
        <div class="modal-footer border-0 pt-0 justify-content-center">
          <argon-button
            color="success"
            variant="gradient"
            class="rounded-0 px-5"
            @click="confirmAuthCode"
            >인증확인</argon-button
          >
          <argon-button
            color="secondary"
            variant="outline"
            class="rounded-0"
            @click="verifyEmail"
            >재발송</argon-button
          >
        </div>
      </div>
    </div>
  </div>

  <!-- [모달 2] 알림용 (중복검사 등) -->
  <div
    v-if="showModal"
    class="modal fade show d-block"
    style="background: rgba(0, 0, 0, 0.5); z-index: 9999"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content rounded-0 border-0 shadow-lg">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title font-weight-bolder">알림</h5>
        </div>
        <div class="modal-body py-4 text-center text-dark font-weight-bold">
          {{ modalMessage }}
        </div>
        <div class="modal-footer border-0 pt-0 justify-content-center">
          <argon-button
            color="success"
            variant="gradient"
            class="rounded-0 px-5"
            @click="showModal = false"
            >확인</argon-button
          >
        </div>
      </div>
    </div>
  </div>
  <app-footer />
</template>

<style scoped>
.form-select:focus {
  border-color: #2dce89;
  box-shadow: 0 0 0 2px rgba(45, 206, 137, 0.2);
}
.modal.show {
  display: block;
}
</style>
