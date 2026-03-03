<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

// Argon components
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonButton from "@/components/ArgonButton.vue";

const router = useRouter();

// =============================
// 🔹 기관 관리자 정보
// =============================
const managerInfo = ref({
  orgName: "",
  userId: "",
  phone: "",
  email: "",
  joinDate: "",
});

const isManagerEditMode = ref(false);
const managerEditForm = ref({
  orgName: "",
  phone: "",
  email: "",
});

// =============================
// 🔹 기관 정보
// =============================
const orgInfo = ref({
  orgTitle: "",
  bizNumber: "",
  address: "",
  tel: "",
  managerCount: "",
});

const isOrgEditMode = ref(false);
const orgEditForm = ref({
  orgTitle: "",
  bizNumber: "",
  address: "",
  tel: "",
  managerCount: "",
});

const startManagerEdit = () => {
  managerEditForm.value = {
    orgName: managerInfo.value.orgName,
    phone: managerInfo.value.phone,
    email: managerInfo.value.email,
  };
  isManagerEditMode.value = true;
};

const cancelManagerEdit = () => {
  isManagerEditMode.value = false;
};

const saveManagerEdit = () => {
  managerInfo.value.orgName = managerEditForm.value.orgName;
  managerInfo.value.phone = managerEditForm.value.phone;
  managerInfo.value.email = managerEditForm.value.email;
  isManagerEditMode.value = false;
  alert("기관 관리자 정보가 수정되었습니다.");
};

const startOrgEdit = () => {
  orgEditForm.value = {
    orgTitle: orgInfo.value.orgTitle,
    bizNumber: orgInfo.value.bizNumber,
    address: orgInfo.value.address,
    tel: orgInfo.value.tel,
    managerCount: orgInfo.value.managerCount,
  };
  isOrgEditMode.value = true;
};

const cancelOrgEdit = () => {
  isOrgEditMode.value = false;
};

const saveOrgEdit = () => {
  orgInfo.value.orgTitle = orgEditForm.value.orgTitle;
  orgInfo.value.bizNumber = orgEditForm.value.bizNumber;
  orgInfo.value.address = orgEditForm.value.address;
  orgInfo.value.tel = orgEditForm.value.tel;
  orgInfo.value.managerCount = orgEditForm.value.managerCount;
  isOrgEditMode.value = false;
  alert("기관 정보가 수정되었습니다.");
};

onMounted(() => {
  // 샘플 데이터 (추후 API 연동)
  managerInfo.value = {
    orgName: "대구 복지센터",
    userId: "manager01",
    phone: "010-1234-5678",
    email: "manager01@test.com",
    joinDate: "2026-02-01",
  };

  orgInfo.value = {
    orgTitle: "대구 남구복지센터",
    bizNumber: "123-45-67890",
    address: "대구 남구 달구벌대로",
    tel: "053-123-4567",
    managerCount: "20명",
  };
});
const goManagerControl = () => {
  router.push("manager-control");
};
</script>

