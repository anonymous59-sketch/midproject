<script setup>
// ========== import ==========
import { ref, reactive, computed, onBeforeMount } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useSupportStore } from "../store/support.js";
import SupportResultHeader from "./support/SupportResultHeader.vue";
import SupportResultDetail from "./support/SupportResultDetail.vue";
import ReasonModal from "./modal/ReasonModal.vue";
import ConfirmModal from "./modal/ConfirmModal.vue";
import AlertModal from "./modal/AlertModal.vue";
import { getAlertPreset } from "../utils/alertPresets.js";

// ========== 변수 ==========
const route = useRoute();
const supportCode = route.params.supportCode;
const planCodeFromQuery = route.query.planCode;

const supportStore = useSupportStore();
const { planData, infoData, resultData } = storeToRefs(supportStore);
const { supportResultDetail, insertResult, updateResult, decideResult } =
  supportStore;

const selectedPlan = computed(() => (planData.value ?? [])[0] ?? null);

const showAddResultForm = ref(false);
const addForm = reactive({ title: "", content: "" });
const cancelRequestResultCode = ref(null);

const approvalConfirm = ref({ show: false, source: "add", payload: null });
const cancelModal = ref({ show: false, context: "add", resultCode: null });
const reasonModal = ref({
  show: false,
  type: "reject",
  resultCode: null,
  resultCmt: "",
});

const alertModal = ref({
  show: false,
  type: "success",
  title: "알림",
  message: "",
});

// 취소 확인 시 해당 Detail에 직접 리셋 지시 (ref by result_code)
const resultDetailRefs = {};
function setResultDetailRef(resultCode, el) {
  if (el) resultDetailRefs[resultCode] = el;
  else delete resultDetailRefs[resultCode];
}

// ========== 함수 ==========
function toggleAddResultForm() {
  showAddResultForm.value = !showAddResultForm.value;
  if (!showAddResultForm.value) {
    addForm.title = "";
    addForm.content = "";
  }
}

function showAlert(type, title, message) {
  const m = (message ?? "").trim();
  if (!m || m === "조회 완료" || m === "조회 성공") return;
  alertModal.value = { show: true, type, title, message: m };
}
function closeAlertModal() {
  alertModal.value.show = false;
}

function openApprovalConfirm(source, payload) {
  if (source !== "add" && !payload) {
    showAlert("error", "알림", "결과를 입력한 후에 승인요청해 주세요.");
    return;
  }
  approvalConfirm.value = { show: true, source, payload };
}
function closeApprovalConfirm() {
  approvalConfirm.value = { show: false, source: "add", payload: null };
}

function openReasonModal(type, resultCode, resultCmt = "") {
  reasonModal.value = { show: true, type, resultCode, resultCmt };
}
function closeReasonModal() {
  reasonModal.value = {
    show: false,
    type: "reject",
    resultCode: null,
    resultCmt: "",
  };
}

function openCancelModal(context, resultCode = null) {
  cancelModal.value = { show: true, context, resultCode };
}
function closeCancelModal() {
  cancelModal.value = { show: false, context: "add", resultCode: null };
}
function clearCancelRequest() {
  cancelRequestResultCode.value = null;
}
function onCancelModalConfirm() {
  if (cancelModal.value.context === "add") {
    showAddResultForm.value = false;
    addForm.title = "";
    addForm.content = "";
    closeCancelModal();
  } else {
    const resultCode = cancelModal.value.resultCode;
    closeCancelModal();
    const detail = resultDetailRefs[resultCode];
    if (detail?.resetToViewMode) {
      detail.resetToViewMode();
      clearCancelRequest();
    }
    const p = getAlertPreset("cancelComplete", "result");
    showAlert(p.type, p.title, p.message);
  }
}

function onAddResult() {
  toggleAddResultForm();
}
function onApprovalRequestFromAdd() {
  openApprovalConfirm("add", null);
}
function onApprovalRequest(payload) {
  openApprovalConfirm("detail", payload);
}
async function onApprove(resultCode) {
  const res = await decideResult(resultCode, "e0_10", null);
  if (res?.retCode === "Success") {
    await supportResultDetail(supportCode, planCodeFromQuery ?? undefined);
    const p = getAlertPreset("approvalComplete", "result");
    showAlert(p.type, p.title, res.retMsg ?? p.message);
  } else if (res != null)
    showAlert("error", "알림", res.retMsg ?? "처리 중 오류가 발생했습니다.");
}
function onSupple(resultCode) {
  openReasonModal("supple", resultCode, reasonModal.value.resultCmt ?? "");
}
function onReject(resultCode) {
  openReasonModal("reject", resultCode, reasonModal.value.resultCmt ?? "");
}

