<script setup>
// ========== import ==========
import { ref, watch } from "vue";

// ========== 변수 ==========
const props = defineProps({
  plan_code: { type: String, default: "" },
  support_plan_title: { type: String, default: "" },
  support_plan_content: { type: String, default: "" },
  support_plan_file: { type: String, default: "" },
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
]);

const isEditing = ref(false);
const titleLocal = ref(props.support_plan_title || "");
const contentLocal = ref(props.support_plan_content || "");

const isViewMode = () => !isEditing.value;
const isInputMode = () => isEditing.value && !(contentLocal.value || "").trim();
const isEditMode = () => isEditing.value && (contentLocal.value || "").trim();

// ========== 함수 ==========
function startEdit() {
  isEditing.value = true;
  titleLocal.value = props.support_plan_title || "";
  contentLocal.value = props.support_plan_content || "";
  emit("edit");
}
function onCancel() {
  isEditing.value = false;
  titleLocal.value = props.support_plan_title || "";
  contentLocal.value = props.support_plan_content || "";
  emit("cancel");
}
function onEditComplete() {
  emit("edit-complete", {
    planCode: props.plan_code,
    title: titleLocal.value?.trim() ?? "",
    content: contentLocal.value?.trim() ?? "",
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
  () => [props.support_plan_title, props.support_plan_content],
  () => {
    if (!isEditing.value) {
      titleLocal.value = props.support_plan_title || "";
      contentLocal.value = props.support_plan_content || "";
    }
  },
);
watch(
  () => props.cancelRequest,
  (v) => {
    if (v && v === props.plan_code && isEditing.value) {
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
        계획작성일시 | {{ plan_date || "—" }}
      </p>
      <p
        v-if="support_plan_updday"
        class="text-sm text-body mb-2 opacity-8 text-end"
      >
        최종수정일시 | {{ support_plan_updday }}
      </p>
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
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">첨부</label>
          <div class="form-control form-control-sm bg-light border-0">
            {{ support_plan_file || "첨부파일 없음" }}
          </div>
        </div>
        <div
          v-if="plan_result === 'e0_99' || plan_result === 'e0_80'"
          class="mb-3"
        >
          <label class="form-label text-sm text-body mb-1">{{
            plan_result === "e0_99" ? "반려" : "보완"
          }}</label>
          <textarea
            class="form-control form-control-sm support-plan-textarea"
            rows="2"
            :value="support_plan_comment || support_plan_reject_comment"
            readonly
            :placeholder="plan_result === 'e0_99' ? '반려사유' : '보완사유'"
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
.support-plan-textarea {
  height: 6rem;
  min-height: 6rem;
  max-height: 6rem;
  resize: none;
}
</style>
