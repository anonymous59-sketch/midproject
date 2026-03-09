<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAuthStore } from "@/store/auth";
import ArgonButton from "@/components/ArgonButton.vue";
import ArgonInput from "@/components/ArgonInput.vue";
import AlertModal from "@/views/modal/AlertModal.vue";
import ConfirmModal from "@/views/modal/ConfirmModal.vue";

const router = useRouter();
const authStore = useAuthStore();

// ✅ 프론트(devServer) 프록시 기준: /api/apply/xxx → 백엔드 /apply/xxx
const API_PREFIX = "/api/apply";

/** 로그인한 회원 m_no = dsbl_prs.gdn_no(보호자) → 본인이 담당하는 장애인만 선택 가능 */
const loginMNo = computed(() => authStore.user?.m_no ?? "");

// ===== 상태 =====
const loading = ref(true);

// 오늘 기준 유효 조사지 1건 (sver_ondate ~ sver_enddate, enddate null이면 2099-12-31)
const currentSurvey = ref(null);
const selectedSurveyCode = ref("");
const survey = ref(null);

const answers = ref({});

// 작성일
const writeDate = ref("");

// ===== AlertModal / ConfirmModal =====
const alertModal = ref({ show: false, type: "success", title: "알림", message: "" });
/** AlertModal 닫을 때 실행할 콜백 (저장 성공 시 메인 이동 등) */
let onAlertCloseCallback = null;

function showAlert(type, title, message) {
  alertModal.value = { show: true, type, title, message: message ?? "" };
}

function closeAlertModal() {
  alertModal.value.show = false;
  if (typeof onAlertCloseCallback === "function") {
    onAlertCloseCallback();
    onAlertCloseCallback = null;
  }
}

const confirmCancelModal = ref({ show: false, title: "취소 확인", message: "" });

function openConfirmCancel() {
  confirmCancelModal.value = {
    show: true,
    title: "취소 확인",
    message: "지금까지 작성한 내용이 모두 취소됩니다. 정말 취소하시겠습니까?",
  };
}

function onConfirmCancel() {
  confirmCancelModal.value.show = false;
  router.push("/applicant");
}

function closeConfirmCancel() {
  confirmCancelModal.value.show = false;
}

// ===== 좌측(지원대상자) =====
const targetLoading = ref(true);
const targets = ref([]);
const selectedMcPn = ref("");

// ===== computed =====
/** 질문 타입 상수 (survey_q.q_type = sub_code.s_code) */
const Q_TYPE = { TEXT: "f0_00", CHECKBOX: "f0_10", RADIO: "f0_20" };

/** 모든 질문 플랫 목록 (검증용) */
const allQuestions = computed(() => {
  if (!survey.value?.majors) return [];
  const list = [];
  for (const mj of survey.value.majors) {
    for (const sb of mj.subs || []) {
      for (const q of sb.questions || []) {
        if (q.q_code) list.push(q);
      }
    }
  }
  return list;
});

/** 질문별 답변 유효 여부 */
const isQuestionAnswered = (q) => {
  const v = answers.value[q.q_code];
  if (q.q_type === Q_TYPE.TEXT) return typeof v === "string" && v.trim() !== "";
  if (q.q_type === Q_TYPE.CHECKBOX) return Array.isArray(v) && v.length > 0;
  if (q.q_type === Q_TYPE.RADIO) return typeof v === "string" && v !== "";
  return false;
};

const selectedTarget = computed(() => {
  if (!selectedMcPn.value) return null;
  return (
    targets.value.find((t) => String(t.mc_pn) === String(selectedMcPn.value)) ??
    null
  );
});

// ===== helpers =====
const setToday = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  writeDate.value = `${yyyy}-${mm}-${dd}`;
};

const genderLabel = (code) => {
  const map = { b0_00: "남", b0_10: "여" };
  return map[code] ?? code ?? "";
};

const toDateInput = (v) => {
  if (!v) return "";
  const s = String(v);
  return s.length >= 10 ? s.substring(0, 10) : s;
};

/** 라디오 질문의 보기 목록 — DB 보기 없으면 기본 '예'/'아니오' */
const DEFAULT_RADIO_OPTIONS = [
  { q_view_code: "Y", q_view_content: "예" },
  { q_view_code: "N", q_view_content: "아니오" },
];
const getRadioOptions = (q) => {
  if (q.views && q.views.length > 0) return q.views;
  return DEFAULT_RADIO_OPTIONS;
};

