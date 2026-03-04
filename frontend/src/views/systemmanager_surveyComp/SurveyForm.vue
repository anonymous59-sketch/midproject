<script setup>
// **을 검색해서 작업해야할 항목 확인하기
import { ref, computed, onBeforeMount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { useAuthStore } from "@/store/auth";
// 라우터에 있는 정보를 가지고 와서 사용
const route = useRoute();
// 라우터에 정보를 입력하고 그 라우터로 이동
const router = useRouter();

const mode = computed(() => (route.query.mode == "edit" ? "edit" : "create"));

const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD 형식으로 오늘 날짜 구하기

// 로그인 사용자 정보 (Pinia 우선, 없으면 localStorage fallback)
const authStore = useAuthStore();
const currentUser = computed(() => {
  if (authStore.user) return authStore.user;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
});

// 작성자(회원번호/이름)
const writerNo = computed(() => currentUser.value?.m_no || "");
const writerName = computed(() => currentUser.value?.m_nm || "");

const form = ref({
  sver_code: "",
  sv_name: "",
  sver_ondate: today,
  sver_enddate: "2999-12-31",
});

// 모달 상태
// 값이 true로 변경되면 모달 창이 보임
const showMajorModal = ref(false); // 대분류 관련
const showSubModal = ref(false); // 소분류 관련
const showQuestionModal = ref(false); // 질문 등록 관련
const showPreviewModal = ref(false); // 조사지 전체 미리보기

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
});

const questionForm = ref({
  text: "", // 항목내용
  answerType: "OX", // 질문 유형, 기본값 OX
  views: [], // 체크박스 보기 목록
});

const isExpiredSurvey = ref(false); // 유효종료일을 확인해서 만료된 조사지인지 체크

// 유효 시작일, 종료일 비교 -> 종료일이 시작일보다 빠르면 true 반환
const isInvalidDateRange = computed(() => {
  if (!form.value.sver_ondate || !form.value.sver_enddate) {
    return false; // 날짜가 하나라도 없으면 유효성 검사 통과로 간주
  };
  return form.value.sver_ondate > form.value.sver_enddate;
});

// 대분류 / 소분류 / 질문
const majorCategories = ref([]);
const subCategories = ref([]);
const questionsBySubcategory = ref([]);

// 프론트에서만 사용하는 임시 ID 시퀀스 (DB PK 아님)
let tempMajorIdSeq = 1;
let tempSubIdSeq = 1;
let tempViewIdSeq = 1;

