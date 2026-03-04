<script setup>
import { onBeforeUnmount, onBeforeMount, ref, computed } from "vue";
import { onMounted } from "vue";
import axios from "axios";
import { useStore } from "vuex";
import Navbar from "@/examples/PageLayout/Navbar.vue";
import AppFooter from "@/examples/PageLayout/Footer.vue";
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import { useRouter } from "vue-router";

const body = document.getElementsByTagName("body")[0];
const store = useStore();
const router = useRouter();

// --- [상태 관리 변수] ---
const userid = ref("");
const isIdChecked = ref(false);
const idErrorMessage = ref("");

const name = ref("");

const password = ref("");
const confirmPassword = ref("");

const email = ref("");
const isEmailVerified = ref(false);
const authCodeInput = ref("");
const showAuthSection = ref(false); // 인증번호 발송 후 입력 칸 표시
const authMessage = ref(""); // 성공/실패 메시지 (작은 글씨)
const emailErrorMessage = ref(""); // 이메일 중복 경고
const isSendingCode = ref(false); // 발송 중 로딩
const isVerifying = ref(false); // 인증 중 로딩

const tel = ref("");
const bd = ref("");
const address = ref("");
const userType = ref("일반회원");
const org = ref("");

const organList = ref([]);
// 주소(도시명: 대구/부산 등) 기반 기관 필터링용
const filteredOrganList = computed(() => {
  // 회원이 선택한 주소에서 도시명 추출
  const userCity = extractCityFromAddress(address.value);

  // 아직 주소가 없거나 도시명을 못 뽑으면 전체 목록 노출
  if (!userCity) {
    return organList.value;
  }

  return organList.value.filter((orgItem) => {
    const orgAddr = orgItem?.organ_address;
    if (typeof orgAddr !== "string") return false;

    const orgCity = extractCityFromAddress(orgAddr);
    return orgCity === userCity;
  });
});

const authCodeMap = {
  일반회원: "a0_21",
  기관담당자: "a0_31",
  기관관리자: "a0_41",
};

const showModal = ref(false);
const modalMessage = ref("");
const countdown = ref(0);
let timerInterval = null;

// 이메일 인증 버튼 라벨: 인증완료 → 발송중 → (발송 후 만료/실패 시) 재인증 → 이메일 인증
const emailButtonLabel = computed(() => {
  if (isEmailVerified.value) return "인증완료";
  if (isSendingCode.value) return "발송중...";
  // 인증 발송한 적 있고, 만료/실패로 재인증 가능한 상태
  if (showAuthSection.value && countdown.value === 0) return "재인증";
  return "이메일 인증";
});

// 발송 후 카운트다운 중에는 버튼 비활성화, 만료/실패 시에만 재인증 버튼 활성화
const emailButtonDisabled = computed(
  () =>
    isEmailVerified.value ||
    isSendingCode.value ||
    (showAuthSection.value && countdown.value > 0),
);

const goToSignin = () => router.push("/signin");
// 주소검색관련
const zipCode = ref("");
const institutions = ref([]);
// 상세주소
const detailAddress = ref("");

// "(우편번호) 대구 남구 ..." 또는 "대구 남구 ..." 형식의 주소에서
// 앞의 도시명(예: "대구", "부산")만 추출
const extractCityFromAddress = (addr) => {
  if (!addr || typeof addr !== "string") return "";

  // 앞에 붙은 "(12345)" 형태의 우편번호 제거
  const noZip = addr.replace(/^\(\d+\)\s*/, "");

  // 공백 기준으로 자르기
  const parts = noZip.split(" ").filter(Boolean);
  if (!parts.length) return "";

  const firstToken = parts[0]; // 예: "대구", "대구광역시", "부산광역시"

  // "대구광역시" → "대구", "부산광역시" → "부산" 정도로 단순 정규화
  return firstToken.replace(/광역시|특별시|시$/, "").slice(0, 2);
};

// 주소검색관련

// --- [라이프사이클] ---

onMounted(async () => {
  try {
    const res = await axios.get("/api/auth/organ/list");
    organList.value = res.data;
  } catch (err) {
    console.error("기관 목록 조회 실패", err);
  }
});

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