// ✅ rows -> tree
const buildSurveyTree = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const root = {
    sver_code: rows[0].sver_code,
    sv_name: rows[0].sv_name,
    majors: [],
  };
  const majorMap = new Map();
  const subMap = new Map();

  for (const r of rows) {
    let mj = majorMap.get(r.major_code);
    if (!mj) {
      mj = { major_code: r.major_code, major_name: r.major_name, subs: [] };
      majorMap.set(r.major_code, mj);
      root.majors.push(mj);
    }

    let sb = subMap.get(r.sub_code);
    if (!sb) {
      sb = { sub_code: r.sub_code, sub_name: r.sub_name, questions: [] };
      subMap.set(r.sub_code, sb);
      mj.subs.push(sb);
    }

    sb.questions.push({
      q_code: r.q_code,
      q_no: r.q_no,
      q_type: r.q_type,
      q_content: r.q_content,
      views: [],
    });
  }
  return root;
};

const apiGet = (path) => axios.get(`${API_PREFIX}${path}`);
const apiPost = (path, body) => axios.post(`${API_PREFIX}${path}`, body);

// ===== API =====
/** 로그인 사용자(gdn_no)의 지원대상자만 조회 */
const loadTargets = async () => {
  const gdnNo = loginMNo.value;
  if (!gdnNo) {
    targets.value = [];
    selectedMcPn.value = "";
    targetLoading.value = false;
    return;
  }
  targetLoading.value = true;
  try {
    const { data } = await apiGet(
      `/dsbl-prs?gdn_no=${encodeURIComponent(gdnNo)}`,
    );
    targets.value = Array.isArray(data) ? data : [];
    selectedMcPn.value = targets.value.length ? targets.value[0].mc_pn : "";
  } catch (err) {
    console.error("[loadTargets] error:", err);
    targets.value = [];
    selectedMcPn.value = "";
    const msg = err.response?.data?.error || err.message;
    if (msg) showAlert("error", "조회 실패", `지원대상자 목록 조회 실패: ${msg}`);
  } finally {
    targetLoading.value = false;
  }
};

// 오늘 기준 유효 조사지 1건 조회 (apply 페이지용)
const loadCurrentSurvey = async () => {
  try {
    const { data } = await apiGet("/surveys/current");
    currentSurvey.value = data?.sver_code ? data : null;
  } catch (err) {
    console.error("[loadCurrentSurvey] error:", err);
    currentSurvey.value = null;
    const msg = err.response?.data?.error || err.message;
    if (msg) showAlert("error", "조회 실패", `조사지 조회 실패: ${msg}`);
  }
};

const loadSurveyTree = async (code) => {
  if (!code) return;

  const { data } = await apiGet(`/surveys/${code}`);
  const normalized = Array.isArray(data)
    ? buildSurveyTree(data)
    : data?.majors
      ? data
      : null;

  survey.value = normalized;
  answers.value = {};

  // 체크박스 타입 질문은 답변을 배열로 초기화
  if (normalized?.majors) {
    for (const mj of normalized.majors) {
      for (const sb of mj.subs || []) {
        for (const q of sb.questions || []) {
          if (q.q_type === Q_TYPE.CHECKBOX) answers.value[q.q_code] = [];
        }
      }
    }
  }
};

// ===== 초기 로딩 =====
onMounted(async () => {
  try {
    setToday();
    await loadTargets();
    if (!loginMNo.value) {
      setTimeout(() => { if (loginMNo.value) loadTargets(); }, 300);
    }
    await loadCurrentSurvey();

    if (!currentSurvey.value?.sver_code) {
      survey.value = null;
      return;
    }

    selectedSurveyCode.value = currentSurvey.value.sver_code;
    await loadSurveyTree(selectedSurveyCode.value);
  } catch (err) {
    console.error("[onMounted] error:", err);
    survey.value = null;
  } finally {
    loading.value = false;
  }
});

