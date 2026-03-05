<!-- 우선순위 탭 -->
<script setup>
import RankDetail from "@/views/rank/RankDetail.vue";

defineProps({
  rankData: { type: Object, default: null },
  rankLoading: { type: Boolean, default: false },
  rankCodeLocal: { type: String, default: "" },
  rankCmtLocal: { type: String, default: "" },
  rankHasSupple: { type: Boolean, default: false },
});

const emit = defineEmits([
  "refresh",
  "update:rankCodeLocal",
  "update:rankCmtLocal",
  "approval-request",
  "approve",
  "reject",
  "supple",
  "cancel",
  "open-supple-history",
]);
</script>

<template>
  <div class="d-flex align-items-center justify-content-between mb-3">
    <h6 class="text-sm text-uppercase text-muted mb-0">우선순위</h6>
    <button
      type="button"
      class="btn btn-sm btn-outline-secondary"
      @click="emit('refresh')"
    >
      새로고침
    </button>
  </div>
  <p v-if="rankLoading" class="text-muted text-sm mb-0">로딩 중...</p>
  <p v-else-if="!rankData" class="text-muted text-sm mb-0">
    우선순위 정보가 없습니다.
  </p>
  <RankDetail
    v-else
    :rank_code="rankCodeLocal"
    :rank_cmt="rankCmtLocal"
    :priority="rankData.priority ?? ''"
    :apply_for="rankData.apply_for ?? ''"
    :s_rank_res="rankData.s_rank_res ?? ''"
    :req_code="rankData.req_code ?? ''"
    :has_supple="rankHasSupple"
    @update:rank_code="(v) => emit('update:rankCodeLocal', v)"
    @update:rank_cmt="(v) => emit('update:rankCmtLocal', v)"
    @approval-request="emit('approval-request', $event)"
    @approve="emit('approve')"
    @reject="emit('reject')"
    @supple="emit('supple')"
    @cancel="emit('cancel')"
    @open-supple-history="emit('open-supple-history')"
  />
</template>
