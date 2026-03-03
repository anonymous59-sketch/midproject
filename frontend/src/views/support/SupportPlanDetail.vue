<script setup>
/**
 * 지원계획 한 건 상세/편집 카드 (SupportPlanDetail)
 * ----------------------------------------
 * - 역할: 한 건의 지원계획을 카드 형태로 표시하고, 조회/수정/승인·보완·반려·연장·종료 등 액션 처리
 * - plan_result(plan_tf) 코드: e0_00 검토대기, e0_10 승인, e0_80 보완요청, e0_99 반려
 * - 모드: isViewMode(조회) | isInputMode(수정 중+내용 없음→승인요청) | isEditMode(수정 중+내용 있음→수정완료)
 * - 첨부: plan_code로 /api/upload/files/:categoryPk 조회, 수정 시 삭제 표시·신규 선택 후 edit-complete 시 부모가 DELETE/업로드
 * - 연장: 승인 상태이고 종료일 기준 ±30일 이내일 때만 노출. 종료: 승인 상태이고 종료일이 지나지 않았을 때만 노출
 */
// ========== import ==========
import { ref, watch, onBeforeMount } from "vue";

// ========== props / emit ==========
const props = defineProps({
  plan_code: { type: String, default: "" },
  support_plan_title: { type: String, default: "" },
  support_plan_content: { type: String, default: "" },
  start_time: { type: String, default: "" },
  end_time: { type: String, default: "" },
  support_plan_file: { type: String, default: "" },
  file_code: { type: String, default: "" },
  support_plan_reject_comment: { type: String, default: "" },
  support_plan_comment: { type: String, default: "" },
  support_plan_updday: { type: String, default: "" },
  plan_result: { type: String, default: "" },
  plan_date: { type: String, default: "" },
  cancelRequest: { type: String, default: "" },
});
const emit = defineEmits([
  "history",
  "result",
  "edit",
  "edit-complete",
  "approve",
  "supple",
  "reject",
  "approval-request",
  "cancel",
  "request-cancel",
  "cancel-done",
  "add-plan",
  "plan-result",
  "temp-save",
  "alert",
  "extend",
  "end",
]);

/** 수정 모드 여부. true면 제목·내용·지원기간·첨부 편집 가능 */
const isEditing = ref(false);
/** 수정 중 로컬 제목·내용·시작일·종료일. 수정완료 시 부모에 전달 */
const titleLocal = ref(props.support_plan_title || "");
const contentLocal = ref(props.support_plan_content || "");
const startDateLocal = ref("");
const endDateLocal = ref("");
/** 수정 모드에서 새로 선택한 File 목록. 수정완료 시 부모가 file-content 업로드 */
const editFiles = ref([]);
const editFileInput = ref(null);
const deleteExistingFile = ref(false);
/** 서버에서 조회한 이 계획의 첨부파일 목록. GET /api/upload/files/:plan_code */
const filesForPlan = ref([]);
const fileNames = ref("");
/** 수정 중 '삭제' 표시한 file_code 배열. 수정완료 시 부모가 DELETE /api/upload/file/:fileCode 호출 */
const deletedFileCodes = ref([]);

/** 조회 모드: 수정 중이 아님. 결과조회·수정·연장·종료·승인/보완/반려 버튼 노출 기준 */
const isViewMode = () => !isEditing.value;
/** 입력 모드: 수정 중이지만 내용 비어 있음 → 승인요청·취소 버튼만 표시 */
const isInputMode = () => isEditing.value && !(contentLocal.value || "").trim();
/** 편집 모드: 수정 중이고 내용 있음 → 수정완료·임시저장·취소 버튼 표시 */
const isEditMode = () => isEditing.value && (contentLocal.value || "").trim();

// ========== 날짜·편집·완료 함수 ==========
/** API에서 오는 날짜(시간) 문자열을 input[type=date]용 YYYY-MM-DD로 자르기 */
function toDateOnly(val) {
  if (!val) return "";
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}

