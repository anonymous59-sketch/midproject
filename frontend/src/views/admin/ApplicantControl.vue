<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/store/auth";
import { usePagination } from "@/composables/usePagination";
import { useReasonModal } from "@/composables/useReasonModal";
import SearchNavbar from "@/views/components/SearchNavbar.vue";
import MainTable from "@/views/components/MainTable.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import ArgonInput from "@/components/ArgonInput.vue";
import AlertModal from "@/views/modal/AlertModal.vue";
import ConfirmModal from "@/views/modal/ConfirmModal.vue";

const authStore = useAuthStore();

const alertModal = ref({
  show: false,
  type: "success",
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

const { reasonModal, openReasonModal, closeReasonModal, onReasonConfirm } =
  useReasonModal();

const tableData = ref([]);
const searchBy = ref("m_nm");
const searchValue = ref("");
const listLoading = ref(false);
const listError = ref("");

/** m_auth: a0_20 → 승인됨, 기타 → 미승인 */
function mapRow(item, index) {
  const auth = item.m_auth || "";
  const status = auth === "a0_20" ? "승인됨" : "미승인";
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

const approvalSaving = ref(false);
const statusBadge = (status) => ({
  "bg-gradient-success": status === "승인됨",
});

const approveApplicant = async (item) => {
  if (!item?.id) return;
  approvalSaving.value = true;
  try {
    const res = await fetch(
      `/api/admin/members/${encodeURIComponent(item.id)}/approve-applicant`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      },
    );
    if (!res.ok) throw new Error("승인 처리에 실패했습니다.");
    approvalSaving.value = false;
    showAlert("success", "알림", "승인되었습니다.");
    await loadList();
  } catch (e) {
    showAlert("error", "알림", e.message ?? "처리에 실패했습니다.");
  } finally {
    approvalSaving.value = false;
  }
};

const rejectApplicant = (item) => {
  if (!item?.id) return;
  openReasonModal({
    context: {
      mNo: item.id,
      email: item.email,
      userName: item.userName,
      userId: item.userId,
      kind: "applicant",
    },
    title: "가입 요청 반려",
    message: `${item.userName} (${item.userId}) 지원자의 가입 요청을 반려하시겠습니까?`,
    reasonPlaceholder: "반려 사유를 입력해 주세요.",
    onConfirm: async ({ context, reason }) => {
      if (!context?.mNo) return;
      approvalSaving.value = true;
      try {
        const res = await fetch(
          `/api/admin/members/${encodeURIComponent(context.mNo)}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reject_reason: reason }),
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "반려 처리에 실패했습니다.");
        }
        showAlert("success", "알림", "반려되었습니다.");
        await loadList();
      } catch (e) {
        showAlert("error", "알림", e.message || "반려 처리에 실패했습니다.");
      } finally {
        approvalSaving.value = false;
      }
    },
  });
};

const deleteSelected = () => {
  const selectedCount = tableData.value.filter((i) => i.selected).length;
  if (!selectedCount) {
    showAlert("info", "알림", "삭제할 항목을 선택해주세요.");
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
              <template v-if="item.m_auth === 'a0_20'">
                <span
                  class="badge badge-sm"
                  :class="statusBadge('승인됨')"
                >
                  승인됨
                </span>
              </template>
              <template v-else>
                <div class="d-flex justify-content-center gap-1">
                  <ArgonButton
                    size="xs"
                    color="success"
                    variant="gradient"
                    :disabled="approvalSaving"
                    @click="approveApplicant(item)"
                  >
                    승인
                  </ArgonButton>
                  <ArgonButton
                    size="xs"
                    color="danger"
                    variant="outline"
                    :disabled="approvalSaving"
                    @click="rejectApplicant(item)"
                  >
                    반려
                  </ArgonButton>
                </div>
              </template>
            </td>
          </tr>
        </template>
      </MainTable>
    </div>

    <!-- 사유 입력 모달 (반려용) -->
    <ConfirmModal
      :show="reasonModal.show"
      :title="reasonModal.title"
      :message="reasonModal.message"
      :show-reason="reasonModal.showReason"
      :reason-placeholder="reasonModal.reasonPlaceholder"
      :reason-label="reasonModal.reasonLabel"
      @close="closeReasonModal"
      @confirm="onReasonConfirm"
    />
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
