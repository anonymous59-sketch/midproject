<script setup>
import RankHeader from "./rank/RankHeader.vue";
import RankDetail from "./rank/RankDetail.vue";
import { onBeforeMount } from "vue";
import { useRoute } from "vue-router";
import { useRankStore } from "../store/rank.js";
import { storeToRefs } from "pinia";

const route = useRoute();
const supCode = route.params.supCode;
const rankStore = useRankStore();
const { rankInfo } = storeToRefs(rankStore);
const { getRankInfo } = rankStore;

onBeforeMount(() => {
  if (supCode) getRankInfo(supCode);
});

// 헤더/디테일에 넘길 데이터 (API data 필드명 그대로 사용)
const infoData = rankInfo;
</script>
<template>
  <div class="container-fluid py-4">
    <h5 class="mb-3">우선순위</h5>
    <RankHeader
      :target_name="infoData?.target_name ?? ''"
      :member_name="infoData?.member_name ?? ''"
      :manager_name="infoData?.manager_name ?? ''"
      :write_date="infoData?.write_date ?? ''"
      :disability_type="infoData?.disability_type ?? ''"
    />
    <RankDetail />
  </div>
</template>
<style></style>