// --- [검증 로직] ---
const idValidationMessage = computed(() => {
  if (userid.value.length === 0) return "";
  if (userid.value.length < 4 || userid.value.length > 15)
    return "아이디는 4~15글자로 입력해주세요.";
  return "";
});

const passwordValidationMessage = computed(() => {
  if (confirmPassword.value.length === 0) return "";
  if (password.value !== confirmPassword.value)
    return "비밀번호가 일치하지 않습니다.";
  return "";
});

// --- [기능 함수] ---
const checkIdDuplication = async () => {
  // 1. 기본 길이 검증
  if (idValidationMessage.value) {
    modalMessage.value = idValidationMessage.value;
    showModal.value = true;
    return;
  }

  try {
    // 2. 서버에 중복 검사 요청
    const res = await axios.get(`/api/auth/check-id/${userid.value}`);

    // 3. 결과 처리
    if (res.data.exists) {
      idErrorMessage.value = "이미 등록된 아이디입니다.";
      isIdChecked.value = false;
    } else {
      idErrorMessage.value = "";
      isIdChecked.value = true;
      modalMessage.value = "사용 가능한 아이디입니다.";
      showModal.value = true;
    }
  } catch (err) {
    console.error(err);
    modalMessage.value = "중복 검사 중 오류 발생";
    showModal.value = true;
  }
};

// 이메일 인증번호 발송
const sendEmailVerification = async () => {
  if (!email.value) {
    modalMessage.value = "이메일을 입력해주세요.";
    showModal.value = true;
    return;
  }
  emailErrorMessage.value = "";
  authMessage.value = "";
  isSendingCode.value = true;
  try {
    // 0) 이메일 중복 체크 (member.email unique)
    const check = await axios.get("/api/auth/check-email", {
      params: { email: email.value },
    });
    if (check.data?.exists) {
      emailErrorMessage.value = "해당 이메일은 이미 가입되어있습니다.";
      showAuthSection.value = false;
      return;
    }

    // 재인증 시도를 위해 기존 상태 초기화
    isEmailVerified.value = false;
    authCodeInput.value = "";
    const res = await axios.post("/api/verifi/join", { email: email.value });
    authMessage.value = res.data.message || "인증번호가 발송되었습니다.";
    showAuthSection.value = true;
    startTimer(); // 3분 타이머
  } catch (err) {
    authMessage.value =
      err.response?.data?.message || "인증번호 발송에 실패했습니다.";
  } finally {
    isSendingCode.value = false;
  }
};
// 인증 타이머
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
      isEmailVerified.value = false;
    }
  }, 1000);
};

// 인증번호 확인
const confirmAuthCode = async () => {
  if (!authCodeInput.value) {
    authMessage.value = "인증번호를 입력해주세요.";
    return;
  }
  authMessage.value = "";
  isVerifying.value = true;
  try {
    const res = await axios.post("/api/verifi/verify", {
      email: email.value,
      code: authCodeInput.value,
      purpose: "i0_10",
    });
    authMessage.value = res.data.message || "인증이 완료되었습니다.";
    isEmailVerified.value = true;

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  } catch (err) {
    authMessage.value =
      err.response?.data?.message ||
      "인증번호가 일치하지 않습니다 인증 번호를 다시 발급받아주세요.";
    // 인증 실패 시 타이머 종료 → 재인증 버튼 활성화
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    countdown.value = 0;
  } finally {
    isVerifying.value = false;
  }
};

const selectUserType = (type) => {
  userType.value = type;
};

