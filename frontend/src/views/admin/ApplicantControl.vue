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

/** m_auth: a0_20 → 승인됨, a0_21 → 승인요청 */
function mapRow(item, index) {
  const auth = item.m_auth || "";
  const status = auth === "a0_21" ? "승인요청" : "승인됨";
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

const loadList = async () => {
  listLoading.value = true;
  listError.value = "";
  try {
    const params = new URLSearchParams();
    if (searchBy.value) params.set("searchBy", searchBy.value);
    if (searchValue.value) params.set("searchValue", searchValue.value);
    if (authStore.user?.m_auth === "a0_40" && authStore.user?.m_org) {
      params.set("m_org", authStore.user.m_org);
    }
    const res = await fetch(`/api/admin/applicants?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "목록 조회 실패");
    const list = Array.isArray(data) ? data : [];
    tableData.value = list.map((item, i) => mapRow(item, i));
  } catch (err) {
    listError.value = err.message || "지원자 목록을 불러오지 못했습니다.";
    tableData.value = [];
  } finally {
    listLoading.value = false;
  }
};

const doSearch = () => {
  loadList();
};

const onReset = () => {
  searchBy.value = "m_nm";
  searchValue.value = "";
  loadList();
};

const filteredRows = computed(() => tableData.value);

const {
  page,
  pageSize,
  totalItems: totalRows,
  pagedItems: pagedRows,
  rowDisplayNo,
} = usePagination(() => filteredRows.value, 10);

const statusBadge = (status) => ({
  "bg-gradient-success": status === "승인됨",
  "bg-gradient-warning": status === "승인요청",
});

const approvalModalOpen = ref(false);
const approvalTarget = ref(null);
const rejectReason = ref("");
const approvalStep = ref("choice");
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

const doApprove = async () => {
  const target = approvalTarget.value;
  if (!target) return;
  approvalSaving.value = true;
  try {
    const res = await fetch(`/api/admin/members/${encodeURIComponent(target.id)}/approve-applicant`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("승인 처리에 실패했습니다.");
    approvalSaving.value = false;
    alert("승인되었습니다.");
    closeApprovalModal();
    await loadList();
  } catch (e) {
    alert(e.message);
  } finally {
    approvalSaving.value = false;
  }
};

const showRejectForm = () => {
  approvalStep.value = "reject";
};

const doReject = async () => {
  const target = approvalTarget.value;
  if (!target) return;
  approvalSaving.value = true;
  try {
    const res = await fetch(`/api/admin/members/${encodeURIComponent(target.id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reject_reason: rejectReason.value || "" }),
    });
    if (!res.ok) throw new Error("반려 처리에 실패했습니다.");
    approvalSaving.value = false;
    closeApprovalModal();
    await loadList();
  } catch (e) {
    alert(e.message);
  } finally {
    approvalSaving.value = false;
  }
};

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

onMounted(() => loadList());
</script>

<template>
  <div class="container-fluid py-4">
    <div class="row">
      <SearchNavbar title="지원자 검색" @search="doSearch" @reset="onReset">
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
        title="지원자 상세 목록 관리"
        :list-error="listError"
        :loading="listLoading"
        :rows-count="filteredRows.length"
        empty-text="지원자가 없습니다."
        :colspan="8"
        v-model:page="page"
        :page-size="pageSize"
        :total="totalRows"
      >
        <template #header-actions>
          <ArgonButton size="sm" variant="outline" color="danger" @click="deleteSelected">
            선택삭제
          </ArgonButton>
        </template>
        <template #header>
          <th class="text-center text-xxs font-weight-bolder opacity-7">선택</th>
          <th class="text-xxs font-weight-bolder opacity-7 ps-2">No.</th>
          <th class="text-xxs font-weight-bolder opacity-7 ps-2">아이디</th>
          <th class="text-xxs font-weight-bolder opacity-7 ps-2">지원자명</th>
          <th class="text-xxs font-weight-bolder opacity-7 ps-2">소속기관</th>
          <th class="text-xxs font-weight-bolder opacity-7 ps-2">연락처</th>
          <th class="text-xxs font-weight-bolder opacity-7 ps-2">이메일</th>
          <th class="text-center text-xxs font-weight-bolder opacity-7">상태</th>
        </template>
        <template #body>
          <tr v-for="(item, index) in pagedRows" :key="item.id">
            <td class="text-center">
              <input type="checkbox" v-model="item.selected" class="form-check-input" />
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
              <span v-else class="badge badge-sm" :class="statusBadge(item.status)">
                {{ item.status }}
              </span>
            </td>
          </tr>
        </template>
      </MainTable>
    </div>

    <!-- 승인/반려 모달 -->
    <div v-if="approvalModalOpen">
      <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content card shadow-lg border-0">
            <div class="card-header text-center bg-transparent pb-0">
              <h6 class="font-weight-bolder text-dark">사용승인여부</h6>
            </div>
            <div class="card-body p-4">
              <template v-if="approvalStep === 'choice'">
                <p class="text-sm text-muted mb-3">
                  {{ approvalTarget?.userName }} ({{ approvalTarget?.userId }}) 지원자에 대해 승인 또는 반려를 선택하세요.
                </p>
                <div class="d-flex justify-content-center gap-2 flex-wrap">
                  <ArgonButton size="sm" color="success" variant="gradient" :disabled="approvalSaving" @click="doApprove">승인</ArgonButton>
                  <ArgonButton size="sm" color="danger" variant="gradient" :disabled="approvalSaving" @click="showRejectForm">반려</ArgonButton>
                  <ArgonButton size="sm" color="secondary" variant="gradient" :disabled="approvalSaving" @click="closeApprovalModal">취소</ArgonButton>
                </div>
              </template>
              <template v-else>
                <label class="form-label text-sm">반려사유 (선택, 향후 이메일 발송 예정)</label>
                <textarea v-model="rejectReason" class="form-control form-control-sm mb-3" rows="4" placeholder="반려 사유를 입력하세요" />
                <div class="d-flex justify-content-center gap-2 flex-wrap">
                  <ArgonButton size="sm" color="danger" variant="gradient" :disabled="approvalSaving" @click="doReject">
                    {{ approvalSaving ? "처리 중..." : "반려 제출" }}
                  </ArgonButton>
                  <ArgonButton size="sm" color="secondary" variant="gradient" :disabled="approvalSaving" @click="approvalStep = 'choice'">뒤로</ArgonButton>
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