// ===== 저장/취소 =====
const onSave = async () => {
  try {
    if (!selectedMcPn.value) {
      showAlert("error", "알림", "지원대상자를 선택해 주세요.");
      return;
    }
    if (!selectedSurveyCode.value) {
      showAlert("error", "알림", "조사지 정보가 없습니다.");
      return;
    }

    // 질문 타입별로 모든 문항에 답변이 있는지 검사
    const missing = allQuestions.value.filter((q) => !isQuestionAnswered(q));
    if (missing.length > 0) {
      showAlert("error", "알림", "모든 항목에 답변해 주세요. 답변하지 않은 문항이 있습니다.");
      return;
    }

    const memNo = authStore.user?.m_no;
    if (!memNo) {
      showAlert("error", "알림", "로그인 정보가 없습니다. 다시 로그인해 주세요.");
      return;
    }
    const reqYn = "e0_00"; // 부코드(판정 상태) 기본값

    // support INSERT: mc_pn(지원대상자 dsbl_prs.mc_pn), mem_no(로그인 회원) → PK sup_code
    // survey_a INSERT: 조사지 답변, ans_no=mem_no, sup_code(support PK) 함께 저장
    const payload = {
      mc_pn: selectedMcPn.value, // 지원대상자 선택값 → support.mc_pn
      sver_code: selectedSurveyCode.value,
      write_date: writeDate.value,
      mem_no: memNo,
      req_yn: reqYn,
      answers: answers.value,
    };

    await apiPost("/applications", payload);
    onAlertCloseCallback = () => router.push("/applicant");
    showAlert("success", "알림", "저장되었습니다.");
  } catch (err) {
    console.error("[onSave] submit error:", err);
    showAlert("error", "저장 실패", "저장 중 오류가 발생했습니다. 콘솔을 확인해 주세요.");
  }
};

const onCancel = () => {
  openConfirmCancel();
};
</script>

