<!-- 상담내역 우측 패널 -->
<script setup>
import { reactive, watch, computed, ref } from "vue";
import ArgonButton from "@/components/ArgonButton.vue";
import ArgonInput from "@/components/ArgonInput.vue";

function formatCounselDate(val) {
  if (!val) return "";
  const d = new Date(val);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function contentPreview(text, max = 30) {
  if (!text) return "";
  return text.length <= max ? text : text.slice(0, max) + "...";
}

/** 상담진행자 표시: m_nm 우선, 없으면 writerList에서 m_no로 조회 */
function getWriterDisplayName(item) {
  if (!item) return "";
  if (item.csl_writer_nm) return item.csl_writer_nm;
  if (item.csl_name) return item.csl_name;
  const w = props.writerList?.find((m) => m.m_no === item.csl_writer);
  if (w?.m_nm) return w.m_nm;
  return item.csl_writer || "";
}

const props = defineProps({
  /** 지원자(a0_20) 등 읽기 전용 모드: 상담추가/등록 폼 비노출 */
  readOnly: { type: Boolean, default: false },
  counselList: { type: Array, default: () => [] },
  counselListLoading: { type: Boolean, default: false },
  counselListError: { type: String, default: null },
  writerList: { type: Array, default: () => [] },
  writerListLoading: { type: Boolean, default: false },
  showForm: { type: Boolean, default: false },
  counselForm: { type: Object, default: () => ({}) },
  counselFormSaving: { type: Boolean, default: false },
  tempSaveLoading: { type: Boolean, default: false },
  tempStorageListLoading: { type: Boolean, default: false },
  selectedCounselDetail: { type: Object, default: null },
  /** 수정 모드 여부를 판단하기 위한 기존 상담 csl_code (null이면 신규 작성) */
  editingCounselCode: { type: String, default: null },
});

const form = reactive({
  csl_title: "",
  counselDate: "",
  csl_content: "",
  csl_writer: "",
});

const emit = defineEmits([
  "update:counselForm",
  "open-add-form",
  "close-detail",
  "open-detail",
  "cancel-form",
  "save-counsel",
  "temp-save",
  "open-temp-load",
  "open-temp-load-detail",
  "temp-save-detail",
  "set-counsel-files",
  "open-counsel-history",
  "edit-counsel",
  "cancel-detail-edit",
  "toggle-add-form",
  "request-save-counsel",
  "request-cancel-form",
]);

/** 상담 상세 카드가 수정 모드인지(같은 카드에서 편집 중) */
const isDetailEditMode = computed(
  () =>
    props.selectedCounselDetail &&
    props.editingCounselCode === props.selectedCounselDetail.csl_code,
);

/** 상세 카드 수정 모드용 로컬 폼(수정완료/취소 시 사용) */
const detailEditForm = reactive({
  csl_title: "",
  counselDate: "",
  csl_content: "",
  csl_writer: "",
});

/** 상담(csl_code) 기준 첨부파일 목록. GET /api/upload/files/:csl_code */
const filesForCounsel = ref([]);
/** 상담 첨부파일 목록 로딩 중 */
const filesForCounselLoading = ref(false);
/** 수정 모드에서 새로 선택한 File 목록. 수정완료 시 부모가 업로드 */
const detailEditFiles = ref([]);
/** 수정 모드에서 삭제 표시한 file_code. 수정완료 시 부모가 DELETE */
const detailDeletedFileCodes = ref([]);
const detailFileInputRef = ref(null);
/** 상세 수정 모드 진입 시점의 첨부파일 개수 (이력용, 비동기 로딩 보정) */
const initialCounselAttachmentCountWhenEdit = ref(0);

async function loadCounselFiles() {
  const cslCode = props.selectedCounselDetail?.csl_code;
  if (!cslCode) {
    filesForCounsel.value = [];
    filesForCounselLoading.value = false;
    return;
  }
  filesForCounselLoading.value = true;
  filesForCounsel.value = [];
  try {
    const res = await fetch(`/api/upload/files/${encodeURIComponent(cslCode)}`);
    const data = await res.json().catch(() => ({}));
    const list = Array.isArray(data?.data) ? data.data : [];
    filesForCounsel.value = list;
    if (isDetailEditMode.value) {
      initialCounselAttachmentCountWhenEdit.value = list.length;
    }
  } catch (e) {
    filesForCounsel.value = [];
  } finally {
    filesForCounselLoading.value = false;
  }
}

function formatFileDisplayName(file) {
  const name = file?.origin_file_name ?? "";
  const ext = file?.file_ext ? `.${file.file_ext}` : "";
  return name + ext;
}

function openDetailFileSelect() {
  detailFileInputRef.value?.click();
}

function onDetailFileChange(e) {
  const files = e.target?.files;
  if (!files?.length) return;
  detailEditFiles.value = [...detailEditFiles.value, ...Array.from(files)];
  e.target.value = "";
}

function removeDetailNewFile(index) {
  detailEditFiles.value = detailEditFiles.value.filter((_, i) => i !== index);
}

function removeCounselFileForEdit(fileCode) {
  if (!fileCode) return;
  detailDeletedFileCodes.value = [...detailDeletedFileCodes.value, fileCode];
  filesForCounsel.value = filesForCounsel.value.filter(
    (f) => f.file_code !== fileCode,
  );
}

function downloadCounselFile(fileCode) {
  if (!fileCode) return;
  const url = `/api/upload/download/${encodeURIComponent(fileCode)}`;
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.click();
}

function downloadAllCounselFiles() {
  const cslCode = props.selectedCounselDetail?.csl_code;
  if (!cslCode || !filesForCounsel.value.length) return;
  const url = `/api/upload/download-zip/${encodeURIComponent(cslCode)}`;
  const a = document.createElement("a");
  a.href = url;
  a.click();
}

watch(
  () => props.counselForm,
  (val) => {
    if (val) {
      form.csl_title = val.csl_title ?? "";
      form.counselDate = val.counselDate ?? "";
      form.csl_content = val.csl_content ?? "";
      form.csl_writer = val.csl_writer ?? "";
    }
  },
  { immediate: true, deep: true },
);

watch(
  form,
  () => {
    emit("update:counselForm", { ...form });
  },
  { deep: true },
);

// 부모에서 임시저장 불러오기로 counselForm을 채우면 추가 폼 로컬 form에 반영
watch(
  () => props.counselForm,
  (newVal) => {
    if (!props.showForm || isDetailEditMode.value || !newVal) return;
    form.csl_title = newVal.csl_title ?? "";
    form.counselDate = newVal.counselDate ?? "";
    form.csl_content = newVal.csl_content ?? "";
    form.csl_writer = newVal.csl_writer ?? "";
  },
  { deep: true },
);

// 상세 수정 모드 진입 시 detailEditForm을 선택된 상담 데이터로 초기화
watch(
  () => [props.selectedCounselDetail, props.editingCounselCode],
  () => {
    if (!isDetailEditMode.value || !props.selectedCounselDetail) return;
    initialCounselAttachmentCountWhenEdit.value = filesForCounsel.value?.length ?? 0;
    const item = props.selectedCounselDetail;
    const d = item.csl_date ? new Date(item.csl_date) : null;
    const counselDate = d
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      : "";
    detailEditForm.csl_title = item.csl_title ?? "";
    detailEditForm.counselDate = counselDate;
    detailEditForm.csl_content = item.csl_content ?? "";
    detailEditForm.csl_writer = item.csl_writer ?? item.csl_name ?? "";
    detailEditFiles.value = [];
    detailDeletedFileCodes.value = [];
  },
  { immediate: true },
);

watch(
  () => props.selectedCounselDetail,
  (detail) => {
    if (detail?.csl_code) loadCounselFiles();
    else filesForCounsel.value = [];
  },
  { immediate: true, deep: true },
);

/** 상담 추가 폼 임시저장용 payload (제목 + JSON: counselDate, csl_content, csl_writer) */
function getAddFormTempPayload() {
  return {
    save_title: (form.csl_title ?? "").trim(),
    save_content: JSON.stringify({
      counselDate: form.counselDate ?? "",
      csl_content: form.csl_content ?? "",
      csl_writer: form.csl_writer ?? "",
    }),
  };
}

/** 상세 수정 모드 임시저장용 payload (제목 + JSON: counselDate, csl_content, csl_writer) */
function getDetailEditTempPayload() {
  return {
    save_title: (detailEditForm.csl_title ?? "").trim(),
    save_content: JSON.stringify({
      counselDate: detailEditForm.counselDate ?? "",
      csl_content: detailEditForm.csl_content ?? "",
      csl_writer: detailEditForm.csl_writer ?? "",
    }),
  };
}

/** 부모에서 임시저장 불러오기 선택 시 상세 수정 폼에 반영 */
function setDetailFormFromTemp(item) {
  if (!item) return;
  detailEditForm.csl_title = item.save_title ?? "";
  try {
    const o = JSON.parse(item.save_content || "{}");
    detailEditForm.counselDate = o.counselDate ?? "";
    detailEditForm.csl_content = o.csl_content ?? "";
    detailEditForm.csl_writer = o.csl_writer ?? "";
  } catch {
    // ignore
  }
}

/** 상세 수정 완료 시 부모로 보낼 payload (수정 전/후 첨부 개수 포함, 스크립트에서 .value로 계산) */
function getDetailEditSavePayload() {
  const existing = filesForCounsel.value?.length ?? 0;
  const deleted = detailDeletedFileCodes.value?.length ?? 0;
  const existingFileCount = Math.max(
    initialCounselAttachmentCountWhenEdit.value ?? 0,
    existing + deleted,
  );
  return {
    ...detailEditForm,
    deleteFileCodes: detailDeletedFileCodes.value?.slice() ?? [],
    newFiles: detailEditFiles.value?.slice() ?? [],
    existingFileCount,
  };
}

defineExpose({ setDetailFormFromTemp });
</script>

<template>
  <div class="card shadow-sm">
    <div
      class="card-header py-2 d-flex align-items-center justify-content-between"
    >
      <div class="d-flex align-items-center gap-2">
        <h6 class="mb-0 fw-bold">상담내역</h6>
        <ArgonButton
          v-if="!readOnly"
          type="button"
          size="sm"
          variant="outline"
          color="primary"
          class="d-inline-flex align-items-center gap-1"
          @click="emit('toggle-add-form')"
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
        </ArgonButton>
      </div>
    </div>
    <!-- 상담 상세보기 (readonly) -->
    <div class="card-body">
      <div
        v-if="selectedCounselDetail"
        class="border rounded p-3 mb-4 bg-light"
      >
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h6 class="text-sm text-uppercase text-muted mb-0">상담 상세</h6>
          <div v-if="isDetailEditMode" class="d-flex gap-2">
            <ArgonButton
              type="button"
              size="sm"
              variant="outline"
              color="secondary"
              @click="emit('open-temp-load-detail')"
            >
              임시저장 불러오기
            </ArgonButton>
            <ArgonButton
              type="button"
              size="sm"
              color="secondary"
              :disabled="counselFormSaving || tempSaveLoading"
              @click="emit('temp-save-detail', getDetailEditTempPayload())"
            >
              {{ tempSaveLoading ? "저장 중..." : "임시저장" }}
            </ArgonButton>
          </div>
          <ArgonButton
            v-else
            type="button"
            size="sm"
            variant="outline"
            color="secondary"
            @click="emit('close-detail')"
          >
            닫기
          </ArgonButton>
        </div>
        <!-- 수정 모드: 같은 카드에서 편집 -->
        <template v-if="isDetailEditMode">
          <div class="mb-2">
            <label class="form-label text-xs mb-0">제목</label>
            <ArgonInput
              v-model="detailEditForm.csl_title"
              type="text"
              size="sm"
              class="bg-white"
              placeholder="제목"
            />
          </div>
          <div class="mb-2">
            <label class="form-label text-xs mb-0">상담일</label>
            <ArgonInput
              v-model="detailEditForm.counselDate"
              type="date"
              size="sm"
              class="bg-white"
            />
          </div>
          <div class="mb-2">
            <label class="form-label text-xs mb-0">상담진행자</label>
            <select
              v-model="detailEditForm.csl_writer"
              class="form-select form-select-sm bg-white"
              :disabled="writerListLoading"
            >
              <option value="">선택하세요</option>
              <option v-for="w in writerList" :key="w.m_no" :value="w.m_no">
                {{ w.m_nm }}
              </option>
            </select>
          </div>
          <div class="mb-2">
            <label class="form-label text-xs mb-0">내용</label>
            <textarea
              v-model="detailEditForm.csl_content"
              class="form-control form-control-sm bg-white"
              rows="4"
              placeholder="내용"
            />
          </div>
          <!-- 수정 모드: 첨부파일 -->
          <div
            v-if="
              isDetailEditMode &&
              ((filesForCounsel?.length ?? 0) || (detailEditFiles?.length ?? 0))
            "
            class="mb-2"
          >
            <label class="form-label text-xs mb-0">첨부파일</label>
            <input
              ref="detailFileInputRef"
              type="file"
              class="d-none"
              multiple
              @change="onDetailFileChange"
            />
            <ArgonButton
              type="button"
              size="sm"
              variant="outline"
              color="secondary"
              class="mb-1"
              @click="openDetailFileSelect"
            >
              파일 선택
            </ArgonButton>
            <div
              v-if="(detailEditFiles?.length ?? 0) > 0"
              class="d-flex flex-wrap gap-1 mb-1"
            >
              <span
                v-for="(f, i) in detailEditFiles"
                :key="i"
                class="badge bg-primary bg-opacity-25 text-dark border"
              >
                {{ f.name }}
                <button
                  type="button"
                  class="btn btn-link btn-sm p-0 ms-1 text-danger"
                  @click="removeDetailNewFile(i)"
                >
                  ×
                </button>
              </span>
            </div>
            <div v-if="(filesForCounsel?.length ?? 0) > 0" class="d-flex flex-wrap gap-1">
              <template v-for="file in (filesForCounsel ?? [])" :key="file.file_code">
                <span class="badge bg-light text-dark border">
                  {{ formatFileDisplayName(file) }}
                  <button
                    type="button"
                    class="btn btn-link btn-sm p-0 ms-1 text-danger"
                    @click="removeCounselFileForEdit(file.file_code)"
                  >
                    ×
                  </button>
                </span>
              </template>
            </div>
          </div>
          <div v-else-if="isDetailEditMode" class="mb-2">
            <label class="form-label text-xs mb-0">첨부파일</label>
            <input
              ref="detailFileInputRef"
              type="file"
              class="d-none"
              multiple
              @change="onDetailFileChange"
            />
            <ArgonButton
              type="button"
              size="sm"
              variant="outline"
              color="secondary"
              @click="openDetailFileSelect"
            >
              파일 선택
            </ArgonButton>
          </div>
          <div
            class="d-flex align-items-center justify-content-end gap-2 mt-3 pt-2 border-top"
          >
            <ArgonButton
              type="button"
              size="sm"
              color="primary"
              :disabled="counselFormSaving"
              @click="emit('save-counsel', getDetailEditSavePayload())"
            >
              {{ counselFormSaving ? "수정 중..." : "수정완료" }}
            </ArgonButton>
            <ArgonButton
              type="button"
              size="sm"
              variant="outline"
              color="secondary"
              :disabled="counselFormSaving"
              @click="emit('cancel-detail-edit')"
            >
              취소
            </ArgonButton>
          </div>
        </template>
        <!-- 읽기 전용 -->
        <template v-else>
          <div class="mb-2">
            <label class="form-label text-xs mb-0">제목</label>
            <ArgonInput
              type="text"
              size="sm"
              class="bg-white"
              :model-value="selectedCounselDetail.csl_title"
              readonly
            />
          </div>
          <div class="mb-2">
            <label class="form-label text-xs mb-0">상담일</label>
            <ArgonInput
              type="text"
              size="sm"
              class="bg-white"
              :model-value="formatCounselDate(selectedCounselDetail.csl_date)"
              readonly
            />
          </div>
          <div class="mb-2">
            <label class="form-label text-xs mb-0">상담진행자</label>
            <ArgonInput
              type="text"
              size="sm"
              class="bg-white"
              :model-value="getWriterDisplayName(selectedCounselDetail)"
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
          <!-- 읽기 전용: 첨부파일 목록 + 전체 ZIP 다운로드 (항상 영역 표시) -->
          <div class="mb-2">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <label class="form-label text-xs mb-0">첨부파일</label>
              <ArgonButton
                v-if="(filesForCounsel?.length ?? 0) > 0"
                type="button"
                size="sm"
                variant="outline"
                color="primary"
                @click="downloadAllCounselFiles"
              >
                첨부파일 전체 다운로드
              </ArgonButton>
            </div>
            <p v-if="filesForCounselLoading" class="text-muted text-sm mb-0">
              로딩 중...
            </p>
            <div
              v-else-if="(filesForCounsel?.length ?? 0) > 0"
              class="d-flex flex-wrap gap-1"
            >
              <button
                v-for="file in (filesForCounsel ?? [])"
                :key="file.file_code"
                type="button"
                class="btn btn-sm btn-outline-primary"
                :title="formatFileDisplayName(file)"
                @click="downloadCounselFile(file.file_code)"
              >
                {{ formatFileDisplayName(file) }}
              </button>
            </div>
            <p v-else class="text-muted text-sm mb-0">첨부파일 없음</p>
          </div>
          <div
            class="d-flex align-items-center justify-content-between mt-3 pt-2 border-top"
          >
            <ArgonButton
              type="button"
              size="sm"
              color="success"
              @click="
                emit('open-counsel-history', selectedCounselDetail.csl_code)
              "
            >
              수정이력
            </ArgonButton>
            <ArgonButton
              v-if="!readOnly"
              type="button"
              size="sm"
              color="primary"
              @click="emit('edit-counsel', selectedCounselDetail)"
            >
              수정
            </ArgonButton>
          </div>
        </template>
      </div>

      <!-- 상담등록 폼: 상세 카드에서 수정 중일 때는 노출하지 않음 -->
      <div
        v-if="showForm && !readOnly && !isDetailEditMode"
        class="border rounded p-3 mb-4 bg-light"
      >
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h6 class="text-sm text-uppercase text-muted mb-0">상담등록</h6>
          <div class="d-flex gap-2">
            <ArgonButton
              type="button"
              size="sm"
              variant="outline"
              color="secondary"
              @click="emit('open-temp-load')"
            >
              임시저장 불러오기
            </ArgonButton>
            <ArgonButton
              type="button"
              size="sm"
              color="secondary"
              :disabled="counselFormSaving || tempSaveLoading"
              @click="emit('temp-save', getAddFormTempPayload())"
            >
              {{ tempSaveLoading ? "저장 중..." : "임시저장" }}
            </ArgonButton>
          </div>
        </div>
        <div class="mb-2">
          <label class="form-label text-xs mb-0">제목</label>
          <ArgonInput
            v-model="form.csl_title"
            type="text"
            size="sm"
            placeholder="제목을 입력해주세요"
          />
        </div>
        <div class="mb-2">
          <label class="form-label text-xs mb-0">상담일</label>
          <ArgonInput v-model="form.counselDate" type="date" size="sm" />
        </div>
        <div class="mb-2">
          <label class="form-label text-xs mb-0">상담진행자</label>
          <select
            v-model="form.csl_writer"
            class="form-select form-select-sm"
            :disabled="writerListLoading"
          >
            <option value="">선택하세요</option>
            <option v-for="w in writerList" :key="w.m_no" :value="w.m_no">
              {{ w.m_nm }}
            </option>
          </select>
        </div>
        <div class="mb-2">
          <label class="form-label text-xs mb-0">내용</label>
          <textarea
            v-model="form.csl_content"
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
            @change="emit('set-counsel-files', $event.target.files)"
          />
          <small class="text-muted"
            >파일 1개당 10MB를 초과할 수 없습니다.</small
          >
        </div>
        <div class="d-flex justify-content-end gap-2">
          <ArgonButton
            type="button"
            size="sm"
            color="warning"
            :disabled="counselFormSaving"
            @click="emit('request-save-counsel', { ...form })"
          >
            {{ counselFormSaving ? "저장 중..." : "저장" }}
          </ArgonButton>
          <ArgonButton
            type="button"
            size="sm"
            variant="outline"
            color="secondary"
            :disabled="counselFormSaving"
            @click="emit('request-cancel-form')"
          >
            취소
          </ArgonButton>
        </div>
      </div>

      <!-- 상담내역 목록 -->
      <h6 class="text-sm text-uppercase text-muted mb-2">상담내역 목록</h6>
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
              <span v-if="getWriterDisplayName(item)" class="text-muted">
                {{ getWriterDisplayName(item) }}
              </span>
            </div>
            <div class="fw-semibold">{{ item.csl_title }}</div>
            <div class="text-muted small">
              {{ contentPreview(item.csl_content) }}
            </div>
          </div>
          <ArgonButton
            type="button"
            size="sm"
            variant="outline"
            color="secondary"
            class="flex-shrink-0"
            @click="emit('open-detail', item)"
          >
            상세보기
          </ArgonButton>
        </div>
        <div
          v-if="
            !counselListLoading && !counselListError && counselList.length === 0
          "
          class="list-group-item text-center text-muted py-4"
        >
          저장된 상담내역이 없습니다.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
textarea {
  resize: none;
}
</style>