const handleSignUp = async () => {
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
  if (!address.value.trim() || !detailAddress.value.trim()) {
    modalMessage.value = "주소를 입력해주세요.";
    showModal.value = true;
    return;
  }
  if (password.value !== confirmPassword.value) {
    alert("비밀번호 확인 요망");
    return;
  }

  try {
    const userInfo = {
      m_id: userid.value,
      m_pw: password.value,
      m_nm: name.value,
      m_email: email.value,
      m_tel: tel.value.replace(/\D/g, ""), // 숫자만 추출, 하이픈이나 다른 문자, 공백 전부 제거
      m_bd: bd.value,
      m_add: `(${zipCode.value}) ${address.value} ${detailAddress.value}`
        .replace(/\s+/g, " ")
        .trim(), // (우편번호) 기본주소 상세주소 형식
      // 우편번호 기준으로 가까운 기관 선택할 거라 필요함
      m_auth: authCodeMap[userType.value] || "a0_21", // 기본값은 일반회원
      m_org: org.value || null,
    };

    const res = await axios.post("/api/auth/sign-up", userInfo);

    if (res.data.success) {
      alert("회원가입 완료! 로그인 페이지로 이동합니다.");
      // 로그인 페이지 이동 등
      router.push("/signin");
    } else {
      alert(res.data.message);
    }
  } catch (err) {
    console.error(err);
    alert("회원가입 실패");
  }
};
const fetchInstitutionsByZip = async (zip) => {
  try {
    const res = await axios.get(`/api/institution/by-zip/${zip}`);
    institutions.value = res.data || [];
  } catch (err) {
    console.error("기관 조회 실패:", err);
  }
};

