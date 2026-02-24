<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const mode = computed(() => (route.query.mode == "edit" ? "edit" : "create"));

const form = ref({
  sver_code: "",
  sv_name: "",
  sver_ondate: "",
  sver_enddate: "",
});

// 모달 상태
const showMajorModal = ref(false);
const showSubModal = ref(false);
const showQuestionModal = ref(false);

const majorModalMode = ref("create"); // create | edit
const subModalMode = ref("create"); // create | edit
const questionModalMode = ref("create"); // create | edit

const editingMajorId = ref(null);
const editingSubId = ref(null);
const editingQuestionIndex = ref(null);

const majorForm = ref({
  name: "",
});

const subForm = ref({
  name: "",
  note: "",
});

const questionForm = ref({
  text: "",
  answerType: "OX",
});

// 대분류 / 소분류 / 질문 목업 데이터
const majorCategories = ref([
  { id: 1, name: "지원사유" },
]);

const subCategories = ref([
  {
    id: 11,
    majorId: 1,
    name: "긴급지원필요",
    note: "즉시지원인식 및 서비스 필요",
  },
  { id: 12, majorId: 1, name: "중점지원필요", note: "2년 이내에 지원 필요" },
  {
    id: 13,
    majorId: 1,
    name: "계획수립필요",
    note: "지원이 필요한 시점이 2년 이상 5년 미만인 경우",
  },
]);

const questionsBySubcategory = ref({
  11: [
    {
      text: "가족(돌보는 사람)의 사망, 심각한 질병, 위기 등으로 더 이상 돌봄을 할 수 없음",
      answerType: "OX",
    },
    {
      text: "법원에 의해 구속되었거나, 지원이 없으면 궁핍을 위협이 있는 경우",
      answerType: "OX",
    },
  ],
  12: [
    {
      text: "질병을 앓고 있는 지원자가 있으며 향후 2년 이내에 계속 간병을 제공할 수 있음",
      answerType: "OX",
    },
    {
      text: "지원이 필요한 날짜를 선택할 수 있도록 날짜형 질문 예시",
      answerType: "DATE",
    },
  ],
  13: [
    {
      text: "구체적 사유를 작성할 수 있도록 사유작성형 질문 예시",
      answerType: "TEXT",
    },
  ],
});

const selectedMajorId = ref(majorCategories.value[0]?.id || null);
const selectedSubId = ref(null);

const filteredSubCategories = computed(() =>
  subCategories.value.filter((sub) => sub.majorId === selectedMajorId.value)
);

const selectedMajor = computed(() =>
  majorCategories.value.find((m) => m.id === selectedMajorId.value) || null
);

const selectedSub = computed(() =>
  subCategories.value.find((s) => s.id === selectedSubId.value) || null
);

const currentQuestions = computed(
  () => questionsBySubcategory.value[selectedSubId.value] || []
);

const answerTypeLabel = (type) => {
  if (type === "DATE") return "날짜";
  if (type === "TEXT") return "사유작성";
  return "O/X";
};

const titleText = computed(() =>
  mode.value === "edit" ? "조사지 수정" : "조사지 등록"
);

onMounted(() => {
  if (mode.value === "edit") {
    form.value.sver_code = route.query.sver_code || "";
    form.value.sv_name = route.query.sv_name || "";
    form.value.sver_ondate = route.query.sver_ondate || "";
    form.value.sver_enddate = route.query.sver_enddate || "";
  }

  // 최초 진입 시 선택된 대분류에 맞는 첫 소분류 선택
  if (filteredSubCategories.value.length > 0) {
    selectedSubId.value = filteredSubCategories.value[0].id;
  }
});

watch(selectedMajorId, () => {
  const list = filteredSubCategories.value;
  selectedSubId.value = list.length ? list[0].id : null;
});

const handleSave = () => {
  // 목업 저장 처리: 이후 실제 API 연동 시 이 위치에서 axios 호출
  // eslint-disable-next-line no-console
  console.log("SurveyForm save", {
    mode: mode.value,
    ...form.value,
  });
  router.push({ name: "systemSurveyList" });
};

const handleCancel = () => {
  router.push({ name: "systemSurveyList" });
};

// 모달 열기/닫기 및 저장 로직
const openMajorCreate = () => {
  majorModalMode.value = "create";
  editingMajorId.value = null;
  majorForm.value.name = "";
  showMajorModal.value = true;
};

const openMajorEdit = (major) => {
  majorModalMode.value = "edit";
  editingMajorId.value = major.id;
  majorForm.value.name = major.name;
  showMajorModal.value = true;
};

