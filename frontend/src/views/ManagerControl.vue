<script setup>
import { ref, computed, onMounted } from "vue";

// ====== 페이징 ======
const itemsPerPage = 10;
const currentPage = ref(1);

// ====== 담당자 검색 (좌측 사이드바) ======
const searchBy = ref("m_nm");
const searchValue = ref("");
const listLoading = ref(false);
const listError = ref(null);

// ====== 모달 상태 ======
const isModalOpen = ref(false);
const selectedItem = ref(null);
const isRejectModalOpen = ref(false);
const rejectReason = ref("");
const isEmailSentModalOpen = ref(false);
const emailSentTarget = ref(null);
const isEmailFailModalOpen = ref(false);
const emailFailTarget = ref(null);
const isApproveModalOpen = ref(false);
const approveTarget = ref(null);

// ====== 수정 모달 ======
const isEditModalOpen = ref(false);
const editTarget = ref(null);
const editUserId = ref("");
const editUserName = ref("");
const editPhone = ref("");
const editEmail = ref("");
const editSaving = ref(false);

// ====== 목록 (member 테이블 m_auth=a0_30 연동) ======
const tableData = ref([]);

function mapRow(r) {
  return {
    id: r.m_no,
    selected: false,
    userId: r.m_id ?? "",
    userName: r.m_nm ?? "",
    phone: r.m_tel ?? "",
    email: r.m_email ?? "",
    organName: r.organ_name || r.m_org || "-",
    status: "승인",
  };
}

async function loadManagers() {
  listLoading.value = true;
  listError.value = null;
  try {
    const params = new URLSearchParams();
    if (searchBy.value && searchValue.value.trim()) {
      params.set("searchBy", searchBy.value);
      params.set("searchValue", searchValue.value.trim());
    }
    const res = await fetch(`/api/admin/managers?${params}`);
    if (!res.ok) throw new Error("담당자 목록 조회 실패");
    const data = await res.json();
    tableData.value = (Array.isArray(data) ? data : []).map(mapRow);
    currentPage.value = 1;
  } catch (e) {
    listError.value = e.message;
    tableData.value = [];
  } finally {
    listLoading.value = false;
  }
}

function doSearch() {
  loadManagers();
}

onMounted(() => {
  loadManagers();
});

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

// ====== 승인/반려 모달 ======
const openModal = (item) => {
  selectedItem.value = item;
  isModalOpen.value = true;
};

const processStatus = (status) => {
  if (selectedItem.value) {
    selectedItem.value.status = status;
    if (status === "승인") {
      approveTarget.value = selectedItem.value;
      isApproveModalOpen.value = true;
    }
  }
  isModalOpen.value = false;
  selectedItem.value = null;
};

const openRejectModal = () => {
  isModalOpen.value = false;
  rejectReason.value = "";
  isRejectModalOpen.value = true;
};

const closeRejectModal = () => (isRejectModalOpen.value = false);

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    alert("반려 사유를 입력해주세요.");
    return;
  }
  if (selectedItem.value) {
    try {
      // 실제 API 호출 필요 시 fetch 사용
      selectedItem.value.status = "반려";
      selectedItem.value.rejectReason = rejectReason.value;
      emailSentTarget.value = selectedItem.value;
      isEmailSentModalOpen.value = true;
    } catch {
      emailFailTarget.value = selectedItem.value;
      isEmailFailModalOpen.value = true;
      return;
    }
  }
  isRejectModalOpen.value = false;
  rejectReason.value = "";
  selectedItem.value = null;
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
    if (currentPage.value > totalPages.value)
      currentPage.value = totalPages.value || 1;
  }
};

