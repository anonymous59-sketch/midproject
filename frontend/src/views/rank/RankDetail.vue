<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  rank_code: { type: String, default: "" },
  rank_cmt: { type: String, default: "" },
  priority: { type: String, default: "" },
  apply_for: { type: String, default: "" },
  s_rank_res: { type: String, default: "" }, // e0_00 검토대기, e0_80 보완, e0_10 승인, e0_99 반려
  req_code: { type: String, default: "" },
});

const emit = defineEmits([
  "update:rank_code",
  "update:rank_cmt",
  "approval-request",
  "cancel",
  "approve",
  "reject",
  "supple",
]);

// 빈 문자열이면 3개 모두 표시, 선택 시 해당 pill만 중앙 표시
const selectedCode = ref(props.rank_code || "");
watch(
  () => props.rank_code,
  (v) => {
    selectedCode.value = v || "";
  },
);

const rankComment = ref(props.rank_cmt || "");
watch(
  () => props.rank_cmt,
  (v) => {
    rankComment.value = v || "";
  },
);
// 보완(e0_80) 시 textarea에 apply_for 채우고 편집 가능
watch(
  () => [props.apply_for, props.s_rank_res],
  () => {
    if (props.s_rank_res === "e0_80") rankComment.value = props.apply_for || "";
  },
  { immediate: true },
);

// 읽기 전용 apply_for: e0_00(검토대기) 또는 승인 후 priority 있음. e0_80(보완)은 편집 가능
const showApplyForReadonly = () =>
  (!!props.priority && props.priority !== "-") || props.s_rank_res === "e0_00";
// e0_80이면 편집 가능하게 rankComment, 아니면 기존 로직
const isSupplementEditable = () => props.s_rank_res === "e0_80";
const textareaValue = () =>
  isSupplementEditable()
    ? rankComment.value
    : showApplyForReadonly()
      ? props.apply_for
      : rankComment.value;
const textareaReadonly = () =>
  isSupplementEditable() ? false : showApplyForReadonly();

const pills = [
  { code: "d0_20", label: "계획", pillClass: "rank-pill-plan" },
  { code: "d0_30", label: "중점", pillClass: "rank-pill-focus" },
  { code: "d0_40", label: "긴급", pillClass: "rank-pill-urgent" },
];

function showPill(p) {
  return selectedCode.value === "" || selectedCode.value === p.code;
}

function selectPill(code) {
  if (selectedCode.value === "") {
    selectedCode.value = code;
    emit("update:rank_code", code);
  } else if (selectedCode.value === code) {
    selectedCode.value = "";
    emit("update:rank_code", "");
  }
}

function onCommentInput() {
  emit("update:rank_cmt", rankComment.value);
}

// 템플릿에서는 ref가 자동 언래핑되어 rankComment가 문자열이므로, ref 갱신은 스크립트 함수에서만 처리
function updateComment(val) {
  rankComment.value = val;
  onCommentInput();
}

// 취소: textarea·우선순위 선택 초기화
function onCancel() {
  selectedCode.value = "";
  rankComment.value = "";
  emit("update:rank_code", "");
  emit("update:rank_cmt", "");
  emit("cancel");
}
</script>

<template>
  <div class="rank-detail">
    <div
      v-if="s_rank_res === 'e0_80'"
      class="rank-detail-block rank-supple-reason mb-3"
    >
      <div class="rank-detail-block-inner py-3 px-3">
        <div class="rank-supple-label text-muted small mb-1">보완 사유</div>
        <div class="rank-supple-text">{{ rank_cmt || "—" }}</div>
      </div>
    </div>
    <!-- 우선순위 선택: 빈 문자열이면 3개 모두, 선택 시 해당 pill만 중앙 정렬 -->
    <div class="rank-detail-block mb-3">
      <div
        class="rank-detail-block-inner py-3 px-3 d-flex align-items-center flex-wrap gap-2"
        :class="
          selectedCode ? 'justify-content-center' : 'justify-content-between'
        "
      >
        <span
          v-for="p in pills"
          v-show="showPill(p)"
          :key="p.code"
          role="button"
          tabindex="0"
          class="rank-pill"
          :class="p.pillClass"
          @click="selectPill(p.code)"
          @keydown.enter="selectPill(p.code)"
        >
          {{ p.label }}
        </span>
      </div>
    </div>
    <!-- 우선순위 선택 사유 + 버튼 (선택된 경우에만 표시) -->
    <div
      v-if="
        selectedCode === 'd0_20' ||
        selectedCode === 'd0_30' ||
        selectedCode === 'd0_40'
      "
      class="rank-detail-block mb-3"
    >
      <textarea
        :value="textareaValue()"
        :readonly="textareaReadonly()"
        class="form-control form-control-sm mb-3 rank-detail-textarea"
        rows="3"
        :placeholder="
          textareaReadonly()
            ? ''
            : '우선순위 선택 사유를 작성해주시기 바랍니다.'
        "
        @input="
          (e) => {
            if (!textareaReadonly()) updateComment(e.target.value);
          }
        "
      />
      <!-- e0_10(승인)·e0_99(반려)면 모든 버튼 숨김 / e0_00이면 승인요청·취소 숨김 / e0_80(보완)이면 승인요청·취소만 표시 -->
      <div
        v-if="s_rank_res !== 'e0_10' && s_rank_res !== 'e0_99'"
        class="d-flex flex-wrap gap-2 justify-content-end"
      >
        <button
          v-if="s_rank_res !== 'e0_00'"
          type="button"
          class="btn btn-sm btn-outline-primary"
          @click="
            emit('approval-request', {
              s_rank_code: selectedCode,
              apply_for: rankComment,
              prev_req_code: s_rank_res === 'e0_80' ? req_code : null,
            })
          "
        >
          승인요청
        </button>
        <button
          v-if="s_rank_res !== 'e0_00'"
          type="button"
          class="btn btn-sm btn-outline-secondary"
          @click="onCancel"
        >
          취소
        </button>
        <button
          v-if="s_rank_res !== 'e0_80'"
          type="button"
          class="btn btn-sm btn-success"
          @click="emit('approve')"
        >
          승인
        </button>
        <button
          v-if="s_rank_res !== 'e0_80'"
          type="button"
          class="btn btn-sm btn-warning"
          @click="emit('supple')"
        >
          보완
        </button>
        <button
          v-if="s_rank_res !== 'e0_80'"
          type="button"
          class="btn btn-sm btn-danger"
          @click="emit('reject')"
        >
          반려
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rank-detail-block {
  border: 1px solid #b8d4e8;
  border-radius: 0.375rem;
  background: #fff;
}
.rank-detail-block-inner {
  min-height: 2.5rem;
}
.rank-supple-reason .rank-supple-label {
  font-weight: 500;
}
.rank-supple-reason .rank-supple-text {
  white-space: pre-wrap;
  word-break: break-word;
  color: #212529;
}
.rank-pill {
  display: inline-block;
  padding: 0.35rem 1rem;
  border-radius: 9999px;
  font-size: 0.9rem;
  color: #fff;
  white-space: nowrap;
}
.rank-pill-plan {
  background-color: #7eb8da;
}
.rank-pill-focus {
  background-color: #2dce89;
}
.rank-pill-urgent {
  background-color: #f5365c;
}
.rank-detail-textarea {
  height: 6rem;
  min-height: 6rem;
  max-height: 6rem;
  resize: none;
}
</style>
