<!-- 상담내역: /review/:sup_code, 좌측 지원대상자(dsbl_prs) + 조사지 결과, 우측 상담등록·목록 -->
<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useTempStorage } from "@/composables/useTempStorage";
import TempStorageModal from "@/components/TempStorageModal.vue";

const route = useRoute();
const supCode = computed(() => route.params.sup_code || "");

// ─── 좌측: 지원 정보 (support + dsbl_prs, sup_code 기준) ───
const support = ref(null);
const dsblPrs = ref(null);
const dsblLoading = ref(false);
const dsblError = ref(null);

function formatDate(val) {
  if (!val) return "";
  const d = new Date(val);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function genderLabel(code) {
  const m = { b0_00: "남자", b0_10: "여자" };
  return m[code] ?? code ?? "";
}

async function loadSupport() {
  const code = supCode.value;
  if (!code) {
    dsblError.value = "지원번호(sup_code)가 없습니다.";
    return;
  }
  dsblLoading.value = true;
  dsblError.value = null;
  try {
    const res = await fetch(`/api/apply/support/${encodeURIComponent(code)}`);
    if (!res.ok) throw new Error("지원 정보 조회 실패");
    const data = await res.json();
    support.value = data.support || null;
    dsblPrs.value = data.dsbl_prs || null;
  } catch (e) {
    dsblError.value = e.message;
    support.value = null;
    dsblPrs.value = null;
  } finally {
    dsblLoading.value = false;
  }
}

onMounted(() => {
  loadSupport();
  loadSurveyAnswers();
});

// 우측 상담내역 패널 표시 여부 — URL 진입 시 숨김, '상담내역 보기' 클릭 시 표시
const showRightPanel = ref(false);

// 좌측 탭: application(지원신청서) | plan(지원계획) | result(지원결과) — 기본 지원신청서
const leftTab = ref("application");

// 지원신청서: survey_a 조사지 질문+답 (sup_code로 API 조회)
const surveyAnswers = ref([]);
const surveyAnswersLoading = ref(false);
const surveyAnswersError = ref(null);

async function loadSurveyAnswers() {
  const code = supCode.value;
  if (!code) return;
  surveyAnswersLoading.value = true;
  surveyAnswersError.value = null;
  try {
    const res = await fetch(
      `/api/apply/support/${encodeURIComponent(code)}/survey-answers`,
    );
    if (!res.ok) throw new Error("조사지 답변 조회 실패");
    const data = await res.json();
    surveyAnswers.value = (Array.isArray(data) ? data : []).map((r) => ({
      a_code: r.a_code ?? "",
      major_name: r.major_name ?? "",
      sub_name: r.sub_name ?? "",
      q_no: r.q_no,
      q_type: r.q_type ?? "f0_00",
      q_content: r.q_content ?? "",
      a_content: r.a_content ?? "",
    }));
  } catch (e) {
    surveyAnswersError.value = e.message;
    surveyAnswers.value = [];
  } finally {
    surveyAnswersLoading.value = false;
  }
}

// major_name > sub_name 기준으로 그룹화 (표시용)
function groupSurveyAnswers(items) {
  const groups = [];
  let curMajor = null;
  let curSub = null;
  let subGroup = null;
  for (const r of items) {
    if (r.major_name !== curMajor) {
      curMajor = r.major_name;
      curSub = null;
      groups.push({ type: "major", major_name: curMajor, subs: [] });
    }
    const majorObj = groups[groups.length - 1];
    if (r.sub_name !== curSub) {
      curSub = r.sub_name;
      subGroup = { sub_name: curSub, items: [] };
      majorObj.subs.push(subGroup);
    }
    subGroup.items.push(r);
  }
  return groups;
}

const surveyAnswersGrouped = computed(() =>
  groupSurveyAnswers(surveyAnswers.value),
);

// 지원신청서 수정하기 모드 (여러 컴포넌트에서 재사용 가능하도록 추후 composable 분리 가능)
const applicationEditMode = ref(false);
const applicationSaveLoading = ref(false);

function startApplicationEdit() {
  applicationEditMode.value = true;
}

async function saveApplicationEdit() {
  const code = supCode.value;
  if (!code) return;
  const answers = surveyAnswers.value
    .filter((r) => r.a_code)
    .map((r) => ({ a_code: r.a_code, a_content: r.a_content ?? "" }));
  if (answers.length === 0) {
    alert("저장할 답변이 없습니다.");
    return;
  }
  applicationSaveLoading.value = true;
  try {
    const res = await fetch(
      `/api/apply/support/${encodeURIComponent(code)}/survey-answers`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "저장 실패");
    }
    applicationEditMode.value = false;
    await loadSurveyAnswers();
  } catch (e) {
    alert(e.message || "저장에 실패했습니다.");
  } finally {
    applicationSaveLoading.value = false;
  }
}