/** 수정 모드로 전환하고 로컬 값 초기화 후 edit 이벤트 발생 */
function startEdit() {
  isEditing.value = true;
  titleLocal.value = props.support_plan_title || "";
  contentLocal.value = props.support_plan_content || "";
  startDateLocal.value = toDateOnly(props.start_time);
  endDateLocal.value = toDateOnly(props.end_time);
  editFiles.value = [];
  deleteExistingFile.value = false;
  deletedFileCodes.value = [];
  emit("edit");
}
/** 수정 취소: 조회 모드로 복귀 후 cancel 이벤트 발생 */
function onCancel() {
  isEditing.value = false;
  titleLocal.value = props.support_plan_title || "";
  contentLocal.value = props.support_plan_content || "";
  startDateLocal.value = toDateOnly(props.start_time);
  endDateLocal.value = toDateOnly(props.end_time);
  editFiles.value = [];
  deleteExistingFile.value = false;
  deletedFileCodes.value = [];
  emit("cancel");
}
/** 수정 완료 시 부모에 planCode·제목·내용·시작일·종료일 전달 후 조회 모드로 전환 */
function onEditComplete() {
  emit("edit-complete", {
    planCode: props.plan_code,
    title: titleLocal.value?.trim() ?? "",
    content: contentLocal.value?.trim() ?? "",
    startDate: startDateLocal.value || null,
    endDate: endDateLocal.value || null,
    deleteFileCodes: deletedFileCodes.value.slice(),
    newFiles: editFiles.value,
  });
  isEditing.value = false;
  editFiles.value = [];
  deleteExistingFile.value = false;
  deletedFileCodes.value = [];
}
/** 제목 입력값을 갱신한다. */
function updateTitle(val) {
  titleLocal.value = val;
}
/** 내용 입력값을 갱신한다. */
function updateContent(val) {
  contentLocal.value = val;
}
/** 조회용: 시작일/종료일 표시 문자열 (날짜만 보이게) */
function displayStartTime() {
  return toDateOnly(props.start_time) || "—";
}
function displayEndTime() {
  return toDateOnly(props.end_time) || "—";
}

/**
 * 연장 버튼 표시 여부: 승인(e0_10) 상태이고, 오늘이 종료일 기준 전후 30일 이내일 때만 활성화.
 * (종료일 - 30일 <= 오늘 <= 종료일 + 30일)
 */
