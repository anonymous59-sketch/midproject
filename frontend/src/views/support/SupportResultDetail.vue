<script setup>
/**
 * 지원결과 한 건 상세/편집 카드 (SupportResultDetail)
 * ----------------------------------------
 * - 역할: 한 건의 지원결과를 카드로 표시하고, 조회/수정/승인·보완·반려·승인요청·취소 처리
 * - result_result(result_tf): e0_00 검토대기, e0_10 승인, e0_80 보완요청, e0_99 반려
 * - 모드: isViewMode | isInputMode(수정 중+내용 없음→승인요청) | isEditMode(수정 중+내용 있음→수정완료)
 * - 수정 완료 시: 제목·내용·첨부 변경이 없으면 API 호출 없이 알림만. 있으면 edit-complete로 부모가 updateResult + 첨부 DELETE/업로드
 * - 첨부: result_code로 GET /api/upload/files/:categoryPk 조회. defineExpose({ resetToViewMode, reloadFiles }) 로 부모에서 취소/재조회 가능
 * - 권한: 기관관리자(a0_40)만 승인/보완/반려 버튼 노출. 수정·승인요청 등은 권한 무관.
 */
// ========== import ==========
import { ref, watch, onBeforeMount, computed } from "vue";
import { useAuthStore } from "@/store/auth";
import ArgonButton from "@/components/ArgonButton.vue";
import ArgonInput from "@/components/ArgonInput.vue";

// ========== auth (버튼 노출 권한) ==========
const authStore = useAuthStore();
/** 기관관리자(a0_40)일 때만 true. 승인/보완/반려는 기관관리자만 노출(일반 이용자/기관담당자/시스템관리자 제외) */
const canManageResult = computed(() => authStore.user?.m_auth === "a0_40");
/** 기관담당자(a0_30) 여부 — 보완이력 노출용 */
const isManagerRole = computed(() => authStore.user?.m_auth === "a0_30");
/** 지원자(a0_20)면 결과 수정/승인요청 등 전부 비활성화(조회만 허용) */
const isApplicant = computed(() => authStore.user?.m_auth === "a0_20");

// ========== props / emit ==========
const props = defineProps({
  result_code: { type: String, default: "" },
  result_title: { type: String, default: "" },
  result_content: { type: String, default: "" },
  result_date: { type: String, default: "" },
  result_tf: { type: String, default: "" },
  result_cmt: { type: String, default: "" },
  result_updday: { type: String, default: "" },
  result_result: { type: String, default: "" },
  cancelRequest: { type: String, default: "" },
  has_supple: { type: Boolean, default: false },
});
const emit = defineEmits([
  "history",
  "open-supple-history",
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
  "add-result",
  "result-result",
  "temp-save",
  "alert",
]);

/** 수정 모드 여부 */
const isEditing = ref(false);
/** 수정 중 로컬 제목·내용·시작일·종료일. 수정완료 시 부모에 전달 */
const titleLocal = ref(props.result_title || "");
const contentLocal = ref(props.result_content || "");

/** 수정 시작 시점의 원본 제목·내용. 수정완료 시 변경 여부 판단용(변경 없으면 API 미호출) */
const editStartedTitle = ref("");
const editStartedContent = ref("");

/** 수정 모드에서 새로 선택한 File 목록. 수정완료 시 부모가 file-content 업로드 */
const editFiles = ref([]);
const editFileInput = ref(null);
/** GET /api/upload/files/:result_code 로 조회한 이 결과의 첨부파일 목록 */
const filesForResult = ref([]);
const fileNames = ref("");
/** 수정 중 삭제 표시한 file_code 배열. 수정완료 시 부모가 DELETE /api/upload/file/:fileCode 호출 */
const deletedFileCodes = ref([]);

const isViewMode = () => !isEditing.value;
const isInputMode = () => isEditing.value && !(contentLocal.value || "").trim();
const isEditMode = () => isEditing.value && (contentLocal.value || "").trim();

