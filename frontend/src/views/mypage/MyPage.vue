<script setup>
import { ref, computed } from "vue";

/* ================= 회원 정보 ================= */
const member = ref({
  m_id: "kkkk",
  m_bd: "1990-01-01",
  m_phone: "010-1234-5678",
  m_email: "kkkk@test.com",
  m_address: "대구광역시 수성구",
  m_joindate: "2024-01-15",
});

const isEditMode = ref(false);

const editForm = ref({
  m_phone: member.value.m_phone,
  m_email: member.value.m_email,
});

const startEdit = () => {
  editForm.value.m_phone = member.value.m_phone;
  editForm.value.m_email = member.value.m_email;
  isEditMode.value = true;
};

const saveEdit = () => {
  member.value.m_phone = editForm.value.m_phone;
  member.value.m_email = editForm.value.m_email;
  isEditMode.value = false;
  alert("회원 정보가 수정되었습니다.");
};

const cancelEdit = () => {
  isEditMode.value = false;
};

const withdrawMember = () => {
  if (confirm("정말 회원탈퇴 하시겠습니까?")) {
    alert("회원탈퇴 처리 (백엔드 연결 예정)");
  }
};

/* ================= 지원자 ================= */
const applicants = ref([
  {
    mc_pn: "DSBL20240101",
    mc_nm: "김민수",
    mc_bd: "2010-03-01",
    mc_gender: "남",
    mc_address: "대구 달서구",
    mc_type: "지체장애",
    mc_submitdate: "2024-02-01",
  },
  {
    mc_pn: "DSBL20240102",
    mc_nm: "이서연",
    mc_bd: "2011-07-15",
    mc_gender: "여",
    mc_address: "대구 수성구",
    mc_type: "시각장애",
    mc_submitdate: "2024-02-10",
  },
  {
    mc_pn: "DSBL20240103",
    mc_nm: "박준호",
    mc_bd: "2009-11-22",
    mc_gender: "남",
    mc_address: "대구 북구",
    mc_type: "지적장애",
    mc_submitdate: "2024-02-18",
  },
  {
    mc_pn: "DSBL20240104",
    mc_nm: "최지우",
    mc_bd: "2012-05-03",
    mc_gender: "여",
    mc_address: "대구 동구",
    mc_type: "자폐성장애",
    mc_submitdate: "2024-02-25",
  },
]);

const selectedApplicant = ref(null);
const totalCount = computed(() => applicants.value.length);

const isApplicantEditMode = ref(false);

const applicantEditForm = ref({
  mc_nm: "",
  mc_bd: "",
  mc_gender: "남",
  mc_address: "",
  mc_type: "",
  mc_submitdate: "",
});

const selectApplicant = (a) => {
  selectedApplicant.value = a;
  isApplicantEditMode.value = false;
};

const isSelectedApplicant = (a) => selectedApplicant.value?.mc_pn === a?.mc_pn;

const startApplicantEdit = () => {
  if (!selectedApplicant.value) return;

  applicantEditForm.value = {
    mc_nm: selectedApplicant.value.mc_nm,
    mc_bd: selectedApplicant.value.mc_bd,
    mc_gender: selectedApplicant.value.mc_gender,
    mc_address: selectedApplicant.value.mc_address,
    mc_type: selectedApplicant.value.mc_type,
    mc_submitdate: selectedApplicant.value.mc_submitdate,
  };

  isApplicantEditMode.value = true;
};

const saveApplicantEdit = () => {
  if (!selectedApplicant.value) return;

  selectedApplicant.value.mc_nm = applicantEditForm.value.mc_nm;
  selectedApplicant.value.mc_bd = applicantEditForm.value.mc_bd;
  selectedApplicant.value.mc_gender = applicantEditForm.value.mc_gender;
  selectedApplicant.value.mc_address = applicantEditForm.value.mc_address;
  selectedApplicant.value.mc_type = applicantEditForm.value.mc_type;
  selectedApplicant.value.mc_submitdate = applicantEditForm.value.mc_submitdate;

  isApplicantEditMode.value = false;
  alert("지원자 정보가 수정되었습니다.");
};

