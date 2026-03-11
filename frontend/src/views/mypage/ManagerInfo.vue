<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useAuthStore } from "@/store/auth";

// Argon components
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import AlertModal from "@/views/modal/AlertModal.vue";
import { useVerificationTimer } from "@/composables/useVerificationTimer";

const authStore = useAuthStore();

// 담당자 정보 (백엔드 연동: organ_name, m_tel, m_add 포함)
const managerInfo = ref({
  orgName: "",
  userId: "",
  phone: "",
  email: "",
  address: "",
});
const userName = ref("");

const isEditMode = ref(false);
const saving = ref(false);

const originalEmail = ref("");

const {
  countdown: emailCountdown,
  startTimer: startEmailTimer,
  stopTimer: stopEmailTimer,
} = useVerificationTimer("verifi_end_mypage_managerinfo_email", 180);

const emailAuthSectionVisible = ref(false);
const emailAuthCodeInput = ref("");
const emailAuthMessage = ref("");
const isEmailAuthSending = ref(false);
const isEmailAuthChecking = ref(false);
const isEmailAuthVerified = ref(false);

const isEmailChanged = computed(
  () =>
    (managerInfo.value.email ?? "").trim() !==
    (originalEmail.value ?? "").trim(),
);

const emailAuthButtonLabel = computed(() => {
  if (isEmailAuthVerified.value) return "완료";
  if (isEmailAuthSending.value) return "발송 중...";
  if (emailAuthSectionVisible.value && emailCountdown.value === 0)
    return "재발송";
  return "인증";
});

const emailAuthButtonDisabled = computed(() => {
  if (!isEmailChanged.value) return true;
  return (
    isEmailAuthVerified.value ||
    isEmailAuthSending.value ||
    (emailAuthSectionVisible.value && emailCountdown.value > 0)
  );
});

const alertModal = ref({
  show: false,
  type: "error",
  title: "알림",
  message: "",
});

function showAlert(type, title, message) {
  alertModal.value = {
    show: true,
    type,
    title: title ?? "알림",
    message: message ?? "",
  };
}

function resetEmailAuthState() {
  stopEmailTimer();
  emailAuthSectionVisible.value = false;
  emailAuthCodeInput.value = "";
  emailAuthMessage.value = "";
  isEmailAuthSending.value = false;
  isEmailAuthChecking.value = false;
  isEmailAuthVerified.value = false;
}

// API 응답이 배열이면 첫 번째 행 사용 (호환)
function normalizeProfile(data) {
  if (!data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return row && typeof row === "object" ? row : null;
}

// 로그인 사용자(m_no) 기준으로 프로필 조회
const loadMyInfo = async () => {
  const mNo = authStore.user?.m_no;
  if (!mNo) return;
  try {
    const res = await fetch(`/api/apply/mypage/profile?m_no=${encodeURIComponent(mNo)}`);
    if (!res.ok) throw new Error("프로필 조회 실패");
    const raw = await res.json();
    const data = normalizeProfile(raw);
    if (data) {
      managerInfo.value = {
        orgName: data.organ_name ?? "",
        userId: data.m_id ?? "",
        phone: data.m_tel ?? "",
        email: data.m_email ?? "",
        address: data.m_add ?? "",
      };
      userName.value = data.m_nm ?? "";
      originalEmail.value = managerInfo.value.email ?? "";
    }
  } catch (e) {
    console.error(e);
    showAlert("error", "알림", "정보를 불러오지 못했습니다.");
  }
};

onMounted(() => {
  loadMyInfo();
});

const toggleEdit = () => {
  if (!isEditMode.value) {
    originalEmail.value = managerInfo.value.email ?? "";
    resetEmailAuthState();
    isEditMode.value = true;
  } else {
    isEditMode.value = false;
    resetEmailAuthState();
  }
};

const saveInfo = async () => {
  const mNo = authStore.user?.m_no;
  if (!mNo) {
    showAlert("error", "알림", "로그인 정보가 없습니다.");
    return;
  }
  const emailChanged =
    (managerInfo.value.email ?? "").trim() !==
    (originalEmail.value ?? "").trim();
  if (emailChanged && !isEmailAuthVerified.value) {
    showAlert("error", "알림", "이메일 인증을 완료해주세요.");
    return;
  }
  saving.value = true;
  try {
    const res = await fetch("/api/apply/mypage/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        m_no: mNo,
        m_tel: managerInfo.value.phone,
        m_email: managerInfo.value.email,
        m_add: managerInfo.value.address,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "저장 실패");
    }
    showAlert("success", "알림", "정보가 수정되었습니다.");
    isEditMode.value = false;
  } catch (e) {
    showAlert("error", "알림", e.message || "저장에 실패했습니다.");
  } finally {
    saving.value = false;
  }
};

watch(
  () => managerInfo.value.email,
  (val) => {
    if (!isEditMode.value) return;
    if ((val ?? "").trim() !== (originalEmail.value ?? "").trim()) {
      resetEmailAuthState();
    }
  },
);

