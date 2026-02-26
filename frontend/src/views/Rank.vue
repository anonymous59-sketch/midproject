<script setup>
import { ref } from "vue";
import RankHeader from "./rank/RankHeader.vue";
import RankDetail from "./rank/RankDetail.vue";
import ReasonModal from "./modal/ReasonModal.vue";
import ConfirmModal from "./modal/ConfirmModal.vue";
import { onBeforeMount } from "vue";
import { useRoute } from "vue-router";
import { useRankStore } from "../store/rank.js";
import { storeToRefs } from "pinia";

const route = useRoute();
const supCode = route.params.supCode;
const rankStore = useRankStore();
const { rankInfo } = storeToRefs(rankStore);
const { getRankInfo } = rankStore;
const reasonModal = ref({ show: false, type: "reject" });

function openReasonModal(type) {
  reasonModal.value = { show: true, type };
}
function closeReasonModal() {
  reasonModal.value = { ...reasonModal.value, show: false };
}

const approvalConfirm = ref({ show: false, payload: null });
function openApprovalConfirm(payload) {
  if (!payload?.s_rank_code) {
    alert("우선순위를 선택한 뒤 승인요청해 주세요.");
    return;
  }
  approvalConfirm.value = { show: true, payload };
}
function closeApprovalConfirm() {
  approvalConfirm.value = { show: false, payload: null };
}

function onApprovalRequest(payload) {
  openApprovalConfirm(payload);
}
function onCancel() {
  console.log("취소");
}

async function onApprovalConfirmYes() {
  const payload = approvalConfirm.value.payload;
  if (!payload) return;
  closeApprovalConfirm();
  const res = await rankStore.requestApproval(
    supCode,
    payload.s_rank_code,
    rankInfo?.value?.mgr_no ?? null,
    payload.apply_for ?? null,
    payload.prev_req_code ?? null,
  );
  if (res?.retCode === "Success") {
    alert("정상적으로 승인요청이 들어갔습니다.");
    await getRankInfo(supCode);
  } else if (res != null) {
    alert(res.retMsg || "승인요청 처리 중 오류가 발생했습니다.");
  } else {
    alert("승인요청 요청에 실패했습니다. 네트워크와 백엔드를 확인해 주세요.");
  }
}

onBeforeMount(() => {
  if (supCode) getRankInfo(supCode);
});

async function onApprove() {
  const reqCode = rankInfo?.value?.req_code;
  if (!reqCode) return;
  const res = await rankStore.decideRank(reqCode, supCode, "e0_10");
  if (res?.retCode === "Success") {
    await getRankInfo(supCode);
  }
}
function onSupple() {
  openReasonModal("supple");
}
async function onReject() {
  openReasonModal("reject");
}
async function onReasonConfirm(reason) {
  const reqCode = rankInfo?.value?.req_code;
  if (!reqCode) return;
  const isReject = reasonModal.value.type === "reject";
  if (isReject) {
    const res = await rankStore.decideRank(reqCode, supCode, "e0_99");
    if (res?.retCode === "Success") await getRankInfo(supCode);
  } else {
    const res = await rankStore.suppleRank(reqCode, reason);
    if (res?.retCode === "Success") await getRankInfo(supCode);
  }
  closeReasonModal();
}
// 헤더/디테일에 넘길 데이터 (store rankInfo = API data)
</script>
<template>
  <div class="container-fluid py-4">
    <h5 class="mb-3">우선순위</h5>
    <RankHeader
      :target_name="rankInfo?.target_name ?? ''"
      :member_name="rankInfo?.member_name ?? ''"
      :manager_name="rankInfo?.manager_name ?? ''"
      :write_date="rankInfo?.write_date ?? ''"
      :disability_type="rankInfo?.disability_type ?? ''"
      :priority="rankInfo?.priority ?? ''"
    />
    <RankDetail
      :rank_code="rankInfo?.s_rank_code ?? ''"
      :rank_cmt="rankInfo?.rank_cmt ?? ''"
      :priority="rankInfo?.priority ?? ''"
      :apply_for="rankInfo?.apply_for ?? ''"
      :s_rank_res="rankInfo?.s_rank_res ?? ''"
      :req_code="rankInfo?.req_code ?? ''"
      @approval-request="onApprovalRequest"
      @cancel="onCancel"
      @approve="onApprove"
      @supple="onSupple"
      @reject="onReject"
    />
    <ConfirmModal
      :show="approvalConfirm.show"
      title="우선순위 승인 요청"
      message="우선순위의 승인 요청을 하시겠습니까?"
      @confirm="onApprovalConfirmYes"
      @close="closeApprovalConfirm"
    />
    <ReasonModal
      :show="reasonModal.show"
      :type="reasonModal.type"
      @close="closeReasonModal"
      @confirm="onReasonConfirm"
    />
  </div>
</template>
<style></style>