function cancelApplicationEdit() {
  applicationEditMode.value = false;
  loadSurveyAnswers();
}

// 상담 작성자 후보 (m_auth = a0_30 회원 목록, csl_writer select용)
const writerList = ref([]);
const writerListLoading = ref(false);

async function loadWriterList() {
  writerListLoading.value = true;
  try {
    const res = await fetch("/api/apply/members?m_auth=a0_30");
    if (!res.ok) throw new Error("작성자 목록 조회 실패");
    const data = await res.json();
    writerList.value = Array.isArray(data) ? data : [];
  } catch (e) {
    writerList.value = [];
  } finally {
    writerListLoading.value = false;
  }
}

// 상담내역 목록 (sup_code 기준 API 조회)
const counselList = ref([]);
const counselListLoading = ref(false);
const counselListError = ref(null);

async function loadCounsels() {
  const code = supCode.value;
  if (!code) return;
  counselListLoading.value = true;
  counselListError.value = null;
  try {
    const res = await fetch(
      `/api/apply/support/${encodeURIComponent(code)}/counsels`,
    );
    if (!res.ok) throw new Error("상담내역 조회 실패");
    const data = await res.json();
    counselList.value = Array.isArray(data) ? data : [];
  } catch (e) {
    counselListError.value = e.message;
    counselList.value = [];
  } finally {
    counselListLoading.value = false;
  }
}

// 상담내역 보기 패널을 열 때 목록 + 작성자 목록 로드
watch(showRightPanel, (visible) => {
  if (visible && supCode.value) {
    loadCounsels();
    loadWriterList();
  }
});

// 상세보기: 선택한 상담 건을 readonly로 표시
const selectedCounselDetail = ref(null);

function openDetail(item) {
  selectedCounselDetail.value = item;
}

function closeDetail() {
  selectedCounselDetail.value = null;
}

function toggleRightPanel() {
  showRightPanel.value = !showRightPanel.value;
  if (!showRightPanel.value) showForm.value = false;
}

// 상담등록 폼: 제목, 상담일, 내용, 첨부파일
const showForm = ref(false);
const counselForm = ref({
  csl_title: "",
  counselDate: "",
  csl_content: "",
  csl_writer: "",
});
const counselFormSaving = ref(false);
const counselFormFiles = ref(null); // 첨부파일 (UI만, DB 저장은 추후)
function setCounselFiles(files) {
  counselFormFiles.value = files;
}

const openAddForm = () => {
  showForm.value = true;
  closeDetail();
  counselForm.value = {
    csl_title: "",
    counselDate: new Date().toISOString().slice(0, 10),
    csl_content: "",
    csl_writer: writerList.value.length ? writerList.value[0].m_no : "",
  };
  counselFormFiles.value = null;
};

const cancelForm = () => {
  showForm.value = false;
};

// 임시저장 (상담등록 폼, j0_10 = 상담내역) — 재사용: 지원계획 j0_20, 지원결과 j0_30
const {
  showModal: tempStorageModalVisible,
  tempList: tempStorageList,
  tempListLoading: tempStorageListLoading,
  tempSaveLoading: tempSaveLoading,
  saveTemp: doTempSave,
  openLoadModal: openTempStorageModal,
  applyItem: applyTempStorageItem,
} = useTempStorage(
  () => supCode.value,
  "j0_10",
  {
    getPayload: () => ({
      save_title: (counselForm.value?.csl_title ?? "").trim(),
      save_content: JSON.stringify({
        counselDate: counselForm.value?.counselDate ?? "",
        csl_content: counselForm.value?.csl_content ?? "",
        csl_writer: counselForm.value?.csl_writer ?? "",
      }),
    }),
    setPayload: (item) => {
      if (!item) return;
      counselForm.value.csl_title = item.save_title ?? "";
      try {
        const o = JSON.parse(item.save_content || "{}");
        counselForm.value.counselDate = o.counselDate ?? "";
        counselForm.value.csl_content = o.csl_content ?? "";
        counselForm.value.csl_writer = o.csl_writer ?? "";
      } catch {
        // save_content가 JSON이 아닐 수 있음
      }
    },
    validate: (payload) => {
      if (!(payload.save_title && payload.save_title.trim())) {
        return { valid: false, message: "제목을 입력해주세요." };
      }
      return { valid: true };
    },
  },
);

