<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";

import ArgonInput from "@/components/ArgonInput.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import TablePagination from "@/views/components/TablePagination.vue";

const router = useRouter();
const authStore = useAuthStore();

// 기관 관리자(본인) 정보
const managerInfo = ref({
  orgName: "",
  userId: "",
  phone: "",
  email: "",
  address: "",
});
const userName = ref("");
const isManagerEditMode = ref(false);
const managerSaving = ref(false);

// 기관 정보
const orgInfo = ref({
  orgTitle: "",
  bizNumber: "",
  address: "",
  tel: "",
  managerCount: "",
  startTime: "",
  endTime: "",
});
const isOrgEditMode = ref(false);
const orgEditForm = ref({
  address: "",
  tel: "",
});
const orgSaving = ref(false);

// 담당자 목록 모달
const showManagerModal = ref(false);
const managerList = ref([]);
const managerListLoading = ref(false);
const managerPage = ref(1);
const managerPageSize = 10;
const managerTotalRows = computed(() => managerList.value.length);
const pagedManagerList = computed(() => {
  const start = (managerPage.value - 1) * managerPageSize;
  return managerList.value.slice(start, start + managerPageSize);
});
const managerRowDisplayNo = (indexInPage) =>
  managerTotalRows.value - ((managerPage.value - 1) * managerPageSize + indexInPage);

watch(showManagerModal, (visible) => {
  if (visible) managerPage.value = 1;
});

function formatBizNumber(val) {
  if (!val || typeof val !== "string") return "";
  const digits = val.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

async function loadMypage() {
  const mNo = authStore.user?.m_no;
  if (!mNo) return;
  try {
    const res = await fetch(
      `/api/apply/mypage/organmanager?m_no=${encodeURIComponent(mNo)}`
    );
    if (!res.ok) throw new Error("조회 실패");
    const data = await res.json();
    const member = data.member || {};
    const organ = data.organ || {};
    const count = data.managerCount ?? 0;

    managerInfo.value = {
      orgName: member.organ_name ?? "",
      userId: member.m_id ?? "",
      phone: member.m_tel ?? "",
      email: member.m_email ?? "",
      address: member.m_add ?? "",
    };
    userName.value = member.m_nm ?? "";

    orgInfo.value = {
      orgTitle: organ.organ_name ?? "",
      bizNumber: formatBizNumber(organ.organ_no ?? ""),
      address: organ.organ_address ?? "",
      tel: organ.organ_tel ?? "",
      managerCount: `${count}명`,
      startTime: organ.start_time != null ? String(organ.start_time).slice(0, 10) : "",
      endTime: organ.end_time != null ? String(organ.end_time).slice(0, 10) : "",
    };
    orgEditForm.value = {
      address: organ.organ_address ?? "",
      tel: organ.organ_tel ?? "",
    };
  } catch (e) {
    console.error(e);
    alert("정보를 불러오지 못했습니다.");
  }
}

onMounted(() => {
  loadMypage();
});

// 왼쪽 카드: 기관 관리자 수정
const startManagerEdit = () => {
  isManagerEditMode.value = true;
};

const cancelManagerEdit = () => {
  isManagerEditMode.value = false;
};

const saveManagerEdit = async () => {
  const mNo = authStore.user?.m_no;
  if (!mNo) return;
  managerSaving.value = true;
  try {
    const res = await fetch("/api/apply/mypage/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        m_no: mNo,
        m_tel: managerInfo.value.phone,
        m_email: managerInfo.value.email,
        m_add: managerInfo.value.address ?? "",
      }),
    });
    if (!res.ok) throw new Error("저장 실패");
    alert("기관 관리자 정보가 수정되었습니다.");
    isManagerEditMode.value = false;
  } catch (e) {
    alert(e.message || "저장에 실패했습니다.");
  } finally {
    managerSaving.value = false;
  }
};

// 오른쪽 카드: 기관 정보 수정 (사업자번호, 기관담당자 수, 소속기관은 readonly)
const startOrgEdit = () => {
  orgEditForm.value = {
    address: orgInfo.value.address,
    tel: orgInfo.value.tel,
  };
  isOrgEditMode.value = true;
};

const cancelOrgEdit = () => {
  isOrgEditMode.value = false;
};

const saveOrgEdit = async () => {
  const mNo = authStore.user?.m_no;
  if (!mNo) return;
  orgSaving.value = true;
  try {
    const res = await fetch("/api/apply/mypage/organmanager/organ", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        m_no: mNo,
        organ_name: orgInfo.value.orgTitle,
        organ_address: orgEditForm.value.address,
        organ_tel: orgEditForm.value.tel,
        organ_mail: "",
      }),
    });
    if (!res.ok) throw new Error("저장 실패");
    orgInfo.value.address = orgEditForm.value.address;
    orgInfo.value.tel = orgEditForm.value.tel;
    alert("기관 정보가 수정되었습니다.");
    isOrgEditMode.value = false;
  } catch (e) {
    alert(e.message || "저장에 실패했습니다.");
  } finally {
    orgSaving.value = false;
  }
};