const cancelApplicantEdit = () => {
  isApplicantEditMode.value = false;
};

/* ================= 모달 ================= */
const showModal = ref(false);

const newApplicant = ref({
  mc_nm: "",
  mc_bd: "",
  mc_gender: "남",
  mc_address: "",
  mc_types: [""],
  mc_submitdate: "",
});

const openModal = () => (showModal.value = true);
const closeModal = () => (showModal.value = false);

const addDisabilityTypeField = () => {
  newApplicant.value.mc_types.push("");
};

const removeDisabilityTypeField = (idx) => {
  if (newApplicant.value.mc_types.length <= 1) {
    newApplicant.value.mc_types[0] = "";
    return;
  }
  newApplicant.value.mc_types.splice(idx, 1);
};

const addApplicant = () => {
  if (!newApplicant.value.mc_nm) {
    alert("이름을 입력하세요.");
    return;
  }

  const disabilityTypes = newApplicant.value.mc_types
    .map((t) => String(t ?? "").trim())
    .filter(Boolean);

  if (disabilityTypes.length === 0) {
    alert("장애유형을 1개 이상 입력하세요.");
    return;
  }

  applicants.value.push({
    mc_pn: "DSBL" + Date.now(),
    mc_nm: newApplicant.value.mc_nm,
    mc_bd: newApplicant.value.mc_bd,
    mc_gender: newApplicant.value.mc_gender,
    mc_address: newApplicant.value.mc_address,
    mc_type: disabilityTypes.join(", "),
    mc_submitdate: newApplicant.value.mc_submitdate,
  });

  newApplicant.value = {
    mc_nm: "",
    mc_bd: "",
    mc_gender: "남",
    mc_address: "",
    mc_types: [""],
    mc_submitdate: "",
  };

  showModal.value = false;
};

const findAddress = () => {
  alert("주소찾기 API 연결 예정");
};
</script>