async function sendManagerEmailVerification() {
  const email = (managerInfo.value.email ?? "").trim();
  if (!email) {
    showAlert("error", "알림", "이메일을 입력해주세요.");
    return;
  }
  if (!isEmailChanged.value) {
    showAlert("info", "알림", "이메일을 변경한 후 인증을 진행해 주세요.");
    return;
  }
  isEmailAuthSending.value = true;
  emailAuthMessage.value = "";
  try {
    const checkRes = await fetch(
      `/api/auth/check-email?email=${encodeURIComponent(email)}`,
    );
    if (checkRes.ok) {
      const body = await checkRes.json().catch(() => ({}));
      if (body?.exists) {
        emailAuthMessage.value = "해당 이메일은 이미 사용 중입니다.";
        showAlert("error", "알림", emailAuthMessage.value);
        emailAuthSectionVisible.value = false;
        stopEmailTimer();
        return;
      }
    }

    await fetch("/api/verifi/expire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "i0_10" }),
    }).catch(() => {});

    const mNo = authStore.user?.m_no || null;
    const res = await fetch("/api/verifi/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, m_no: mNo }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "인증번호 발송에 실패했습니다.");
    }
    emailAuthMessage.value =
      data.message || "인증번호가 발송되었습니다.";
    emailAuthSectionVisible.value = true;
    isEmailAuthVerified.value = false;
    emailAuthCodeInput.value = "";
    startEmailTimer(async () => {
      emailAuthMessage.value =
        "인증시간이 만료되었습니다. 다시 요청해주세요.";
      isEmailAuthVerified.value = false;
      await fetch("/api/verifi/expire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "i0_10" }),
      }).catch(() => {});
    });
  } catch (e) {
    emailAuthMessage.value =
      e.message || "인증번호 발송에 실패했습니다.";
    showAlert("error", "알림", emailAuthMessage.value);
  } finally {
    isEmailAuthSending.value = false;
  }
}

async function confirmManagerEmailCode() {
  const email = (managerInfo.value.email ?? "").trim();
  if (!emailAuthSectionVisible.value) {
    emailAuthMessage.value = "먼저 인증번호를 발송해 주세요.";
    return;
  }
  if (!emailAuthCodeInput.value) {
    emailAuthMessage.value = "인증번호를 입력해주세요.";
    return;
  }
  isEmailAuthChecking.value = true;
  emailAuthMessage.value = "";
  try {
    const res = await fetch("/api/verifi/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        code: emailAuthCodeInput.value,
        purpose: "i0_10",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "인증에 실패했습니다.");
    }
    isEmailAuthVerified.value = true;
    stopEmailTimer();
    emailAuthMessage.value = data.message || "인증 성공";
  } catch (e) {
    emailAuthMessage.value =
      e.message || "인증에 실패했습니다. 다시 시도해주세요.";
    isEmailAuthVerified.value = false;
    stopEmailTimer();
    emailCountdown.value = 0;
  } finally {
    isEmailAuthChecking.value = false;
  }
}

onBeforeUnmount(() => {
  stopEmailTimer();
});
</script>