// 보기: 담당자 목록 모달
async function openManagerModal() {
  const mOrg = authStore.user?.m_org;
  if (!mOrg) {
    alert("기관 정보가 없습니다.");
    return;
  }
  showManagerModal.value = true;
  managerList.value = [];
  managerListLoading.value = true;
  try {
    const res = await fetch(
      `/api/admin/managers?m_org=${encodeURIComponent(mOrg)}`
    );
    if (!res.ok) throw new Error("담당자 목록 조회 실패");
    const list = await res.json();
    managerList.value = Array.isArray(list) ? list : [];
  } catch (e) {
    alert(e.message || "담당자 목록을 불러오지 못했습니다.");
  } finally {
    managerListLoading.value = false;
  }
}

function closeManagerModal() {
  showManagerModal.value = false;
}

function goToManagerControl() {
  closeManagerModal();
  router.push("/managermanage");
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="row">
      <!-- 왼쪽: 기관 관리자 정보 -->
      <div class="col-lg-6 mb-4">
        <div class="card shadow-lg border-0 h-100">
          <div
            class="card-header bg-gradient-primary d-flex justify-content-between align-items-center"
          >
            <div>
              <h5 class="text-white mb-0">기관 관리자</h5>
              <p class="text-white text-sm opacity-8 mb-0">
                {{ userName || "기관관리자" }}님 반갑습니다.
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
              <ArgonInput v-model="managerInfo.orgName" disabled readonly />
            </div>
            <div class="form-item">
              <div class="label-col">아이디</div>
              <ArgonInput v-model="managerInfo.userId" disabled readonly />
            </div>
            <div class="form-item">
              <div class="label-col">연락처</div>
              <ArgonInput
                v-if="!isManagerEditMode"
                v-model="managerInfo.phone"
                disabled
              />
              <ArgonInput v-else v-model="managerInfo.phone" />
            </div>
            <div class="form-item">
              <div class="label-col">이메일</div>
              <ArgonInput
                v-if="!isManagerEditMode"
                v-model="managerInfo.email"
                disabled
              />
              <ArgonInput v-else v-model="managerInfo.email" />
            </div>

            <div v-if="isManagerEditMode" class="d-flex gap-2 pt-2">
              <ArgonButton
                color="success"
                variant="gradient"
                fullWidth
                :disabled="managerSaving"
                @click="saveManagerEdit"
              >
                {{ managerSaving ? "저장 중..." : "저장" }}
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

      <!-- 오른쪽: 기관 정보 -->
      <div class="col-lg-6 mb-4">
        <div class="card shadow-lg border-0 h-100">
          <div
            class="card-header bg-gradient-success d-flex justify-content-between align-items-center"
          >
            <h5 class="text-white mb-0">{{ orgInfo.orgTitle || "기관 상세정보" }}</h5>
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
              <div class="label-col">사업자 번호</div>
              <ArgonInput v-model="orgInfo.bizNumber" disabled readonly />
            </div>
            <div class="form-item">
              <div class="label-col">시작일</div>
              <ArgonInput v-model="orgInfo.startTime" disabled readonly />
            </div>
            <div class="form-item">
              <div class="label-col">종료일</div>
              <ArgonInput v-model="orgInfo.endTime" disabled readonly />
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
                  <ArgonInput v-model="orgInfo.managerCount" disabled readonly />
                </div>
                <ArgonButton
                  color="info"
                  variant="outline"
                  size="sm"
                  class="btn-view"
                  @click="openManagerModal"
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
                :disabled="orgSaving"
                @click="saveOrgEdit"
              >
                {{ orgSaving ? "저장 중..." : "저장" }}
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

    <!-- 담당자 목록 모달 -->
    <div
      v-if="showManagerModal"
      class="modal d-block"
      tabindex="-1"
      style="background: rgba(0,0,0,0.5)"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">기관 담당자 목록 (a0_30)</h5>
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              @click="closeManagerModal"
            />
          </div>
          <div class="modal-body">
            <div v-if="managerListLoading" class="text-center py-4">
              로딩 중...
            </div>
            <div v-else-if="managerList.length === 0" class="text-muted text-center py-4">
              담당자가 없습니다.
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th class="text-center text-xs">번호</th>
                    <th>이름</th>
                    <th>아이디</th>
                    <th>연락처</th>
                    <th>이메일</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(m, idx) in pagedManagerList" :key="m.m_no">
                    <td class="text-center text-sm">{{ managerRowDisplayNo(idx) }}</td>
                    <td>{{ m.m_nm }}</td>
                    <td>{{ m.m_id }}</td>
                    <td>{{ m.m_tel }}</td>
                    <td>{{ m.m_email }}</td>
                    <td>{{ m.m_auth === "a0_31" ? "승인요청" : "승인됨" }}</td>
                  </tr>
                </tbody>
              </table>
              <TablePagination
                v-if="managerTotalRows > managerPageSize"
                v-model:page="managerPage"
                :total="managerTotalRows"
                :page-size="managerPageSize"
                class="mt-2"
              />
            </div>
          </div>
          <div class="modal-footer">
            <ArgonButton
              color="primary"
              variant="gradient"
              @click="goToManagerControl"
            >
              수정하기
            </ArgonButton>
            <ArgonButton color="secondary" variant="outline" @click="closeManagerModal">
              취소
            </ArgonButton>
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
