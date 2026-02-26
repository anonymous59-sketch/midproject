<script setup>
// ========== import ==========
import { ref, reactive, onBeforeMount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useSupportStore } from "../store/support.js";
import SupportPlanHeader from "./support/SupportPlanHeader.vue";
import SupportPlanDetail from "./support/SupportPlanDetail.vue";
import ReasonModal from "./modal/ReasonModal.vue";
import ConfirmModal from "./modal/ConfirmModal.vue";
import AlertModal from "./modal/AlertModal.vue";
import { getAlertPreset } from "../utils/alertPresets.js";

// ========== 변수 ==========
const route = useRoute();
const router = useRouter();
const supportCode = route.params.supportCode;

const supportStore = useSupportStore();
const { planData, infoData } = storeToRefs(supportStore);
const { supportPlanDetail, insertPlan, tempSavePlan, updatePlan, decidePlan } =
  supportStore;

const showAddPlanForm = ref(false);
const addForm = reactive({
  title: "",
  content: "",
  startDate: "",
  endDate: "",
});

const reasonModal = ref({
  show: false,
  type: "reject",
  planCode: null,
  planCmt: "",
});
const cancelModal = ref({ show: false, context: "add", planCode: null });
const cancelRequestPlanCode = ref(null);
const approvalConfirm = ref({ show: false, source: "add", payload: null });

const alertModal = ref({
  show: false,
  type: "success",
  title: "알림",
  message: "",
});

// ========== 함수 ==========
function showAlert(type, title, message) {
  const m = (message ?? "").trim();
  if (!m || m === "조회 완료" || m === "조회 성공") return;
  alertModal.value = { show: true, type, title, message: m };
}
function closeAlertModal() {
  alertModal.value.show = false;
}

function toggleAddPlan() {
  showAddPlanForm.value = !showAddPlanForm.value;
  if (!showAddPlanForm.value) {
    addForm.title = "";
    addForm.content = "";
    addForm.startDate = "";
    addForm.endDate = "";
  }
}

function openReasonModal(type, planCode, planCmt) {
  reasonModal.value = { show: true, type, planCode, planCmt: planCmt ?? "" };
}
function closeReasonModal() {
  reasonModal.value = { ...reasonModal.value, show: false };
}

function openCancelModal(context, planCode = null) {
  cancelModal.value = { show: true, context, planCode };
}
function closeCancelModal() {
  cancelModal.value = { show: false, context: "add", planCode: null };
}
function onCancelModalConfirm() {
  if (cancelModal.value.context === "add") {
    showAddPlanForm.value = false;
    addForm.title = "";
    addForm.content = "";
    addForm.startDate = "";
    addForm.endDate = "";
  } else {
    cancelRequestPlanCode.value = cancelModal.value.planCode;
    const p = getAlertPreset("cancelComplete", "plan");
    showAlert(p.type, p.title, p.message);
  }
  closeCancelModal();
}
function clearCancelRequest() {
  cancelRequestPlanCode.value = null;
}

function closeApprovalConfirm() {
  approvalConfirm.value = { show: false, source: "add", payload: null };
}

function updHistory() {
  console.log("수정이력");
}
function result(planCode) {
  router.push({
    name: "SupportResult",
    params: { supportCode },
    query: planCode ? { planCode } : {},
  });
}
function edit() {
  console.log("수정");
}
function onCancel() {
  console.log("취소");
}
function onAddPlan() {
  console.log("계획추가");
}

function openReasonModalForPlan(type, planCode) {
  openReasonModal(type, planCode, "");
}
async function onApprove(planCode) {
  const res = await decidePlan(planCode, "e0_10", null);
  if (res?.retCode === "Success") {
    await supportPlanDetail(supportCode);
    const p = getAlertPreset("approvalComplete", "plan");
    showAlert(p.type, p.title, res.retMsg ?? p.message);
  } else if (res != null)
    showAlert("error", "알림", res.retMsg ?? "처리 중 오류가 발생했습니다.");
}
function supple(planCode) {
  openReasonModalForPlan("supple", planCode);
}
function reject(planCode) {
  openReasonModalForPlan("reject", planCode);
}
async function onReasonConfirm(reason) {
  const { planCode, type } = reasonModal.value;
  const decision = type === "reject" ? "e0_99" : "e0_80";
  const res = await decidePlan(planCode, decision, reason);
  closeReasonModal();
  if (res?.retCode === "Success") {
    await supportPlanDetail(supportCode);
    const presetKey = decision === "e0_99" ? "rejectComplete" : "suppleComplete";
    const p = getAlertPreset(presetKey, "plan");
    showAlert(p.type, p.title, res.retMsg ?? p.message);
  } else if (res != null)
    showAlert("error", "알림", res.retMsg ?? "처리 중 오류가 발생했습니다.");
}

