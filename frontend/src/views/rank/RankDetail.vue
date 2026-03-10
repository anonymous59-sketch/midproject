<script setup>
/**
 * 우선순위 한 건 상세 카드.
 * 계획/중점/긴급 pill 선택, 신청 사유 입력, 승인요청/승인/보완/반려 버튼을 제공하며, 상태(e0_00/e0_80 등)에 따라 읽기 전용·편집 가능을 구분한다.
 * - 권한: 기관관리자(a0_40)만 승인/보완/반려 버튼 노출. 승인요청/취소는 담당자도 사용.
 */
import { ref, watch, computed } from "vue";
import { useAuthStore } from "@/store/auth";
import ArgonButton from "@/components/ArgonButton.vue";

// ========== auth (버튼 노출 권한) ==========
const authStore = useAuthStore();
/** 기관관리자(a0_40)일 때만 true. 승인/보완/반려는 기관관리자만 노출 */
const canManageRank = computed(() => authStore.user?.m_auth === "a0_40");
/** 접속한 사람 권한 a0_30 (기관담당자) */
const isManagerRole = computed(() => authStore.user?.m_auth === "a0_30");
const suppleEditMode = ref(false);
/** 보완/반려 사유(관리자 피드백) 고정 표시용 - 신청사유 수정해도 안 바뀜 */
const feedbackReasonFixed = ref("");
/** 보완하기 클릭(suppleEditMode) 시 편집 가능. a0_30 + 보완(e0_80): 클릭 전까지 readonly, 클릭 후 편집. 그 외는 readOnly 그대로 */
const effectiveReadOnly = computed(() => {
  if (suppleEditMode.value) return false;
  if (props.s_rank_res === "e0_80" && isManagerRole.value)
    return !suppleEditMode.value;
  return props.readOnly;
});
// ========== 변수 ==========
const props = defineProps({
  /** 지원자(a0_20) 등 읽기 전용: 선택/승인요청/보완이력 등 버튼 숨김 */
  readOnly: { type: Boolean, default: false },
  rank_code: { type: String, default: "" }, // 우선순위 코드 (d0_20/d0_30/d0_40)
  rank_cmt: { type: String, default: "" },
  priority: { type: String, default: "" },
  apply_for: { type: String, default: "" },
  s_rank_res: { type: String, default: "" }, // e0_00 검토대기, e0_80 보완, e0_10 승인, e0_99 반려
  req_code: { type: String, default: "" },
  has_supple: { type: Boolean, default: false }, // 한 번이라도 보완 판정 있으면 true
});

const emit = defineEmits([
  "update:rank_code",
  "update:rank_cmt",
  "approval-request",
  "cancel",
  "approve",
  "reject",
  "supple",
  "open-supple-history",
]);

// 빈 문자열이면 3개 pill 모두 표시, 선택 시 해당 pill만 중앙 표시
const selectedCode = ref(props.rank_code || "");
watch(
  () => props.rank_code,
  (v) => {
    selectedCode.value = v || "";
  },
);

const rankComment = ref(props.rank_cmt || ""); // 신청 사유(또는 보완 사유) 입력값
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
// 보완판정이 아니면 편집 모드 해제
watch(
  () => props.s_rank_res,
  (v) => {
    if (v !== "e0_80") suppleEditMode.value = false;
  },
);
// 보완/반려(e0_80, e0_99)로 진입할 때만 보완사유 고정 저장 (이후 신청사유 수정해도 표시값 유지)
watch(
  () => props.s_rank_res,
  (res, prev) => {
    const isFeedbackState = res === "e0_80" || res === "e0_99";
    const enteredFeedbackState =
      isFeedbackState &&
      (prev === undefined || (prev !== "e0_80" && prev !== "e0_99"));
    if (enteredFeedbackState && (props.rank_cmt || "").trim())
      feedbackReasonFixed.value = (props.rank_cmt || "").trim();
  },
  { immediate: true },
);

// 읽기 전용: e0_00(검토대기) 또는 승인 후 priority 있음. e0_80(보완)은 편집 가능
const showApplyForReadonly = () =>
  (props.priority && props.priority !== "-") || props.s_rank_res === "e0_00";
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
  // 계획/중점/긴급 pill 정의
  { code: "d0_20", label: "계획", pillClass: "rank-pill-plan" },
  { code: "d0_30", label: "중점", pillClass: "rank-pill-focus" },
  { code: "d0_40", label: "긴급", pillClass: "rank-pill-urgent" },
];