<template>
  <div class="container-fluid py-4">
    <div class="row g-4">
      <!-- LEFT -->
      <div class="col-lg-4">
        <div class="card shadow-lg border-0 h-100">
          <div class="card-header pb-0">
            <h5 class="mb-0">회원 정보</h5>
          </div>

          <div class="card-body pt-3">
            <div class="info-box">
              <div class="info-label">아이디</div>
              <div class="info-value">{{ member.m_id }}</div>
            </div>

            <div class="info-box">
              <div class="info-label">생년월일</div>
              <div class="info-value">{{ member.m_bd }}</div>
            </div>

            <div class="info-box">
              <div class="info-label">연락처</div>
              <div v-if="!isEditMode" class="info-value">
                {{ member.m_phone }}
              </div>
              <input v-else v-model="editForm.m_phone" class="form-control" />
            </div>

            <div class="info-box">
              <div class="info-label">이메일</div>
              <div v-if="!isEditMode" class="info-value">
                {{ member.m_email }}
              </div>
              <input v-else v-model="editForm.m_email" class="form-control" />
            </div>

            <div class="info-box">
              <div class="info-label">주소</div>
              <div class="info-value">{{ member.m_address }}</div>
            </div>

            <div class="info-box">
              <div class="info-label">가입일</div>
              <div class="info-value">{{ member.m_joindate }}</div>
            </div>

            <div class="mt-3">
              <button
                v-if="!isEditMode"
                class="btn bg-gradient-success w-100 mb-2"
                @click="startEdit"
              >
                회원정보 수정
              </button>

              <div v-else class="d-flex gap-2 mb-2">
                <button class="btn bg-gradient-success w-100" @click="saveEdit">
                  저장
                </button>
                <button
                  class="btn btn-outline-secondary w-100"
                  @click="cancelEdit"
                >
                  취소
                </button>
              </div>

              <button
                class="btn bg-gradient-danger w-100"
                @click="withdrawMember"
              >
                회원탈퇴
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CENTER -->
      <div class="col-lg-4">
        <div class="card shadow-lg border-0 h-100">
          <div
            class="card-header pb-0 d-flex justify-content-between align-items-center"
          >
            <h5 class="mb-0">지원 대상자</h5>
            <span class="badge bg-gradient-primary">
              총 {{ totalCount }}명
            </span>
          </div>

          <div class="card-body">
            <button
              class="btn bg-gradient-success w-100 mb-3"
              @click="openModal"
            >
              지원자 추가
            </button>

            <ul class="list-group applicant-list">
              <li
                v-for="a in applicants"
                :key="a.mc_pn"
                class="list-group-item applicant-item"
                :class="{ 'applicant-item--active': isSelectedApplicant(a) }"
                role="button"
                @click="selectApplicant(a)"
              >
                <div class="applicant-name">
                  {{ a.mc_nm }}
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- RIGHT -->
      <div class="col-lg-4">
        <div class="card shadow-lg border-0 h-100">
          <div
            class="card-header pb-0 d-flex justify-content-between align-items-center"
          >
            <h5 class="mb-0">지원자 정보</h5>
            <button
              v-if="selectedApplicant && !isApplicantEditMode"
              class="btn btn-sm bg-gradient-info mb-0"
              @click="startApplicantEdit"
            >
              수정
            </button>
          </div>

          <div class="card-body">
            <div v-if="!selectedApplicant" class="text-center text-muted py-5">
              중앙에서 지원자를 선택하세요
            </div>

            <div v-else>
              <div v-if="!isApplicantEditMode">
                <div class="info-box">
                  <div class="info-label">이름</div>
                  <div class="info-value">{{ selectedApplicant.mc_nm }}</div>
                </div>

                <div class="info-box">
                  <div class="info-label">생년월일</div>
                  <div class="info-value">{{ selectedApplicant.mc_bd }}</div>
                </div>

                <div class="info-box">
                  <div class="info-label">성별</div>
                  <div class="info-value">
                    {{ selectedApplicant.mc_gender }}
                  </div>
                </div>

                <div class="info-box">
                  <div class="info-label">주소</div>
                  <div class="info-value">
                    {{ selectedApplicant.mc_address }}
                  </div>
                </div>

                <div class="info-box">
                  <div class="info-label">장애유형</div>
                  <div class="info-value">{{ selectedApplicant.mc_type }}</div>
                </div>

                <div class="info-box">
                  <div class="info-label">신청일</div>
                  <div class="info-value">
                    {{ selectedApplicant.mc_submitdate }}
                  </div>
                </div>
              </div>

              <div v-else>
                <div class="info-box">
                  <div class="info-label">이름</div>
                  <input
                    v-model="applicantEditForm.mc_nm"
                    class="form-control"
                  />
                </div>

                <div class="info-box">
                  <div class="info-label">생년월일</div>
                  <input
                    v-model="applicantEditForm.mc_bd"
                    type="date"
                    class="form-control"
                  />
                </div>

                <div class="info-box">
                  <div class="info-label">성별</div>
                  <div class="d-flex align-items-center">
                    <label class="me-3 mb-0">
                      <input
                        type="radio"
                        value="남"
                        v-model="applicantEditForm.mc_gender"
                      />
                      남
                    </label>
                    <label class="mb-0">
                      <input
                        type="radio"
                        value="여"
                        v-model="applicantEditForm.mc_gender"
                      />
                      여
                    </label>
                  </div>
                </div>

                <div class="info-box">
                  <div class="info-label">주소</div>
                  <input
                    v-model="applicantEditForm.mc_address"
                    class="form-control"
                  />
                </div>

                <div class="info-box">
                  <div class="info-label">장애유형</div>
                  <input
                    v-model="applicantEditForm.mc_type"
                    class="form-control"
                  />
                </div>

                <div class="info-box">
                  <div class="info-label">신청일</div>
                  <input
                    v-model="applicantEditForm.mc_submitdate"
                    type="date"
                    class="form-control"
                  />
                </div>

                <div class="d-flex gap-2 mt-3">
                  <button
                    class="btn bg-gradient-success w-100"
                    @click="saveApplicantEdit"
                  >
                    저장
                  </button>
                  <button
                    class="btn btn-outline-secondary w-100"
                    @click="cancelApplicantEdit"
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

    <!-- MODAL -->
    <div v-if="showModal" class="modal-backdrop-custom">
      <div class="modal-custom">
        <h4 class="mb-4 text-center">신규 지원대상자 등록</h4>

        <div class="modal-form">
          <div class="form-row">
            <div class="form-label-left">이름</div>
            <div class="form-input-right">
              <input v-model="newApplicant.mc_nm" class="form-control" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-label-left">생년월일</div>
            <div class="form-input-right">
              <input
                v-model="newApplicant.mc_bd"
                type="date"
                class="form-control"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-label-left">성별</div>
            <div class="form-input-right">
              <label class="me-3">
                <input
                  type="radio"
                  value="남"
                  v-model="newApplicant.mc_gender"
                />
                남
              </label>
              <label>
                <input
                  type="radio"
                  value="여"
                  v-model="newApplicant.mc_gender"
                />
                여
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="form-label-left">주소</div>
            <div class="form-input-right d-flex gap-2">
              <input v-model="newApplicant.mc_address" class="form-control" />
              <button class="btn btn-outline-secondary" @click="findAddress">
                주소찾기
              </button>
            </div>
          </div>

          <div class="form-row">
            <div class="form-label-left">장애유형</div>
            <div class="form-input-right">
              <div class="d-flex flex-column gap-2">
                <div
                  v-for="(t, idx) in newApplicant.mc_types"
                  :key="idx"
                  class="d-flex gap-2"
                >
                  <input
                    v-model="newApplicant.mc_types[idx]"
                    class="form-control"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-danger btn-sm mb-0"
                    @click="removeDisabilityTypeField(idx)"
                  >
                    삭제
                  </button>
                </div>

                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm mb-0 align-self-start"
                  @click="addDisabilityTypeField"
                >
                  장애유형 추가
                </button>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-label-left">등록일</div>
            <div class="form-input-right">
              <input
                v-model="newApplicant.mc_submitdate"
                type="date"
                class="form-control"
              />
            </div>
          </div>
        </div>

        <div class="d-flex gap-2 mt-4">
          <button class="btn bg-gradient-success w-100" @click="addApplicant">
            등록
          </button>
          <button class="btn btn-outline-secondary w-100" @click="closeModal">
            취소
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-box {
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
  background: #fff;
  transition: all 0.15s ease;
}

.info-box:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.info-label {
  font-size: 12px;
  color: #8392ab;
  margin-bottom: 4px;
}

.info-value {
  font-weight: 600;
  color: #344767;
}

.list-hover {
  cursor: pointer;
  transition: all 0.15s ease;
}

.list-hover:hover {
  background: #f8f9fa;
  transform: translateX(2px);
}

.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-custom {
  background: white;
  padding: 32px;
  border-radius: 18px;
  width: 480px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: flex;
  align-items: center;
}

.form-label-left {
  width: 110px;
  font-weight: 600;
  color: #344767;
  font-size: 14px;
}

.form-input-right {
  flex: 1;
}

.applicant-list {
  max-height: 420px;
  overflow-y: auto;
}

.applicant-item {
  border: 0;
  border-radius: 14px;
  margin-bottom: 10px;
  padding: 14px 14px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
  background: #fff;
}

.applicant-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
}

.applicant-item--active {
  background: rgba(17, 205, 239, 0.12);
}

.applicant-name {
  font-weight: 700;
  color: #344767;
  line-height: 1.2;
}

@media (max-width: 991px) {
  .modal-custom {
    width: 92%;
  }
}
</style>