async function saveCounsel() {
  if (!counselForm.value.csl_title?.trim()) {
    alert("제목을 입력해주세요.");
    return;
  }
  if (!counselForm.value.counselDate) {
    alert("상담일을 선택해주세요.");
    return;
  }
  if (!counselForm.value.csl_writer?.trim()) {
    alert("작성자를 선택해주세요.");
    return;
  }
  const code = supCode.value;
  if (!code) {
    alert("지원번호가 없습니다.");
    return;
  }
  counselFormSaving.value = true;
  try {
    const res = await fetch(
      `/api/apply/support/${encodeURIComponent(code)}/counsels`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csl_title: counselForm.value.csl_title.trim(),
          csl_date: counselForm.value.counselDate,
          csl_content: counselForm.value.csl_content || "",
          csl_writer: counselForm.value.csl_writer || undefined,
          csl_name: counselForm.value.csl_writer || undefined,
        }),
      },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "저장 실패");
    }
    showForm.value = false;
    await loadCounsels();
  } catch (e) {
    alert(e.message || "저장에 실패했습니다.");
  } finally {
    counselFormSaving.value = false;
  }
}

const contentPreview = (text, max = 30) => {
  if (!text) return "";
  return text.length <= max ? text : text.slice(0, max) + "...";
};

function formatCounselDate(val) {
  if (!val) return "";
  const d = new Date(val);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
</script>

<template>
  <div>
    <div class="container-fluid py-4">
      <div class="row g-4">
        <!-- ─── 좌측: 지원자 정보 + 지원신청서/지원계획/지원결과 (우측 표시 시 col-lg-5) ─── -->
        <div :class="showRightPanel ? 'col-lg-5' : 'col-12'">
          <!-- 상단: 지원자 정보 -->
          <div class="card shadow-sm mb-3">
            <div
              class="card-header py-2 d-flex align-items-center justify-content-between"
            >
              <h6 class="mb-0">지원대상자 정보</h6>
              <button
                type="button"
                class="btn btn-sm"
                :class="
                  showRightPanel ? 'btn-outline-secondary' : 'btn-success'
                "
                @click="toggleRightPanel"
              >
                {{ showRightPanel ? "상담내역 닫기" : "상담내역 보기" }}
              </button>
            </div>
            <div class="card-body pt-2">
              <p v-if="dsblLoading" class="text-muted text-sm mb-0">
                로딩 중...
              </p>
              <p v-else-if="dsblError" class="text-danger text-sm mb-0">
                {{ dsblError }}
              </p>
              <template v-else>
                <div class="mb-3">
                  <label class="form-label text-sm mb-1">성명</label>
                  <input
                    :value="dsblPrs?.mc_nm ?? ''"
                    type="text"
                    class="form-control form-control-sm bg-light"
                    readonly
                  />
                </div>
                <template v-if="dsblPrs">
                  <ul class="list-unstyled text-sm mb-0">
                    <li class="d-flex mb-1">
                      <span class="text-muted me-2" style="min-width: 100px"
                        >생년월일</span
                      >
                      <span>{{ formatDate(dsblPrs.mc_bd) }}</span>
                    </li>
                    <li class="d-flex mb-1">
                      <span class="text-muted me-2" style="min-width: 100px"
                        >성별</span
                      >
                      <span>{{ genderLabel(dsblPrs.mc_gender) }}</span>
                    </li>
                    <li class="d-flex mb-1">
                      <span class="text-muted me-2" style="min-width: 100px"
                        >주소</span
                      >
                      <span>{{ dsblPrs.mc_address }}</span>
                    </li>
                    <li class="d-flex mb-1">
                      <span class="text-muted me-2" style="min-width: 100px"
                        >유형</span
                      >
                      <span>{{ dsblPrs.mc_type }}</span>
                    </li>
                    <li class="d-flex mb-1">
                      <span class="text-muted me-2" style="min-width: 100px"
                        >등록일</span
                      >
                      <span>{{ formatDate(dsblPrs.mc_submitdate) }}</span>
                    </li>
                  </ul>
                </template>
                <p v-else class="text-muted text-sm mb-0">
                  지원 정보가 없습니다.
                </p>
              </template>
            </div>
          </div>

          <!-- 이동 링크: 지원신청서 | 지원계획 | 지원결과 -->
          <div class="mb-2">
            <button
              type="button"
              class="btn btn-link btn-sm p-0 me-3 text-decoration-none"
              :class="
                leftTab === 'application' ? 'fw-bold text-dark' : 'text-muted'
              "
              @click="leftTab = 'application'"
            >
              지원신청서
            </button>
            <button
              type="button"
              class="btn btn-link btn-sm p-0 me-3 text-decoration-none"
              :class="leftTab === 'plan' ? 'fw-bold text-dark' : 'text-muted'"
              @click="leftTab = 'plan'"
            >
              지원계획
            </button>
            <button
              type="button"
              class="btn btn-link btn-sm p-0 text-decoration-none"
              :class="leftTab === 'result' ? 'fw-bold text-dark' : 'text-muted'"
              @click="leftTab = 'result'"
            >
              지원결과
            </button>
          </div>

          <!-- 탭별 컨텐츠 -->
          <div class="card shadow-sm">
            <div class="card-body">
              <!-- 지원신청서: survey_a 질문+답 더미 -->
              <template v-if="leftTab === 'application'">
                <div
                  class="d-flex align-items-center justify-content-between mb-3"
                >
                  <h6 class="text-sm text-uppercase text-muted mb-0">
                    지원신청서 (조사지 응답)
                  </h6>
                  <span v-if="support?.sup_day" class="text-muted text-sm">
                    작성일 {{ formatDate(support.sup_day) }}
                  </span>
                </div>
                <p v-if="surveyAnswersLoading" class="text-muted text-sm mb-0">
                  로딩 중...
                </p>
                <p
                  v-else-if="surveyAnswersError"
                  class="text-danger text-sm mb-0"
                >
                  {{ surveyAnswersError }}
                </p>
                <div
                  v-else-if="surveyAnswers.length === 0"
                  class="text-muted text-sm mb-0"
                >
                  등록된 조사지 답변이 없습니다.
                </div>
                <div v-else class="counsel-survey-list">
                  <template
                    v-for="(majorGrp, mIdx) in surveyAnswersGrouped"
                    :key="mIdx"
                  >
                    <div class="mb-3">
                      <div class="text-dark fw-semibold text-sm mb-2">
                        {{ majorGrp.major_name }}
                      </div>
                      <template
                        v-for="(subGrp, sIdx) in majorGrp.subs"
                        :key="sIdx"
                      >
                        <div class="ms-2 mb-2">
                          <div class="text-muted text-xs fw-medium mb-1">
                            {{ subGrp.sub_name }}
                          </div>
                          <div
                            v-for="(row, rIdx) in subGrp.items"
                            :key="row.a_code || rIdx"
                            class="border-bottom border-light pb-2 mb-2 counsel-survey-item ms-2"
                          >
                            <div class="text-muted text-xs mb-1">
                              {{ row.q_no }}.
                            </div>
                            <div class="fw-semibold text-sm mb-1">
                              {{ row.q_content }}
                            </div>
                            <div v-if="!applicationEditMode" class="text-sm">
                              {{ row.a_content }}
                            </div>
                            <!-- q_type별 수정 입력: f0_00 텍스트(textarea), f0_10 체크박스, f0_20 라디오 -->
                            <template v-else>
                              <textarea
                                v-if="row.q_type === 'f0_00'"
                                v-model="row.a_content"
                                class="form-control form-control-sm mt-1"
                                rows="3"
                                placeholder="답변 입력"
                              />
                              <div v-else-if="row.q_type === 'f0_10'" class="mt-1 d-flex align-items-center gap-3">
                                <label class="mb-0 d-flex align-items-center gap-1 text-sm">
                                  <input
                                    type="checkbox"
                                    :checked="row.a_content === 'Y'"
                                    @change="row.a_content = $event.target.checked ? 'Y' : 'N'"
                                  />
                                  예
                                </label>
                                <span class="text-muted text-sm">(미체크 시 아니오)</span>
                              </div>
                              <div v-else-if="row.q_type === 'f0_20'" class="mt-1 d-flex align-items-center gap-3">
                                <label class="mb-0 d-flex align-items-center gap-1 text-sm">
                                  <input
                                    type="radio"
                                    :name="row.a_code"
                                    value="Y"
                                    v-model="row.a_content"
                                  />
                                  예
                                </label>
                                <label class="mb-0 d-flex align-items-center gap-1 text-sm">
                                  <input
                                    type="radio"
                                    :name="row.a_code"
                                    value="N"
                                    v-model="row.a_content"
                                  />
                                  아니오
                                </label>
                              </div>
                              <input
                                v-else
                                v-model="row.a_content"
                                type="text"
                                class="form-control form-control-sm mt-1"
                                placeholder="답변 입력"
                              />
                            </template>
                          </div>
                        </div>
                      </template>
                    </div>
                  </template>
                </div>
                <div class="mt-3 pt-2 border-top d-flex align-items-center justify-content-end flex-wrap gap-2">
                  <div v-if="!applicationEditMode" class="d-flex gap-2">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary"
                      @click="startApplicationEdit"
                    >
                      수정하기
                    </button>
                  </div>
                  <div v-else class="d-flex gap-2">
                    <button
                      type="button"
                      class="btn btn-sm btn-primary"
                      :disabled="applicationSaveLoading"
                      @click="saveApplicationEdit"
                    >
                      {{ applicationSaveLoading ? "저장 중..." : "저장" }}
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary"
                      :disabled="applicationSaveLoading"
                      @click="cancelApplicationEdit"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </template>
              <!-- 지원계획: placeholder -->
              <template v-else-if="leftTab === 'plan'">
                <h6 class="text-sm text-uppercase text-muted mb-3">지원계획</h6>
                <p class="text-muted text-sm mb-0">
                  지원계획 내용이 여기에 표시됩니다. (추후 연동)
                </p>
              </template>
              <!-- 지원결과: placeholder -->
              <template v-else>
                <h6 class="text-sm text-uppercase text-muted mb-3">지원결과</h6>
                <p class="text-muted text-sm mb-0">
                  지원결과 내용이 여기에 표시됩니다. (추후 연동)
                </p>
              </template>
            </div>
          </div>
        </div>

        <!-- ─── 우측: 상담내역 (상담내역 보기 클릭 시에만 표시) ─── -->
        <div v-if="showRightPanel" class="col-lg-7">
          <div class="card shadow-sm">
            <div
              class="card-header py-2 d-flex align-items-center justify-content-between"
            >
              <div class="d-flex align-items-center gap-2">
                <h6 class="mb-0 fw-bold">상담내역</h6>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                  @click="openAddForm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>상담추가</span>
                </button>
              </div>
            </div>
            <div class="card-body">
              <!-- 상담등록 폼 (상담추가 클릭 시, 항상 제일 위) -->
              <!-- 상담 상세보기 (readonly) -->
              <div
                v-if="selectedCounselDetail"
                class="border rounded p-3 mb-4 bg-light"
              >
                <div
                  class="d-flex align-items-center justify-content-between mb-3"
                >
                  <h6 class="text-sm text-uppercase text-muted mb-0">
                    상담 상세
                  </h6>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary"
                    @click="closeDetail"
                  >
                    닫기
                  </button>
                </div>
                <div class="mb-2">
                  <label class="form-label text-xs mb-0">제목</label>
                  <input
                    type="text"
                    class="form-control form-control-sm bg-white"
                    :value="selectedCounselDetail.csl_title"
                    readonly
                  />
                </div>
                <div class="mb-2">
                  <label class="form-label text-xs mb-0">상담일</label>
                  <input
                    type="text"
                    class="form-control form-control-sm bg-white"
                    :value="formatCounselDate(selectedCounselDetail.csl_date)"
                    readonly
                  />
                </div>
                <div class="mb-2">
                  <label class="form-label text-xs mb-0">상담진행자</label>
                  <input
                    type="text"
                    class="form-control form-control-sm bg-white"
                    :value="selectedCounselDetail.csl_writer_nm || selectedCounselDetail.csl_name || selectedCounselDetail.csl_writer"
                    readonly
                  />
                </div>
                <div class="mb-2">
                  <label class="form-label text-xs mb-0">내용</label>
                  <textarea
                    class="form-control form-control-sm bg-white"
                    rows="4"
                    readonly
                    :value="selectedCounselDetail.csl_content"
                  />
                </div>
              </div>

              <!-- 상담등록 폼 (상담추가 클릭 시) -->
              <div v-if="showForm" class="border rounded p-3 mb-4 bg-light">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <h6 class="text-sm text-uppercase text-muted mb-0">상담등록</h6>
                  <div class="d-flex gap-2">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary"
                      :disabled="tempSaveLoading"
                      @click="doTempSave"
                    >
                      {{ tempSaveLoading ? "저장 중..." : "임시저장" }}
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary"
                      :disabled="tempStorageListLoading"
                      @click="openTempStorageModal"
                    >
                      {{ tempStorageListLoading ? "로딩..." : "임시저장 불러오기" }}
                    </button>
                  </div>
                </div>
                <div class="mb-2">
                  <label class="form-label text-xs mb-0">제목</label>
                  <input
                    v-model="counselForm.csl_title"
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="제목을 입력해주세요"
                  />
                </div>
                <div class="mb-2">
                  <label class="form-label text-xs mb-0">상담일</label>
                  <input
                    v-model="counselForm.counselDate"
                    type="date"
                    class="form-control form-control-sm"
                  />
                </div>
                <div class="mb-2">
                  <label class="form-label text-xs mb-0">상담진행자</label>
                  <select
                    v-model="counselForm.csl_writer"
                    class="form-select form-select-sm"
                    :disabled="writerListLoading"
                  >
                    <option value="">선택하세요</option>
                    <option
                      v-for="w in writerList"
                      :key="w.m_no"
                      :value="w.m_no"
                    >
                      {{ w.m_nm }}
                    </option>
                  </select>
                </div>
                <div class="mb-2">
                  <label class="form-label text-xs mb-0">내용</label>
                  <textarea
                    v-model="counselForm.csl_content"
                    class="form-control form-control-sm"
                    rows="3"
                    placeholder="내용을 입력해주세요"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label text-xs mb-0">첨부파일</label>
                  <input
                    type="file"
                    class="form-control form-control-sm"
                    multiple
                    @change="setCounselFiles($event.target.files)"
                  />
                  <small class="text-muted"
                    >첨부파일 저장은 추후 연동 예정입니다.</small
                  >
                </div>
                <div class="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    class="btn btn-sm btn-warning"
                    :disabled="counselFormSaving"
                    @click="saveCounsel"
                  >
                    {{ counselFormSaving ? "저장 중..." : "저장" }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary"
                    :disabled="counselFormSaving"
                    @click="cancelForm"
                  >
                    취소
                  </button>
                </div>
              </div>

              <!-- 상담내역 목록 (sup_code 기준 조회) -->
              <h6 class="text-sm text-uppercase text-muted mb-2">
                상담내역 목록
              </h6>
              <p v-if="counselListLoading" class="text-muted text-sm mb-0">
                로딩 중...
              </p>
              <p v-else-if="counselListError" class="text-danger text-sm mb-0">
                {{ counselListError }}
              </p>
              <div v-else class="list-group list-group-flush">
                <div
                  v-for="item in counselList"
                  :key="item.csl_code"
                  class="list-group-item px-0 border-bottom d-flex align-items-center justify-content-between"
                >
                  <div class="flex-grow-1 text-sm">
                    <div class="d-flex flex-wrap gap-2 align-items-center mb-1">
                      <span class="text-muted">{{
                        formatCounselDate(item.csl_date)
                      }}</span>
                      <span v-if="item.csl_writer_nm || item.csl_name" class="text-muted">{{
                        item.csl_writer_nm || item.csl_name
                      }}</span>
                    </div>
                    <div class="fw-semibold">{{ item.csl_title }}</div>
                    <div class="text-muted small">
                      {{ contentPreview(item.csl_content) }}
                    </div>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary flex-shrink-0"
                    @click="openDetail(item)"
                  >
                    상세보기
                  </button>
                </div>
                <div
                  v-if="
                    !counselListLoading &&
                    !counselListError &&
                    counselList.length === 0
                  "
                  class="list-group-item text-center text-muted py-4"
                >
                  저장된 상담내역이 없습니다.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 임시저장 불러오기 모달 (공통 컴포넌트) -->
    <TempStorageModal
      v-model="tempStorageModalVisible"
      :list="tempStorageList"
      :loading="tempStorageListLoading"
      @select="applyTempStorageItem"
    />
  </div>
</template>

<style scoped>
.ni {
  font-size: 1rem;
}
.counsel-survey-list .counsel-survey-item:last-child {
  border-bottom: none !important;
}
</style>
