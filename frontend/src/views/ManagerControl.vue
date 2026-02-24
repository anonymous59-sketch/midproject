<script setup>
import { ref, computed } from "vue";

const itemsPerPage = 10;
const currentPage = ref(1);

// 팝업 관련 상태
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

// 샘플 데이터
const tableData = ref([
  {
    id: 1,
    selected: false,
    userId: "admin_master",
    userName: "홍길동",
    phone: "010-1234-5678",
    email: "hong@creative.com",
    targetCount: 1,
    joinedAt: "20/05/24",
    status: "승인",
  },
  {
    id: 2,
    selected: false,
    userId: "user_dev_02",
    userName: "이미영",
    phone: "010-9876-5432",
    email: "lee@creative.com",
    targetCount: 3,
    joinedAt: "21/05/24",
    status: "대기중",
  },
  {
    id: 3,
    selected: false,
    userId: "manager_kim",
    userName: "김철수",
    phone: "010-2233-4455",
    email: "kim@creative.com",
    targetCount: 2,
    joinedAt: "22/05/24",
    status: "승인",
  },
  {
    id: 4,
    selected: false,
    userId: "support_park",
    userName: "박지민",
    phone: "010-5566-7788",
    email: "park@creative.com",
    targetCount: 4,
    joinedAt: "23/05/24",
    status: "반려",
  },
  {
    id: 5,
    selected: false,
    userId: "lead_choi",
    userName: "최유진",
    phone: "010-8899-0011",
    email: "choi@creative.com",
    targetCount: 1,
    joinedAt: "24/05/24",
    status: "승인",
  },
  {
    id: 6,
    selected: false,
    userId: "staff_jung",
    userName: "정호석",
    phone: "010-1122-3344",
    email: "jung@creative.com",
    targetCount: 6,
    joinedAt: "25/05/24",
    status: "대기중",
  },
  {
    id: 7,
    selected: false,
    userId: "dev_lee",
    userName: "이현우",
    phone: "010-4455-6677",
    email: "hwlee@creative.com",
    targetCount: 1,
    joinedAt: "26/05/24",
    status: "승인",
  },
  {
    id: 8,
    selected: false,
    userId: "hr_min",
    userName: "민윤기",
    phone: "010-7788-9900",
    email: "min@creative.com",
    targetCount: 3,
    joinedAt: "27/05/24",
    status: "대기중",
  },
  {
    id: 9,
    selected: false,
    userId: "ops_kang",
    userName: "강다니엘",
    phone: "010-3344-5566",
    email: "kang@creative.com",
    targetCount: 2,
    joinedAt: "28/05/24",
    status: "승인",
  },
  {
    id: 10,
    selected: false,
    userId: "design_son",
    userName: "손흥민",
    phone: "010-6677-8899",
    email: "son@creative.com",
    targetCount: 1,
    joinedAt: "29/05/24",
    status: "반려",
  },
  {
    id: 11,
    selected: false,
    userId: "new_user_01",
    userName: "이강인",
    phone: "010-1111-2222",
    email: "lee@creative.com",
    targetCount: 1,
    joinedAt: "30/05/24",
    status: "대기중",
  },
]);

const totalPages = computed(() =>
  Math.ceil(tableData.value.length / itemsPerPage),
);
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return tableData.value.slice(start, start + itemsPerPage);
});

const statusBadge = (status) => ({
  "bg-gradient-success": status === "승인",
  "bg-gradient-secondary": status === "대기중",
  "bg-gradient-danger": status === "반려",
});

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
const closeRejectModal = () => {
  isRejectModalOpen.value = false;
};

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    alert("반려 사유를 입력해주세요.");
    return;
  }
  if (selectedItem.value) {
    try {
      await fetch("/api/users/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedItem.value.userId,
          email: selectedItem.value.email,
          reason: rejectReason.value,
        }),
      });
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
const handleEdit = (item) => console.log("Edit:", item.userName);
</script>

<template>
  <div class="container-fluid py-4">
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
        <div class="table-responsive p-0">
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
                  지원대상자수
                </th>
                <th
                  class="text-center text-xxs text-secondary font-weight-bolder opacity-7"
                >
                  가입일
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
                <td>{{ item.phone }}</td>
                <td>{{ item.email }}</td>
                <td class="text-center">
                  {{ item.targetCount.toLocaleString() }}명
                </td>
                <td class="text-center">{{ item.joinedAt }}</td>
                <td class="text-center">
                  <span
                    class="badge badge-sm cursor-pointer"
                    :class="[
                      statusBadge(item.status),
                      item.status === '대기중' ? 'hover-opacity' : '',
                    ]"
                    @click="item.status === '대기중' && openModal(item)"
                    >{{ item.status }}</span
                  >
                </td>
                <td class="text-center">
                  <a
                    href="javascript:;"
                    @click="handleEdit(item)"
                    class="text-secondary text-xs font-weight-bold"
                    >수정</a
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>

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

    <!-- 모달 -->
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
        role="dialog"
        style="background: rgba(0, 0, 0, 0.5)"
      >
        <div class="modal-dialog modal-dialog-centered" role="document">
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
  </div>
</template>
