<script setup>
// SupportResult Import
import SupportResultHeader from "./support/SupportResultHeader.vue";
import SupportResultDetail from "./support/SupportResultDetail.vue";
// // Modal Import
// import ReasonModal from "./modal/ReasonModal.vue";
// import ConfirmModal from "./modal/ConfirmModal.vue";

// storeSupport Import
import { useSupportStore } from "../store/support.js";

// vue-Router Import
import { useRoute } from "vue-router";
// vue onBeforeMount Import
import { onBeforeMount } from "vue";
// pinia Import
import { storeToRefs } from "pinia";

const route = useRoute();
const supportCode = route.params.supportCode;
const supportStore = useSupportStore();
const { detail, infoData } = storeToRefs(supportStore);
const { supportResultDetail } = supportStore;

onBeforeMount(() => {
  supportResultDetail(supportCode);
});
</script>

<template>
  <SupportResultHeader
    :target_name="infoData?.target_name ?? ''"
    :member_name="infoData?.member_name ?? ''"
    :manager_name="infoData?.manager_name ?? ''"
    :priority="infoData?.priority ?? ''"
    :write_date="infoData?.write_date ?? ''"
    :disability_type="infoData?.disability_type ?? ''"
  />
  <SupportResultDetail v-for="item in detail ?? []" :key="item.plan_code" />
</template>

<style scoped></style>
