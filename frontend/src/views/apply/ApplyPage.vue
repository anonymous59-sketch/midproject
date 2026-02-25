<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

// ✅ 프론트(devServer) 프록시 기준: /api/apply/xxx → 백엔드 /apply/xxx
const API_PREFIX = "/api/apply";

// ===== 상태 =====
const loading = ref(true);

// survey list + selected
const surveyList = ref([]);
const selectedSurveyCode = ref("");
const survey = ref(null);

const activeSubCode = ref(null);
const answers = ref({});

// 작성일
const writeDate = ref("");

// ===== 좌측(지원대상자) =====
const targetLoading = ref(true);
const targets = ref([]);
const selectedMcPn = ref("");

// ===== computed =====
const activeSub = computed(() => {
  if (!survey.value || !activeSubCode.value) return null;
  for (const mj of survey.value.majors || []) {
    const found = (mj.subs || []).find(
      (s) => s.sub_code === activeSubCode.value,
    );
    if (found) return found;
  }
  return null;
});

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
    });
  }
  return root;
};

const apiGet = (path) => axios.get(`${API_PREFIX}${path}`);
const apiPost = (path, body) => axios.post(`${API_PREFIX}${path}`, body);

// ===== API =====
const loadTargets = async () => {
  targetLoading.value = true;
  try {
    const { data } = await apiGet("/targets");
    targets.value = data || [];
    selectedMcPn.value = targets.value.length ? targets.value[0].mc_pn : "";
  } catch (err) {
    console.error("[loadTargets] error:", err);
    targets.value = [];
    selectedMcPn.value = "";
  } finally {
    targetLoading.value = false;
  }
};

const loadSurveyList = async () => {
  const { data } = await apiGet("/surveys");
  surveyList.value = data || [];
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

  const firstSub = normalized?.majors?.[0]?.subs?.[0];
  activeSubCode.value = firstSub?.sub_code ?? null;
  answers.value = {};
};

// ===== 초기 로딩 =====
onMounted(async () => {
  try {
    setToday();
    await loadTargets();
    await loadSurveyList();

    if (!surveyList.value.length) {
      survey.value = null;
      return;
    }

    selectedSurveyCode.value = surveyList.value[0].sver_code;
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
      alert("지원대상자를 선택해 주세요.");
      return;
    }
    if (!selectedSurveyCode.value) {
      alert("조사지를 선택해 주세요.");
      return;
    }

    // TODO: 로그인/담당자 연동 후 실제 값으로 교체
    const memNo = "MEM202602240023"; // 지원자(신청자)
    const mgrNo = "MEM202602240021"; // 담당자
    const reqYn = "d0_00"; // 부코드(판정 상태) 기본값

    const payload = {
      mc_pn: selectedMcPn.value,
      sver_code: selectedSurveyCode.value,
      write_date: writeDate.value,
      mem_no: memNo,
      mgr_no: mgrNo,
      req_yn: reqYn,
      answers: answers.value,
    };

    await apiPost("/applications", payload);
    alert("저장되었습니다.");
  } catch (err) {
    console.error("[onSave] submit error:", err);
    alert("저장 중 오류가 발생했습니다. 콘솔을 확인해 주세요.");
  }
};

const onCancel = () => alert("취소(더미)");
</script>