const saveMajor = () => {
  if (!majorForm.value.name.trim()) {
    return;
  }
  if (majorModalMode.value === "create") {
    const nextId =
      (majorCategories.value[majorCategories.value.length - 1]?.id || 0) + 1;
    majorCategories.value.push({
      id: nextId,
      name: majorForm.value.name.trim(),
    });
  } else if (majorModalMode.value === "edit") {
    const idx = majorCategories.value.findIndex(
      (m) => m.id === editingMajorId.value
    );
    if (idx !== -1) {
      majorCategories.value[idx].name = majorForm.value.name.trim();
    }
  }
  showMajorModal.value = false;
};

const openSubCreate = () => {
  if (!selectedMajorId.value) return;
  subModalMode.value = "create";
  editingSubId.value = null;
  subForm.value.name = "";
  subForm.value.note = "";
  showSubModal.value = true;
};

const openSubEdit = (sub) => {
  subModalMode.value = "edit";
  editingSubId.value = sub.id;
  subForm.value.name = sub.name;
  subForm.value.note = sub.note || "";
  showSubModal.value = true;
};

const saveSub = () => {
  if (!subForm.value.name.trim() || !selectedMajorId.value) {
    return;
  }
  if (subModalMode.value === "create") {
    const nextId =
      (subCategories.value[subCategories.value.length - 1]?.id || 0) + 1;
    subCategories.value.push({
      id: nextId,
      majorId: selectedMajorId.value,
      name: subForm.value.name.trim(),
      note: subForm.value.note.trim(),
    });
  } else if (subModalMode.value === "edit") {
    const idx = subCategories.value.findIndex(
      (s) => s.id === editingSubId.value
    );
    if (idx !== -1) {
      subCategories.value[idx].name = subForm.value.name.trim();
      subCategories.value[idx].note = subForm.value.note.trim();
    }
  }
  showSubModal.value = false;
};

const openQuestionCreate = () => {
  if (!selectedSubId.value) return;
  questionModalMode.value = "create";
  editingQuestionIndex.value = null;
  questionForm.value.text = "";
  questionForm.value.answerType = "OX";
  showQuestionModal.value = true;
};

const openQuestionEdit = (index, q) => {
  questionModalMode.value = "edit";
  editingQuestionIndex.value = index;
  questionForm.value.text = q?.text || "";
  questionForm.value.answerType = q?.answerType || "OX";
  showQuestionModal.value = true;
};

const saveQuestion = () => {
  if (!selectedSubId.value || !questionForm.value.text.trim()) {
    return;
  }
  const key = selectedSubId.value;
  if (!questionsBySubcategory.value[key]) {
    questionsBySubcategory.value[key] = [];
  }

  if (questionModalMode.value === "create") {
    questionsBySubcategory.value[key].push({
      text: questionForm.value.text.trim(),
      answerType: questionForm.value.answerType,
    });
  } else if (questionModalMode.value === "edit") {
    const list = questionsBySubcategory.value[key];
    if (
      list &&
      editingQuestionIndex.value !== null &&
      editingQuestionIndex.value >= 0 &&
      editingQuestionIndex.value < list.length
    ) {
      list[editingQuestionIndex.value] = {
        ...(list[editingQuestionIndex.value] || {}),
        text: questionForm.value.text.trim(),
        answerType: questionForm.value.answerType,
      };
    }
  }

  showQuestionModal.value = false;
};

</script>

