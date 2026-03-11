<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { useAuthStore } from "@/store/auth";
import ArgonButton from "@/components/ArgonButton.vue";
import ArgonInput from "@/components/ArgonInput.vue";
import AlertModal from "@/views/modal/AlertModal.vue";
import { useVerificationTimer } from "@/composables/useVerificationTimer";

const authStore = useAuthStore();

/* ================= 회원 정보 (백엔드 연동) ================= */
const member = ref({
  m_no: "",
  m_id: "",
  m_bd: "",
  m_tel: "",
  m_email: "",
  m_add: "",
});
const memberLoading = ref(false);
const isEditMode = ref(false);

const editForm = ref({
  m_tel: "",
  m_email: "",
  m_add: "",
});

const {
  countdown: emailCountdown,
  startTimer: startEmailTimer,
  stopTimer: stopEmailTimer,
} = useVerificationTimer("verifi_end_mypage_email", 180);

const emailAuthSectionVisible = ref(false);
const emailAuthCodeInput = ref("");
const emailAuthMessage = ref("");
const isEmailAuthSending = ref(false);
const isEmailAuthChecking = ref(false);
const isEmailAuthVerified = ref(false);
const lastVerifiedEmail = ref("");

const isEmailChanged = computed(
  () =>
    (editForm.value.m_email ?? "").trim() !==
    (member.value.m_email ?? "").trim(),
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

function resetEmailAuthState() {
  stopEmailTimer();
  emailAuthSectionVisible.value = false;
  emailAuthCodeInput.value = "";
  emailAuthMessage.value = "";
  isEmailAuthSending.value = false;
  isEmailAuthChecking.value = false;
  isEmailAuthVerified.value = false;
  lastVerifiedEmail.value = "";
}

/** 회원정보: 백엔드 m_bd, m_tel, m_add 사용. 로그인 정보로 보강 */
async function loadMemberProfile() {
  const u = authStore.user;
  const mNo = u?.m_no;
  if (!mNo) return;
  member.value = {
    m_no: u.m_no ?? "",
    m_id: u.m_id ?? "",
    m_bd: u.m_bd ?? "",
    m_tel: u.m_tel ?? "",
    m_email: u.m_email ?? "",
    m_add: u.m_add ?? "",
  };
  memberLoading.value = true;
  try {
    const res = await fetch(
      `/api/apply/mypage/profile?m_no=${encodeURIComponent(mNo)}`,
    );
    const data = await res.json();
    if (res.ok && data && data.m_no) {
      member.value.m_no = data.m_no ?? member.value.m_no;
      member.value.m_id = data.m_id ?? member.value.m_id;
      member.value.m_bd = data.m_bd ?? member.value.m_bd;
      member.value.m_tel = data.m_tel ?? member.value.m_tel;
      member.value.m_email = data.m_email ?? member.value.m_email;
      member.value.m_add = data.m_add ?? member.value.m_add;
    }
    editForm.value.m_tel = member.value.m_tel ?? "";
    editForm.value.m_email = member.value.m_email ?? "";
    editForm.value.m_add = member.value.m_add ?? "";
  } catch (e) {
    editForm.value.m_tel = member.value.m_tel ?? "";
    editForm.value.m_email = member.value.m_email ?? "";
    editForm.value.m_add = member.value.m_add ?? "";
  } finally {
    memberLoading.value = false;
  }
}

const startEdit = () => {
  editForm.value.m_tel = member.value.m_tel ?? "";
  editForm.value.m_email = member.value.m_email ?? "";
  editForm.value.m_add = member.value.m_add ?? "";
  isEditMode.value = true;
  resetEmailAuthState();
};

/** 회원정보 저장 (skipClose: true면 blur 시 자동 저장, 알림/모드 전환 없음) */
const saveEdit = async (skipClose = false) => {
  const mNo = member.value.m_no || authStore.user?.m_no;
  if (!mNo) {
    if (!skipClose) showAlert("error", "알림", "로그인 정보가 없습니다.");
    return;
  }
  const tel = (editForm.value.m_tel ?? "").trim();
  const email = (editForm.value.m_email ?? "").trim();
  const add = (editForm.value.m_add ?? "").trim();
   const emailChanged = email !== (member.value.m_email ?? "");
   if (!skipClose && emailChanged && !isEmailAuthVerified.value) {
     showAlert("error", "알림", "이메일 인증을 완료해주세요.");
     return;
   }
  try {
    const res = await fetch("/api/apply/mypage/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        m_no: mNo,
        m_tel: tel,
        m_email: email,
        m_add: add,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "저장에 실패했습니다.");
    }
    member.value.m_tel = tel;
    member.value.m_email = email;
    member.value.m_add = add;
    if (authStore.user) {
      authStore.user.m_tel = tel;
      authStore.user.m_email = email;
      authStore.user.m_add = add;
    }
    if (!skipClose) {
      isEditMode.value = false;
      showAlert("success", "알림", "성공적으로 저장되었습니다.");
    }
  } catch (e) {
    if (!skipClose) {
      showAlert("error", "알림", e.message || "저장에 실패했습니다.");
    }
  }
};

