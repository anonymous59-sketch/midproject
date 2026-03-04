<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/store/auth";

// Argon components
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonButton from "@/components/ArgonButton.vue";

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
    }
  } catch (e) {
    console.error(e);
    alert("정보를 불러오지 못했습니다.");
  }
};

onMounted(() => {
  loadMyInfo();
});

const toggleEdit = () => {
  isEditMode.value = !isEditMode.value;
};

const saveInfo = async () => {
  const mNo = authStore.user?.m_no;
  if (!mNo) {
    alert("로그인 정보가 없습니다.");
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
    alert("정보가 수정되었습니다.");
    isEditMode.value = false;
  } catch (e) {
    alert(e.message || "저장에 실패했습니다.");
  } finally {
    saving.value = false;
  }
};
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
                    :disabled="!isEditMode"
                    class="organ-input"
                  />
                </div>

                <div class="form-item">
                  <label class="form-label">이메일</label>
                  <ArgonInput
                    v-model="managerInfo.email"
                    :disabled="!isEditMode"
                    class="organ-input"
                  />
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
