<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/store/auth";
import { usePagination } from "@/composables/usePagination";
import SearchNavbar from "@/views/components/SearchNavbar.vue";
import MainTable from "@/views/components/MainTable.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import ArgonInput from "@/components/ArgonInput.vue";

const authStore = useAuthStore();

const tableData = ref([]);
const searchBy = ref("m_nm");
const searchValue = ref("");
const listLoading = ref(false);
const listError = ref("");

/** m_auth: a0_30 → 승인됨, a0_31 → 승인요청 */
function mapRow(item, index) {
  const auth = item.m_auth || "";
  const status = auth === "a0_31" ? "승인요청" : "승인됨";
  return {
    id: item.m_no || index + 1,
    selected: false,
    userId: item.m_id,
    userName: item.m_nm,
    phone: item.m_tel || "",
    email: item.m_email || "",
    organName: item.organ_name || item.m_org || "",
    status,
    m_auth: auth,
  };
}

const loadManagers = async () => {
  listLoading.value = true;
  listError.value = "";
  try {
    const params = new URLSearchParams();
    if (searchBy.value) params.set("searchBy", searchBy.value);
    if (searchValue.value) params.set("searchValue", searchValue.value);
    if (authStore.user?.m_auth === "a0_40" && authStore.user?.m_org) {
      params.set("m_org", authStore.user.m_org);
    }
    const res = await fetch(`/api/admin/managers?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "목록 조회 실패");
    const list = Array.isArray(data) ? data : [];
    tableData.value = list.map((item, i) => mapRow(item, i));
  } catch (err) {
    listError.value = err.message || "담당자 목록을 불러오지 못했습니다.";
    tableData.value = [];
  } finally {
    listLoading.value = false;
  }
};

const doSearch = () => {
  loadManagers();
};

const onReset = () => {
  searchBy.value = "m_nm";
  searchValue.value = "";
  loadManagers();
};

const filteredRows = computed(() => tableData.value);

const {
  page,
  pageSize,
  totalItems: totalRows,
  pagedItems: pagedRows,
  rowDisplayNo,
} = usePagination(() => filteredRows.value, 10);

// ====== 상태별 배지 ======
const statusBadge = (status) => ({
  "bg-gradient-success": status === "승인됨",
  "bg-gradient-warning": status === "승인요청",
  "bg-gradient-secondary": status === "대기중",
  "bg-gradient-danger": status === "반려",
});

// ====== 승인/반려 모달 (승인요청 클릭 시) ======
const approvalModalOpen = ref(false);
const approvalTarget = ref(null);
const rejectReason = ref("");
const approvalStep = ref("choice"); // 'choice' | 'reject'
const approvalSaving = ref(false);

const openApprovalModal = (item) => {
  if (item.status !== "승인요청") return;
  approvalTarget.value = item;
  rejectReason.value = "";
  approvalStep.value = "choice";
  approvalModalOpen.value = true;
};

const closeApprovalModal = () => {
  if (!approvalSaving.value) {
    approvalModalOpen.value = false;
    approvalTarget.value = null;
    rejectReason.value = "";
    approvalStep.value = "choice";
  }
};

/** 승인: a0_31 → a0_30 */
const doApprove = async () => {
  const target = approvalTarget.value;
  if (!target) return;
  approvalSaving.value = true;
  try {
    const res = await fetch(
      `/api/admin/members/${encodeURIComponent(target.id)}/approve`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      },
    );
    if (!res.ok) throw new Error("승인 처리에 실패했습니다.");
    approvalSaving.value = false;
    alert("승인되었습니다.");
    closeApprovalModal();
    await loadManagers();
  } catch (e) {
    alert(e.message);
  } finally {
    approvalSaving.value = false;
  }
};

/** 반려: 1단계에서 반려 클릭 시 textarea 단계로 */
const showRejectForm = () => {
  approvalStep.value = "reject";
};

/** 반려 제출: DELETE + 반려사유 (향후 m_email 발송용) */
const doReject = async () => {
  const target = approvalTarget.value;
  if (!target) return;
  approvalSaving.value = true;
  try {
    const res = await fetch(
      `/api/admin/members/${encodeURIComponent(target.id)}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reject_reason: rejectReason.value || "" }),
      },
    );
    if (!res.ok) throw new Error("반려 처리에 실패했습니다.");
    approvalSaving.value = false;
    closeApprovalModal();
    await loadManagers();
  } catch (e) {
    alert(e.message);
  } finally {
    approvalSaving.value = false;
  }
};