// ====== 수정 모달 ======
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
                <th
                  class="text-center text-secondary text-xxs font-weight-bolder opacity-7"
                >
                  선택
                </th>
                <th
                  class="text-xxs text-secondary font-weight-bolder opacity-7 ps-2"
                >
                  No.
                </th>
                <th
                  class="text-xxs text-secondary font-weight-bolder opacity-7 ps-2"
                >
                  아이디
                </th>
                <th
                  class="text-xxs text-secondary font-weight-bolder opacity-7 ps-2"
                >
                  담당자명
                </th>
                <th
                  class="text-xxs text-secondary font-weight-bolder opacity-7 ps-2"
                >
                  소속기관
                </th>
                <th
                  class="text-xxs text-secondary font-weight-bolder opacity-7 ps-2"
                >
                  연락처
                </th>
                <th
                  class="text-xxs text-secondary font-weight-bolder opacity-7 ps-2"
                >
                  이메일
                </th>
                <th
                  class="text-center text-xxs text-secondary font-weight-bolder opacity-7"
                >
                  요청처리
                </th>
                <th
                  class="text-center text-xxs text-secondary font-weight-bolder opacity-7"
                >
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
                <td class="text-center">
                  <span
                    class="badge badge-sm cursor-pointer"
                    :class="[
                      statusBadge(item.status),
                      item.status === '대기중' ? 'hover-opacity' : '',
                    ]"
                    @click="item.status === '대기중' && openModal(item)"
                  >
                    {{ item.status }}
                  </span>
                </td>
                <td class="text-center">
                  <a
                    href="javascript:;"
                    @click="handleEdit(item)"
                    class="text-secondary"
                    title="수정"
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
                <a class="page-link" href="javascript:;" @click="currentPage--"
                  ><i class="fa fa-angle-left"></i
                ></a>
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
                  >{{ page }}</a
                >
              </li>
              <li
                class="page-item"
                :class="{ disabled: currentPage === totalPages }"
              >
                <a class="page-link" href="javascript:;" @click="currentPage++"
                  ><i class="fa fa-angle-right"></i
                ></a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
      </div>
    </div>

    <!-- ====== 승인/반려 모달 ====== -->
    <div
      v-if="
        isModalOpen ||
        isRejectModalOpen ||
        isEmailSentModalOpen ||
        isEmailFailModalOpen ||
        isApproveModalOpen
      "
    >
      <div
        class="modal fade show d-block"
        tabindex="-1"
        style="background: rgba(0, 0, 0, 0.5)"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content card shadow-lg border-0">
            <div class="card-header text-center bg-transparent pb-0">
              <h6 class="font-weight-bolder text-dark" v-if="isModalOpen">
                가입 요청 승인 처리
              </h6>
              <h6
                class="font-weight-bolder text-danger"
                v-if="isRejectModalOpen"
              >
                반려 사유 입력
              </h6>
              <h6
                class="font-weight-bolder text-success"
                v-if="isEmailSentModalOpen"
              >
                이메일 발송 완료
              </h6>
              <h6
                class="font-weight-bolder text-danger"
                v-if="isEmailFailModalOpen"
              >
                이메일 발송 실패
              </h6>
              <h6
                class="font-weight-bolder text-success"
                v-if="isApproveModalOpen"
              >
                가입 승인 완료
              </h6>

              <p class="text-sm mb-0" v-if="isModalOpen">
                <strong>{{ selectedItem?.userName }}</strong> 님의 가입 요청을
                처리하시겠습니까?
              </p>
              <p class="text-sm mb-0" v-if="isRejectModalOpen">
                <strong>{{ selectedItem?.userName }}</strong> 님의 반려 사유를
                입력하세요.
              </p>
              <p class="text-sm mb-0" v-if="isEmailSentModalOpen">
                <strong>{{ emailSentTarget?.userName }}</strong> 님에게 반려
                안내 이메일이 발송되었습니다.
              </p>
              <p class="text-sm mb-0" v-if="isEmailFailModalOpen">
                <strong>{{ emailFailTarget?.userName }}</strong> 님에게 이메일
                발송에 실패했습니다.
              </p>
              <p class="text-sm mb-0" v-if="isApproveModalOpen">
                <strong>{{ approveTarget?.userName }}</strong> 님의 가입이
                승인되었습니다.
              </p>
            </div>
            <div
              class="card-body p-4 text-center d-flex justify-content-center gap-2 flex-column flex-md-row"
            >
              <button
                v-if="isModalOpen"
                @click="processStatus('승인')"
                class="btn btn-sm bg-gradient-success"
              >
                수락(승인)
              </button>
              <button
                v-if="isModalOpen"
                @click="openRejectModal"
                class="btn btn-sm bg-gradient-danger"
              >
                반려(거절)
              </button>
              <button
                v-if="isModalOpen"
                @click="isModalOpen = false"
                class="btn btn-sm bg-gradient-secondary"
              >
                취소
              </button>

              <textarea
                v-if="isRejectModalOpen"
                v-model="rejectReason"
                class="form-control mb-3"
                rows="3"
                placeholder="반려 사유를 입력하세요"
              ></textarea>
              <button
                v-if="isRejectModalOpen"
                @click="confirmReject"
                class="btn btn-sm bg-gradient-danger"
              >
                반려 확정
              </button>
              <button
                v-if="isRejectModalOpen"
                @click="closeRejectModal"
                class="btn btn-sm bg-gradient-secondary"
              >
                취소
              </button>

              <button
                v-if="isEmailSentModalOpen"
                @click="isEmailSentModalOpen = false"
                class="btn btn-sm bg-gradient-success"
              >
                확인
              </button>
              <button
                v-if="isEmailFailModalOpen"
                @click="isEmailFailModalOpen = false"
                class="btn btn-sm bg-gradient-danger"
              >
                확인
              </button>
              <button
                v-if="isApproveModalOpen"
                @click="isApproveModalOpen = false"
                class="btn btn-sm bg-gradient-success"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isEditModalOpen">
      <div
        class="modal fade show d-block"
        tabindex="-1"
        style="background: rgba(0, 0, 0, 0.5)"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content card shadow-lg border-0">
            <div class="card-header text-center bg-transparent pb-0">
              <h6 class="font-weight-bolder text-dark">당담자 정보 수정</h6>
            </div>
            <div class="card-body p-4">
              <h6 class="text-dark mb-3 border-bottom pb-1">기본 정보</h6>
              <!-- 아이디 (읽기 전용) -->
              <div
                class="d-flex flex-column flex-md-row align-items-center mb-2"
              >
                <label
                  class="me-md-2 mb-1 mb-md-0"
                  style="width: 120px; text-align: right"
                  >아이디</label
                >
                <input
                  :value="editUserId"
                  type="text"
                  class="form-control flex-grow-1 bg-light"
                  placeholder="아이디"
                  readonly
                />
              </div>

              <!-- 담당자명 -->
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
                  placeholder="담당자명"
                />
              </div>

              <!-- 연락처 -->
              <div
                class="d-flex flex-column flex-md-row align-items-center mb-2"
              >
                <label
                  class="me-md-2 mb-1 mb-md-0"
                  style="width: 120px; text-align: right"
                  >연락처</label
                >
                <input
                  v-model="editPhone"
                  class="form-control flex-grow-1"
                  placeholder="연락처"
                />
              </div>

              <!-- 이메일 -->
              <div
                class="d-flex flex-column flex-md-row align-items-center mb-2"
              >
                <label
                  class="me-md-2 mb-1 mb-md-0"
                  style="width: 120px; text-align: right"
                  >이메일</label
                >
                <input
                  v-model="editEmail"
                  class="form-control flex-grow-1"
                  placeholder="이메일"
                />
              </div>

              <!-- 버튼 -->
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
