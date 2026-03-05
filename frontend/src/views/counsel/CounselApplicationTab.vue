<!-- 지원신청서 탭 (조사지 응답) -->
<script setup>
function formatDate(val) {
  if (!val) return "";
  const d = new Date(val);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

defineProps({
  support: { type: Object, default: null },
  surveyAnswersGrouped: { type: Array, default: () => [] },
  surveyAnswersLoading: { type: Boolean, default: false },
  surveyAnswersError: { type: String, default: null },
  applicationEditMode: { type: Boolean, default: false },
  applicationSaveLoading: { type: Boolean, default: false },
  isApplicant: { type: Boolean, default: false },
});

const emit = defineEmits(["start-edit", "save", "cancel"]);
</script>

<template>
  <div class="d-flex align-items-center justify-content-between mb-3">
    <h6 class="text-sm text-uppercase text-muted mb-0">
      지원신청서 (조사지 응답)
    </h6>
    <span v-if="support?.sup_day" class="text-muted text-sm">
      작성일 {{ formatDate(support.sup_day) }}
    </span>
  </div>
  <p v-if="surveyAnswersLoading" class="text-muted text-sm mb-0">
    로딩 중...
  </p>
  <p v-else-if="surveyAnswersError" class="text-danger text-sm mb-0">
    {{ surveyAnswersError }}
  </p>
  <div
    v-else-if="surveyAnswersGrouped.length === 0"
    class="text-muted text-sm mb-0"
  >
    등록된 조사지 답변이 없습니다.
  </div>
  <div v-else class="counsel-survey-list">
    <template v-for="(majorGrp, mIdx) in surveyAnswersGrouped" :key="mIdx">
      <div class="mb-3">
        <div class="text-dark fw-semibold text-sm mb-2">
          {{ majorGrp.major_name }}
        </div>
        <template v-for="(subGrp, sIdx) in majorGrp.subs" :key="sIdx">
          <div class="ms-2 mb-2">
            <div class="text-muted text-xs fw-medium mb-1">
              {{ subGrp.sub_name }}
            </div>
            <div
              v-for="(row, rIdx) in subGrp.items"
              :key="row.a_code || rIdx"
              class="border-bottom border-light pb-2 mb-2 counsel-survey-item ms-2"
            >
              <div class="text-muted text-xs mb-1">{{ row.q_no }}.</div>
              <div class="fw-semibold text-sm mb-1">{{ row.q_content }}</div>
              <div v-if="!applicationEditMode" class="text-sm">
                {{ row.a_content }}
              </div>
              <template v-else>
                <textarea
                  v-if="row.q_type === 'f0_00'"
                  v-model="row.a_content"
                  class="form-control form-control-sm mt-1"
                  rows="3"
                  placeholder="답변 입력"
                />
                <div
                  v-else-if="row.q_type === 'f0_10'"
                  class="mt-1 d-flex align-items-center gap-3"
                >
                  <label class="mb-0 d-flex align-items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      :checked="row.a_content === 'Y'"
                      @change="
                        row.a_content = $event.target.checked ? 'Y' : 'N'
                      "
                    />
                    예
                  </label>
                  <span class="text-muted text-sm">(미체크 시 아니오)</span>
                </div>
                <div
                  v-else-if="row.q_type === 'f0_20'"
                  class="mt-1 d-flex align-items-center gap-3"
                >
                  <label class="mb-0 d-flex align-items-center gap-1 text-sm">
                    <input
                      type="radio"
                      :name="row.a_code"
                      value="Y"
                      v-model="row.a_content"
                    />
                    예
                  </label>
                  <label class="mb-0 d-flex align-items-center gap-1 text-sm">
                    <input
                      type="radio"
                      :name="row.a_code"
                      value="N"
                      v-model="row.a_content"
                    />
                    아니오
                  </label>
                </div>
                <input
                  v-else
                  v-model="row.a_content"
                  type="text"
                  class="form-control form-control-sm mt-1"
                  placeholder="답변 입력"
                />
              </template>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
  <div
    class="mt-3 pt-2 border-top d-flex align-items-center justify-content-end flex-wrap gap-2"
  >
    <div v-if="!applicationEditMode && isApplicant" class="d-flex gap-2">
      <button
        type="button"
        class="btn btn-sm btn-outline-primary"
        @click="emit('start-edit')"
      >
        수정하기
      </button>
    </div>
    <div v-else-if="applicationEditMode && isApplicant" class="d-flex gap-2">
      <button
        type="button"
        class="btn btn-sm btn-primary"
        :disabled="applicationSaveLoading"
        @click="emit('save')"
      >
        {{ applicationSaveLoading ? "저장 중..." : "저장" }}
      </button>
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        :disabled="applicationSaveLoading"
        @click="emit('cancel')"
      >
        취소
      </button>
    </div>
  </div>
</template>

<style scoped>
.counsel-survey-list .counsel-survey-item:last-child {
  border-bottom: none !important;
}
</style>
