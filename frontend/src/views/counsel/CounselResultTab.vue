<!-- 지원결과 탭 -->
<script setup>
import { ref, reactive, watch } from "vue";
import SupportResultDetail from "@/views/support/SupportResultDetail.vue";

const addResultFileInputRef = ref(null);

const props = defineProps({
  showAddResultForm: { type: Boolean, default: false },
  addResultForm: { type: Object, default: () => ({}) },
  addResultFileNames: { type: String, default: "" },
  resultLoading: { type: Boolean, default: false },
  resultData: { type: Array, default: () => [] },
  cancelRequestResultCode: { type: [String, Number], default: null },
});

const form = reactive({
  title: "",
  content: "",
});

const emit = defineEmits([
  "update:addResultForm",
  "set-result-detail-ref",
  "toggle-add",
  "load-temp",
  "temp-save",
  "result-file-change",
  "open-file-dialog",
  "approval-request-add",
  "cancel-add",
  "open-supple-history",
  "approve",
  "supple",
  "reject",
  "edit-complete",
  "approval-request",
  "request-cancel",
  "cancel-done",
  "temp-save-detail",
  "history",
  "alert",
]);

watch(
  () => props.addResultForm,
  (val) => {
    if (val) {
      form.title = val.title ?? "";
      form.content = val.content ?? "";
    }
  },
  { immediate: true, deep: true }
);

watch(
  form,
  () => {
    emit("update:addResultForm", { ...form });
  },
  { deep: true }
);

function setResultDetailRef(resultCode, el) {
  emit("set-result-detail-ref", resultCode, el);
}

function openFileDialog() {
  addResultFileInputRef.value?.click();
}

function clearFileInput() {
  if (addResultFileInputRef.value) addResultFileInputRef.value.value = "";
}

defineExpose({
  openFileDialog,
  clearFileInput,
});
</script>

<template>
  <div class="d-flex align-items-center justify-content-between mb-3">
    <h6 class="text-sm text-uppercase text-muted mb-0">지원결과</h6>
    <button
      type="button"
      class="btn btn-sm btn-outline-primary"
      @click="emit('toggle-add')"
    >
      결과추가
    </button>
  </div>
  <!-- 결과 추가 폼 -->
  <div v-if="showAddResultForm" class="card shadow-sm border-radius-lg mb-4">
    <div class="card-body">
      <div class="d-flex justify-content-end gap-2 mb-3">
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          @click="emit('load-temp')"
        >
          임시저장 불러오기
        </button>
        <button
          type="button"
          class="btn btn-sm btn-secondary"
          @click="emit('temp-save')"
        >
          임시저장
        </button>
      </div>
      <div class="mb-3">
        <label class="form-label text-sm text-body mb-1">제목</label>
        <input
          v-model="form.title"
          type="text"
          class="form-control form-control-sm"
          placeholder="지원 결과 제목"
        />
      </div>
      <div class="mb-3">
        <label class="form-label text-sm text-body mb-1">내용</label>
        <textarea
          v-model="form.content"
          class="form-control form-control-sm"
          placeholder="결과"
          rows="3"
        />
      </div>
      <div class="mb-3">
        <label class="form-label text-sm text-body mb-1">첨부파일</label>
        <input
          ref="addResultFileInputRef"
          type="file"
          class="d-none"
          multiple
          @change="emit('result-file-change', $event)"
        />
        <button
          type="button"
          class="form-control form-control-sm text-start bg-white"
          @click="emit('open-file-dialog')"
        >
          <span v-if="addResultFileNames">{{ addResultFileNames }}</span>
          <span v-else class="text-muted"
            >파일을 선택하세요. 10MB 초과 불가.</span
          >
        </button>
      </div>
      <div class="d-flex justify-content-end gap-2">
        <button
          type="button"
          class="btn btn-sm btn-outline-primary"
          @click="emit('approval-request-add')"
        >
          승인요청
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          @click="emit('cancel-add')"
        >
          취소
        </button>
      </div>
    </div>
  </div>
  <div v-if="resultLoading" class="text-muted text-sm">로딩 중...</div>
  <div v-else-if="resultData.length === 0" class="text-muted text-sm">
    등록된 지원결과가 없습니다.
  </div>
  <template v-else>
    <SupportResultDetail
      v-for="result in resultData"
      :key="result.result_code"
      :ref="(el) => setResultDetailRef(result.result_code, el)"
      :result_code="result.result_code"
      :result_title="result.result_title"
      :result_content="result.result_content"
      :result_date="result.result_date"
      :result_tf="result.result_tf"
      :result_cmt="result.result_cmt"
      :result_updday="result.result_updday"
      :result_result="result.result_tf"
      :cancel-request="cancelRequestResultCode"
      :has_supple="!!(result.result_tf === 'e0_80' || result.prev_result_code)"
      @open-supple-history="emit('open-supple-history', result.result_code)"
      @approve="emit('approve', $event)"
      @supple="emit('supple', $event)"
      @reject="emit('reject', $event)"
      @edit-complete="emit('edit-complete', $event)"
      @approval-request="emit('approval-request', $event)"
      @request-cancel="emit('request-cancel', $event)"
      @cancel-done="emit('cancel-done')"
      @temp-save="emit('temp-save-detail', $event)"
      @history="emit('history', $event)"
      @alert="emit('alert', $event)"
    />
  </template>
</template>
