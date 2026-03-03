<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

// ====== 페이징 ======
const itemsPerPage = 10;
const currentPage = ref(1);

// ====== 테이블 데이터 (DB 연동) ======
const tableData = ref([]);

// ====== 담당자 목록 조회 ======
const fetchManagerList = async () => {
  try {
    const res = await axios.get("/api/manager/list"); // 프록시 적용됨

    console.log("🔥 res.data:", res.data);

    // res.data가 배열이면 그대로, 아니면 배열로 감싸기
    const list = Array.isArray(res.data) ? res.data : [res.data];

    tableData.value = list.map((item, index) => ({
      id: item.m_no || index + 1,
      selected: false,
      userId: item.m_id,
      userName: item.m_nm,
      phone: item.m_tel,
      email: item.m_email,
      targetCount: item.target_count || 0,
      joinedAt: item.m_join_date || "",
      status: item.m_status || "승인",
    }));
  } catch (err) {
    console.error("담당자 목록 조회 실패:", err);
  }
};

// ====== 페이징 계산 ======
const totalPages = computed(() =>
  Math.ceil(tableData.value.length / itemsPerPage),
);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return tableData.value.slice(start, start + itemsPerPage);
});

// ====== 상태별 배지 ======
const statusBadge = (status) => ({
  "bg-gradient-success": status === "승인",
  "bg-gradient-secondary": status === "대기중",
  "bg-gradient-danger": status === "반려",
});

// ====== 선택 삭제 ======
const deleteSelected = () => {
  const selectedCount = tableData.value.filter((i) => i.selected).length;
  if (!selectedCount) {
    alert("삭제할 항목을 선택해주세요.");
    return;
  }
  if (confirm(`${selectedCount}개의 항목을 삭제하시겠습니까?`)) {
    tableData.value = tableData.value.filter((i) => !i.selected);
    if (currentPage.value > totalPages.value)
      currentPage.value = totalPages.value || 1;
  }
};