async function onReasonConfirm(reason) {
  const { resultCode, type } = reasonModal.value;
  if (!resultCode) return;
  const decision = type === "reject" ? "e0_99" : "e0_80";
  const res = await decideResult(resultCode, decision, reason);
  closeReasonModal();
  if (res?.retCode === "Success") {
    await supportResultDetail(supportCode, planCodeFromQuery ?? undefined);
    const presetKey = decision === "e0_99" ? "rejectComplete" : "suppleComplete";
    const p = getAlertPreset(presetKey, "result");
    showAlert(p.type, p.title, res.retMsg ?? p.message);
  } else if (res != null)
    showAlert("error", "알림", res.retMsg ?? "처리 중 오류가 발생했습니다.");
}
async function onApprovalConfirmYes() {
  const { source, payload } = approvalConfirm.value;
  closeApprovalConfirm();

  if (source === "add") {
    const planCode = selectedPlan.value?.plan_code ?? planCodeFromQuery ?? null;
    if (!planCode) {
      showAlert(
        "error",
        "알림",
        "계획 정보가 없습니다. 결과조회로 진입한 뒤 결과를 추가해 주세요.",
      );
      return;
    }
    const res = await insertResult(
      supportCode,
      planCode,
      addForm.title?.trim() ?? "",
      addForm.content?.trim() ?? "",
    );
    if (res?.retCode === "Success") {
      await supportResultDetail(supportCode, planCodeFromQuery ?? undefined);
      showAddResultForm.value = false;
      addForm.title = "";
      addForm.content = "";
      const p = getAlertPreset("approvalRequestComplete", "result");
      showAlert(p.type, p.title, res.retMsg ?? p.message);
    } else if (res != null) {
      showAlert("error", "알림", res.retMsg ?? "처리 중 오류가 발생했습니다.");
    }
    return;
  }

  if (!payload) return;
  const res = await insertResult(
    supportCode,
    payload.planCode ?? planCodeFromQuery,
    payload.title ?? "",
    payload.content ?? "",
  );
  if (res?.retCode === "Success") {
    await supportResultDetail(supportCode, planCodeFromQuery ?? undefined);
    const p = getAlertPreset("approvalRequestComplete", "result");
    showAlert(p.type, p.title, res.retMsg ?? p.message);
  } else if (res != null)
    showAlert("error", "알림", res.retMsg ?? "처리 중 오류가 발생했습니다.");
}
async function onEditComplete(payload) {
  if (!payload?.resultCode) return;
  const res = await updateResult(payload.resultCode, {
    result_title: payload.title ?? "",
    result_content: payload.content ?? "",
  });
  if (res?.retCode === "Success")
    await supportResultDetail(supportCode, planCodeFromQuery ?? undefined);
  else if (res != null)
    showAlert("error", "알림", res.retMsg ?? "수정 중 오류가 발생했습니다.");
}

// ========== 라이프사이클 훅 ==========
onBeforeMount(() => {
  supportResultDetail(supportCode, planCodeFromQuery ?? undefined);
});
</script>

<template>
  <div class="container-fluid py-4">
    <h5 class="mb-3">지원결과</h5>
    <SupportResultHeader
      :target_name="infoData?.target_name ?? ''"
      :member_name="infoData?.member_name ?? ''"
      :manager_name="infoData?.manager_name ?? ''"
      :priority="infoData?.priority ?? ''"
      :write_date="infoData?.write_date ?? ''"
      :disability_type="infoData?.disability_type ?? ''"
      :plan_code="selectedPlan?.plan_code ?? ''"
      :plan_date="selectedPlan?.plan_date ?? ''"
      :organ_name="selectedPlan?.organ_name ?? ''"
      :plan_goal="selectedPlan?.plan_goal ?? ''"
    />
    <div class="d-flex justify-content-end mb-2">
      <button
        type="button"
        class="btn btn-sm btn-outline-primary"
        @click="onAddResult"
      >
        결과추가
      </button>
    </div>
    <!-- 계획 추가 폼: 제목, 내용, 지원기간(시작일~종료일), 첨부 -->
    <div v-if="showAddResultForm" class="card shadow-sm border-radius-lg mb-4">
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">제목</label>
          <input
            v-model="addForm.title"
            type="text"
            class="form-control form-control-sm"
            placeholder="지원 결과 제목"
          />
        </div>
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">제목</label>
          <textarea
            v-model="addForm.content"
            class="form-control form-control-sm support-result-textarea"
            placeholder="결과"
          >
          </textarea>
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
    <SupportResultDetail
      v-for="item in resultData ?? []"
      :key="item.result_code"
      :ref="(el) => setResultDetailRef(item.result_code, el)"
      :result_code="item.result_code"
      :result_title="item.result_title"
      :result_content="item.result_content"
      :result_date="item.result_date"
      :result_tf="item.result_tf"
      :result_cmt="item.result_cmt"
      :result_updday="item.result_updday"
      :file_code="item.file_code"
      :origin_file_name="item.origin_file_name"
      :server_file_name="item.server_file_name"
      :file_path="item.file_path"
      :file_ext="item.file_ext"
      @history="updHistory"
      @result="(resultCode) => result(resultCode)"
      @edit="edit"
      @edit-complete="onEditComplete"
      @approve="onApprove"
      @supple="onSupple"
      @reject="onReject"
      :cancel-request="cancelRequestResultCode"
      @cancel-done="clearCancelRequest"
      @approval-request="onApprovalRequest"
      @request-cancel="(resultCode) => openCancelModal('edit', resultCode)"
      @add-result="onAddResult"
      :result_result="item.result_tf"
    />

    <ConfirmModal
      :show="approvalConfirm.show"
      title="승인 요청"
      message="지원 결과 승인 요청을 하시겠습니까?"
      @close="closeApprovalConfirm"
      @confirm="onApprovalConfirmYes"
    />
    <ConfirmModal
      :show="cancelModal.show"
      title="지원 결과 취소"
      message="작성 중인 지원 결과를 취소하시겠습니까?"
      warning-message="임시저장 되지 않은 결과는 삭제 시 복구가 불가합니다."
      @close="closeCancelModal"
      @confirm="onCancelModalConfirm"
    />
    <ReasonModal
      :show="reasonModal.show"
      :type="reasonModal.type"
      :title-override="
        reasonModal.type === 'reject' ? '반려 사유' : '보완 사유'
      "
      :display-content="reasonModal.resultCmt"
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
.support-result-textarea {
  height: 6rem;
  min-height: 6rem;
  max-height: 6rem;
  resize: none;
}
</style>