// DB에서 데이터를 가지고 오는 함수 (create 모드에서는 sver_code 없으면 조회 생략)
const loadSurveyStructure = async () => {
  const sverCode = route.query.sver_code;
  // create 모드에서 sver_code 없으면 빈 구조로 초기화
  if (!sverCode && mode.value == "create") {
    majorCategories.value = [];
    subCategories.value = [];
    questionsBySubcategory.value = [];
    return;
  }
  try {
    // 조사지 버전을 기준으로 각각 대분류, 소분류, 질문, 보기 조회
    const [majorRes, subRes, qRes, viewRes] = await Promise.all([
      axios.get("/api/majCate", { params: { sver_code: sverCode } }),
      axios.get("/api/subCate", { params: { sver_code: sverCode } }),
      axios.get("/api/surveyQ", { params: { sver_code: sverCode } }),
      axios.get("/api/surveyView", { params: { sver_code: sverCode } }),
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
    const viewList = Array.isArray(viewRes?.data) ? viewRes.data : [];
    questionsBySubcategory.value = qRes.data.map((q) => ({
      id: q.q_code,
      subId: q.sub_code,
      qNo: q.q_no,
      text: q.q_content,
      answerType: codeToUiType(q.q_type),
      // 보기는 질문(q_code)에 FK로 연결됨 → 해당 질문의 보기만 필터
      views: viewList
        .filter((v) => v.q_code === q.q_code)
        .map((v) => ({
          id: v.q_view_code,
          content: v.q_view_content,
        })),
    }));
  } catch (err) {
    console.error(err);
  }
};
// DB의 질문유형 부코드와 화면에서 사용하는 이름 일치를 위한 함수 **
const codeToUiType = (code) => {
  if (code == "f0_10") return "CHECK";
  if (code == "f0_00") return "TEXT";
  return "OX";
};

// 라디오(radio), 체크박스(check), 사유(text)로 수정해야됨 **
const answerTypeLabel = (type) => {
  if (type == "CHECK") return "체크박스";
  if (type == "TEXT") return "사유";
  return "O/X";
};

// 선택한 (대분류/소분류) 반응형 변수
const selectedMajorId = ref(null);
const selectedSubId = ref(null);

// 소분류 항목 중에서 대분류 항목과 같은 것만 가지고 오기
// db에서 대분류와 fk로 엮인 소분류 항목만 가져오는 것
const filteredSubCategories = computed(() =>
  subCategories.value.filter((sub) => sub.majorId == selectedMajorId.value),
);

const selectedMajor = computed(() =>
  majorCategories.value.find((majC) => majC.id == selectedMajorId.value),
);

const selectedSub = computed(() =>
  subCategories.value.find((subC) => subC.id == selectedSubId.value),
);

const currentQuestions = computed(() =>
  questionsBySubcategory.value.filter((q) => q.subId == selectedSubId.value),
);

// 화면에 나오는 타이틀
const titleText = computed(() =>
  mode.value == "edit" ? "조사지 수정" : "조사지 등록",
);

watch(selectedMajorId, () => {
  const list = filteredSubCategories.value;
  selectedSubId.value = list.length ? list[0].id : null;
});

// 질문 유형이 체크박스일 때 보기 하나 자동 추가
watch(
  () => questionForm.value.answerType,
  (newVal) => {
    if (newVal == "CHECK" && questionForm.value.views.length == 0) {
      questionForm.value.views.push({
        id: `TMP_VIEW_${tempViewIdSeq++}`,
        content: "",
      });
    }
    if (newVal != "CHECK") {
      questionForm.value.views = [];
    }
  },
);

// 질문 유형이 체크박스일 때 보기 추가/삭제 함수
const addViewOption = () => {
  questionForm.value.views.push({
    id: `TMP_VIEW_${tempViewIdSeq++}`,
    content: "",
  });
};

const removeViewOption = (index) => {
  questionForm.value.views.splice(index, 1);
};

// 미리보기 모달에서 저장 시 사용할 payload
const pendingPreviewPayload = ref(null);

// payload 생성 (handleSave와 공유)
const buildPayload = () => {
  const surveyInfo = {
    sver_code: form.value.sver_code || null,
    sv_name: form.value.sv_name,
    sver_ondate: form.value.sver_ondate,
    sver_enddate:
      form.value.sver_enddate == "2999-12-31"
        ? null
        : form.value.sver_enddate,
  };

  const majorList = majorCategories.value.map((majorC) => ({
    id: majorC.id,
    name: majorC.name,
  }));

  const subList = subCategories.value.map((subC) => ({
    id: subC.id,
    majorId: subC.majorId,
    name: subC.name,
  }));

  const mapAnswerTypeToCode = (type) => {
    if (type == "CHECK") return "f0_10";
    if (type == "TEXT") return "f0_00";
    return "f0_20";
  };

  const questionList = questionsBySubcategory.value.map((q) => ({
    id: q.id,
    subId: q.subId,
    qNo: q.qNo,
    text: q.text,
    answerType: mapAnswerTypeToCode(q.answerType),
    views: q.answerType == "CHECK" ? q.views || [] : [],
  }));

  return {
    mode: mode.value,
    survey: surveyInfo,
    majors: majorList,
    subs: subList,
    questions: questionList,
    // backend에서 writer는 member.m_no(작성자 번호)로 사용됨
    writer: writerNo.value,
    writer_name: writerName.value,
  };
};

// 미리보기용 계층 구조 (대분류 > 소분류 > 질문)
const previewStructure = computed(() => {
  const result = [];
  for (const major of majorCategories.value) {
    const subsOfMajor = subCategories.value.filter(
      (s) => s.majorId == major.id,
    );
    const subsWithQuestions = subsOfMajor.map((sub) => ({
      sub,
      questions: questionsBySubcategory.value
        .filter((q) => q.subId == sub.id)
        .sort((a, b) => (a.qNo || 0) - (b.qNo || 0)),
    }));
    result.push({
      major,
      subs: subsWithQuestions,
    });
  }
  return result;
});

// 전체저장 클릭 → 미리보기 모달 열기
const openPreviewModal = () => {
  // create 모드에서는 작성자(로그인 사용자)가 없으면 저장 막기
  if (mode.value == "create" && !writerNo.value) {
    alert("로그인 정보를 찾지 못했습니다. 다시 로그인 후 시도해주세요.");
    return;
  }
  pendingPreviewPayload.value = buildPayload();
  showPreviewModal.value = true;
};

// 미리보기 모달 닫기 (취소)
const closePreviewModal = () => {
  showPreviewModal.value = false;
  pendingPreviewPayload.value = null;
};

// 미리보기 모달의 저장 클릭 → DB 전송
const handleSave = async () => {
  const payload =
    pendingPreviewPayload.value || buildPayload();

  try {
    const surveyInfo = payload.survey;
    const isEdit = mode.value == "edit" && surveyInfo.sver_code;
    const url = isEdit
      ? `/api/survey/${encodeURIComponent(surveyInfo.sver_code)}`
      : "/api/survey";
    const method = isEdit ? "put" : "post";

    await axios[method](url, payload);
    closePreviewModal();
    router.push({ name: "admin-survey-list" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Survey save failed", err);
  }
};

const handleCancel = () => {
  router.push({ name: "admin-survey-list" });
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
    // 새 대분류는 프론트 전용 임시 ID를 사용 (예: TMP_MAJ_1)
    const newId = `TMP_MAJ_${tempMajorIdSeq++}`;
    majorCategories.value.push({
      id: newId,
      name: majorForm.value.name.trim(),
    });
    // 방금 만든 대분류를 선택 상태로 변경
    selectedMajorId.value = newId;
    selectedSubId.value = null;
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
  showSubModal.value = true;
};

const saveSub = () => {
  if (!subForm.value.name.trim() || !selectedMajorId.value) {
    return;
  }
  if (subModalMode.value == "create") {
    // 새 소분류도 프론트 전용 임시 ID 사용 (예: TMP_SUB_1)
    const newId = `TMP_SUB_${tempSubIdSeq++}`;
    subCategories.value.push({
      id: newId,
      majorId: selectedMajorId.value,
      name: subForm.value.name.trim(),
    });
    // 방금 만든 소분류 선택
    selectedSubId.value = newId;
  } else if (subModalMode.value == "edit") {
    const idx = subCategories.value.findIndex(
      (s) => s.id == editingSubId.value,
    );
    if (idx !== -1) {
      subCategories.value[idx].name = subForm.value.name.trim();
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
  questionForm.value.views = [];
  showQuestionModal.value = true;
};

const openQuestionEdit = (index, q) => {
  questionModalMode.value = "edit";
  editingQuestionIndex.value = index;
  questionForm.value.text = q?.text || "";
  questionForm.value.answerType = q?.answerType || "OX";
  questionForm.value.views = q?.views || [];
  showQuestionModal.value = true;
};

const saveQuestion = () => {
  if (!selectedSubId.value || !questionForm.value.text.trim()) {
    return;
  }

  const subId = selectedSubId.value;

  if (questionModalMode.value == "create") {
    // 현재 소분류에 속한 질문들만 필터해서, 그중 가장 큰 qNo 찾기
    const questionsInSub = questionsBySubcategory.value.filter(
      (q) => q.subId == subId,
    );
    const maxQNo = questionsInSub.length
      ? Math.max(...questionsInSub.map((q) => q.qNo))
      : 0;

    // 배열 끝에 새 질문 push (majorCategories, subCategories와 동일한 방식)
    questionsBySubcategory.value.push({
      id: null, // 새로 추가한 질문은 DB 저장 전까지 id 없음
      subId,
      qNo: maxQNo + 1,
      text: questionForm.value.text.trim(),
      answerType: questionForm.value.answerType,
      views:
        questionForm.value.answerType == "CHECK"
          ? questionForm.value.views
              .filter((v) => v.content.trim())
              .map((v) => ({
                id: v.id,
                content: v.content.trim(),
              }))
          : [],
    });
  } else if (questionModalMode.value == "edit") {
    // editingQuestionIndex는 currentQuestions(필터된 리스트) 내 인덱스
    const filteredList = currentQuestions.value;
    const targetQuestion = filteredList[editingQuestionIndex.value];

    if (targetQuestion) {
      targetQuestion.text = questionForm.value.text.trim();
      targetQuestion.answerType = questionForm.value.answerType;
      targetQuestion.views =
        questionForm.value.answerType == "CHECK"
          ? questionForm.value.views
              .filter((v) => v.content.trim())
              .map((v) => ({
                id: v.id,
                content: v.content.trim(),
              }))
          : [];
    }
  }

  showQuestionModal.value = false;
};

onBeforeMount(() => {
  // 데이터 통신해서 조사지 정보 가져오기
  loadSurveyStructure();

  // 수정 눌렀을 때 조사지 정보(조사지버전, 이름, 유효날짜 정보 가져오기)
  if (mode.value == "edit") {
    form.value.sver_code = route.query.sver_code;
    form.value.sv_name = route.query.sv_name;
    form.value.sver_ondate = route.query.sver_ondate;
    form.value.sver_enddate = route.query.sver_enddate;
  }

  // 유효종료일이 오늘보다 과거면 isExpiredSurvey를 true로 설정해서 화면에서 수정 불가 처리
  if (
      route.query.sver_enddate <= today
    ) {
      isExpiredSurvey.value = true;
    }
});
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
            <label class="form-label mb-1">작성자</label>
            <input
              :value="writerName || '(로그인 필요)'"
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
                    <td>{{ question.qNo }}</td>
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
                      <div v-else-if="question.answerType == 'CHECK'">
                        <div
                          v-if="question.views && question.views.length"
                          class="d-flex flex-wrap gap-3"
                        >
                          <label
                            v-for="(view, vIdx) in question.views"
                            :key="vIdx"
                            class="d-flex align-items-center gap-1 mb-0"
                            style="white-space: nowrap"
                          >
                            <input
                              type="checkbox"
                              class="form-check-input"
                              disabled
                            />
                            <span class="small">{{ view.content }}</span>
                          </label>
                        </div>
                        <div v-else class="text-muted small">
                          (등록된 보기가 없습니다)
                        </div>
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

      <!-- 버튼 영역 -->
      <div
        class="card-footer d-flex flex-column align-items-end bg-transparent"
      >
        <div class="d-flex gap-2">
          <button
            class="btn btn-success"
            type="button"
            @click="openPreviewModal"
            :disabled="isExpiredSurvey || isInvalidDateRange"
          >
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

        <div v-if="isExpiredSurvey" class="text-danger small mt-1 mb-0">
          유효종료일이 이미 지난 조사지입니다. 수정할 수 없습니다.
        </div>
        <div v-else-if="isInvalidDateRange">
          <div class="text-danger small mt-1 mb-0">
            유효기간이 올바르지 않습니다. 종료일은 시작일보다 빠를 수 없습니다.
          </div>
        </div>
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
                  id="type-check"
                  v-model="questionForm.answerType"
                  class="form-check-input"
                  type="radio"
                  value="CHECK"
                />
                <label class="form-check-label" for="type-check"
                  >체크박스</label
                >
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
              <div v-if="questionForm.answerType == 'CHECK'" class="mt-3">
                <label class="form-label">보기 항목</label>

                <div
                  v-for="(view, idx) in questionForm.views"
                  :key="idx"
                  class="d-flex gap-2 mb-2"
                >
                  <input
                    v-model="view.content"
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="보기 내용을 입력하세요"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-danger btn-sm"
                    @click="removeViewOption(idx)"
                    v-if="questionForm.views.length > 1"
                  >
                    -
                  </button>
                </div>

                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm"
                  @click="addViewOption"
                >
                  + 보기 추가
                </button>
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

      <!-- 조사지 전체 미리보기 모달 -->
      <div
        v-if="showPreviewModal"
        class="modal-backdrop preview-modal-backdrop"
      >
        <div class="modal-card preview-modal-card">
          <div class="modal-header">
            <h6 class="mb-0">조사지 미리보기</h6>
          </div>
          <div class="modal-body preview-modal-body">
            <div class="mb-3">
              <div class="preview-survey-info small text-muted mb-2">
                <span>{{ form.sv_name || "(조사지명)" }}</span>
                <span class="ms-2"
                  >{{ form.sver_ondate }} ~
                  {{
                    form.sver_enddate == "2999-12-31"
                      ? "무기한"
                      : form.sver_enddate
                  }}</span
                >
              </div>
            </div>

            <div v-if="previewStructure.length" class="preview-content">
              <template
                v-for="(group, majIdx) in previewStructure"
                :key="majIdx"
              >
                <div class="preview-major">{{ group.major.name }}</div>
                <template
                  v-for="({ sub, questions }, subIdx) in group.subs"
                  :key="sub.id || subIdx"
                >
                  <div class="preview-sub">{{ sub.name }}</div>
                  <div
                    v-for="(q, qIdx) in questions"
                    :key="q.id || qIdx"
                    class="preview-question-block"
                  >
                    <template v-if="q.answerType == 'OX'">
                      <div class="preview-question-row">
                        <span class="preview-q-no">{{ q.qNo }}.</span>
                        <span class="preview-q-text">{{ q.text }}</span>
                        <div class="preview-answer-ox ms-auto">
                          <label class="d-flex align-items-center gap-1 mb-0">
                            <input type="radio" disabled />
                            <span class="small">예</span>
                          </label>
                          <label class="d-flex align-items-center gap-1 mb-0">
                            <input type="radio" disabled />
                            <span class="small">아니오</span>
                          </label>
                        </div>
                      </div>
                    </template>
                    <template v-else-if="q.answerType == 'CHECK'">
                      <div class="preview-q-line">
                        <span class="preview-q-no">{{ q.qNo }}.</span>
                        <span class="preview-q-text">{{ q.text }}</span>
                      </div>
                      <div
                        v-if="q.views?.length"
                        class="preview-answer-check d-flex flex-wrap gap-3"
                      >
                        <label
                          v-for="(v, vIdx) in q.views"
                          :key="vIdx"
                          class="d-flex align-items-center gap-1 mb-0 small"
                        >
                          <input
                            type="checkbox"
                            class="form-check-input"
                            disabled
                            readonly
                          />
                          <span>{{ v.content }}</span>
                        </label>
                      </div>
                    </template>
                    <template v-else>
                      <div class="preview-q-line">
                        <span class="preview-q-no">{{ q.qNo }}.</span>
                        <span class="preview-q-text">{{ q.text }}</span>
                      </div>
                      <textarea
                        class="form-control form-control-sm mt-1"
                        rows="2"
                        disabled
                        readonly
                        placeholder="사유를 입력하세요"
                      ></textarea>
                    </template>
                  </div>
                </template>
              </template>
            </div>
            <div v-else class="text-muted small py-4 text-center">
              등록된 질문이 없습니다.
            </div>
          </div>
          <div class="modal-footer d-flex justify-content-end gap-2">
            <button class="btn btn-success" type="button" @click="handleSave">
              저장
            </button>
            <button
              class="btn btn-warning"
              type="button"
              @click="closePreviewModal"
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

/* 조사지 미리보기 모달 */
.preview-modal-backdrop {
  z-index: 1060;
}

.preview-modal-card {
  min-width: 560px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.preview-modal-body {
  overflow-y: auto;
  max-height: 60vh;
}

.preview-survey-info {
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.preview-content {
  font-size: 0.9rem;
}

.preview-major {
  font-weight: 700;
  font-size: 1rem;
  margin-top: 16px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 2px solid #dee2e6;
}

.preview-major:first-child {
  margin-top: 0;
}

.preview-sub {
  font-weight: 600;
  color: #495057;
  margin-top: 12px;
  margin-bottom: 6px;
  padding-left: 8px;
  border-left: 3px solid #adb5bd;
}

.preview-question-block {
  margin-bottom: 12px;
  padding-left: 12px;
}

.preview-question-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-q-line {
  display: flex;
  gap: 4px;
}

.preview-q-no {
  flex-shrink: 0;
  font-weight: 500;
}

.preview-q-text {
  flex: 1;
  min-width: 0;
}

.preview-answer-ox {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.preview-answer-check {
  padding-left: 1.5em;
  margin-top: 6px;
}
</style>
