<script setup>
import SupportPlanHeader from "./support/SupportPlanHeader.vue";
import SupportPlanDetail from "./support/SupportPlanDetail.vue";
import { onBeforeMount } from "vue";
import { useRoute } from "vue-router";
import { useSupportStore } from "../store/support.js";
import { storeToRefs } from "pinia";

const route = useRoute();
const supportCode = route.params.supportCode;
const supportStore = useSupportStore();
const { detail, infoData } = storeToRefs(supportStore);
const { supportPlanDetail } = supportStore;

onBeforeMount(() => {
  supportPlanDetail(supportCode);
});

function updHistory() {
  console.log("수정이력");
}
function result() {
  console.log("결과조회");
}
function edit() {
  console.log("수정");
}
function approve() {
  console.log("승인");
}
function supple() {
  console.log("보완");
}
function reject() {
  console.log("반려");
}
</script>
<template>
  <div class="container-fluid py-4">
    <h5 class="mb-3">지원계획</h5>
    <SupportPlanHeader
      :target_name="infoData?.target_name ?? ''"
      :member_name="infoData?.member_name ?? ''"
      :manager_name="infoData?.manager_name ?? ''"
      :priority="infoData?.priority ?? ''"
      :write_date="infoData?.write_date ?? ''"
      :disability_type="infoData?.disability_type ?? ''"
    />
    <SupportPlanDetail
      v-for="item in detail ?? []"
      :key="item.plan_code"
      :support_plan_title="item.plan_goal"
      :support_plan_content="item.plan_content"
      :support_plan_file="item.origin_file_name"
      :support_plan_reject_comment="item.plan_rej_cmt"
      :plan_date="item.plan_date"
      @history="updHistory"
      @result="result"
      @edit="edit"
      @approve="approve"
      @supple="supple"
      @reject="reject"
      :plan_result="item.plan_tf"
    />
  </div>
</template>
<style scoped></style>
