<!-- 신청접수 탭 (기관담당자용) -->
<script setup>
import ArgonButton from "@/components/ArgonButton.vue";

defineProps({
  hasCounsel: { type: Boolean, default: false },
  support: { type: Object, default: null },
  counselList: { type: Array, default: () => [] },
});

const emit = defineEmits(["accept", "reject"]);
</script>

<template>
  <div class="d-flex align-items-center justify-content-between mb-3">
    <h6 class="text-sm text-uppercase text-muted mb-0">신청수리</h6>
    <span class="text-sm text-muted">
      상담일지 {{ counselList.length }}건 /
      현재 상태:
      {{ support?.req_name || support?.req_yn || "-" }}
    </span>
  </div>
  <p v-if="!hasCounsel" class="text-muted text-sm mb-0">
    상담일지가 한 건 이상 존재할 때 신청수리를 진행할 수 있습니다.
  </p>
  <div v-else class="text-sm">
    <p class="text-muted">
      상담내역을 검토한 뒤, 이 신청을 접수하거나 반려할 수 있습니다.
    </p>
    <div class="d-flex gap-2 mt-3">
      <ArgonButton type="button" size="sm" color="success" @click="emit('accept')">
        신청 접수
      </ArgonButton>
      <ArgonButton type="button" size="sm" variant="outline" color="danger" @click="emit('reject')">
        신청 반려
      </ArgonButton>
    </div>
  </div>
</template>
