<script setup>
defineProps({
  // member_role: { type: String, default: "" }, // 로그인 연동 시 권한에 따라 노출 제어
  support_plan_title: { type: String, default: "" },
  support_plan_content: { type: String, default: "" },
  support_plan_file: { type: String, default: "" },
  support_plan_reject_comment: { type: String, default: "" },
  plan_result: { type: String, default: "" },
  plan_date: { type: String, default: "" },
});
const emit = defineEmits([
  "history",
  "result",
  "edit",
  "approve",
  "supple",
  "reject",
]);
</script>
<template>
  <div class="support-plan-detail card shadow-sm border-radius-lg mb-4">
    <div class="card-body">
    <p class="text-sm text-body mb-3 opacity-8">
      계획작성일시 | {{ plan_date || "—" }}
    </p>
    <div class="detail-fields mb-4">
      <div class="mb-3">
        <label class="form-label text-sm text-body mb-1">제목</label>
        <input
          type="text"
          class="form-control form-control-sm"
          :value="support_plan_title"
          readonly
          placeholder="지원 계획 제목"
        />
      </div>
      <div class="mb-3">
        <label class="form-label text-sm text-body mb-1">내용</label>
        <textarea
          class="form-control form-control-sm"
          rows="4"
          :value="support_plan_content"
          readonly
          placeholder="계획"
        ></textarea>
      </div>
      <div class="mb-3">
        <label class="form-label text-sm text-body mb-1">첨부</label>
        <div class="form-control form-control-sm bg-light border-0">
          {{ support_plan_file || "첨부파일 없음" }}
        </div>
      </div>
      <div v-if="plan_result === 'e0_99'" class="mb-3">
        <label class="form-label text-sm text-body mb-1">반려</label>
        <textarea
          class="form-control form-control-sm"
          rows="2"
          :value="support_plan_reject_comment"
          readonly
          placeholder="반려사유"
        ></textarea>
      </div>
    </div>
    <div class="actions d-flex flex-wrap gap-2 mb-3">
      <!-- 로그인 연동 시 member_role에 따라 v-if 적용 -->
      <button
        type="button"
        class="btn btn-sm btn-success"
        @click="emit('history')"
      >
        수정이력
      </button>
      <button
        type="button"
        class="btn btn-sm btn-primary"
        @click="emit('result')"
      >
        결과조회
      </button>
      <button
        v-if="plan_result === 'e0_00' || plan_result === 'e0_80'"
        type="button"
        class="btn btn-sm btn-primary"
        @click="emit('edit')"
      >
        수정
      </button>
      <button
        v-if="plan_result === 'e0_00' || plan_result === 'e0_80'"
        type="button"
        class="btn btn-sm btn-success"
        @click="emit('approve')"
      >
        승인
      </button>
      <button
        v-if="plan_result === 'e0_00' || plan_result === 'e0_80'"
        type="button"
        class="btn btn-sm btn-danger"
        @click="emit('reject')"
      >
        반려
      </button>
      <button
        v-if="plan_result === 'e0_00' || plan_result === 'e0_80'"
        type="button"
        class="btn btn-sm btn-outline-secondary"
        @click="emit('supple')"
      >
        보완
      </button>
    </div>
    <div v-if="plan_result === 'e0_10' || plan_result === 'e0_99'" class="text-sm">
      <span class="text-body opacity-8">승인여부:</span>
      <span :class="plan_result === 'e0_10' ? 'text-success fw-bold' : 'text-danger fw-bold'">
        {{ plan_result === 'e0_10' ? '승인' : '반려' }}
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
</style>
