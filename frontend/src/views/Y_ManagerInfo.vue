<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

// Argon components
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonButton from "@/components/ArgonButton.vue";

// =============================
// 🔹 라우터
// =============================
const router = useRouter();

// =============================
// 🔹 담당자 정보
// =============================
const managerInfo = ref({
  orgName: "",
  userId: "",
  phone: "",
  email: "",
  address: "",
  joinDate: "",
});

const isEditMode = ref(false);

// ⭐ state로 넘어온 값 있으면 사용
onMounted(() => {
  if (router?.options?.history?.state?.managerInfo) {
    managerInfo.value = { ...router.options.history.state.managerInfo };
  } else {
    loadMyInfo(); // fallback
  }
});

// fallback (지금은 샘플)
const loadMyInfo = async () => {
  managerInfo.value = {
    orgName: "대구 복지센터",
    userId: "manager01",
    phone: "010-1234-5678",
    email: "manager01@test.com",
    address: "대구 수성구 달구벌대로",
    joinDate: "2026-02-01",
  };
};

const toggleEdit = () => {
  isEditMode.value = !isEditMode.value;
};

const saveInfo = async () => {
  alert("정보가 수정되었습니다.");
  isEditMode.value = false;
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
                    김길동님 반갑습니다.
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
                    :disabled="!isEditMode"
                    class="organ-input"
                  />
                </div>

                <div class="form-item">
                  <label class="form-label">아이디</label>
                  <ArgonInput
                    v-model="managerInfo.userId"
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

                <div class="form-item">
                  <label class="form-label">가입일</label>
                  <div class="organ-readonly">{{ managerInfo.joinDate }}</div>
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
                  @click="saveInfo"
                >
                  저장
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