const searchAddress = () => {
  new window.daum.Postcode({
    oncomplete: function (data) {
      // 도로명 주소
      address.value = data.roadAddress || data.jibunAddress;

      // 우편번호
      zipCode.value = data.zonecode;

      // 주소 기반 기관 조회
      fetchInstitutionsByZip(data.zonecode);
    },
  }).open();
};
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

            <!-- 수정: 회원 유형 버튼 선택 시 색상 표시 -->
            <div class="row px-xl-5 px-sm-4 px-3 mb-4 text-center">
              <div class="col-4 px-1">
                <!-- 기본적으로 일반회원이 선택되게 설정 -->
                <argon-button
                  :variant="userType === '일반회원' ? 'gradient' : 'outline'"
                  :color="userType === '일반회원' ? 'success' : 'secondary'"
                  fullWidth
                  class="rounded-0 py-2 text-nowrap"
                  @click="selectUserType('일반회원')"
                >
                  일반 회원
                </argon-button>
              </div>
              <div class="col-4 px-1">
                <argon-button
                  :variant="userType === '기관담당자' ? 'gradient' : 'outline'"
                  :color="userType === '기관담당자' ? 'success' : 'secondary'"
                  fullWidth
                  class="rounded-0 py-2 text-nowrap"
                  @click="selectUserType('기관담당자')"
                >
                  기관 담당자
                </argon-button>
              </div>
              <div class="col-4 px-1">
                <argon-button
                  :variant="userType === '기관관리자' ? 'gradient' : 'outline'"
                  :color="userType === '기관관리자' ? 'success' : 'secondary'"
                  fullWidth
                  class="rounded-0 py-2 text-nowrap"
                  @click="selectUserType('기관관리자')"
                >
                  기관 관리자
                </argon-button>
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

                <!-- 이메일 -->
                <div class="mb-3">
                  <div class="d-flex gap-2">
                    <argon-input
                      v-model="email"
                      type="email"
                      placeholder="이메일"
                      size="lg"
                      class="rounded-0 flex-grow-1 mb-0"
                      @input="
                        emailErrorMessage = '';
                        isEmailVerified = false;
                        showAuthSection = false;
                        authCodeInput = '';
                        authMessage = '';
                        countdown = 0;
                        if (timerInterval) {
                          clearInterval(timerInterval);
                          timerInterval = null;
                        }
                      "
                    />
                    <argon-button
                      type="button"
                      variant="outline"
                      color="success"
                      class="rounded-0 text-nowrap"
                      style="height: 46px"
                      :disabled="emailButtonDisabled"
                      @click="sendEmailVerification"
                    >
                      {{ emailButtonLabel }}
                    </argon-button>
                  </div>
                  <p
                    v-if="emailErrorMessage"
                    class="text-danger text-xs mt-1 mb-0 ps-1"
                  >
                    {{ emailErrorMessage }}
                  </p>
                  <!-- 인증번호 입력 (발송 후 표시) -->
                  <div v-if="showAuthSection && !isEmailVerified" class="mt-2">
                    <div class="d-flex gap-2">
                      <argon-input
                        v-model="authCodeInput"
                        placeholder="인증번호 6자리"
                        class="rounded-0 flex-grow-1"
                        maxlength="6"
                      />
                      <argon-button
                        type="button"
                        variant="outline"
                        color="dark"
                        class="rounded-0 text-nowrap"
                        style="height: 46px"
                        :disabled="isVerifying"
                        @click="confirmAuthCode"
                      >
                        {{ isVerifying ? "확인중..." : "인증" }}
                      </argon-button>
                    </div>
                    <p
                      v-if="authMessage"
                      :class="[
                        'text-xs mt-1 mb-0 ps-1',
                        isEmailVerified ||
                        authMessage.includes('완료') ||
                        authMessage.includes('발송')
                          ? 'text-success'
                          : 'text-danger',
                      ]"
                    >
                      {{ authMessage }}
                    </p>
                    <p
                      v-if="countdown > 0 && !isEmailVerified"
                      class="text-danger text-xs mt-1 mb-0 ps-1"
                    >
                      남은 시간 :
                      {{ Math.floor(countdown / 60) }}:
                      {{ String(countdown % 60).padStart(2, "0") }}
                    </p>
                  </div>
                </div>

                <!-- 연락처 -->
                <div class="mb-3">
                  <input
                    v-model="tel"
                    type="tel"
                    maxlength="11"
                    placeholder="연락처 (숫자만 입력해주세요)"
                    size="lg"
                    class="rounded-3 form-control form-control-lg mb-3"
                  />
                </div>

                <!-- 생년월일 -->
                <input
                  v-model="bd"
                  type="text"
                  placeholder="생년월일을 선택해주세요"
                  size="lg"
                  class="rounded-3 form-control form-control-lg mb-3"
                  @focus="(e) => (e.target.type = 'date')"
                  @blur="
                    (e) => {
                      if (!bd) e.target.type = 'text';
                    }
                  "
                />

                <!-- 주소 -->
                <div class="mb-3">
                  <div class="d-flex gap-2 mb-2">
                    <input
                      v-model="zipCode"
                      placeholder="우편번호"
                      readonly
                      class="form-control"
                    />

                    <argon-button
                      type="button"
                      variant="outline"
                      color="success"
                      class="rounded-0 text-nowrap"
                      style="height: 46px"
                      @click="searchAddress"
                    >
                      주소 검색
                    </argon-button>
                  </div>

                  <input
                    v-model="address"
                    placeholder="기본 주소"
                    readonly
                    class="mb-2 form-control form-control-lg"
                  />

                  <argon-input
                    v-model="detailAddress"
                    placeholder="상세 주소를 입력해주세요"
                  />
                </div>

                <!-- 기관 선택 -->
                <select
                  v-model="org"
                  class="form-select form-select-lg rounded-0 border-gray-300"
                  style="height: 46px; font-size: 0.875rem"
                >
                  <option disabled value="">기관을 선택해주세요</option>

                  <option
                    v-for="item in filteredOrganList"
                    :key="item.organ_no"
                    :value="item.organ_no"
                  >
                    {{ item.organ_name }}
                  </option>
                </select>
                <!-- 기관 선택 테스트 -->
                <div v-if="institutions.length > 0" class="mt-3">
                  <label class="form-label">아래 기관을 선택해주세요</label>
                  <select v-model="selectedInstitution" class="form-control">
                    <option value="">기관 선택</option>
                    <option
                      v-for="inst in institutions"
                      :key="inst.inst_id"
                      :value="inst.inst_id"
                    >
                      {{ inst.inst_name }}
                    </option>
                  </select>
                </div>
                <div class="text-center mt-4">
                  <argon-button
                    type="submit"
                    fullWidth
                    color="success"
                    variant="gradient"
                    class="rounded-0"
                    size="lg"
                    >가입하기</argon-button
                  >
                </div>
                <div class="text-center mt-3">
                  <span
                    class="text-xs text-secondary"
                    style="cursor: pointer; text-decoration: underline"
                    @click="goToSignin"
                  >
                    - 로그인 화면 이동 -
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- 모달: 알림 -->
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
