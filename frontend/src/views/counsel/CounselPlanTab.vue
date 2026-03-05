<!-- 지원계획 탭 -->
<script setup>
import { ref, reactive, watch } from "vue";
import SupportPlanDetail from "@/views/support/SupportPlanDetail.vue";

const addPlanFileInputRef = ref(null);

const props = defineProps({
  showAddPlanForm: { type: Boolean, default: false },
  addPlanForm: { type: Object, default: () => ({}) },
  addPlanFileNames: { type: String, default: "" },
  planLoading: { type: Boolean, default: false },
  planData: { type: Array, default: () => [] },
  cancelRequestPlanCode: { type: [String, Number], default: null },
});

const form = reactive({
  title: "",
  content: "",
  startDate: "",
  endDate: "",
});

const emit = defineEmits([
  "update:addPlanForm",
  "set-plan-detail-ref",
  "toggle-add",
  "load-temp",
  "temp-save",
  "plan-file-change",
  "open-file-dialog",
  "approval-request-add",
  "cancel-add",
  "result",
  "open-supple-history",
  "approve",
  "supple",
  "reject",
  "edit-complete",
  "approval-request",
  "request-cancel",
  "cancel-done",
  "end",
  "temp-save-detail",
  "history",
  "alert",
]);

watch(
  () => props.addPlanForm,
  (val) => {
    if (val) {
      form.title = val.title ?? "";
      form.content = val.content ?? "";
      form.startDate = val.startDate ?? "";
      form.endDate = val.endDate ?? "";
    }
  },
  { immediate: true, deep: true }
);

watch(
  form,
  () => {
    emit("update:addPlanForm", { ...form });
  },
  { deep: true }
);

function setPlanDetailRef(planCode, el) {
  emit("set-plan-detail-ref", planCode, el);
}

function openFileDialog() {
  addPlanFileInputRef.value?.click();
}

function clearFileInput() {
  if (addPlanFileInputRef.value) addPlanFileInputRef.value.value = "";
}

defineExpose({
  openFileDialog,
  clearFileInput,
});
</script>

<template>
  <div class="d-flex align-items-center justify-content-between mb-3">
    <h6 class="text-sm text-uppercase text-muted mb-0">지원계획</h6>
    <button
      type="button"
      class="btn btn-sm btn-outline-primary"
      @click="emit('toggle-add')"
    >
      계획추가
    </button>
  </div>
  <!-- 계획 추가 폼 -->
  <div v-if="showAddPlanForm" class="card shadow-sm border-radius-lg mb-4">
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
          placeholder="지원 계획 제목"
        />
      </div>
      <div class="mb-3">
        <label class="form-label text-sm text-body mb-1">내용</label>
        <textarea
          v-model="form.content"
          class="form-control form-control-sm"
          placeholder="계획"
          rows="3"
        />
      </div>
      <div class="mb-3">
        <label class="form-label text-sm text-body mb-1">지원기간</label>
        <div class="d-flex align-items-center flex-wrap gap-2">
          <input
            v-model="form.startDate"
            type="date"
            class="form-control form-control-sm"
            style="max-width: 11rem"
          />
          <span class="text-body">~</span>
          <input
            v-model="form.endDate"
            type="date"
            class="form-control form-control-sm"
            style="max-width: 11rem"
          />
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label text-sm text-body mb-1">첨부파일</label>
        <input
          ref="addPlanFileInputRef"
          type="file"
          class="d-none"
          multiple
          @change="emit('plan-file-change', $event)"
        />
        <button
          type="button"
          class="form-control form-control-sm text-start bg-white"
          @click="emit('open-file-dialog')"
        >
          <span v-if="addPlanFileNames">{{ addPlanFileNames }}</span>
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
  <div v-if="planLoading" class="text-muted text-sm">로딩 중...</div>
  <div v-else-if="planData.length === 0" class="text-muted text-sm">
    등록된 지원계획이 없습니다.
  </div>
  <template v-else>
    <SupportPlanDetail
      v-for="plan in planData"
      :key="plan.plan_code"
      :ref="(el) => setPlanDetailRef(plan.plan_code, el)"
      :plan_code="plan.plan_code"
      :support_plan_title="plan.plan_goal"
      :support_plan_content="plan.plan_content"
      :start_time="plan.start_time"
      :end_time="plan.end_time"
      :support_plan_file="plan.origin_file_name"
      :file_code="plan.file_code"
      :plan_result="plan.plan_tf"
      :plan_date="plan.plan_date"
      :support_plan_comment="plan.plan_cmt"
      :support_plan_reject_comment="plan.plan_cmt"
      :support_plan_updday="plan.plan_updday"
      :cancel-request="cancelRequestPlanCode"
      :has_supple="!!(plan.plan_tf === 'e0_80' || plan.prev_plan_code)"
      @result="emit('result', $event)"
      @open-supple-history="emit('open-supple-history', plan.plan_code)"
      @approve="emit('approve', $event)"
      @supple="emit('supple', $event)"
      @reject="emit('reject', $event)"
      @edit-complete="emit('edit-complete', $event)"
      @approval-request="emit('approval-request', $event)"
      @request-cancel="emit('request-cancel', $event)"
      @cancel-done="emit('cancel-done')"
      @end="emit('end', $event)"
      @temp-save="emit('temp-save-detail', $event)"
      @history="emit('history', $event)"
      @alert="emit('alert', $event)"
    />
  </template>
</template>