<template>
  <div class="py-4 container-fluid">
    <div v-if="loading" class="text-center text-muted py-5">불러오는 중...</div>

    <div
      v-else-if="surveyList.length === 0"
      class="text-center text-muted py-5"
    >
      등록된 조사지가 없습니다. (survey 테이블 확인)
    </div>

    <div v-else-if="!survey" class="text-center text-danger py-5">
      조사지 데이터를 불러오지 못했습니다.
    </div>

    <div v-else class="row">
      <!-- 좌측 -->
      <div class="col-lg-3 mb-4">
        <div class="card">
          <div class="card-header pb-0">
            <h6 class="mb-0">지원자 선택</h6>
          </div>
          <div class="card-body">
            <div v-if="targetLoading" class="text-center text-muted py-3">
              불러오는 중...
            </div>

            <template v-else>
              <div v-if="targets.length === 0" class="text-sm text-muted">
                등록된 지원대상자가 없습니다. (dsbl_prs 확인)
              </div>

              <template v-else>
                <label class="form-label text-sm">지원자명</label>
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
                <input
                  class="form-control form-control-sm"
                  type="text"
                  :value="selectedTarget?.mc_type ?? ''"
                  readonly
                />

                <div class="row mt-3">
                  <div class="col-6">
                    <label class="form-label text-sm">성별</label>
                    <input
                      class="form-control form-control-sm"
                      type="text"
                      :value="genderLabel(selectedTarget?.mc_gender)"
                      readonly
                    />
                  </div>
                  <div class="col-6">
                    <label class="form-label text-sm">생년월일</label>
                    <input
                      class="form-control form-control-sm"
                      type="date"
                      :value="toDateInput(selectedTarget?.mc_bd)"
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
                <div class="input-group input-group-sm" style="width: 180px">
                  <span class="input-group-text"
                    ><i class="ni ni-calendar-grid-58"></i
                  ></span>
                  <input type="date" class="form-control" v-model="writeDate" />
                </div>
              </div>
            </div>
          </div>

          <div class="card-body pt-3">
            <div class="mb-3" style="max-width: 420px">
              <label class="form-label text-sm">조사지</label>
              <select
                class="form-select form-select-sm"
                v-model="selectedSurveyCode"
                @change="loadSurveyTree(selectedSurveyCode)"
              >
                <option
                  v-for="s in surveyList"
                  :key="s.sver_code"
                  :value="s.sver_code"
                >
                  {{ s.sv_name }} ({{ s.sver_code }})
                </option>
              </select>
            </div>

            <div class="mb-3 d-flex flex-wrap gap-2">
              <template v-for="mj in survey.majors" :key="mj.major_code">
                <button
                  v-for="sb in mj.subs"
                  :key="sb.sub_code"
                  class="btn btn-sm mb-0"
                  :class="
                    activeSubCode === sb.sub_code
                      ? 'btn-warning'
                      : 'btn-outline-secondary'
                  "
                  @click="activeSubCode = sb.sub_code"
                >
                  {{ sb.sub_name }}
                </button>
              </template>
            </div>

            <hr class="horizontal dark my-3" />

            <div v-if="!activeSub" class="text-muted text-sm">
              항목을 선택하세요.
            </div>

            <div v-else>
              <h6 class="mb-3">{{ activeSub.sub_name }}</h6>
              <div
                v-for="q in activeSub.questions"
                :key="q.q_code"
                class="d-flex align-items-center justify-content-between py-2 border-bottom"
              >
                <div class="d-flex align-items-start gap-2">
                  <div class="text-sm text-muted" style="width: 20px">
                    {{ q.q_no }}
                  </div>
                  <div class="text-sm">{{ q.q_content }}</div>
                </div>

                <div class="d-flex align-items-center gap-3">
                  <label class="mb-0 d-flex align-items-center gap-1 text-sm">
                    <input
                      type="radio"
                      :name="q.q_code"
                      value="Y"
                      v-model="answers[q.q_code]"
                    />
                    예
                  </label>
                  <label class="mb-0 d-flex align-items-center gap-1 text-sm">
                    <input
                      type="radio"
                      :name="q.q_code"
                      value="N"
                      v-model="answers[q.q_code]"
                    />
                    아니오
                  </label>
                </div>
              </div>
            </div>

            <div class="d-flex justify-content-end gap-2 mt-4">
              <button class="btn btn-warning mb-0" @click="onSave">저장</button>
              <button class="btn btn-outline-secondary mb-0" @click="onCancel">
                취소
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- /우측 -->
    </div>
  </div>
</template>