<template>
  <div class="container-fluid py-4">
    <div class="row">
      <!-- ============================= -->
      <!-- 🔵 왼쪽: 기관 관리자 정보 -->
      <!-- ============================= -->
      <div class="col-lg-6 mb-4">
        <div class="card shadow-lg border-0 h-100">
          <div
            class="card-header bg-gradient-primary d-flex justify-content-between align-items-center"
          >
            <div>
              <h5 class="text-white mb-0">기관 관리자</h5>
              <p class="text-white text-sm opacity-8 mb-0">
                이석민님 반갑습니다.
              </p>
            </div>

            <ArgonButton
              v-if="!isManagerEditMode"
              color="white"
              variant="fill"
              size="sm"
              class="btn-header-action"
              @click="startManagerEdit"
            >
              수정
            </ArgonButton>
            <ArgonButton
              v-else
              color="white"
              variant="outline"
              size="sm"
              class="btn-header-action btn-header-action--outline"
              @click="cancelManagerEdit"
            >
              취소
            </ArgonButton>
          </div>

          <div class="card-body form-vertical">
            <div class="form-item">
              <div class="label-col">소속 기관</div>
              <ArgonInput
                v-if="!isManagerEditMode"
                v-model="managerInfo.orgName"
                disabled
              />
              <ArgonInput v-else v-model="managerEditForm.orgName" />
            </div>

            <div class="form-item">
              <div class="label-col">아이디</div>
              <ArgonInput v-model="managerInfo.userId" disabled />
            </div>

            <div class="form-item">
              <div class="label-col">연락처</div>
              <ArgonInput
                v-if="!isManagerEditMode"
                v-model="managerInfo.phone"
                disabled
              />
              <ArgonInput v-else v-model="managerEditForm.phone" />
            </div>

            <div class="form-item">
              <div class="label-col">이메일</div>
              <ArgonInput
                v-if="!isManagerEditMode"
                v-model="managerInfo.email"
                disabled
              />
              <ArgonInput v-else v-model="managerEditForm.email" />
            </div>

            <div class="form-item">
              <div class="label-col">가입일</div>
              <ArgonInput v-model="managerInfo.joinDate" disabled />
            </div>

            <div v-if="isManagerEditMode" class="d-flex gap-2 pt-2">
              <ArgonButton
                color="success"
                variant="gradient"
                fullWidth
                @click="saveManagerEdit"
              >
                저장
              </ArgonButton>
              <ArgonButton
                color="secondary"
                variant="outline"
                fullWidth
                @click="cancelManagerEdit"
              >
                취소
              </ArgonButton>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================= -->
      <!-- 🟢 오른쪽: 기관 정보 -->
      <!-- ============================= -->
      <div class="col-lg-6 mb-4">
        <div class="card shadow-lg border-0 h-100">
          <div
            class="card-header bg-gradient-success d-flex justify-content-between align-items-center"
          >
            <h5 class="text-white mb-0">대구 남구 지원센터 상세정보</h5>

            <ArgonButton
              v-if="!isOrgEditMode"
              color="white"
              variant="fill"
              size="sm"
              class="btn-header-action"
              @click="startOrgEdit"
            >
              수정
            </ArgonButton>
            <ArgonButton
              v-else
              color="white"
              variant="outline"
              size="sm"
              class="btn-header-action btn-header-action--outline"
              @click="cancelOrgEdit"
            >
              취소
            </ArgonButton>
          </div>

          <div class="card-body form-vertical">
            <div class="form-item">
              <div class="label-col">기관명</div>
              <ArgonInput
                v-if="!isOrgEditMode"
                v-model="orgInfo.orgTitle"
                disabled
              />
              <ArgonInput v-else v-model="orgEditForm.orgTitle" />
            </div>

            <div class="form-item">
              <div class="label-col">사업자번호</div>
              <ArgonInput
                v-if="!isOrgEditMode"
                v-model="orgInfo.bizNumber"
                disabled
              />
              <ArgonInput v-else v-model="orgEditForm.bizNumber" />
            </div>

            <div class="form-item">
              <div class="label-col">주소</div>
              <ArgonInput
                v-if="!isOrgEditMode"
                v-model="orgInfo.address"
                disabled
              />
              <ArgonInput v-else v-model="orgEditForm.address" />
            </div>

            <div class="form-item">
              <div class="label-col">대표전화번호</div>
              <ArgonInput
                v-if="!isOrgEditMode"
                v-model="orgInfo.tel"
                disabled
              />
              <ArgonInput v-else v-model="orgEditForm.tel" />
            </div>

            <div class="form-item form-item-inline">
              <div class="label-col">기관담당자 수</div>
              <div
                class="inline-controls d-flex align-items-center gap-2 flex-grow-1"
              >
                <div class="flex-grow-1 inline-input">
                  <ArgonInput
                    v-if="!isOrgEditMode"
                    v-model="orgInfo.managerCount"
                    disabled
                  />
                  <ArgonInput v-else v-model="orgEditForm.managerCount" />
                </div>
                <ArgonButton
                  color="info"
                  variant="outline"
                  size="sm"
                  class="btn-view"
                  @click="goManagerControl"
                >
                  보기
                </ArgonButton>
              </div>
            </div>

            <div v-if="isOrgEditMode" class="d-flex gap-2 pt-2">
              <ArgonButton
                color="success"
                variant="gradient"
                fullWidth
                @click="saveOrgEdit"
              >
                저장
              </ArgonButton>
              <ArgonButton
                color="secondary"
                variant="outline"
                fullWidth
                @click="cancelOrgEdit"
              >
                취소
              </ArgonButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 1.25rem;
}

.form-vertical {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.label-col {
  font-weight: 700;
  color: #344767;
  margin-bottom: 0.35rem;
}

.form-item-inline {
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.form-item-inline .label-col {
  width: 120px;
  margin-bottom: 0;
  flex: 0 0 auto;
}

.inline-controls {
  min-width: 0;
}

.inline-input :deep(.form-group) {
  margin-bottom: 0;
}

.btn-header-action {
  font-weight: 700 !important;
  color: #344767 !important;
  background: #fff !important;
  border: none !important;
  border-radius: 0.5rem !important;
  padding: 0.45rem 0.9rem !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18) !important;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.btn-header-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.24) !important;
}

.btn-header-action--outline {
  background: transparent !important;
  color: #fff !important;
  border: 1px solid rgba(255, 255, 255, 0.8) !important;
  box-shadow: none !important;
}

.btn-view {
  white-space: nowrap;
}
</style>