<template>
  <div class="py-4 container-fluid">
    <div v-if="loading" class="text-center text-muted py-5">불러오는 중...</div>

    <div
      v-else-if="!currentSurvey?.sver_code"
      class="text-center text-muted py-5"
    >
      현재 신청 가능한 조사지가 없습니다. (오늘 날짜가 조사 기간에 포함된
      조사지가 없습니다.)
    </div>

    <div v-else-if="!survey" class="text-center text-danger py-5">
      조사지 데이터를 불러오지 못했습니다.
    </div>

    <div v-else class="row">
      <!-- 좌측 -->
      <div class="col-lg-3 mb-4">
        <div class="card">
          <div class="card-header pb-0">
            <h6 class="mb-0">지원대상자 선택</h6>
            <p class="text-xs text-muted mb-0 mt-1">
              로그인한 회원이 담당하는 장애인만 표시됩니다.
            </p>
          </div>
          <div class="card-body">
            <div v-if="targetLoading" class="text-center text-muted py-3">
              불러오는 중...
            </div>

            <template v-else>
              <div v-if="!loginMNo" class="text-sm text-muted">
                로그인한 회원이 담당하는 장애인만 선택할 수 있습니다. 로그인 후 이용해 주세요.
              </div>
              <div v-else-if="targets.length === 0" class="text-sm text-muted">
                본인이 담당하는 지원대상자(장애인)가 없습니다. (마이페이지에서 등록 후 이용)
              </div>

              <template v-else>
                <label class="form-label text-sm">지원대상자(장애인)명</label>
                <select
                  class="form-select form-select-sm"
                  v-model="selectedMcPn"
                >
                  <option v-for="t in targets" :key="t.mc_pn" :value="t.mc_pn">
                    {{ t.mc_nm }} ({{ t.mc_pn }})
                  </option>
                </select>

                <hr class="horizontal dark my-3" />

                <label class="form-label text-sm">장애유형</label>
                <ArgonInput
                  type="text"
                  size="sm"
                  :model-value="selectedTarget?.mc_type ?? ''"
                  readonly
                />

                <div class="row mt-3">
                  <div class="col-6">
                    <label class="form-label text-sm">성별</label>
                    <ArgonInput
                      type="text"
                      size="sm"
                      :model-value="genderLabel(selectedTarget?.mc_gender)"
                      readonly
                    />
                  </div>
                  <div class="col-6">
                    <label class="form-label text-sm">생년월일</label>
                    <ArgonInput
                      type="date"
                      size="sm"
                      :model-value="toDateInput(selectedTarget?.mc_bd)"
                      readonly
                    />
                  </div>
                </div>
              </template>
            </template>
          </div>
        </div>
      </div>

      <!-- 우측 -->
      <div class="col-lg-9">
        <div class="card">
          <div class="card-header pb-0">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="mb-0">지원신청 하기</h6>

              <div class="d-flex align-items-center gap-2">
                <span class="text-sm">작성일</span>
                <ArgonInput
                  v-model="writeDate"
                  type="date"
                  size="sm"
                  icon="ni ni-calendar-grid-58"
                  icon-dir="left"
                  style="width: 180px"
                />
              </div>
            </div>
          </div>

          <div class="card-body pt-3">
            <div class="mb-3" style="max-width: 420px">
              <label class="form-label text-sm">조사지</label>
              <ArgonInput
                type="text"
                size="sm"
                class="bg-light"
                :model-value="currentSurvey?.sv_name ?? survey?.sv_name ?? ''"
                readonly
              />
            </div>

            <!-- 전체 질문 스크롤 영역 (대분류 > 소분류 > 질문 순) -->
            <div
              class="survey-questions-scroll border rounded p-3 bg-light"
              style="max-height: 60vh; overflow-y: auto"
            >
              <template v-for="mj in survey.majors" :key="mj.major_code">
                <div class="mb-4">
                  <div class="text-dark fw-semibold text-sm mb-2">
                    {{ mj.major_name }}
                  </div>
                  <template v-for="sb in mj.subs" :key="sb.sub_code">
                    <div class="ms-2 mb-3">
                      <div class="text-muted text-xs fw-medium mb-2">
                        {{ sb.sub_name }}
                      </div>
                      <div
                        v-for="q in sb.questions"
                        :key="q.q_code"
                        class="py-2 border-bottom border-light"
                      >
                        <div class="d-flex align-items-start gap-2 mb-2">
                          <span
                            class="text-muted text-sm"
                            style="min-width: 20px"
                          >
                            {{ q.q_no }}.
                          </span>
                          <span class="text-sm">{{ q.q_content }}</span>
                        </div>
                        <!-- 텍스트(텍스트에어리어) -->
                        <div
                          v-if="q.q_type === 'f0_00'"
                          class="ms-4 mb-0"
                        >
                          <textarea
                            class="form-control form-control-sm"
                            rows="3"
                            :placeholder="'내용을 입력하세요.'"
                            v-model="answers[q.q_code]"
                          />
                        </div>
                        <!-- 체크박스 -->
                        <div
                          v-else-if="q.q_type === 'f0_10' && (q.views && q.views.length)"
                          class="ms-4 d-flex flex-wrap gap-3"
                        >
                          <label
                            v-for="opt in q.views"
                            :key="opt.q_view_code"
                            class="mb-0 d-flex align-items-center gap-1 text-sm"
                          >
                            <input
                              type="checkbox"
                              :value="opt.q_view_code"
                              v-model="answers[q.q_code]"
                            />
                            {{ opt.q_view_content }}
                          </label>
                        </div>
                        <!-- 라디오: 보기 있으면 사용, 없으면 예/아니오 -->
                        <div
                          v-else-if="q.q_type === 'f0_20'"
                          class="ms-4 d-flex flex-wrap gap-3"
                        >
                          <label
                            v-for="opt in getRadioOptions(q)"
                            :key="opt.q_view_code"
                            class="mb-0 d-flex align-items-center gap-1 text-sm"
                          >
                            <input
                              type="radio"
                              :name="q.q_code"
                              :value="opt.q_view_code"
                              v-model="answers[q.q_code]"
                            />
                            {{ opt.q_view_content }}
                          </label>
                        </div>
                        <!-- 보기 없음(체크박스만, views 없을 때) -->
                        <div
                          v-else-if="q.q_type === 'f0_10'"
                          class="ms-4 text-muted text-sm"
                        >
                          (보기 없음)
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </template>
            </div>

            <div class="d-flex justify-content-end gap-2 mt-4">
              <ArgonButton color="warning" class="mb-0" @click="onSave">저장</ArgonButton>
              <ArgonButton variant="outline" color="secondary" class="mb-0" @click="onCancel">취소</ArgonButton>
            </div>
          </div>
        </div>
      </div>
      <!-- /우측 -->
    </div>

    <AlertModal
      :show="alertModal.show"
      :type="alertModal.type"
      :title="alertModal.title"
      :message="alertModal.message"
      @close="closeAlertModal"
    />
    <ConfirmModal
      :show="confirmCancelModal.show"
      title="취소 확인"
      :message="confirmCancelModal.message"
      @confirm="onConfirmCancel"
      @close="closeConfirmCancel"
    />
  </div>
</template>