// ====== 수정 모달 ======
const isEditModalOpen = ref(false);
const editTarget = ref(null);
const editUserId = ref("");
const editUserName = ref("");
const editPhone = ref("");
const editEmail = ref("");
const newPassword = ref("");
const confirmPassword = ref("");

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

  if (newPassword.value || confirmPassword.value) {
    if (newPassword.value !== confirmPassword.value) {
      alert("새 비밀번호와 확인이 일치하지 않습니다.");
      return;
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
  isEditModalOpen.value = false;
  editTarget.value = null;
};

// ====== 최초 로딩 ======
onMounted(() => {
  fetchManagerList();
});
</script>

<template>
  <div class="container-fluid py-4">
    <div class="row">
      <!-- ====== 좌측: 담당자 검색 ====== -->
      <div class="col-lg-3 mb-4">
        <div class="card">
          <div class="card-header pb-0">
            <h6 class="mb-0">담당자 검색</h6>
          </div>
          <div class="card-body">
            <label class="form-label text-sm">검색 조건</label>
            <select v-model="searchBy" class="form-select form-select-sm mb-2">
              <option value="m_nm">이름</option>
              <option value="m_org">소속기관</option>
              <option value="m_id">아이디</option>
            </select>
            <input
              v-model="searchValue"
              type="text"
              class="form-control form-control-sm mb-2"
              placeholder="검색어 입력"
              @keyup.enter="doSearch"
            />
            <button class="btn btn-sm btn-success w-100 mb-0" @click="doSearch">
              검색
            </button>
          </div>
        </div>
      </div>

      <!-- ====== 우측: 테이블 ====== -->
      <div class="col-lg-9">
    <div class="card mb-4">
      <div
        class="card-header d-flex justify-content-between align-items-center pb-0"
      >
        <h6>담당자 상세 목록 관리</h6>
        <button @click="deleteSelected" class="btn btn-sm btn-outline-danger">
          선택삭제
        </button>
      </div>

      <div class="card-body px-0 pt-0 pb-2">
        <p v-if="listLoading" class="text-muted text-sm mb-0 px-3">로딩 중...</p>
        <p v-else-if="listError" class="text-danger text-sm mb-0 px-3">{{ listError }}</p>
        <div v-else class="table-responsive p-0">
          <table class="table align-items-center mb-0">
            <thead>
              <tr>
                <th class="text-center text-xxs font-weight-bolder opacity-7">
                  선택
                </th>
                <th class="text-xxs font-weight-bolder opacity-7 ps-2">No.</th>
                <th class="text-xxs font-weight-bolder opacity-7 ps-2">
                  아이디
                </th>
                <th class="text-xxs font-weight-bolder opacity-7 ps-2">
                  담당자명
                </th>
                <th class="text-xxs font-weight-bolder opacity-7 ps-2">
                  연락처
                </th>
                <th class="text-xxs font-weight-bolder opacity-7 ps-2">
                  이메일
                </th>
                <th class="text-center text-xxs font-weight-bolder opacity-7">
                  지원대상자수
                </th>
                <th class="text-center text-xxs font-weight-bolder opacity-7">
                  가입일
                </th>
                <th class="text-center text-xxs font-weight-bolder opacity-7">
                  상태
                </th>
                <th class="text-center text-xxs font-weight-bolder opacity-7">
                  수정
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(item, index) in paginatedData" :key="item.id">
                <td class="text-center">
                  <input
                    type="checkbox"
                    v-model="item.selected"
                    class="form-check-input"
                  />
                </td>
                <td>{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
                <td>{{ item.userId }}</td>
                <td>{{ item.userName }}</td>
                <td>{{ item.organName }}</td>
                <td>{{ item.phone }}</td>
                <td>{{ item.email }}</td>
                <td class="text-center">{{ item.targetCount }}명</td>
                <td class="text-center">{{ item.joinedAt }}</td>
                <td class="text-center">
                  <span
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
              <tr v-if="!listLoading && !listError && tableData.length === 0">
                <td colspan="9" class="text-center text-muted py-4">담당자가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ====== 페이징 ====== -->
        <div
          v-if="tableData.length > itemsPerPage"
          class="d-flex justify-content-center py-3"
        >
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <a class="page-link" href="javascript:;" @click="currentPage--">
                  <i class="fa fa-angle-left"></i>
                </a>
              </li>
              <li
                v-for="page in totalPages"
                :key="page"
                class="page-item"
                :class="{ active: currentPage === page }"
              >
                <a
                  class="page-link"
                  href="javascript:;"
                  @click="currentPage = page"
                >
                  {{ page }}
                </a>
              </li>
              <li
                class="page-item"
                :class="{ disabled: currentPage === totalPages }"
              >
                <a class="page-link" href="javascript:;" @click="currentPage++">
                  <i class="fa fa-angle-right"></i>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
      </div>
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
              <div
                class="d-flex flex-column flex-md-row align-items-center mb-2"
              >
                <label
                  class="me-md-2 mb-1 mb-md-0"
                  style="width: 120px; text-align: right"
                  >아이디</label
                >
                <input v-model="editUserId" class="form-control flex-grow-1" />
              </div>

              <div
                class="d-flex flex-column flex-md-row align-items-center mb-2"
              >
                <label
                  class="me-md-2 mb-1 mb-md-0"
                  style="width: 120px; text-align: right"
                  >담당자명</label
                >
                <input
                  v-model="editUserName"
                  class="form-control flex-grow-1"
                />
              </div>

              <div
                class="d-flex flex-column flex-md-row align-items-center mb-2"
              >
                <label
                  class="me-md-2 mb-1 mb-md-0"
                  style="width: 120px; text-align: right"
                  >연락처</label
                >
                <input v-model="editPhone" class="form-control flex-grow-1" />
              </div>

              <div
                class="d-flex flex-column flex-md-row align-items-center mb-3"
              >
                <label
                  class="me-md-2 mb-1 mb-md-0"
                  style="width: 120px; text-align: right"
                  >이메일</label
                >
                <input v-model="editEmail" class="form-control flex-grow-1" />
              </div>

              <div class="d-flex justify-content-center gap-2 flex-wrap">
                <button
                  class="btn btn-sm bg-gradient-success"
                  :disabled="editSaving"
                  @click="confirmEdit"
                >
                  {{ editSaving ? "저장 중..." : "저장" }}
                </button>
                <button
                  class="btn btn-sm bg-gradient-secondary"
                  :disabled="editSaving"
                  @click="closeEditModal"
                >
                  취소
                </button>
              </div>
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
</style>