function onApprovalRequestFromAdd() {
  approvalConfirm.value = { show: true, source: "add", payload: null };
}
function onApprovalRequest(payload) {
  approvalConfirm.value = { show: true, source: "detail", payload };
}
async function onApprovalConfirmYes() {
  if (approvalConfirm.value.source === "add") {
    const { title, content, startDate, endDate } = addForm;
    closeApprovalConfirm();
    const res = await insertPlan(supportCode, {
      dsbl_no: infoData?.dsbl_no ?? null,
      plan_goal: title?.trim() ?? "",
      plan_content: content?.trim() ?? "",
      start_date: startDate || null,
      end_date: endDate || null,
    });
    if (res?.retCode === "Success") {
      await supportPlanDetail(supportCode);
      showAddPlanForm.value = false;
      addForm.title = "";
      addForm.content = "";
      addForm.startDate = "";
      addForm.endDate = "";
      const p = getAlertPreset("approvalRequestComplete", "plan");
      showAlert(p.type, p.title, res.retMsg ?? p.message);
    } else if (res != null) {
      showAlert("error", "알림", res.retMsg ?? "등록 중 오류가 발생했습니다.");
    } else {
      showAlert("error", "알림", "승인요청에 실패했습니다.");
    }
  } else {
    const payload = approvalConfirm.value.payload;
    closeApprovalConfirm();
    if (payload) {
      const res = await updatePlan(payload.planCode, {
        plan_goal: payload.title,
        plan_content: payload.content,
      });
      if (res?.retCode === "Success") {
        await supportPlanDetail(supportCode);
        const p = getAlertPreset("approvalRequestComplete", "plan");
        showAlert(p.type, p.title, res.retMsg ?? p.message);
      }
    }
  }
}
async function onEditComplete(payload) {
  if (!payload?.planCode) return;
  const res = await updatePlan(payload.planCode, {
    plan_goal: payload.title ?? "",
    plan_content: payload.content ?? "",
  });
  if (res?.retCode === "Success") {
    await supportPlanDetail(supportCode);
  } else if (res != null) {
    showAlert("error", "알림", res.retMsg ?? "수정 중 오류가 발생했습니다.");
  }
}
async function onTempSaveFromAdd() {
  const res = await tempSavePlan(supportCode, {
    save_title: addForm.title ?? "",
    save_content: addForm.content ?? "",
  });
  if (res?.retCode === "Success") {
    showAlert("success", "알림", res.retMsg ?? "임시저장 완료");
  } else if (res != null) {
    showAlert("error", "알림", res.retMsg ?? "임시저장 실패");
  } else {
    showAlert("error", "알림", "임시저장 처리 중 오류가 발생했습니다.");
  }
}

// ========== 라이프사이클 훅 ==========
onBeforeMount(() => {
  supportPlanDetail(supportCode);
});
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
    <div class="d-flex justify-content-end mb-2">
      <button
        type="button"
        class="btn btn-sm btn-outline-primary"
        @click="toggleAddPlan"
      >
        계획추가
      </button>
    </div>
    <!-- 계획 추가 폼: 제목, 내용, 지원기간(시작일~종료일), 첨부 -->
    <div v-if="showAddPlanForm" class="card shadow-sm border-radius-lg mb-4">
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">제목</label>
          <input
            v-model="addForm.title"
            type="text"
            class="form-control form-control-sm"
            placeholder="지원 계획 제목"
          />
        </div>
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">내용</label>
          <textarea
            v-model="addForm.content"
            class="form-control form-control-sm support-plan-textarea"
            placeholder="계획"
          ></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">지원기간</label>
          <div class="d-flex align-items-center flex-wrap gap-2">
            <input
              v-model="addForm.startDate"
              type="date"
              class="form-control form-control-sm"
              style="max-width: 11rem"
            />
            <span class="text-body">~</span>
            <input
              v-model="addForm.endDate"
              type="date"
              class="form-control form-control-sm"
              style="max-width: 11rem"
            />
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">첨부파일</label>
          <div class="form-control form-control-sm bg-light border-0">
            첨부파일 없음
          </div>
        </div>
        <div class="d-flex justify-content-end gap-2">
          <button
            type="button"
            class="btn btn-sm btn-secondary"
            @click="onTempSaveFromAdd"
          >
            임시저장
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-primary"
            @click="onApprovalRequestFromAdd"
          >
            승인요청
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="openCancelModal('add')"
          >
            취소
          </button>
        </div>
      </div>
    </div>
    <SupportPlanDetail
      v-for="item in planData ?? []"
      :key="item.plan_code"
      :plan_code="item.plan_code"
      :support_plan_title="item.plan_goal"
      :support_plan_content="item.plan_content"
      :support_plan_file="item.origin_file_name"
      :support_plan_updday="item.plan_updday"
      :support_plan_tf="item.plan_tf"
      :support_plan_comment="item.plan_cmt"
      :plan_date="item.plan_date"
      @history="updHistory"
      @result="result"
      @edit="edit"
      @edit-complete="onEditComplete"
      @approve="onApprove"
      @supple="supple"
      @reject="reject"
      :cancel-request="cancelRequestPlanCode"
      @cancel-done="clearCancelRequest"
      @approval-request="onApprovalRequest"
      @request-cancel="(planCode) => openCancelModal('edit', planCode)"
      @cancel="onCancel"
      @add-plan="onAddPlan"
      :plan_result="item.plan_tf"
    />
    <ConfirmModal
      :show="approvalConfirm.show"
      title="승인 요청"
      message="지원 계획 승인 요청을 하시겠습니까?"
      @close="closeApprovalConfirm"
      @confirm="onApprovalConfirmYes"
    />
    <ConfirmModal
      :show="cancelModal.show"
      title="지원 계획 취소"
      message="작성 중인 지원 계획을 취소하시겠습니까?"
      warning-message="임시저장 되지 않은 계획은 삭제 시 복구가 불가합니다."
      @close="closeCancelModal"
      @confirm="onCancelModalConfirm"
    />
    <ReasonModal
      :show="reasonModal.show"
      :type="reasonModal.type"
      :title-override="
        reasonModal.type === 'reject' ? '반려 사유' : '보완 사유'
      "
      :display-content="reasonModal.planCmt"
      @close="closeReasonModal"
      @confirm="onReasonConfirm"
    />
    <AlertModal
      :show="alertModal.show"
      :type="alertModal.type"
      :title="alertModal.title"
      :message="alertModal.message"
      @close="closeAlertModal"
    />
  </div>
</template>
<style scoped>
.support-plan-textarea {
  height: 6rem;
  min-height: 6rem;
  max-height: 6rem;
  resize: none;
}
</style>