// ========== 함수 ==========
/** 해당 pill을 표시할지 여부 (전체 선택 시 모두, 선택 후에는 해당만) */
function showPill(p) {
  return selectedCode.value === "" || selectedCode.value === p.code;
}

/** pill 클릭 시 선택/해제 토글 후 update:rank_code 발생 */
function selectPill(code) {
  if (selectedCode.value === "") {
    selectedCode.value = code;
    emit("update:rank_code", code);
  } else if (selectedCode.value === code) {
    selectedCode.value = "";
    emit("update:rank_code", "");
  }
}

/** 신청 사유 변경 시 부모에 전달 */
function onCommentInput() {
  emit("update:rank_cmt", rankComment.value);
}

/** textarea 입력값 갱신 후 부모에 전달 */
function updateComment(val) {
  rankComment.value = val;
  onCommentInput();
}

/** 보완하기 클릭: 버튼 숨기고 textarea 편집 가능 */
function onSuppleClick() {
  suppleEditMode.value = true;
}

/** 취소: suppleEditMode면 편집만 해제, 아니면 초기화 후 cancel 이벤트 */
function onCancel() {
  if (suppleEditMode.value) {
    suppleEditMode.value = false;
    return;
  }
  selectedCode.value = "";
  rankComment.value = "";
  emit("update:rank_code", "");
  emit("update:rank_cmt", "");
  emit("cancel");
}
</script>

