<script setup>
// ========== import ==========
import { ref, watch } from "vue";

// ========== 변수 ==========
const props = defineProps({
  result_code: { type: String, default: "" },
  result_title: { type: String, default: "" },
  result_content: { type: String, default: "" },
  result_date: { type: String, default: "" },
  result_tf: { type: String, default: "" },
  result_cmt: { type: String, default: "" },
  result_updday: { type: String, default: "" },
  file_code: { type: String, default: "" },
  origin_file_name: { type: String, default: "" },
  server_file_name: { type: String, default: "" },
  file_path: { type: String, default: "" },
  file_ext: { type: String, default: "" },
  result_result: { type: String, default: "" },
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
  "add-result",
  "result-result",
]);

const isEditing = ref(false);
const titleLocal = ref(props.result_title || "");
const contentLocal = ref(props.result_content || "");

// 수정 시작 시점의 원본(조회값) — 수정완료 시 비교용
const editStartedTitle = ref("");
const editStartedContent = ref("");

const isViewMode = () => !isEditing.value;
const isInputMode = () => isEditing.value && !(contentLocal.value || "").trim();
const isEditMode = () => isEditing.value && (contentLocal.value || "").trim();

// ========== 함수 ==========
function startEdit() {
  isEditing.value = true;
  const title = props.result_title || "";
  const content = props.result_content || "";
  titleLocal.value = title;
  contentLocal.value = content;
  editStartedTitle.value = title;
  editStartedContent.value = content;
  emit("edit");
}
function onCancel() {
  isEditing.value = false;
  titleLocal.value = props.result_title || "";
  contentLocal.value = props.result_content || "";
  emit("cancel");
}
/** 부모에서 취소 확인 시 호출 — 조회 모드로 복귀 */
function resetToViewMode() {
  isEditing.value = false;
  titleLocal.value = props.result_title || "";
  contentLocal.value = props.result_content || "";
}

defineExpose({ resetToViewMode });
function onEditComplete() {
  const title = titleLocal.value?.trim() ?? "";
  const content = contentLocal.value?.trim() ?? "";
  const origTitle = (editStartedTitle.value ?? "").trim();
  const origContent = (editStartedContent.value ?? "").trim();
  if (title === origTitle && content === origContent) {
    alert("변경된 내용이 없습니다.");
    isEditing.value = false;
    titleLocal.value = props.result_title || "";
    contentLocal.value = props.result_content || "";
    return;
  }
  emit("edit-complete", {
    resultCode: props.result_code,
    title,
    content,
  });
  isEditing.value = false;
}
function updateTitle(val) {
  titleLocal.value = val;
}
function updateContent(val) {
  contentLocal.value = val;
}

// ========== 라이프사이클 훅 / watch ==========
watch(
  () => [props.result_title, props.result_content],
  () => {
    if (!isEditing.value) {
      titleLocal.value = props.result_title || "";
      contentLocal.value = props.result_content || "";
    }
  },
);
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
  <div class="support-plan-detail card shadow-sm border-radius-lg mb-4">
    <div class="card-body">
      <p class="text-sm text-body mb-2 opacity-8 text-end">
        결과작성일시 | {{ result_date || "—" }}
      </p>
      <p v-if="result_updday" class="text-sm text-body mb-2 opacity-8 text-end">
        최종수정일시 | {{ result_updday }}
      </p>
      <div class="detail-fields mb-4">
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">제목</label>
          <input
            type="text"
            class="form-control form-control-sm"
            :value="isEditing ? titleLocal : result_title"
            :readonly="!isEditing"
            placeholder="지원 결과 제목"
            @input="(e) => isEditing && updateTitle(e.target.value)"
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
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">첨부</label>
          <div class="form-control form-control-sm bg-light border-0">
            {{ origin_file_name || "첨부파일 없음" }}
          </div>
        </div>
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
          <!-- 조회상태: 반려(e0_99)·승인(e0_10)=수정이력만, 보완(e0_80)=수정이력+수정(승인/보완/반려 비활성), 검토대기(e0_00)=전부 -->
          <template v-if="isViewMode()">
            <button
              v-if="result_result === 'e0_00'"
              type="button"
              class="btn btn-sm btn-primary"
              @click="startEdit"
            >
              수정
            </button>
            <button
              v-if="result_result === 'e0_80'"
              type="button"
              class="btn btn-sm btn-primary"
              @click="startEdit"
            >
              보완하기
            </button>
            <button
              v-if="result_result === 'e0_00'"
              type="button"
              class="btn btn-sm btn-success"
              @click="emit('approve', result_code)"
            >
              승인
            </button>
            <button
              v-if="result_result === 'e0_00'"
              type="button"
              class="btn btn-sm btn-warning"
              @click="emit('supple', result_code)"
            >
              보완
            </button>
            <button
              v-if="result_result === 'e0_00'"
              type="button"
              class="btn btn-sm btn-danger"
              @click="emit('reject', result_code)"
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
                  resultCode: result_code,
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
              @click="emit('request-cancel', result_code)"
            >
              취소
            </button>
          </template>
          <!-- 수정상태: 편집 중 + 내용 있음 → 수정완료, 취소 -->
          <template v-else-if="isEditMode()">
            <button
              v-if="result_result === 'e0_00'"
              type="button"
              class="btn btn-sm btn-success"
              @click="onEditComplete"
            >
              수정완료
            </button>
            <button
              v-if="result_result === 'e0_80'"
              type="button"
              class="btn btn-sm btn-success"
              @click="onEditComplete"
            >
              승인재요청
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="emit('request-cancel', result_code)"
            >
              취소
            </button>
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
.support-result-detail .form-control:read-only,
.support-result-detail textarea[readonly] {
  background-color: var(--bs-gray-100, #f8f9fa);
}
.support-result-textarea {
  height: 6rem;
  min-height: 6rem;
  max-height: 6rem;
  resize: none;
}
</style>