<template>
  <div class="organ-manager-page">
    <div class="container-fluid py-4">
      <div class="row justify-content-center">
        <div class="col-xl-7 col-lg-8 col-md-10">
          <!-- Argon card -->
          <div class="card organ-card shadow-lg border-0">
            <!-- Header - Argon gradient -->
            <div class="card-header organ-card-header p-4 pb-3">
              <div
                class="d-flex justify-content-between align-items-center flex-wrap gap-3"
              >
                <div>
                  <h5 class="text-white mb-1 font-weight-bolder">
                    기관 담당자
                  </h5>
                  <p class="text-white text-sm opacity-9 mb-0">
                    {{ userName || "담당자" }}님 반갑습니다.
                  </p>
                </div>

                <!-- 수정 버튼 - 잘 보이게 -->
                <ArgonButton
                  color="white"
                  variant="fill"
                  size="md"
                  class="btn-edit-header"
                  @click="toggleEdit"
                >
                  {{ isEditMode ? "취소" : "정보수정" }}
                </ArgonButton>
              </div>
            </div>

            <!-- Body - Argon form style -->
            <div class="card-body pt-4 pb-4">
              <div class="form-vertical">
                <div class="form-item">
                  <label class="form-label">소속 기관</label>
                  <ArgonInput
                    v-model="managerInfo.orgName"
                    readonly
                    disabled
                    class="organ-input"
                  />
                </div>

                <div class="form-item">
                  <label class="form-label">아이디</label>
                  <ArgonInput
                    v-model="managerInfo.userId"
                    readonly
                    disabled
                    class="organ-input"
                  />
                </div>

                <div class="form-item">
                  <label class="form-label">연락처</label>
                  <ArgonInput
                    v-model="managerInfo.phone"
                    type="text"
                    inputmode="numeric"
                    maxlength="11"
                    :disabled="!isEditMode"
                    class="organ-input"
                    @input="managerInfo.phone = managerInfo.phone.replace(/\D/g, '').slice(0, 11)"
                    @paste.prevent
                  />
                </div>

                <div class="form-item">
                  <label class="form-label">이메일</label>
                  <div class="w-100">
                    <ArgonInput
                      v-model="managerInfo.email"
                      :disabled="!isEditMode"
                      class="organ-input"
                    />
                    <div
                      v-if="isEditMode"
                      class="d-flex align-items-center gap-2 mt-2"
                    >
                      <ArgonButton
                        type="button"
                        size="sm"
                        variant="outline"
                        color="success"
                        :disabled="emailAuthButtonDisabled"
                        @click="sendManagerEmailVerification"
                      >
                        {{ emailAuthButtonLabel }}
                      </ArgonButton>
                      <span
                        v-if="emailCountdown > 0 && !isEmailAuthVerified"
                        class="text-xs text-muted"
                      >
                        {{ emailCountdown }}초 남음
                      </span>
                    </div>
                    <div
                      v-if="isEditMode && emailAuthSectionVisible"
                      class="mt-2"
                    >
                      <div class="d-flex gap-2">
                        <ArgonInput
                          v-model="emailAuthCodeInput"
                          placeholder="인증번호 6자리를 입력하세요."
                          size="sm"
                        />
                        <ArgonButton
                          type="button"
                          size="sm"
                          color="primary"
                        class="email-auth-confirm-btn"
                          :disabled="
                            isEmailAuthChecking || isEmailAuthVerified
                          "
                          @click="confirmManagerEmailCode"
                        >
                          {{ isEmailAuthVerified ? "완료" : "확인" }}
                        </ArgonButton>
                      </div>
                      <p
                        v-if="emailAuthMessage"
                        class="text-xs mt-1"
                        :class="
                          isEmailAuthVerified ? 'text-success' : 'text-danger'
                        "
                      >
                        {{ emailAuthMessage }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="form-item">
                  <label class="form-label">주소</label>
                  <ArgonInput
                    v-model="managerInfo.address"
                    :disabled="!isEditMode"
                    class="organ-input"
                  />
                </div>
              </div>

              <!-- 저장 - Argon gradient button -->
              <div
                v-if="isEditMode"
                class="d-flex justify-content-end mt-4 pt-3"
              >
                <ArgonButton
                  color="success"
                  variant="gradient"
                  size="md"
                  class="btn-save"
                  :disabled="saving"
                  @click="saveInfo"
                >
                  {{ saving ? "저장 중..." : "저장" }}
                </ArgonButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <AlertModal
    :show="alertModal.show"
    :type="alertModal.type"
    :title="alertModal.title"
    :message="alertModal.message"
    @close="alertModal.show = false"
  />
</template>

<style scoped>
.organ-manager-page {
  min-height: 100%;
  background: linear-gradient(
    180deg,
    rgba(248, 249, 250, 0.5) 0%,
    rgba(255, 255, 255, 1) 100%
  );
}

/* Card - Argon style */
.organ-card {
  border-radius: 1rem;
  overflow: hidden;
  transition: box-shadow 0.25s ease;
}

.organ-card:hover {
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.12) !important;
}

.organ-card-header {
  background: linear-gradient(310deg, #5e72e4 0%, #825ee4 100%);
  border: 0;
  border-radius: 0;
}

/* Form - Argon typography */
.form-vertical {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #344767;
  margin-bottom: 0.5rem;
}

.organ-input :deep(.form-control) {
  border-radius: 0.5rem;
  border: 1px solid #d2d6da;
  padding: 0.6rem 0.875rem;
  font-size: 0.875rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.organ-input :deep(.form-control:focus) {
  border-color: #5e72e4;
  box-shadow: 0 3px 9px rgba(94, 114, 228, 0.25);
  outline: 0;
}

.organ-input :deep(.form-control:disabled) {
  background-color: #f8f9fa;
  color: #67748e;
}

/* 가입일 등 수정 불가 항목 */
.organ-readonly {
  border-radius: 0.5rem;
  border: 1px solid #e9ecef;
  padding: 0.6rem 0.875rem;
  font-size: 0.875rem;
  color: #67748e;
  background-color: #f8f9fa;
}

.email-auth-confirm-btn {
  height: 38px;
  display: inline-flex;
  align-items: center;
}

/* 수정 버튼 - 잘 보이게 */
.btn-edit-header {
  font-weight: 700 !important;
  color: #344767 !important;
  background: #fff !important;
  border: none !important;
  border-radius: 0.5rem !important;
  padding: 0.6rem 1.25rem !important;
  min-width: 6rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2) !important;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.btn-edit-header:hover {
  color: #1a202c !important;
  background: #fff !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25) !important;
}

/* 저장 버튼 */
.btn-save {
  border-radius: 0.5rem;
  font-weight: 600;
  padding: 0.6rem 1.5rem;
  box-shadow: 0 4px 14px rgba(45, 206, 137, 0.4);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.btn-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(45, 206, 137, 0.5);
}
</style>