/** 수정 모드에서 입력 필드 blur 시 값이 변동된 경우에만 백엔드 저장 */
const onProfileFieldBlur = () => {
  // 자동 저장은 사용하지 않고, '저장' 버튼으로만 저장 처리
  if (!isEditMode.value) return;
};

watch(
  () => editForm.value.m_email,
  (val) => {
    if (!isEditMode.value) return;
    if ((val ?? "").trim() !== (member.value.m_email ?? "").trim()) {
      resetEmailAuthState();
    }
  },
);

async function sendProfileEmailVerification() {
  const email = (editForm.value.m_email ?? "").trim();
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
    // 이메일 중복 체크
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

    // 이전 인증 만료 처리
    await fetch("/api/verifi/expire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "i0_10" }),
    }).catch(() => {});

    const mNo = member.value.m_no || authStore.user?.m_no || null;
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

async function confirmProfileEmailCode() {
  const email = (editForm.value.m_email ?? "").trim();
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
    lastVerifiedEmail.value = email;
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

const cancelEdit = () => {
  isEditMode.value = false;
};

/* ================= 지원대상자 (dsbl_prs, 백엔드 연동) ================= */
const applicants = ref([]);
const applicantsLoading = ref(false);

async function loadApplicants() {
  const gdnNo = authStore.user?.m_no;
  if (!gdnNo) return;
  applicantsLoading.value = true;
  try {
    const res = await fetch(
      `/api/apply/dsbl-prs?gdn_no=${encodeURIComponent(gdnNo)}`,
    );
    const data = await res.json();
    applicants.value = Array.isArray(data) ? data : [];
  } catch (e) {
    applicants.value = [];
  } finally {
    applicantsLoading.value = false;
  }
}

const selectedApplicant = ref(null);
const totalCount = computed(() => applicants.value.length);

const isApplicantEditMode = ref(false);
const applicantSaving = ref(false);

const applicantEditForm = ref({
  mc_nm: "",
  mc_bd: "",
  mc_gender: "b0_00",
  mc_address: "",
  mc_type: "",
  mc_submitdate: "",
});

/** 성별 코드 → 표시: b0_00 남자, b0_10 여자 */
function genderLabel(code) {
  if (code === "b0_10") return "여자";
  return "남자";
}

const selectApplicant = (a) => {
  selectedApplicant.value = a;
  isApplicantEditMode.value = false;
};

const isSelectedApplicant = (a) => selectedApplicant.value?.mc_pn === a?.mc_pn;

const startApplicantEdit = () => {
  if (!selectedApplicant.value) return;
  const a = selectedApplicant.value;
  applicantEditForm.value = {
    mc_nm: a.mc_nm ?? "",
    mc_bd: (a.mc_bd && String(a.mc_bd).slice(0, 10)) ?? "",
    mc_gender: a.mc_gender === "b0_10" ? "b0_10" : "b0_00",
    mc_address: a.mc_address ?? "",
    mc_type: a.mc_type ?? "",
    mc_submitdate:
      (a.mc_submitdate && String(a.mc_submitdate).slice(0, 10)) ?? "",
  };
  isApplicantEditMode.value = true;
};

const saveApplicantEdit = async () => {
  const a = selectedApplicant.value;
  const gdnNo = authStore.user?.m_no;
  if (!a?.mc_pn || !gdnNo) return;
  applicantSaving.value = true;
  try {
    const res = await fetch(
      `/api/apply/dsbl-prs/${encodeURIComponent(a.mc_pn)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gdn_no: gdnNo,
          mc_nm: (applicantEditForm.value.mc_nm ?? "").trim(),
          mc_bd: applicantEditForm.value.mc_bd || null,
          mc_gender:
            applicantEditForm.value.mc_gender === "b0_10" ? "b0_10" : "b0_00",
          mc_address: (applicantEditForm.value.mc_address ?? "").trim(),
          mc_type: (applicantEditForm.value.mc_type ?? "").trim(),
          mc_submitdate: applicantEditForm.value.mc_submitdate || null,
        }),
      },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "저장에 실패했습니다.");
    }
    Object.assign(a, {
      mc_nm: applicantEditForm.value.mc_nm,
      mc_bd: applicantEditForm.value.mc_bd,
      mc_gender: applicantEditForm.value.mc_gender,
      mc_address: applicantEditForm.value.mc_address,
      mc_type: applicantEditForm.value.mc_type,
      mc_submitdate: applicantEditForm.value.mc_submitdate,
    });
    isApplicantEditMode.value = false;
    showAlert("success", "알림", "지원대상자 정보가 수정되었습니다.");
  } catch (e) {
    showAlert("error", "알림", e.message || "저장에 실패했습니다.");
  } finally {
    applicantSaving.value = false;
  }
};

const cancelApplicantEdit = () => {
  isApplicantEditMode.value = false;
};

onMounted(() => {
  loadMemberProfile();
  loadApplicants();
});

onBeforeUnmount(() => {
  stopEmailTimer();
});

/* ================= 모달 ================= */
const showModal = ref(false);

const newApplicant = ref({
  mc_nm: "",
  mc_bd: "",
  mc_gender: "b0_00",
  mc_address: "",
  mc_types: [""],
});

// 등록일: 항상 오늘(날짜 선택 없음, 백엔드에서 today 고정)
const todayYmd = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const openModal = () => (showModal.value = true);
const closeModal = () => (showModal.value = false);

const addDisabilityTypeField = () => {
  newApplicant.value.mc_types.push("");
};

const removeDisabilityTypeField = (idx) => {
  if (newApplicant.value.mc_types.length <= 1) {
    newApplicant.value.mc_types[0] = "";
    return;
  }
  newApplicant.value.mc_types.splice(idx, 1);
};

const addApplicantSaving = ref(false);

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

const addApplicant = async () => {
  if (!newApplicant.value.mc_nm?.trim()) {
    showAlert("error", "알림", "이름을 입력하세요.");
    return;
  }

  const disabilityTypes = newApplicant.value.mc_types
    .map((t) => String(t ?? "").trim())
    .filter(Boolean);

  if (disabilityTypes.length === 0) {
    showAlert("error", "알림", "장애유형을 1개 이상 입력하세요.");
    return;
  }

  const gdnNo = authStore.user?.m_no;
  if (!gdnNo) {
    showAlert("error", "알림", "로그인 정보가 없습니다.");
    return;
  }

  addApplicantSaving.value = true;
  try {
    const res = await fetch("/api/apply/dsbl-prs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gdn_no: gdnNo,
        mc_nm: newApplicant.value.mc_nm.trim(),
        mc_bd: newApplicant.value.mc_bd || null,
        mc_gender: newApplicant.value.mc_gender === "b0_10" ? "b0_10" : "b0_00",
        mc_address: (newApplicant.value.mc_address ?? "").trim(),
        mc_type: disabilityTypes.join(", "),
        // 등록일(mc_submitdate)은 백엔드에서 today()로 고정 저장
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "등록에 실패했습니다.");
    }
    await loadApplicants();
    newApplicant.value = {
      mc_nm: "",
      mc_bd: "",
      mc_gender: "b0_00",
      mc_address: "",
      mc_types: [""],
    };
    showModal.value = false;
    showAlert("success", "알림", "지원대상자가 등록되었습니다.");
  } catch (e) {
    showAlert("error", "알림", e.message || "등록에 실패했습니다.");
  } finally {
    addApplicantSaving.value = false;
  }
};

/** 주소찾기: 회원가입(Signup)과 동일하게 다음(다움) 주소 API 사용 */
const findAddress = () => {
  if (typeof window.daum === "undefined" || !window.daum.Postcode) {
    showAlert(
      "error",
      "알림",
      "주소 검색 서비스를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.",
    );
    return;
  }
  new window.daum.Postcode({
    oncomplete: function (data) {
      newApplicant.value.mc_address =
        data.roadAddress || data.jibunAddress || "";
    },
  }).open();
};
</script>

<template>
  <div class="container-fluid py-4">
    <div class="row g-4">
      <!-- LEFT -->
      <div class="col-lg-4">
        <div class="card shadow-lg border-0 h-100">
          <div class="card-header pb-0">
            <h5 class="mb-0">회원 정보</h5>
          </div>

          <div class="card-body pt-3">
            <div class="info-box">
              <div class="info-label">아이디</div>
              <div class="info-value">{{ member.m_id || "—" }}</div>
            </div>

            <div class="info-box">
              <div class="info-label">생년월일</div>
              <div class="info-value">
                {{ member.m_bd ? String(member.m_bd).slice(0, 10) : "—" }}
              </div>
            </div>

            <div v-if="memberLoading" class="text-muted text-sm">
              로딩 중...
            </div>
            <template v-else>
              <div class="info-box">
                <div class="info-label">연락처</div>
                <div v-if="!isEditMode" class="info-value">
                  {{ member.m_tel || "—" }}
                </div>
                <ArgonInput
                  v-else
                  type="text"
                  inputmode="numeric"
                  maxlength="11"
                  v-model="editForm.m_tel"
                  @blur="onProfileFieldBlur"
                  @input="editForm.m_tel = editForm.m_tel.replace(/\D/g, '').slice(0, 11)"
                  @paste.prevent
                />
              </div>

              <div class="info-box">
                <div class="info-label">이메일</div>
                <div v-if="!isEditMode" class="info-value">
                  {{ member.m_email || "—" }}
                </div>
                <div v-else class="w-100">
                  <ArgonInput
                    v-model="editForm.m_email"
                    @blur="onProfileFieldBlur"
                  />
                  <div class="d-flex align-items-center gap-2 mt-2">
                    <ArgonButton
                      type="button"
                      size="sm"
                      variant="outline"
                      color="success"
                      :disabled="emailAuthButtonDisabled"
                      @click="sendProfileEmailVerification"
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
                  <div v-if="emailAuthSectionVisible" class="mt-2">
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
                        :disabled="isEmailAuthChecking || isEmailAuthVerified"
                        @click="confirmProfileEmailCode"
                      >
                        {{ isEmailAuthVerified ? "완료" : "확인" }}
                      </ArgonButton>
                    </div>
                    <p v-if="emailAuthMessage" class="text-xs mt-1" :class="isEmailAuthVerified ? 'text-success' : 'text-danger'">
                      {{ emailAuthMessage }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="info-box">
                <div class="info-label">주소</div>
                <div v-if="!isEditMode" class="info-value">
                  {{ member.m_add || "—" }}
                </div>
                <ArgonInput
                  v-else
                  v-model="editForm.m_add"
                  @blur="onProfileFieldBlur"
                />
              </div>
            </template>

            <div class="mt-3">
              <ArgonButton
                v-if="!isEditMode"
                color="success"
                variant="gradient"
                class="w-100 mb-2"
                @click="startEdit"
              >
                회원정보 수정
              </ArgonButton>

              <div v-else class="d-flex gap-2 mb-2">
                <ArgonButton
                  type="button"
                  color="success"
                  variant="gradient"
                  class="w-100"
                  @click="saveEdit()"
                >
                  저장
                </ArgonButton>
                <ArgonButton
                  variant="outline"
                  color="secondary"
                  class="w-100"
                  @click="cancelEdit"
                >
                  취소
                </ArgonButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CENTER -->
      <div class="col-lg-4">
        <div class="card shadow-lg border-0 h-100">
          <div
            class="card-header pb-0 d-flex justify-content-between align-items-center"
          >
            <h5 class="mb-0">지원 대상자</h5>
            <span class="badge bg-gradient-primary">
              총 {{ totalCount }}명
            </span>
          </div>

          <div class="card-body">
            <p v-if="applicantsLoading" class="text-muted text-sm mb-2">
              로딩 중...
            </p>
            <ul class="list-group applicant-list">
              <li
                v-for="a in applicants"
                :key="a.mc_pn"
                class="list-group-item applicant-item"
                :class="{ 'applicant-item--active': isSelectedApplicant(a) }"
                role="button"
                @click="selectApplicant(a)"
              >
                <div class="applicant-name">
                  {{ a.mc_nm }}
                </div>
              </li>
            </ul>
            <ArgonButton
              color="success"
              variant="gradient"
              class="w-100 mt-3 mb-0"
              @click="openModal"
            >
              지원대상자 등록
            </ArgonButton>
          </div>
        </div>
      </div>

      <!-- RIGHT -->
      <div class="col-lg-4">
        <div class="card shadow-lg border-0 h-100">
          <div
            class="card-header pb-0 d-flex justify-content-between align-items-center"
          >
            <h5 class="mb-0">지원자 정보</h5>
            <ArgonButton
              v-if="selectedApplicant && !isApplicantEditMode"
              size="sm"
              color="info"
              variant="gradient"
              class="mb-0"
              @click="startApplicantEdit"
            >
              수정
            </ArgonButton>
          </div>

          <div class="card-body">
            <div v-if="!selectedApplicant" class="text-center text-muted py-5">
              중앙에서 지원자를 선택하세요
            </div>

            <div v-else>
              <div v-if="!isApplicantEditMode">
                <div class="info-box">
                  <div class="info-label">이름</div>
                  <div class="info-value">{{ selectedApplicant.mc_nm }}</div>
                </div>

                <div class="info-box">
                  <div class="info-label">생년월일</div>
                  <div class="info-value">
                    {{
                      selectedApplicant.mc_bd
                        ? String(selectedApplicant.mc_bd).slice(0, 10)
                        : "—"
                    }}
                  </div>
                </div>

                <div class="info-box">
                  <div class="info-label">성별</div>
                  <div class="info-value">
                    {{ genderLabel(selectedApplicant.mc_gender) }}
                  </div>
                </div>

                <div class="info-box">
                  <div class="info-label">주소</div>
                  <div class="info-value">
                    {{ selectedApplicant.mc_address }}
                  </div>
                </div>

                <div class="info-box">
                  <div class="info-label">장애유형</div>
                  <div class="info-value">{{ selectedApplicant.mc_type }}</div>
                </div>

                <div class="info-box">
                  <div class="info-label">등록일</div>
                  <div class="info-value">
                    {{
                      selectedApplicant.mc_submitdate
                        ? String(selectedApplicant.mc_submitdate).slice(0, 10)
                        : "—"
                    }}
                  </div>
                </div>
              </div>

              <div v-else>
                <div class="info-box">
                  <div class="info-label">이름</div>
                  <ArgonInput v-model="applicantEditForm.mc_nm" />
                </div>

                <div class="info-box">
                  <div class="info-label">생년월일</div>
                  <ArgonInput v-model="applicantEditForm.mc_bd" type="date" />
                </div>

                <div class="info-box">
                  <div class="info-label">성별</div>
                  <div class="d-flex align-items-center">
                    <label class="me-3 mb-0">
                      <input
                        type="radio"
                        value="b0_00"
                        v-model="applicantEditForm.mc_gender"
                      />
                      남자
                    </label>
                    <label class="mb-0">
                      <input
                        type="radio"
                        value="b0_10"
                        v-model="applicantEditForm.mc_gender"
                      />
                      여자
                    </label>
                  </div>
                </div>

                <div class="info-box">
                  <div class="info-label">주소</div>
                  <ArgonInput v-model="applicantEditForm.mc_address" />
                </div>

                <div class="info-box">
                  <div class="info-label">장애유형</div>
                  <ArgonInput v-model="applicantEditForm.mc_type" />
                </div>

                <div class="info-box">
                  <div class="info-label">등록일</div>
                  <ArgonInput
                    v-model="applicantEditForm.mc_submitdate"
                    type="date"
                    readonly
                  />
                </div>

                <div class="d-flex gap-2 mt-3">
                  <ArgonButton
                    color="success"
                    variant="gradient"
                    class="w-100"
                    :disabled="applicantSaving"
                    @click="saveApplicantEdit"
                  >
                    {{ applicantSaving ? "저장 중..." : "저장" }}
                  </ArgonButton>
                  <ArgonButton
                    variant="outline"
                    color="secondary"
                    class="w-100"
                    @click="cancelApplicantEdit"
                  >
                    취소
                  </ArgonButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div v-if="showModal" class="modal-backdrop-custom">
      <div class="modal-custom">
        <h4 class="mb-4 text-center">신규 지원대상자 등록</h4>

        <div class="modal-form">
          <div class="form-row">
            <div class="form-label-left">이름</div>
            <div class="form-input-right">
              <ArgonInput v-model="newApplicant.mc_nm" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-label-left">생년월일</div>
            <div class="form-input-right">
              <ArgonInput v-model="newApplicant.mc_bd" type="date" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-label-left">성별</div>
            <div class="form-input-right">
              <label class="me-3">
                <input
                  type="radio"
                  value="b0_00"
                  v-model="newApplicant.mc_gender"
                />
                남자
              </label>
              <label>
                <input
                  type="radio"
                  value="b0_10"
                  v-model="newApplicant.mc_gender"
                />
                여자
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="form-label-left">주소</div>
            <div class="form-input-right d-flex gap-2">
              <ArgonInput v-model="newApplicant.mc_address" />
              <ArgonButton
                variant="outline"
                color="secondary"
                @click="findAddress"
              >
                주소찾기
              </ArgonButton>
            </div>
          </div>

          <div class="form-row">
            <div class="form-label-left">장애유형</div>
            <div class="form-input-right">
              <div class="d-flex flex-column gap-2">
                <div
                  v-for="(t, idx) in newApplicant.mc_types"
                  :key="idx"
                  class="d-flex gap-2"
                >
                  <ArgonInput v-model="newApplicant.mc_types[idx]" />
                  <ArgonButton
                    type="button"
                    size="sm"
                    variant="outline"
                    color="danger"
                    class="mb-0"
                    @click="removeDisabilityTypeField(idx)"
                  >
                    삭제
                  </ArgonButton>
                </div>

                <ArgonButton
                  type="button"
                  size="sm"
                  variant="outline"
                  color="primary"
                  class="mb-0 align-self-start"
                  @click="addDisabilityTypeField"
                >
                  장애유형 추가
                </ArgonButton>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-label-left">등록일</div>
            <div class="form-input-right">
              <ArgonInput :model-value="todayYmd()" type="text" readonly />
              <small class="text-muted">
                등록일은 오늘 날짜로 자동 저장됩니다.
              </small>
            </div>
          </div>
        </div>

        <div class="d-flex gap-2 mt-4">
          <ArgonButton
            color="success"
            variant="gradient"
            class="w-100"
            :disabled="addApplicantSaving"
            @click="addApplicant"
          >
            {{ addApplicantSaving ? "등록 중..." : "등록" }}
          </ArgonButton>
          <ArgonButton
            variant="outline"
            color="secondary"
            class="w-100"
            @click="closeModal"
          >
            취소
          </ArgonButton>
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
.info-box {
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
  background: #fff;
  transition: all 0.15s ease;
}

.info-box:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.info-label {
  font-size: 12px;
  color: #8392ab;
  margin-bottom: 4px;
}

.info-value {
  font-weight: 600;
  color: #344767;
}

.list-hover {
  cursor: pointer;
  transition: all 0.15s ease;
}

.list-hover:hover {
  background: #f8f9fa;
  transform: translateX(2px);
}

.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-custom {
  background: white;
  padding: 32px;
  border-radius: 18px;
  width: 480px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.email-auth-confirm-btn {
  height: 38px;
  display: inline-flex;
  align-items: center;
}

.form-row {
  display: flex;
  align-items: center;
}

.form-label-left {
  width: 110px;
  font-weight: 600;
  color: #344767;
  font-size: 14px;
}

.form-input-right {
  flex: 1;
}

.applicant-list {
  max-height: 420px;
  overflow-y: auto;
}

.applicant-item {
  border: 0;
  border-radius: 14px;
  margin-bottom: 10px;
  padding: 14px 14px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
  background: #fff;
}

.applicant-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
}

.applicant-item--active {
  background: rgba(17, 205, 239, 0.12);
}

.applicant-name {
  font-weight: 700;
  color: #344767;
  line-height: 1.2;
}

@media (max-width: 991px) {
  .modal-custom {
    width: 92%;
  }
}
</style>