// ====== 선택 삭제 ======
const deleteSelected = () => {
  const selectedCount = tableData.value.filter((i) => i.selected).length;
  if (!selectedCount) {
    alert("삭제할 항목을 선택해주세요.");
    return;
  }
  if (confirm(`${selectedCount}개의 항목을 삭제하시겠습니까?`)) {
    tableData.value = tableData.value.filter((i) => !i.selected);
  }
};

// ====== 수정 모달 ======
const isEditModalOpen = ref(false);
const editTarget = ref(null);
const editUserId = ref("");
const editUserName = ref("");
const editPhone = ref("");
const editEmail = ref("");
const editSaving = ref(false);

const handleEdit = (item) => {
  editTarget.value = item;
  editUserId.value = item.userId;
  editUserName.value = item.userName;
  editPhone.value = item.phone ?? "";
  editEmail.value = item.email ?? "";
  isEditModalOpen.value = true;
};

const confirmEdit = async () => {
  if (!editTarget.value) return;
  const mNo = editTarget.value.id;
  if (!mNo) {
    alert("대상 회원 정보가 없습니다.");
    return;
  }
  editSaving.value = true;
  try {
    const res = await fetch(`/api/admin/members/${encodeURIComponent(mNo)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        m_nm: (editUserName.value || "").trim(),
        m_tel: (editPhone.value || "").trim(),
        m_email: (editEmail.value || "").trim(),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "저장 실패");
    }
    editTarget.value.userName = editUserName.value;
    editTarget.value.phone = editPhone.value;
    editTarget.value.email = editEmail.value;
    closeEditModal();
    await loadManagers();
  } catch (e) {
    alert(e.message || "저장에 실패했습니다.");
  } finally {
    editSaving.value = false;
  }
};

const closeEditModal = () => {
  if (!editSaving.value) {
    isEditModalOpen.value = false;
    editTarget.value = null;
    editUserId.value = "";
    editUserName.value = "";
    editPhone.value = "";
    editEmail.value = "";
  }
};

onMounted(() => loadManagers());
</script>

<template>
  <div class="container-fluid py-4">
    <div class="row">
      <SearchNavbar title="담당자 검색" @search="doSearch" @reset="onReset">
        <label class="form-label text-sm">검색 조건</label>
        <select v-model="searchBy" class="form-select form-select-sm mb-2">
          <option value="m_nm">이름</option>
          <option value="m_org">소속기관</option>
          <option value="m_id">아이디</option>
        </select>
        <ArgonInput
          v-model="searchValue"
          type="text"
          size="sm"
          placeholder="검색어 입력"
          @keyup.enter="doSearch"
        />
      </SearchNavbar>

      <MainTable
        title="담당자 상세 목록 관리"
        :list-error="listError"
        :loading="listLoading"
        :rows-count="filteredRows.length"
        empty-text="담당자가 없습니다."
        :colspan="9"
        v-model:page="page"
        :page-size="pageSize"
        :total="totalRows"
      >
        <template #header-actions>
          <ArgonButton
            size="sm"
            variant="outline"
            color="danger"
            @click="deleteSelected"
          >
            선택삭제
          </ArgonButton>
        </template>
        <template #header>
          <th class="text-center text-xxs font-weight-bolder opacity-7">
            선택
          </th>
          <th class="text-xxs font-weight-bolder opacity-7 ps-2">No.</th>
          <th class="text-xxs font-weight-bolder opacity-7 ps-2">아이디</th>
          <th class="text-xxs font-weight-bolder opacity-7 ps-2">담당자명</th>
          <th class="text-xxs font-weight-bolder opacity-7 ps-2">소속기관</th>
          <th class="text-xxs font-weight-bolder opacity-7 ps-2">연락처</th>
          <th class="text-xxs font-weight-bolder opacity-7 ps-2">이메일</th>
          <th class="text-center text-xxs font-weight-bolder opacity-7">
            상태
          </th>
          <th class="text-center text-xxs font-weight-bolder opacity-7">
            수정
          </th>
        </template>
        <template #body>
          <tr v-for="(item, index) in pagedRows" :key="item.id">
            <td class="text-center">
              <input
                type="checkbox"
                v-model="item.selected"
                class="form-check-input"
              />
            </td>
            <td>{{ rowDisplayNo(index) }}</td>
            <td>{{ item.userId }}</td>
            <td>{{ item.userName }}</td>
            <td>{{ item.organName }}</td>
            <td>{{ item.phone }}</td>
            <td>{{ item.email }}</td>
            <td class="text-center">
              <span
                v-if="item.status === '승인요청'"
                class="badge badge-sm cursor-pointer"
                :class="statusBadge(item.status)"
                @click="openApprovalModal(item)"
              >
                {{ item.status }}
              </span>
              <span
                v-else
                class="badge badge-sm"
                :class="statusBadge(item.status)"
              >
                {{ item.status }}
              </span>
            </td>
            <td class="text-center">
              <a
                href="javascript:;"
                @click="handleEdit(item)"
                class="text-secondary"
              >
                <i class="fas fa-pencil-alt"></i>
              </a>
            </td>
          </tr>
        </template>
      </MainTable>
    </div>

    <!-- ====== 수정 모달 ====== -->
    <div v-if="isEditModalOpen">
      <div
        class="modal fade show d-block"
        tabindex="-1"
        style="background: rgba(0, 0, 0, 0.5)"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content card shadow-lg border-0">
            <div class="card-header text-center bg-transparent pb-0">
              <h6 class="font-weight-bolder text-dark">담당자 정보 수정</h6>
            </div>
            <div class="card-body p-4">
              <div class="mb-2">
                <label class="form-label text-sm">아이디</label>
                <ArgonInput
                  :model-value="editUserId"
                  size="sm"
                  :readonly="true"
                  class="bg-light"
                />
              </div>
              <div class="mb-2">
                <label class="form-label text-sm">담당자명</label>
                <ArgonInput v-model="editUserName" size="sm" />
              </div>
              <div class="mb-2">
                <label class="form-label text-sm">연락처</label>
                <ArgonInput
                  v-model="editPhone"
                  type="text"
                  inputmode="numeric"
                  maxlength="11"
                  size="sm"
                  placeholder="하이픈 제외 11자"
                  @input="editPhone = editPhone.replace(/\D/g, '').slice(0, 11)"
                  @paste.prevent
                />
              </div>
              <div class="mb-3">
                <label class="form-label text-sm">이메일</label>
                <ArgonInput v-model="editEmail" size="sm" />
              </div>
              <div class="d-flex justify-content-center gap-2 flex-wrap">
                <ArgonButton
                  size="sm"
                  color="success"
                  variant="gradient"
                  :disabled="editSaving"
                  @click="confirmEdit"
                >
                  {{ editSaving ? "저장 중..." : "저장" }}
                </ArgonButton>
                <ArgonButton
                  size="sm"
                  color="secondary"
                  variant="gradient"
                  :disabled="editSaving"
                  @click="closeEditModal"
                >
                  취소
                </ArgonButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== 승인/반려 모달 (승인요청 클릭 시) ====== -->
    <div v-if="approvalModalOpen">
      <div
        class="modal fade show d-block"
        tabindex="-1"
        style="background: rgba(0, 0, 0, 0.5)"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content card shadow-lg border-0">
            <div class="card-header text-center bg-transparent pb-0">
              <h6 class="font-weight-bolder text-dark">사용승인여부</h6>
            </div>
            <div class="card-body p-4">
              <template v-if="approvalStep === 'choice'">
                <p class="text-sm text-muted mb-3">
                  {{ approvalTarget?.userName }} ({{ approvalTarget?.userId }})
                  담당자에 대해 승인 또는 반려를 선택하세요.
                </p>
                <div class="d-flex justify-content-center gap-2 flex-wrap">
                  <ArgonButton
                    size="sm"
                    color="success"
                    variant="gradient"
                    :disabled="approvalSaving"
                    @click="doApprove"
                  >
                    승인
                  </ArgonButton>
                  <ArgonButton
                    size="sm"
                    color="danger"
                    variant="gradient"
                    :disabled="approvalSaving"
                    @click="showRejectForm"
                  >
                    반려
                  </ArgonButton>
                  <ArgonButton
                    size="sm"
                    color="secondary"
                    variant="gradient"
                    :disabled="approvalSaving"
                    @click="closeApprovalModal"
                  >
                    취소
                  </ArgonButton>
                </div>
              </template>
              <template v-else>
                <label class="form-label text-sm"
                  >반려사유 (선택, 향후 이메일 발송 예정)</label
                >
                <textarea
                  v-model="rejectReason"
                  class="form-control form-control-sm mb-3"
                  rows="4"
                  placeholder="반려 사유를 입력하세요"
                />
                <div class="d-flex justify-content-center gap-2 flex-wrap">
                  <ArgonButton
                    size="sm"
                    color="danger"
                    variant="gradient"
                    :disabled="approvalSaving"
                    @click="doReject"
                  >
                    {{ approvalSaving ? "처리 중..." : "반려 제출" }}
                  </ArgonButton>
                  <ArgonButton
                    size="sm"
                    color="secondary"
                    variant="gradient"
                    :disabled="approvalSaving"
                    @click="approvalStep = 'choice'"
                  >
                    뒤로
                  </ArgonButton>
                </div>
              </template>
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
.cursor-pointer {
  cursor: pointer;
}
textarea {
  resize: none;
}
</style>
