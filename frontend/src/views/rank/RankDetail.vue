<script setup>
defineProps({
  // member_role: { type: String, default: "" }, // 로그인 연동 시 권한에 따라 노출 제어
  // rank_res: { type: String, default: "" },   // s_rank_res(승인판정) 연동 시 사용
  rank_code: { type: String, default: "" },
  rank_cmt: { type: String, default: "" },
  priority: { type: String, default: "" },
});
</script>

<template>
  <div class="rank-detail">
    <div class="rank-detail-block mb-3">
      <!-- s_rank_res(승인판정) 연동 시 rank_res === 'd0_80' 일 때 보완 사유 출력 -->
      <div
        v-if="rank_res === 'd0_80'"
        class="rank-detail-block-inner py-3 px-3 text-center"
      >
        {{ rank_cmt }}
      </div>
    </div>
    <!-- 우선순위 선택공간. 우선순위코드(rank_code)가 계획(d0_20), 중점(d0_30), 긴급(d0_40) 중 하나 선택가능. 하나를 선택하면 나머지 비활성화가 되며, 선택을 취소하면 다시 3개를 보여줌 -->
    <div class="rank-detail-block mb-3">
      <div
        class="rank-detail-block-inner py-3 px-3 d-flex justify-content-between align-items-center flex-wrap gap-2"
      >
        <span
          v-if="priority === 'd0_20' || priority === ''"
          class="rank-pill rank-pill-plan"
          rank-code="d0_20"
          >계획</span
        >
        <span
          v-if="priority === 'd0_30' || priority === ''"
          class="rank-pill rank-pill-focus"
          rank-code="d0_30"
          >중점</span
        >
        <span
          v-if="priority === 'd0_40' || priority === ''"
          class="rank-pill rank-pill-urgent"
          rank-code="d0_40"
          >긴급</span
        >
      </div>
    </div>
    <!-- 기관담당자가 우선순위 선택 후 사유 입력. 로그인 연동 시 member_role === 'a0_30' 조건 추가 -->
    <div
      v-if="
        rank_code === 'd0_20' || rank_code === 'd0_30' || rank_code === 'd0_40'
      "
      class="rank-detail-block"
    >
      <textarea
        class="form-control form-control-sm"
        rows="3"
        placeholder="우선순위 선택 사유를 작성해주시기 바랍니다."
        required="required"
      ></textarea>
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
</style>