<template>
  <div class="rank-detail">
    <!-- 우선순위: e0_99 반려 시 미표시, e0_10 승인 시 선택값만 읽기 전용, e0_00/e0_80 검토·보완 시 선택 가능 -->
    <div v-if="s_rank_res !== 'e0_99'" class="rank-detail-block mb-3">
      <div
        class="rank-detail-block-inner py-3 px-3 d-flex align-items-center flex-wrap gap-2"
        :class="
          selectedCode ? 'justify-content-center' : 'justify-content-between'
        "
      >
        <!-- e0_10 승인: 선택된 pill만 표시, 클릭 불가 -->
        <span
          v-for="p in pills"
          v-show="s_rank_res === 'e0_10' && p.code === selectedCode"
          :key="'ro-' + p.code"
          class="rank-pill rank-pill-readonly"
          :class="p.pillClass"
        >
          {{ p.label }}
        </span>
        <span
          v-for="p in pills"
          v-show="
            s_rank_res !== 'e0_10' && s_rank_res !== 'e0_99' && showPill(p)
          "
          :key="p.code"
          :role="readOnly ? undefined : 'button'"
          :tabindex="readOnly ? undefined : 0"
          class="rank-pill"
          :class="[p.pillClass, readOnly ? 'rank-pill-readonly' : '']"
          @click="!readOnly && selectPill(p.code)"
          @keydown.enter="!readOnly && selectPill(p.code)"
        >
          {{ p.label }}
        </span>
      </div>
    </div>
    <!-- 우선순위 선택 사유 + 보완/반려 사유 + 버튼 -->
    <div
      v-if="
        selectedCode === 'd0_20' ||
        selectedCode === 'd0_30' ||
        selectedCode === 'd0_40' ||
        s_rank_res === 'e0_80' ||
        s_rank_res === 'e0_99'
      "
      class="rank-detail-block mb-3"
    >
      <textarea
        v-if="
          selectedCode === 'd0_20' ||
          selectedCode === 'd0_30' ||
          selectedCode === 'd0_40' ||
          s_rank_res === 'e0_80' ||
          s_rank_res === 'e0_10' ||
          s_rank_res === 'e0_99'
        "
        :value="textareaValue()"
        :readonly="
          suppleEditMode ? false : effectiveReadOnly ? true : textareaReadonly()
        "
        class="form-control form-control-sm mb-3 rank-detail-textarea"
        rows="3"
        :placeholder="
          (
            suppleEditMode
              ? false
              : effectiveReadOnly
                ? true
                : textareaReadonly()
          )
            ? ''
            : '우선순위 선택 사유를 작성해주시기 바랍니다.'
        "
        @input="
          (e) => {
            if (suppleEditMode || (!effectiveReadOnly && !textareaReadonly()))
              updateComment(e.target.value);
          }
        "
      />
      <!-- 보완/반려 사유 고정 표시 (신청사유 수정해도 변경 안 됨) -->
      <div
        v-if="
          (s_rank_res === 'e0_80' || s_rank_res === 'e0_99') &&
          (feedbackReasonFixed || '').trim()
        "
        class="rank-detail-block rank-feedback-reason mb-3"
      >
        <div class="rank-detail-block-inner py-2 px-3">
          <div class="rank-feedback-label text-muted small mb-1">
            {{ s_rank_res === "e0_80" ? "보완" : "반려" }}
          </div>
          <div class="rank-feedback-text">{{ feedbackReasonFixed }}</div>
        </div>
      </div>
      <!-- 버튼 영역: 승인요청/취소 또는 승인/보완/반려 (보완·반려 사유가 있어도 노출. 노출 여부는 readOnly만 사용) -->
      <div
        v-if="s_rank_res !== 'e0_10' && s_rank_res !== 'e0_99' && !readOnly"
        class="d-flex flex-wrap gap-2"
        :class="has_supple ? 'justify-content-between' : 'justify-content-end'"
      >
        <!-- 좌측: 보완이력만 -->
        <ArgonButton
          v-if="has_supple"
          type="button"
          size="sm"
          variant="outline"
          color="secondary"
          class="btn-outline-purple"
          @click="emit('open-supple-history')"
        >
          보완이력
        </ArgonButton>

        <!-- 우측: 보완하기 + 승인요청/취소 또는 승인/보완/반려 -->
        <div class="d-flex flex-wrap gap-2">
          <!-- e0_80(보완)일 때만 보완하기 -->
          <ArgonButton
            v-if="has_supple && s_rank_res === 'e0_80' && !suppleEditMode"
            type="button"
            size="sm"
            variant="outline"
            color="primary"
            @click="onSuppleClick"
          >
            보완하기
          </ArgonButton>
          <!-- e0_80 readonly일 땐 보이지 않음. 보완하기 클릭(suppleEditMode) 후에만 재승인요청·취소 노출 -->
          <template v-if="s_rank_res !== 'e0_00' && (s_rank_res !== 'e0_80' || suppleEditMode)">
            <ArgonButton
              type="button"
              size="sm"
              variant="outline"
              color="primary"
              @click="
                emit('approval-request', {
                  s_rank_code: selectedCode,
                  apply_for: rankComment,
                  prev_req_code: s_rank_res === 'e0_80' ? req_code : null,
                })
              "
            >
              {{ s_rank_res === "e0_80" ? "재승인요청" : "승인요청" }}
            </ArgonButton>
            <ArgonButton
              type="button"
              size="sm"
              variant="outline"
              color="secondary"
              @click="onCancel"
            >
              취소
            </ArgonButton>
          </template>

          <!-- 승인요청 상태(e0_00): 승인 / 보완 / 반려만 활성 (기관관리자 전용) -->
          <ArgonButton
            v-if="canManageRank && s_rank_res === 'e0_00'"
            type="button"
            size="sm"
            color="success"
            @click="emit('approve')"
          >
            승인
          </ArgonButton>
          <ArgonButton
            v-if="canManageRank && s_rank_res === 'e0_00'"
            type="button"
            size="sm"
            color="warning"
            @click="emit('supple')"
          >
            보완
          </ArgonButton>
          <ArgonButton
            v-if="canManageRank && s_rank_res === 'e0_00'"
            type="button"
            size="sm"
            color="danger"
            @click="emit('reject')"
          >
            반려
          </ArgonButton>
        </div>
      </div>

      <!-- 승인(e0_10) / 반려(e0_99) 상태: 보완이력만 (종결, 보완하기 없음) -->
      <div
        v-else-if="!readOnly && has_supple"
        class="d-flex flex-wrap gap-2 justify-content-start mt-2"
      >
        <ArgonButton
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
.rank-supple-reason .rank-supple-label,
.rank-feedback-reason .rank-feedback-label {
  font-weight: 500;
}
.rank-supple-reason .rank-supple-text,
.rank-feedback-reason .rank-feedback-text {
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
.rank-pill-readonly {
  cursor: default;
  pointer-events: none;
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
</style>