// ========== 함수 ==========
/** 파일 선택 시 10MB 초과 파일이 있으면 alert 이벤트(AlertModal)로 에러 표시 후 선택 취소, 아니면 editFiles 갱신 */
function onEditFileChange(e) {
  const files = Array.from(e.target.files || []);
  const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
  if (oversized.length > 0) {
    emit("alert", {
      type: "error",
      message: `파일 용량이 10MB를 초과합니다:\n${oversized
        .map((f) => f.name)
        .join("\n")}`,
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

/** filesForResult 목록 전체를 formatFileName 으로 변환해 fileNames 문자열 재계산 */
function recomputeFileNames() {
  fileNames.value = filesForResult.value
    .map((f) => formatFileName(f))
    .filter(Boolean)
    .join(", ");
}

/** result_code 기준으로 해당 결과의 첨부파일 목록을 서버에서 조회하고 filesForResult 갱신 */
async function loadResultFiles() {
  if (!props.result_code) {
    filesForResult.value = [];
    fileNames.value = "";
    return;
  }
  try {
    const res = await fetch(
      `/api/upload/files/${encodeURIComponent(props.result_code)}`,
    );
    const data = await res.json().catch(() => ({}));
    const list = Array.isArray(data?.data) ? data.data : [];
    filesForResult.value = list;
    recomputeFileNames();
  } catch (e) {
    console.error("결과 첨부파일 조회 중 에러", e);
    filesForResult.value = [];
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
  filesForResult.value = filesForResult.value.filter(
    (f) => f.file_code !== fileCode,
  );
  recomputeFileNames();
}

/** 단일 파일 다운로드: 새 탭에서 /api/upload/download/:fileCode 호출 */
function downloadFile(fileCode) {
  if (!fileCode) return;
  const url = `/api/upload/download/${encodeURIComponent(fileCode)}`;
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.click();
}

/** 전체 파일을 ZIP으로 압축 다운로드 */
function downloadAllFiles() {
  if (!filesForResult.value.length) return;
  const url = `/api/upload/download-zip/${encodeURIComponent(props.result_code)}`;
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

/** 수정 모드로 전환하고 로컬·원본 스냅샷 저장 후 edit 이벤트 발생 */
function startEdit() {
  isEditing.value = true;
  const title = props.result_title || "";
  const content = props.result_content || "";
  titleLocal.value = title;
  contentLocal.value = content;
  editStartedTitle.value = title;
  editStartedContent.value = content;
  editFiles.value = [];
  deletedFileCodes.value = [];
  emit("edit");
}
/** 수정 취소: 조회 모드로 복귀 후 cancel 이벤트 발생 */
function onCancel() {
  isEditing.value = false;
  titleLocal.value = props.result_title || "";
  contentLocal.value = props.result_content || "";
  editFiles.value = [];
  deletedFileCodes.value = [];
  loadResultFiles(); // 삭제 표시 취소 → 원복
  emit("cancel");
}
/** 부모에서 취소 확인 시 호출 — 조회 모드로 복귀 (defineExpose로 노출) */
function resetToViewMode() {
  isEditing.value = false;
  titleLocal.value = props.result_title || "";
  contentLocal.value = props.result_content || "";
  editFiles.value = [];
  deletedFileCodes.value = [];
  loadResultFiles();
}

defineExpose({ resetToViewMode, reloadFiles: loadResultFiles });

/** 수정 완료: 변경 없으면 알림만, 있으면 edit-complete 이벤트로 부모에 전달 */
function onEditComplete() {
  const title = titleLocal.value?.trim() ?? "";
  const content = contentLocal.value?.trim() ?? "";
  const origTitle = (editStartedTitle.value ?? "").trim();
  const origContent = (editStartedContent.value ?? "").trim();
  const hasFileChanges =
    editFiles.value.length > 0 || deletedFileCodes.value.length > 0;
  if (title === origTitle && content === origContent && !hasFileChanges) {
    emit("alert", {
      type: "error",
      message: "변경된 내용이 없습니다.",
    });
    isEditing.value = false;
    titleLocal.value = props.result_title || "";
    contentLocal.value = props.result_content || "";
    return;
  }
  emit("edit-complete", {
    resultCode: props.result_code,
    title,
    content,
    deleteFileCodes: deletedFileCodes.value.slice(),
    newFiles: editFiles.value,
  });
  isEditing.value = false;
  editFiles.value = [];
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

// ========== 라이프사이클 훅 / watch ==========
// 부모에서 props(제목·내용)가 갱신되면 수정 중이 아닐 때 로컬값 동기화
watch(
  () => [props.result_title, props.result_content],
  () => {
    if (!isEditing.value) {
      titleLocal.value = props.result_title || "";
      contentLocal.value = props.result_content || "";
    }
  },
);
// result_code가 바뀌면 첨부파일 목록 재조회
watch(
  () => props.result_code,
  () => {
    if (!isEditing.value) loadResultFiles();
  },
);
// 마운트 시 최초 첨부파일 조회
onBeforeMount(loadResultFiles);
// 부모(SupportResult)가 cancelRequest 값을 이 카드의 result_code 로 설정하면 수정 취소 처리
watch(
  () => props.cancelRequest,
  (v) => {
    if (v && v === props.result_code && isEditing.value) {
      onCancel();
      emit("cancel-done");
    }
  },
);
</script>
<template>
  <div class="support-result-detail card shadow-sm border-radius-lg mb-4">
    <div class="card-body">
      <p class="text-sm text-body mb-2 opacity-8 text-end">
        결과작성일시 | {{ result_date || "—" }}
      </p>
      <p v-if="result_updday" class="text-sm text-body mb-2 opacity-8 text-end">
        최종수정일시 | {{ result_updday }}
      </p>
      <!-- 수정/보완하기로 편집 모드일 때만 노출 -->
      <div v-if="isEditing" class="d-flex justify-content-end gap-2 mb-3">
        <ArgonButton type="button" size="sm" variant="outline" color="secondary" @click="onLoadTemp">
          임시저장 불러오기
        </ArgonButton>
        <ArgonButton
          type="button"
          size="sm"
          color="secondary"
          @click="
            emit('temp-save', {
              resultCode: result_code,
              title: titleLocal,
              content: contentLocal,
            })
          "
        >
          임시저장
        </ArgonButton>
      </div>
      <div class="detail-fields mb-4">
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">제목</label>
          <ArgonInput
            type="text"
            size="sm"
            :model-value="isEditing ? titleLocal : result_title"
            :readonly="!isEditing"
            placeholder="지원 결과 제목"
            @update:model-value="(v) => isEditing && updateTitle(v)"
          />
        </div>
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">내용</label>
          <textarea
            class="form-control form-control-sm support-result-textarea"
            :value="isEditing ? contentLocal : result_content"
            :readonly="!isEditing"
            placeholder="결과"
            @input="(e) => isEditing && updateContent(e.target.value)"
          ></textarea>
        </div>
        <!-- 첨부: 조회 모드에서는 파일이 있을 때만, 수정 모드에서는 항상 노출 -->
        <div v-if="isEditing || filesForResult.length" class="mb-3">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <label class="form-label text-sm text-body mb-0">첨부</label>
            <ArgonButton
              v-if="filesForResult.length && !isEditing"
              type="button"
              size="sm"
              variant="outline"
              color="primary"
              @click="downloadAllFiles"
            >
              첨부파일 전체 다운로드
            </ArgonButton>
          </div>
          <!-- 조회 모드: 파일별 다운로드 버튼 -->
          <template v-if="!isEditing">
            <div class="d-flex flex-wrap gap-1">
              <button
                v-for="file in filesForResult"
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
          <!-- 수정 모드: 새 파일 추가 + 기존 파일 삭제 -->
          <template v-else>
            <input
              ref="editFileInput"
              type="file"
              class="d-none"
              multiple
              @change="onEditFileChange"
            />
            <ArgonButton
              type="button"
              size="sm"
              variant="outline"
              color="secondary"
              class="text-start w-100 bg-white mb-1"
              @click="openEditFileDialog"
            >
              <span v-if="editFiles.length">{{ editFiles.map((f) => f.name).join(", ") }}</span>
              <span v-else class="text-muted">파일을 선택하세요</span>
            </ArgonButton>
            <div
              v-if="filesForResult.length"
              class="mt-1 d-flex flex-wrap gap-1"
            >
              <div
                v-for="file in filesForResult"
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
        <!-- 반려(e0_99) 또는 보완(e0_80) 상태일 때만 사유 표시 -->
        <div
          v-if="result_result === 'e0_99' || result_result === 'e0_80'"
          class="mb-3"
        >
          <label class="form-label text-sm text-body mb-1">{{
            result_result === "e0_99" ? "반려" : "보완"
          }}</label>
          <textarea
            class="form-control form-control-sm support-result-textarea"
            rows="2"
            :value="result_cmt"
            readonly
            :placeholder="result_result === 'e0_99' ? '반려사유' : '보완사유'"
          ></textarea>
        </div>
      </div>
      <div
        class="actions d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"
      >
        <div class="d-flex gap-2">
          <ArgonButton
            v-if="isViewMode()"
            type="button"
            size="sm"
            color="success"
            @click="emit('history', result_code)"
          >
            수정이력
          </ArgonButton>
          <ArgonButton
            v-if="isViewMode() && has_supple && (isManagerRole || canManageResult)"
            type="button"
            size="sm"
            variant="outline"
            color="secondary"
            class="btn-outline-purple"
            @click="emit('open-supple-history')"
          >
            보완이력
          </ArgonButton>
        </div>
        <div class="d-flex flex-wrap gap-2 justify-content-end">
          <template v-if="isViewMode()">
            <ArgonButton
              v-if="result_result === 'e0_00' && !isApplicant"
              type="button"
              size="sm"
              color="primary"
              @click="startEdit"
            >
              수정
            </ArgonButton>
            <ArgonButton
              v-if="result_result === 'e0_80' && !isApplicant"
              type="button"
              size="sm"
              color="primary"
              @click="startEdit"
            >
              보완하기
            </ArgonButton>
            <ArgonButton
              v-if="canManageResult && result_result === 'e0_00'"
              type="button"
              size="sm"
              color="success"
              @click="emit('approve', result_code)"
            >
              승인
            </ArgonButton>
            <ArgonButton
              v-if="canManageResult && result_result === 'e0_00'"
              type="button"
              size="sm"
              color="warning"
              @click="emit('supple', result_code)"
            >
              보완
            </ArgonButton>
            <ArgonButton
              v-if="canManageResult && result_result === 'e0_00'"
              type="button"
              size="sm"
              color="danger"
              @click="emit('reject', result_code)"
            >
              반려
            </ArgonButton>
          </template>
          <template v-else-if="isInputMode()">
            <ArgonButton
              v-if="!isApplicant"
              type="button"
              size="sm"
              variant="outline"
              color="primary"
              @click="
                emit('approval-request', {
                  resultCode: result_code,
                  title: titleLocal,
                  content: contentLocal,
                })
              "
            >
              승인요청
            </ArgonButton>
            <ArgonButton
              v-if="!isApplicant"
              type="button"
              size="sm"
              variant="outline"
              color="secondary"
              @click="emit('request-cancel', result_code)"
            >
              취소
            </ArgonButton>
          </template>
          <template v-else-if="isEditMode()">
            <ArgonButton
              v-if="result_result === 'e0_00' && !isApplicant"
              type="button"
              size="sm"
              color="success"
              @click="onEditComplete"
            >
              수정완료
            </ArgonButton>
            <ArgonButton
              v-if="result_result === 'e0_80' && !isApplicant"
              type="button"
              size="sm"
              color="success"
              @click="onEditComplete"
            >
              승인재요청
            </ArgonButton>
            <ArgonButton
              v-if="!isApplicant"
              type="button"
              size="sm"
              variant="outline"
              color="secondary"
              @click="emit('request-cancel', result_code)"
            >
              취소
            </ArgonButton>
          </template>
        </div>
      </div>
      <div
        v-if="result_result === 'e0_10' || result_result === 'e0_99'"
        class="text-sm"
      >
        <span class="text-body opacity-8">승인여부:</span>
        <span
          :class="
            result_result === 'e0_10'
              ? 'text-success fw-bold'
              : 'text-danger fw-bold'
          "
        >
          {{ result_result === "e0_10" ? "승인" : "반려" }}
        </span>
      </div>
    </div>
  </div>
</template>
<style scoped>
.btn-outline-purple {
  color: #6f42c1;
  border-color: #6f42c1;
  background: transparent;
}
.btn-outline-purple:hover {
  color: #fff;
  background: #6f42c1;
  border-color: #6f42c1;
}
.support-result-detail .form-control:read-only,
.support-result-detail textarea[readonly] {
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
.support-result-textarea {
  height: 6rem;
  min-height: 6rem;
  max-height: 6rem;
  resize: none;
}
</style>
