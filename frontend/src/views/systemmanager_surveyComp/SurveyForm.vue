<script setup>
import { ref, computed, onBeforeMount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
// 라우터에 있는 정보를 가지고 와서 사용
const route = useRoute();
// 라우터에 정보를 입력하고 그 라우터로 이동
const router = useRouter();

const mode = computed(() => (route.query.mode == "edit" ? "edit" : "create"));

const form = ref({
  sver_code: "",
  sv_name: "",
  sver_ondate: "",
  sver_enddate: "",
});

// 모달 상태
// 값이 true로 변경되면 모달 창이 보임
const showMajorModal = ref(false); // 대분류 관련
const showSubModal = ref(false); // 소분류 관련
const showQuestionModal = ref(false); // 질문 등록 관련

// 조사지에 대한 등록인지 수정인지 체크 (create | edit)
const majorModalMode = ref("create"); // 대분류
const subModalMode = ref("create"); // 소분류
const questionModalMode = ref("create"); // 질문 등록

// 각 항목별 pk 값 > db에 넣기 위해서 확인
const editingMajorId = ref(null);
const editingSubId = ref(null);
const editingQuestionIndex = ref(null);

const majorForm = ref({
  name: "", // 항목내용
});

const subForm = ref({
  name: "", // 항목내용
  note: "", // 비고
});

const questionForm = ref({
  text: "", // 항목내용
  answerType: "OX", // 질문 유형, 기본값 OX
});

// 대분류 / 소분류 / 질문
const majorCategories = ref([]);
const subCategories = ref([]);
const questionsBySubcategory = ref({});

// DB에서 데이터를 가지고 오는 함수
const loadSurveyStructure = async () => {
  const sverCode = route.query.sver_code;
  try {
    // 조사지 버전을 기준으로 각각 대분류, 소분류, 질문을 조회함
    const [majorRes, subRes, qRes] = await Promise.all([
      axios.get("/api/majCate", { params: { sver_code: sverCode } }),
      axios.get("/api/subCate", { params: { sver_code: sverCode } }),
      axios.get("/api/surveyQ", { params: { sver_code: sverCode } }),
    ]);
    // 각각 사용하는 이름에 맞게 정리
    majorCategories.value = majorRes.data.map((maj) => ({
      id: maj.major_code,
      name: maj.major_name,
    }));
    subCategories.value = subRes.data.map((sub) => ({
      id: sub.sub_code,
      majorId: sub.major_code,
      name: sub.sub_name,
    }));
    questionsBySubcategory.value = transformSurveyQuestions(qRes.data);
  } catch (err) {
    console.error(err);
  }
};
// DB의 질문유형 부코드와 화면에서 사용하는 이름 일치를 위한 함수
const codeToUiType = (code) => {
  if (code == "f0_10") return "DATE";
  if (code == "f0_20") return "TEXT";
  return "OX";
};
// 소분류에 해당하는 질문 정보
const transformSurveyQuestions = (surveyQList) => {
  const result = {};

  surveyQList.forEach((q) => {
    const subCode = q.sub_code;

    if (!result[subCode]) {
      result[subCode] = [];
    }

    result[subCode].push({
      text: q.q_content,
      answerType: codeToUiType(q.q_type),
    });
  });

  return result;
};
// "?." 옵셔널 체이닝 >> 값이 있으면 그 값을 사용하고 값이 없으면 다른 선택지를 사용하는 코드
const selectedMajorId = ref(majorCategories.value[0]?.id || null);
// 여기에선 majorCatgories.value 배열의 첫번째 값이 있으면 그것의 id속성의 값을 가지고 오고 없으면 null을 반환
const selectedSubId = ref(null);

// 소분류 항목 중에서 대분류 항목과 같은 것만 가지고 오기
// db에서 대분류와 fk로 엮인 소분류 항목만 가져오는 것
const filteredSubCategories = computed(() =>
  subCategories.value.filter((sub) => sub.majorId == selectedMajorId.value),
);

const selectedMajor = computed(
  () =>
    majorCategories.value.find((majC) => majC.id == selectedMajorId.value) ||
    null,
);

const selectedSub = computed(
  () =>
    subCategories.value.find((subC) => subC.id == selectedSubId.value) || null,
);

const currentQuestions = computed(
  () => questionsBySubcategory.value[selectedSubId.value] || [],
);

// 라디오(radio), 체크박스(check), 사유(text)로 수정해야됨
const answerTypeLabel = (type) => {
  if (type == "DATE") return "날짜";
  if (type == "TEXT") return "사유";
  return "O/X";
};

const titleText = computed(() =>
  mode.value == "edit" ? "조사지 수정" : "조사지 등록",
);

onBeforeMount(() => {
  loadSurveyStructure();

  if (mode.value == "edit") {
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

const handleSave = async () => {
  const surveyInfo = {
    sver_code: form.value.sver_code || null,
    sv_name: form.value.sv_name,
    sver_ondate: form.value.sver_ondate,
    sver_enddate: form.value.sver_enddate,
  };

  const majorList = majorCategories.value.map((majorC) => ({
    id: majorC.id,
    name: majorC.name,
  }));

  const subList = subCategories.value.map((subC) => ({
    id: subC.id,
    majorId: subC.majorId,
    name: subC.name,
    note: subC.note || "",
  }));

  const mapAnswerTypeToCode = (type) => {
    if (type == "DATE") {
      return "f0_10";
    }
    if (type == "TEXT") {
      return "f0_20";
    }
    return "f0_00"; // 기본 O/X
  };

  const questionList = Object.entries(questionsBySubcategory.value).flatMap(
    ([subId, qs]) =>
      (qs || []).map((q, idx) => ({
        subId,
        order: idx + 1,
        text: q.text,
        answerType: mapAnswerTypeToCode(q.answerType),
      })),
  );

  const payload = {
    mode: mode.value, // 'create' | 'edit'
    survey: surveyInfo,
    majors: majorList,
    subs: subList,
    questions: questionList,
  };

  try {
    const isEdit = mode.value == "edit" && surveyInfo.sver_code;
    const url = isEdit
      ? `/api/survey/${encodeURIComponent(surveyInfo.sver_code)}`
      : "/api/survey";
    const method = isEdit ? "put" : "post";

    await axios[method](url, payload);
    router.push({ name: "systemSurveyList" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Survey save failed", err);
  }
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
  if (majorModalMode.value == "create") {
    const nextId =
      (majorCategories.value[majorCategories.value.length - 1]?.id || 0) + 1;
    majorCategories.value.push({
      id: nextId,
      name: majorForm.value.name.trim(),
    });
  } else if (majorModalMode.value == "edit") {
    const idx = majorCategories.value.findIndex(
      (m) => m.id == editingMajorId.value,
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
  subForm.value.note = sub.note || ""; // 비고
  showSubModal.value = true;
};

const saveSub = () => {
  if (!subForm.value.name.trim() || !selectedMajorId.value) {
    return;
  }
  if (subModalMode.value == "create") {
    const nextId =
      (subCategories.value[subCategories.value.length - 1]?.id || 0) + 1;
    subCategories.value.push({
      id: nextId,
      majorId: selectedMajorId.value,
      name: subForm.value.name.trim(),
      note: subForm.value.note.trim(),
    });
  } else if (subModalMode.value == "edit") {
    const idx = subCategories.value.findIndex(
      (s) => s.id == editingSubId.value,
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

  if (questionModalMode.value == "create") {
    questionsBySubcategory.value[key].push({
      text: questionForm.value.text.trim(),
      answerType: questionForm.value.answerType,
    });
  } else if (questionModalMode.value == "edit") {
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
      <div
        class="card-header d-flex justify-content-between align-items-start survey-header"
      >
        <div>
          <h5 class="mb-1">{{ titleText }}</h5>
          <small class="text-muted">
            조사지명과 유효기간을 입력한 후 전체저장을 눌러주세요.
          </small>
        </div>
        <div class="d-flex gap-2 align-items-end">
          <div v-if="mode == 'edit'" class="me-3">
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
              :class="{ active: major.id == selectedMajorId }"
              @click="selectedMajorId = major.id"
            >
              <span>{{ major.name }}</span>
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
                :class="{ active: sub.id == selectedSubId }"
                @click="selectedSubId = sub.id"
              >
                <div class="category-text">
                  <div class="category-name">{{ sub.name }}</div>
                  <div v-if="sub.note" class="category-note">
                    {{ sub.note }}
                  </div>
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
                  {{
                    selectedMajor ? selectedMajor.name : "대분류를 선택하세요"
                  }}
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
                  <tr v-for="(question, idx) in currentQuestions" :key="idx">
                    <td>{{ idx + 1 }}</td>
                    <td>
                      <div class="fw-semibold">{{ question.text }}</div>
                      <div class="text-muted small">
                        답변유형: {{ answerTypeLabel(question.answerType) }}
                      </div>
                    </td>
                    <td>
                      <div
                        v-if="question.answerType == 'OX'"
                        class="d-flex gap-3"
                      >
                        <label class="d-flex align-items-center gap-1 mb-0">
                          <input type="radio" disabled />
                          <span class="small">예</span>
                        </label>
                        <label class="d-flex align-items-center gap-1 mb-0">
                          <input type="radio" disabled />
                          <span class="small">아니오</span>
                        </label>
                      </div>
                      <div v-else-if="question.answerType == 'DATE'">
                        <input
                          type="date"
                          class="form-control form-control-sm"
                          disabled
                        />
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
                        @click="openQuestionEdit(idx, question)"
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-muted small">
              아직 등록된 질문이 없습니다. 질문 추가 버튼을 눌러 질문을
              추가하세요.
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
        <button
          class="btn btn-outline-secondary"
          type="button"
          @click="handleCancel"
        >
          취소
        </button>
      </div>

      <!-- 대분류 모달 -->
      <div v-if="showMajorModal" class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h6 class="mb-0">
              {{
                majorModalMode == "create"
                  ? "지원서 항목 등록"
                  : "지원서 항목 수정"
              }}
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
              {{ majorModalMode == "create" ? "등록" : "수정" }}
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
              {{
                subModalMode == "create" ? "세부 항목 등록" : "세부 항목 수정"
              }}
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
              {{ subModalMode == "create" ? "등록" : "수정" }}
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
              {{
                questionModalMode == "create"
                  ? "조사지 질문 등록"
                  : "조사지 질문 수정"
              }}
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
              {{ questionModalMode == "create" ? "저장" : "수정" }}
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

<!-- 스타일은 다시 확인해봐야할 것, 스크롤 기능이 CSS로 생김 -->
<style scoped>
.survey-form-layout {
  display: flex;
  gap: 16px;
  min-height: 500px;
  min-width: 900px;
}

.survey-header {
  align-items: flex-start !important;
  min-height: 110px;
}

.survey-header > div:first-child {
  flex: 0 0 260px;
}

.survey-header small {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.survey-header .d-flex.gap-2 {
  flex-wrap: nowrap;
  overflow-x: auto;
}

.category-panel {
  flex: 0 0 420px;
  max-width: 420px;
  display: flex;
  gap: 12px;
}

.major-list,
.sub-list {
  flex: 1;
  height: 420px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px;
  background-color: #f8f9fa;
}

/* 항목 */
.category-item {
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  padding: 8px 10px;
  margin-bottom: 8px;
  background-color: #ffffff;
  cursor: pointer;
  font-size: 0.875rem;
  min-height: 56px;
  transition: background-color 0.2s ease;
}

.category-item:hover {
  background-color: #f1f3f5;
}

.category-item.active {
  border-color: #2dce89; /* 기존 포인트 컬러 유지 */
  background-color: #e6f8f0;
  font-weight: 600;
}

.panel-header span {
  font-weight: 600;
}

.category-item {
  min-height: 56px;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-note {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 2px;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

.right-section {
  display: flex;
  flex-direction: column;
  height: 500px;
  padding: 16px 20px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.content-area {
  flex: 1;
  overflow-y: auto;
}

.action-bar {
  flex: 0 0 60px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  border-top: 1px solid #e0e0e0;
  padding-top: 10px;
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
