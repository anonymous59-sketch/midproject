<script setup>
import { ref, computed } from "vue";

// ====== 페이징 ======
const itemsPerPage = 10;
const currentPage = ref(1);

// ====== 수정 모달 ======
const isEditModalOpen = ref(false);
const editTarget = ref(null);
const editOrgName = ref("");
const editAddress = ref("");
const editPhone = ref("");
const editEmail = ref("");
const editStartDate = ref("");
const editEndDate = ref("");
const editStatus = ref("운영"); // 운영여부

// ====== 샘플 데이터 ======
const tableData = ref([
  {
    id: 1,
    selected: false,
    orgName: "서울시 청년센터",
    address: "서울시 종로구",
    phone: "02-123-4567",
    email: "seoul@center.com",
    startDate: "2022-01-01",
    endDate: "2023-12-31",
    status: "운영",
  },
  {
    id: 2,
    selected: false,
    orgName: "부산 창업 지원센터",
    address: "부산시 해운대구",
    phone: "051-987-6543",
    email: "busan@center.com",
    startDate: "2021-03-01",
    endDate: "2024-02-28",
    status: "중단",
  },
  {
    id: 3,
    selected: false,
    orgName: "대구 IT 인큐베이터",
    address: "대구시 수성구",
    phone: "053-112-3344",
    email: "daegu@incubator.com",
    startDate: "2023-05-01",
    endDate: "2025-04-30",
    status: "운영",
  },
]);

// ====== 페이징 계산 ======
const totalPages = computed(() =>
  Math.ceil(tableData.value.length / itemsPerPage),
);
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return tableData.value.slice(start, start + itemsPerPage);
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
const handleEdit = (item) => {
  editTarget.value = item;
  editOrgName.value = item.orgName;
  editAddress.value = item.address;
  editPhone.value = item.phone;
  editEmail.value = item.email;
  editStartDate.value = item.startDate;
  editEndDate.value = item.endDate;
  editStatus.value = item.status;
  isEditModalOpen.value = true;
};

const confirmEdit = () => {
  if (!editTarget.value) return;

  editTarget.value.orgName = editOrgName.value;
  editTarget.value.address = editAddress.value;
  editTarget.value.phone = editPhone.value;
  editTarget.value.email = editEmail.value;
  editTarget.value.startDate = editStartDate.value;
  editTarget.value.endDate = editEndDate.value;
  editTarget.value.status = editStatus.value;

  closeEditModal();
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
  editTarget.value = null;
  editOrgName.value = "";
  editAddress.value = "";
  editPhone.value = "";
  editEmail.value = "";
  editStartDate.value = "";
  editEndDate.value = "";
  editStatus.value = "운영";
};

// ====== 상태별 배지 ======
const statusBadge = (status) => ({
  "bg-gradient-success": status === "운영",
  "bg-gradient-danger": status === "중단",
});
</script>

<template>
  <div class="container-fluid py-4">
    <!-- ====== 테이블 ====== -->
    <div class="card mb-4">
      <div
        class="card-header d-flex justify-content-between align-items-center pb-0"
      >
        <h6>기관 관리</h6>
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
                  기관명
                </th>
                <th
                  class="text-xxs text-secondary font-weight-bolder opacity-7 ps-2"
                >
                  주소
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
                  가입일
                </th>
                <th
                  class="text-center text-xxs text-secondary font-weight-bolder opacity-7"
                >
                  종료일
                </th>
                <th
                  class="text-center text-xxs text-secondary font-weight-bolder opacity-7"
                >
                  운영여부
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
                <td>{{ item.orgName }}</td>
                <td>{{ item.address }}</td>
                <td>{{ item.phone }}</td>
                <td>{{ item.email }}</td>
                <td class="text-center">{{ item.startDate }}</td>
                <td class="text-center">{{ item.endDate }}</td>
                <td class="text-center">
                  <span :class="['badge badge-sm', statusBadge(item.status)]">{{
                    item.status
                  }}</span>
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
              <h6 class="font-weight-bolder text-dark">기관 정보 수정</h6>
            </div>
            <div class="card-body p-4">
              <div
                class="d-flex flex-column flex-md-row align-items-center mb-2"
              >
                <label
                  class="me-md-2 mb-1 mb-md-0"
                  style="width: 120px; text-align: right"
                  >기관명</label
                >
                <input
                  v-model="editOrgName"
                  class="form-control flex-grow-1"
                  placeholder="기관명"
                />
              </div>
              <div
                class="d-flex flex-column flex-md-row align-items-center mb-2"
              >
                <label
                  class="me-md-2 mb-1 mb-md-0"
                  style="width: 120px; text-align: right"
                  >주소</label
                >
                <input
                  v-model="editAddress"
                  class="form-control flex-grow-1"
                  placeholder="주소"
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
                <input
                  v-model="editPhone"
                  class="form-control flex-grow-1"
                  placeholder="연락처"
                />
              </div>
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
              <div
                class="d-flex flex-column flex-md-row align-items-center mb-2"
              >
                <label
                  class="me-md-2 mb-1 mb-md-0"
                  style="width: 120px; text-align: right"
                  >가입일</label
                >
                <input
                  type="date"
                  v-model="editStartDate"
                  class="form-control flex-grow-1"
                />
              </div>
              <div
                class="d-flex flex-column flex-md-row align-items-center mb-2"
              >
                <label
                  class="me-md-2 mb-1 mb-md-0"
                  style="width: 120px; text-align: right"
                  >종료일</label
                >
                <input
                  type="date"
                  v-model="editEndDate"
                  class="form-control flex-grow-1"
                />
              </div>
              <div
                class="d-flex flex-column flex-md-row align-items-center mb-3"
              >
                <label
                  class="me-md-2 mb-1 mb-md-0"
                  style="width: 120px; text-align: right"
                  >운영여부</label
                >
                <select v-model="editStatus" class="form-control flex-grow-1">
                  <option value="운영">운영</option>
                  <option value="중단">중단</option>
                </select>
              </div>

              <div class="d-flex justify-content-center gap-2 flex-wrap">
                <button
                  class="btn btn-sm bg-gradient-success"
                  @click="confirmEdit"
                >
                  저장
                </button>
                <button
                  class="btn btn-sm bg-gradient-secondary"
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