function canShowExtend() {
  if (props.plan_result !== "e0_10" || !props.end_time) return false;
  const endStr = toDateOnly(props.end_time);
  if (!endStr) return false;
  const end = new Date(endStr);
  if (Number.isNaN(end.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((today - end) / msPerDay);
  return diffDays >= -30 && diffDays <= 30;
}

/**
 * 종료 버튼 표시 여부: 승인(e0_10) 상태이고, 종료일이 아직 지나지 않은 경우(오늘 <= 종료일)에만 표시.
 */
function canShowEnd() {
  if (props.plan_result !== "e0_10") return false;
  if (!props.end_time) return true; // 종료일 미지정 시에도 종료 버튼 노출
  const endStr = toDateOnly(props.end_time);
  if (!endStr) return true;
  const end = new Date(endStr);
  if (Number.isNaN(end.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return today <= end;
}

/** 수정 모드에서 파일 선택 input 값이 바뀌면 editFiles 목록 갱신 (10MB 초과 시 AlertModal로 에러 표시) */
function onEditFileChange(e) {
  const files = Array.from(e.target.files || []);
  const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
  if (oversized.length > 0) {
    emit("alert", {
      type: "error",
      message: `파일 용량이 10MB를 초과합니다:\n${oversized.map((f) => f.name).join("\n")}`,
    });
    if (editFileInput.value) editFileInput.value.value = "";
    return;
  }
  editFiles.value = files;
}
/** 숨겨진 파일 input을 프로그래매틱으로 클릭해 파일 선택 다이얼로그 오픈 */
function openEditFileDialog() {
  if (editFileInput.value) editFileInput.value.click();
}

/**
 * 파일 표시명 계산: origin_file_name + file_ext 조합.
 * origin_file_name이 이미 확장자를 포함하는 경우 중복 방지.
 * (예: origin="보고서", ext="pdf" → "보고서.pdf")
 */
function formatFileName(file) {
  const name = file?.origin_file_name || file?.server_file_name || "";
  const ext = file?.file_ext || "";
  if (!name) return "";
  if (ext && !name.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) {
    return `${name}.${ext}`;
  }
  return name;
}

/** filesForPlan 목록 전체를 formatFileName 으로 변환해 fileNames 문자열 재계산 */
function recomputeFileNames() {
  fileNames.value = filesForPlan.value
    .map((f) => formatFileName(f))
    .filter(Boolean)
    .join(", ");
}

/**
 * 이 계획(plan_code)의 첨부파일 목록을 GET /api/upload/files/:plan_code 로 조회해 filesForPlan 갱신.
 * 마운트 시·plan_code 변경 시·부모에서 reloadFiles() 호출 시 실행됨.
 */
async function loadPlanFiles() {
  if (!props.plan_code) {
    filesForPlan.value = [];
    fileNames.value = "";
    return;
  }
  try {
    const res = await fetch(
      `/api/upload/files/${encodeURIComponent(props.plan_code)}`,
    );
    const data = await res.json().catch(() => ({}));
    const list = Array.isArray(data?.data) ? data.data : [];
    filesForPlan.value = list;
    recomputeFileNames();
  } catch (e) {
    console.error("계획 첨부파일 조회 중 에러", e);
    filesForPlan.value = [];
    fileNames.value = "";
  }
}

/**
 * 수정 모드에서 기존 첨부파일 삭제 표시.
 * deletedFileCodes 에 추가해두고, 수정완료 시 부모가 일괄 DELETE API 호출한다.
 */
function removeFileForEdit(fileCode) {
  if (!fileCode) return;
  if (!deletedFileCodes.value.includes(fileCode)) {
    deletedFileCodes.value.push(fileCode);
  }
  filesForPlan.value = filesForPlan.value.filter(
    (f) => f.file_code !== fileCode,
  );
  recomputeFileNames();
}

/** 단일 파일 다운로드: GET /api/upload/download/:fileCode 를 새 탭에서 열어 브라우저가 다운로드 처리 */
function downloadFile(fileCode) {
  if (!fileCode) return;
  const url = `/api/upload/download/${encodeURIComponent(fileCode)}`;
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.click();
}

/** 전체 첨부파일을 ZIP으로 받기: GET /api/upload/download-zip/:plan_code (현재 카드의 plan_code) */
function downloadAllFiles() {
  if (!filesForPlan.value.length) return;
  const url = `/api/upload/download-zip/${encodeURIComponent(props.plan_code)}`;
  const a = document.createElement("a");
  a.href = url;
  a.click();
}

/** 파일명(확장자 제외) — 버튼 말줄임 표시용 */
function fileBaseName(file) {
  return file?.origin_file_name || "";
}

/** 파일 확장자(.포함) — 버튼에서 항상 표기 */
function fileExt(file) {
  return file?.file_ext ? `.${file.file_ext}` : "";
}

// ========== 라이프사이클 훅 / expose / watch ==========
// 부모에서 props가 갱신되면 수정 중이 아닐 때 로컬값 동기화
watch(
  () => [
    props.support_plan_title,
    props.support_plan_content,
    props.start_time,
    props.end_time,
  ],
  () => {
    if (!isEditing.value) {
      titleLocal.value = props.support_plan_title || "";
      contentLocal.value = props.support_plan_content || "";
      startDateLocal.value = toDateOnly(props.start_time);
      endDateLocal.value = toDateOnly(props.end_time);
    }
  },
);
// plan_code가 바뀌면(다른 계획으로 교체) 첨부파일 목록 재조회
watch(
  () => props.plan_code,
  () => {
    if (!isEditing.value) loadPlanFiles();
  },
);
// 마운트 시 최초 첨부파일 조회
onBeforeMount(loadPlanFiles);
// 부모(SupportPlan)가 cancelRequest 값을 이 카드의 plan_code 로 설정하면 수정 취소 처리
watch(
  () => props.cancelRequest,
  (v) => {
    if (v && v === props.plan_code && isEditing.value) {
      onCancel();
      emit("cancel-done");
    }
  },
);

// 부모에서 ref를 통해 첨부파일 목록 재조회가 필요할 때 사용
defineExpose({ reloadFiles: loadPlanFiles });
</script>
<template>
  <div class="support-plan-detail card shadow-sm border-radius-lg mb-4">
    <div class="card-body">
      <p class="text-sm text-body mb-2 opacity-8 text-end">
        계획작성일시 | {{ plan_date || "—" }}
      </p>
      <p
        v-if="support_plan_updday"
        class="text-sm text-body mb-2 opacity-8 text-end"
      >
        최종수정일시 | {{ support_plan_updday }}
      </p>
      <!-- 수정/보완하기로 편집 모드일 때만 노출 -->
      <div v-if="isEditing" class="d-flex justify-content-end gap-2 mb-3">
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          @click="onLoadTemp"
        >
          임시저장 불러오기
        </button>
        <button
          type="button"
          class="btn btn-sm btn-secondary"
          @click="
            emit('temp-save', {
              planCode: plan_code,
              title: titleLocal.value ?? '',
              content: contentLocal.value ?? '',
            })
          "
        >
          임시저장
        </button>
      </div>
      <div class="detail-fields mb-4">
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">제목</label>
          <input
            type="text"
            class="form-control form-control-sm"
            :value="isEditing ? titleLocal : support_plan_title"
            :readonly="!isEditing"
            placeholder="지원 계획 제목"
            @input="(e) => isEditing && updateTitle(e.target.value)"
          />
        </div>
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">내용</label>
          <textarea
            class="form-control form-control-sm support-plan-textarea"
            :value="isEditing ? contentLocal : support_plan_content"
            :readonly="!isEditing"
            placeholder="계획"
            @input="(e) => isEditing && updateContent(e.target.value)"
          ></textarea>
        </div>
        <!-- 첨부: 조회 모드에서는 파일이 있을 때만, 수정 모드에서는 항상 노출 -->
        <div v-if="isEditing || filesForPlan.length" class="mb-3">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <label class="form-label text-sm text-body mb-1 mb-0">첨부</label>
            <button
              v-if="filesForPlan.length && !isEditing"
              type="button"
              class="btn btn-xs btn-outline-primary"
              @click="downloadAllFiles"
            >
              첨부파일 전체 다운로드
            </button>
          </div>
          <template v-if="!isEditing">
            <div class="d-flex flex-wrap gap-1">
              <button
                v-for="file in filesForPlan"
                :key="file.file_code"
                type="button"
                class="btn btn-xs btn-outline-primary file-dl-btn"
                :title="formatFileName(file)"
                @click="downloadFile(file.file_code)"
              >
                <span class="file-dl-name">{{ fileBaseName(file) }}</span
                ><span class="file-dl-ext">{{ fileExt(file) }}</span>
              </button>
            </div>
          </template>
          <template v-else>
            <input
              ref="editFileInput"
              type="file"
              class="d-none"
              multiple
              @change="onEditFileChange"
            />
            <button
              type="button"
              class="form-control form-control-sm text-start bg-white mb-1"
              @click="openEditFileDialog"
            >
              <span v-if="editFiles.length">
                {{ editFiles.map((f) => f.name).join(", ") }}
              </span>
              <span v-else class="text-muted">파일을 선택하세요</span>
            </button>
            <div v-if="filesForPlan.length" class="mt-1 d-flex flex-wrap gap-1">
              <div
                v-for="file in filesForPlan"
                :key="file.file_code"
                class="btn-group btn-group-xs"
              >
                <button
                  type="button"
                  class="btn btn-xs btn-outline-primary file-dl-btn"
                  :title="formatFileName(file)"
                  @click="downloadFile(file.file_code)"
                >
                  <span class="file-dl-name">{{ fileBaseName(file) }}</span
                  ><span class="file-dl-ext">{{ fileExt(file) }}</span>
                </button>
                <button
                  type="button"
                  class="btn btn-xs btn-outline-danger"
                  @click="removeFileForEdit(file.file_code)"
                >
                  ×
                </button>
              </div>
            </div>
          </template>
        </div>
        <div
          v-if="plan_result === 'e0_99' || plan_result === 'e0_80'"
          class="mb-3"
        >
          <label class="form-label text-sm text-body mb-1">
            {{ plan_result === "e0_99" ? "반려" : "보완" }}
          </label>
          <textarea
            class="form-control form-control-sm support-plan-textarea"
            rows="2"
            :value="support_plan_comment || support_plan_reject_comment"
            readonly
            :placeholder="plan_result === 'e0_99' ? '반려사유' : '보완사유'"
          ></textarea>
        </div>
        <!-- 반려(e0_99)된 계획은 지원기간 미표시 -->
        <div v-if="plan_result !== 'e0_99'" class="mb-3">
          <label class="form-label text-sm text-body mb-1">지원기간 : </label>
          <template v-if="!isEditing">
            <span class="text-body">{{ displayStartTime() }}</span>
            <span class="text-body mx-1">~</span>
            <span class="text-body">{{ displayEndTime() }}</span>
          </template>
          <div v-else class="d-flex align-items-center flex-wrap gap-2">
            <input
              v-model="startDateLocal"
              type="date"
              class="form-control form-control-sm"
              style="max-width: 11rem"
            />
            <span class="text-body">~</span>
            <input
              v-model="endDateLocal"
              type="date"
              class="form-control form-control-sm"
              style="max-width: 11rem"
            />
          </div>
        </div>
      </div>
      <div
        class="actions d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"
      >
        <div class="d-flex gap-2">
          <!-- 수정이력: 조회상태일 때만 왼쪽에 표시 -->
          <button
            v-if="isViewMode()"
            type="button"
            class="btn btn-sm btn-success"
            @click="emit('history')"
          >
            수정이력
          </button>
        </div>
        <div class="d-flex flex-wrap gap-2 justify-content-end">
          <!-- 조회상태: 반려(e0_99)·승인(e0_10)=수정이력+결과조회 등, 보완(e0_80)=수정이력+수정(승인/보완/반려 비활성), 검토대기(e0_00)=전부 -->
          <template v-if="isViewMode()">
            <button
              v-if="plan_result === 'e0_10'"
              type="button"
              class="btn btn-sm btn-primary"
              @click="emit('result', plan_code)"
            >
              결과조회
            </button>
            <button
              v-if="canShowExtend()"
              type="button"
              class="btn btn-sm btn-outline-info"
              @click="emit('extend', plan_code)"
            >
              연장
            </button>
            <button
              v-if="canShowEnd()"
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="emit('end', plan_code)"
            >
              종료
            </button>
            <button
              v-if="plan_result === 'e0_00'"
              type="button"
              class="btn btn-sm btn-primary"
              @click="startEdit"
            >
              수정
            </button>
            <button
              v-if="plan_result === 'e0_80'"
              type="button"
              class="btn btn-sm btn-primary"
              @click="startEdit"
            >
              보완하기
            </button>
            <button
              v-if="plan_result === 'e0_00'"
              type="button"
              class="btn btn-sm btn-success"
              @click="emit('approve', plan_code)"
            >
              승인
            </button>
            <button
              v-if="plan_result === 'e0_00'"
              type="button"
              class="btn btn-sm btn-warning"
              @click="emit('supple', plan_code)"
            >
              보완
            </button>
            <button
              v-if="plan_result === 'e0_00'"
              type="button"
              class="btn btn-sm btn-danger"
              @click="emit('reject', plan_code)"
            >
              반려
            </button>
          </template>
          <!-- 입력상태: 편집 중 + 내용 없음 → 승인요청, 취소 -->
          <template v-else-if="isInputMode()">
            <button
              type="button"
              class="btn btn-sm btn-outline-primary"
              @click="
                emit('approval-request', {
                  planCode: plan_code,
                  title: titleLocal,
                  content: contentLocal,
                })
              "
            >
              승인요청
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="emit('request-cancel', plan_code)"
            >
              취소
            </button>
          </template>
          <!-- 수정상태: 편집 중 + 내용 있음 → 수정완료, 임시저장, 취소 -->
          <template v-else-if="isEditMode()">
            <button
              v-if="plan_result === 'e0_00'"
              type="button"
              class="btn btn-sm btn-success"
              @click="onEditComplete"
            >
              수정완료
            </button>
            <button
              v-if="plan_result === 'e0_80'"
              type="button"
              class="btn btn-sm btn-success"
              @click="onEditComplete"
            >
              승인재요청
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="emit('request-cancel', plan_code)"
            >
              취소
            </button>
          </template>
        </div>
      </div>
      <div
        v-if="plan_result === 'e0_10' || plan_result === 'e0_99'"
        class="text-sm"
      >
        <span class="text-body opacity-8">승인여부:</span>
        <span
          :class="
            plan_result === 'e0_10'
              ? 'text-success fw-bold'
              : 'text-danger fw-bold'
          "
        >
          {{ plan_result === "e0_10" ? "승인" : "반려" }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.support-plan-detail .form-control:read-only,
.support-plan-detail textarea[readonly] {
  background-color: var(--bs-gray-100, #f8f9fa);
}

/* 파일 다운로드 버튼: 최대 100px, 이름은 말줄임·확장자는 항상 표기 */
.file-dl-btn {
  max-width: 100px;
  overflow: hidden;
  display: inline-flex !important;
  align-items: center;
  padding-left: 4px !important;
  padding-right: 4px !important;
}
.file-dl-btn .file-dl-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1 1 auto;
}
.file-dl-btn .file-dl-ext {
  white-space: nowrap;
  flex-shrink: 0;
}
.support-plan-textarea {
  height: 6rem;
  min-height: 6rem;
  max-height: 6rem;
  resize: none;
}
</style>