<template>
  <div class="container-fluid py-4 survey-form-page">
    <div class="card shadow-sm">
      <!-- 상단 기본 정보 영역 -->
      <div class="card-header d-flex justify-content-between align-items-center">
        <div>
          <h5 class="mb-1">{{ titleText }}</h5>
          <small class="text-muted">
            조사지명과 유효기간을 입력한 후 전체저장을 눌러주세요.
          </small>
        </div>
        <div class="d-flex gap-2 align-items-end">
          <div v-if="mode === 'edit'" class="me-3">
            <label class="form-label mb-1">조사지 Ver</label>
            <input
              v-model="form.sver_code"
              type="text"
              class="form-control form-control-sm"
              readonly
            />
          </div>
          <div class="me-3">
            <label class="form-label mb-1">조사지명</label>
            <input
              v-model="form.sv_name"
              type="text"
              class="form-control form-control-sm"
              placeholder="조사지명을 입력하세요"
            />
          </div>
          <div class="me-3">
            <label class="form-label mb-1">유효시작일</label>
            <input
              v-model="form.sver_ondate"
              type="date"
              class="form-control form-control-sm"
            />
          </div>
          <div>
            <label class="form-label mb-1">유효종료일</label>
            <input
              v-model="form.sver_enddate"
              type="date"
              class="form-control form-control-sm"
            />
          </div>
        </div>
      </div>

      <!-- 본문 레이아웃 -->
      <div class="card-body survey-form-layout">
        <!-- 좌측: 대분류 / 소분류 선택 -->
        <div class="category-panel">
          <!-- 대분류 리스트 -->
          <div class="major-list">
            <div class="panel-header mb-2 d-flex justify-content-between">
              <span>대분류 항목</span>
              <button
                class="btn btn-sm btn-outline-secondary"
                type="button"
                @click="openMajorCreate"
              >
                등록
              </button>
            </div>
            <div
              v-for="major in majorCategories"
              :key="major.id"
              class="category-item"
              :class="{ active: major.id === selectedMajorId }"
            >
              <span @click="selectedMajorId = major.id">{{ major.name }}</span>
              <button
                class="btn btn-xs btn-outline-secondary ms-2"
                type="button"
                @click.stop="openMajorEdit(major)"
              >
                수정
              </button>
            </div>
          </div>

          <!-- 소분류 리스트 -->
          <div class="sub-list">
            <div class="panel-header mb-2 d-flex justify-content-between">
              <span>소분류 항목</span>
              <button
                class="btn btn-sm btn-outline-secondary"
                type="button"
                @click="openSubCreate"
              >
                등록
              </button>
            </div>

            <div v-if="filteredSubCategories.length" class="sub-items">
              <div
                v-for="sub in filteredSubCategories"
                :key="sub.id"
                class="category-item"
                :class="{ active: sub.id === selectedSubId }"
              >
                <div class="category-text" @click="selectedSubId = sub.id">
                  <div class="category-name">{{ sub.name }}</div>
                  <div v-if="sub.note" class="category-note">{{ sub.note }}</div>
                </div>
                <button
                  class="btn btn-xs btn-outline-secondary ms-2"
                  type="button"
                  @click.stop="openSubEdit(sub)"
                >
                  수정
                </button>
              </div>
            </div>
            <div v-else class="text-muted small">
              선택된 대분류에 소분류가 없습니다.
            </div>
          </div>
        </div>

        <!-- 우측: 선택된 소분류의 질문 -->
        <div class="right-panel">
          <div class="right-section">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h6 class="section-title mb-1">
                  {{ selectedMajor ? selectedMajor.name : "대분류를 선택하세요" }}
                </h6>
                <p class="section-subtitle mb-0">
                  <template v-if="selectedSub">
                    <span class="me-2">{{ selectedSub.name }}</span>
                    <small v-if="selectedSub.note" class="text-muted">
                      {{ selectedSub.note }}
                    </small>
                  </template>
                  <template v-else>
                    소분류를 선택하면 질문을 작성할 수 있습니다.
                  </template>
                </p>
              </div>
              <button
                class="btn btn-primary btn-sm"
                type="button"
                :disabled="!selectedSub"
                @click="openQuestionCreate"
              >
                질문 추가
              </button>
            </div>

            <hr />

            <h6 class="section-title mb-2">조사지 질문</h6>

            <div v-if="currentQuestions.length" class="table-responsive">
              <table class="table table-sm question-table align-middle">
                <thead>
                  <tr>
                    <th style="width: 56px">번호</th>
                    <th>질문</th>
                    <th style="width: 240px">답변 미리보기</th>
                    <th style="width: 84px">수정</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(q, idx) in currentQuestions" :key="idx">
                    <td>{{ idx + 1 }}</td>
                    <td>
                      <div class="fw-semibold">{{ q.text }}</div>
                      <div class="text-muted small">답변유형: {{ answerTypeLabel(q.answerType) }}</div>
                    </td>
                    <td>
                      <div v-if="q.answerType === 'OX'" class="d-flex gap-3">
                        <label class="d-flex align-items-center gap-1 mb-0">
                          <input type="radio" disabled />
                          <span class="small">예</span>
                        </label>
                        <label class="d-flex align-items-center gap-1 mb-0">
                          <input type="radio" disabled />
                          <span class="small">아니오</span>
                        </label>
                      </div>
                      <div v-else-if="q.answerType === 'DATE'">
                        <input type="date" class="form-control form-control-sm" disabled />
                      </div>
                      <div v-else>
                        <textarea
                          class="form-control form-control-sm"
                          rows="2"
                          disabled
                          placeholder="사유를 입력하세요"
                        ></textarea>
                      </div>
                    </td>
                    <td>
                      <button
                        class="btn btn-xs btn-outline-secondary"
                        type="button"
                        @click="openQuestionEdit(idx, q)"
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-muted small">
              아직 등록된 질문이 없습니다. 질문 추가 버튼을 눌러 질문을 추가하세요.
            </div>
          </div>
        </div>
      </div>

      <!-- 하단 버튼 영역 -->
      <div
        class="card-footer d-flex justify-content-end align-items-center bg-transparent gap-2"
      >
        <button class="btn btn-success" type="button" @click="handleSave">
          전체저장
        </button>
        <button class="btn btn-outline-secondary" type="button" @click="handleCancel">
          취소
        </button>
      </div>

      <!-- 대분류 모달 -->
      <div v-if="showMajorModal" class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h6 class="mb-0">
              {{ majorModalMode === "create" ? "지원서 항목 등록" : "지원서 항목 수정" }}
            </h6>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">제목</label>
              <input
                v-model="majorForm.name"
                type="text"
                class="form-control"
                placeholder="제목을 입력하세요"
              />
            </div>
          </div>
          <div class="modal-footer d-flex justify-content-end gap-2">
            <button class="btn btn-success" type="button" @click="saveMajor">
              {{ majorModalMode === "create" ? "등록" : "수정" }}
            </button>
            <button
              class="btn btn-warning"
              type="button"
              @click="showMajorModal = false"
            >
              취소
            </button>
          </div>
        </div>
      </div>

      <!-- 소분류 모달 -->
      <div v-if="showSubModal" class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h6 class="mb-0">
              {{ subModalMode === "create" ? "세부 항목 등록" : "세부 항목 수정" }}
            </h6>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">제목</label>
              <input
                v-model="subForm.name"
                type="text"
                class="form-control"
                placeholder="제목을 입력하세요"
              />
            </div>
            <div class="mb-2">
              <label class="form-label">비고</label>
              <input
                v-model="subForm.note"
                type="text"
                class="form-control"
                placeholder="필수가 아닙니다."
              />
            </div>
          </div>
          <div class="modal-footer d-flex justify-content-end gap-2">
            <button class="btn btn-success" type="button" @click="saveSub">
              {{ subModalMode === "create" ? "등록" : "수정" }}
            </button>
            <button
              class="btn btn-warning"
              type="button"
              @click="showSubModal = false"
            >
              취소
            </button>
          </div>
        </div>
      </div>

      <!-- 질문 모달 -->
      <div v-if="showQuestionModal" class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h6 class="mb-0">
              {{ questionModalMode === "create" ? "조사지 질문 등록" : "조사지 질문 수정" }}
            </h6>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">질문</label>
              <textarea
                v-model="questionForm.text"
                rows="3"
                class="form-control"
                placeholder="내용을 입력하세요."
              ></textarea>
            </div>
            <div class="mb-2">
              <label class="form-label d-block">답변유형</label>
              <div class="form-check form-check-inline">
                <input
                  id="type-ox"
                  v-model="questionForm.answerType"
                  class="form-check-input"
                  type="radio"
                  value="OX"
                />
                <label class="form-check-label" for="type-ox">O/X</label>
              </div>
              <div class="form-check form-check-inline">
                <input
                  id="type-date"
                  v-model="questionForm.answerType"
                  class="form-check-input"
                  type="radio"
                  value="DATE"
                />
                <label class="form-check-label" for="type-date">날짜</label>
              </div>
              <div class="form-check form-check-inline">
                <input
                  id="type-text"
                  v-model="questionForm.answerType"
                  class="form-check-input"
                  type="radio"
                  value="TEXT"
                />
                <label class="form-check-label" for="type-text">사유작성</label>
              </div>
            </div>
          </div>
          <div class="modal-footer d-flex justify-content-end gap-2">
            <button class="btn btn-primary" type="button" @click="saveQuestion">
              {{ questionModalMode === "create" ? "저장" : "수정" }}
            </button>
            <button
              class="btn btn-warning"
              type="button"
              @click="showQuestionModal = false"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.survey-form-layout {
  display: flex;
  gap: 16px;
  min-height: 420px;
}

.category-panel {
  width: 40%;
  display: flex;
  gap: 12px;
}

.major-list,
.sub-list {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 10px;
  background-color: #f8f9fa;
}

.panel-header span {
  font-weight: 600;
}

.category-item {
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  padding: 6px 8px;
  margin-bottom: 6px;
  background-color: #ffffff;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 4px;
}

.category-item.active {
  border-color: #2dce89;
  background-color: #e6f8f0;
  font-weight: 600;
}

.category-text {
  flex: 1;
}

.category-name {
  font-weight: 600;
}

.category-note {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 2px;
}

.right-panel {
  flex: 1;
}

.right-section {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 16px 20px;
  background-color: #ffffff;
  height: 100%;
}

.section-title {
  font-weight: 600;
}

.section-subtitle {
  font-size: 0.875rem;
}

.question-list {
  list-style: none;
  padding-left: 0;
  margin-bottom: 0;
}

.question-list li + li {
  margin-top: 8px;
}

.question-table th,
.question-table td {
  vertical-align: middle;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 20px;
  min-width: 360px;
  max-width: 480px;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.modal-header {
  margin-bottom: 12px;
}

.modal-footer {
  margin-top: 8px;
}
</style>

