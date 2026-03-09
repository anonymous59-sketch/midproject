<!-- 지원신청서 탭 (조사지 응답): /apply 조사지 화면과 동일 레이아웃, readonly + 지원자 선택값 표시 -->
<script setup>
import ArgonButton from "@/components/ArgonButton.vue";
import ArgonInput from "@/components/ArgonInput.vue";

function formatDate(val) {
  if (!val) return "";
  const d = new Date(val);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/** 체크박스 문항: a_content(쉼표 구분)에서 선택된 q_view_code 목록 */
function selectedViewCodes(row) {
  const s = (row.a_content || "").trim();
  if (!s) return [];
  return s.split(",").map((v) => v.trim()).filter(Boolean);
}

/** 체크박스 옵션 토글 시 a_content 갱신 (수정 모드용) */
function toggleCheckbox(row, qViewCode) {
  const set = new Set(selectedViewCodes(row));
  if (set.has(qViewCode)) set.delete(qViewCode);
  else set.add(qViewCode);
  row.a_content = Array.from(set).join(",");
}

/** 라디오 보기 없을 때 예/아니오 (ApplyPage getRadioOptions와 동일) */
const defaultRadioOptions = [
  { q_view_code: "Y", q_view_content: "예" },
  { q_view_code: "N", q_view_content: "아니오" },
];
function getRadioOptions(row) {
  if (row.views && row.views.length) return row.views;
  return defaultRadioOptions;
}

defineProps({
  support: { type: Object, default: null },
  surveyName: { type: String, default: "" },
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
  <!-- 헤더: ApplyPage와 유사 (제목 + 작성일) -->
  <div class="counsel-section-header d-flex align-items-center justify-content-between mb-3">
    <h6 class="counsel-section-title text-sm text-uppercase text-muted mb-0">
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
  <template v-else-if="surveyAnswersGrouped.length === 0">
    <div class="text-muted text-sm mb-0">
      등록된 조사지 답변이 없습니다.
    </div>
  </template>

  <!-- ApplyPage와 동일: 조사지(readonly) + 전체 질문 스크롤 영역 -->
  <template v-else>
    <div class="mb-3" style="max-width: 420px">
      <label class="form-label text-sm">조사지</label>
      <input
        type="text"
        class="form-control form-control-sm bg-light"
        :value="surveyName"
        readonly
      />
    </div>

    <div
      class="survey-questions-scroll border rounded p-3 bg-light counsel-survey-list"
      style="max-height: 60vh; overflow-y: auto"
    >
      <template v-for="(majorGrp, mIdx) in surveyAnswersGrouped" :key="mIdx">
        <div class="mb-4">
          <div class="text-dark fw-semibold text-sm mb-2">
            {{ majorGrp.major_name }}
          </div>
          <template v-for="(subGrp, sIdx) in majorGrp.subs" :key="sIdx">
            <div class="ms-2 mb-3">
              <div class="text-muted text-xs fw-medium mb-2">
                {{ subGrp.sub_name }}
              </div>
              <div
                v-for="(row, rIdx) in subGrp.items"
                :key="row.q_code || row.a_code || rIdx"
                class="py-2 border-bottom border-light counsel-survey-item"
              >
                <div class="d-flex align-items-start gap-2 mb-2">
                  <span class="text-muted text-sm" style="min-width: 20px">
                    {{ row.q_no }}.
                  </span>
                  <span class="text-sm">{{ row.q_content }}</span>
                </div>

                <!-- 텍스트(텍스트에어리어): ApplyPage와 동일, 기본 readonly / 수정 시 편집 가능 -->
                <div v-if="row.q_type === 'f0_00'" class="ms-4 mb-0">
                  <textarea
                    v-if="!applicationEditMode"
                    class="form-control form-control-sm"
                    rows="3"
                    placeholder="내용을 입력하세요."
                    :value="row.a_content"
                    readonly
                    disabled
                  />
                  <textarea
                    v-else
                    v-model="row.a_content"
                    class="form-control form-control-sm"
                    rows="3"
                    placeholder="내용을 입력하세요."
                  />
                </div>

                <!-- 체크박스: ApplyPage와 동일, readonly로 선택된 항목 표시 / 수정 시 편집 가능 -->
                <div
                  v-else-if="row.q_type === 'f0_10' && (row.views && row.views.length)"
                  class="ms-4 d-flex flex-wrap gap-3"
                >
                  <label
                    v-for="opt in row.views"
                    :key="opt.q_view_code"
                    class="mb-0 d-flex align-items-center gap-1 text-sm"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedViewCodes(row).includes(opt.q_view_code)"
                      :disabled="!applicationEditMode"
                      @change="applicationEditMode && toggleCheckbox(row, opt.q_view_code)"
                    />
                    {{ opt.q_view_content }}
                  </label>
                </div>
                <div
                  v-else-if="row.q_type === 'f0_10'"
                  class="ms-4 text-muted text-sm"
                >
                  (보기 없음)
                </div>

                <!-- 라디오: ApplyPage와 동일, readonly / 수정 시 편집 가능 -->
                <div
                  v-else-if="row.q_type === 'f0_20'"
                  class="ms-4 d-flex flex-wrap gap-3"
                >
                  <label
                    v-for="opt in getRadioOptions(row)"
                    :key="opt.q_view_code"
                    class="mb-0 d-flex align-items-center gap-1 text-sm"
                  >
                    <input
                      type="radio"
                      :name="'ro-' + (row.a_code || row.q_code)"
                      :value="opt.q_view_code"
                      :checked="row.a_content === opt.q_view_code"
                      :disabled="!applicationEditMode"
                      @change="applicationEditMode && (row.a_content = opt.q_view_code)"
                    />
                    {{ opt.q_view_content }}
                  </label>
                </div>

                <!-- 기타 -->
                <div v-else class="ms-4 mb-0">
                  <input
                    v-if="!applicationEditMode"
                    type="text"
                    class="form-control form-control-sm bg-light"
                    :value="row.a_content"
                    readonly
                    disabled
                  />
                  <ArgonInput
                    v-else
                    v-model="row.a_content"
                    type="text"
                    size="sm"
                    class="mb-0"
                    placeholder="답변 입력"
                  />
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>

    <!-- 수정하기/저장/취소 버튼: 지원자이며 req_yn이 e0_00(검토)일 때만 수정하기 노출 -->
    <div class="mt-3 pt-2 border-top d-flex align-items-center justify-content-end flex-wrap gap-2">
      <div v-if="!applicationEditMode && isApplicant && support?.req_yn === 'e0_00'" class="d-flex gap-2">
        <ArgonButton type="button" size="sm" variant="outline" color="primary" @click="emit('start-edit')">
          수정하기
        </ArgonButton>
      </div>
      <div v-else-if="applicationEditMode && isApplicant" class="d-flex gap-2">
        <ArgonButton
          type="button"
          size="sm"
          color="primary"
          :disabled="applicationSaveLoading"
          @click="emit('save')"
        >
          {{ applicationSaveLoading ? "저장 중..." : "저장" }}
        </ArgonButton>
        <ArgonButton
          type="button"
          size="sm"
          variant="outline"
          color="secondary"
          :disabled="applicationSaveLoading"
          @click="emit('cancel')"
        >
          취소
        </ArgonButton>
      </div>
    </div>
  </template>
</template>

<style scoped>
.counsel-survey-list .counsel-survey-item:last-child {
  border-bottom: none !important;
}
textarea {
  resize: none;
}
</style>
