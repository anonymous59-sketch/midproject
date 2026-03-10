<!-- 상담내역: /review/:sup_code, 좌측 지원대상자(dsbl_prs) + 조사지 결과, 우측 상담등록·목록 -->
<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useTempStorage } from "@/composables/useTempStorage";
import { useHistory } from "@/composables/useHistory";
import { useReasonModal } from "@/composables/useReasonModal";
import TempStorageModal from "@/components/TempStorageModal.vue";
import { storeToRefs } from "pinia";
import { useSupportStore } from "@/store/support";
import { useAuthStore } from "@/store/auth";
import CounselApplicantInfo from "@/views/counsel/CounselApplicantInfo.vue";
import CounselReceiptTab from "@/views/counsel/CounselReceiptTab.vue";
import CounselApplicationTab from "@/views/counsel/CounselApplicationTab.vue";
import RankDetail from "@/views/rank/RankDetail.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import SupportPlanDetail from "@/views/support/SupportPlanDetail.vue";
import SupportResultDetail from "@/views/support/SupportResultDetail.vue";
import PlanAdd from "@/views/support/PlanAdd.vue";
import ResultAdd from "@/views/support/ResultAdd.vue";
import CounselRightPanel from "@/views/counsel/CounselRightPanel.vue";
import ConfirmModal from "@/views/modal/ConfirmModal.vue";
import AlertModal from "@/views/modal/AlertModal.vue";
import HistoryModal from "@/views/modal/HistoryModal.vue";
import SuppleHistoryModal from "@/views/modal/SuppleHistoryModal.vue";
import { getAlertPreset } from "@/utils/alertPresets.js";

const route = useRoute();
const supCode = computed(() => route.params.sup_code || "");

// ─── 좌측: 지원 정보 (support + dsbl_prs, sup_code 기준) ───
const support = ref(null);
const dsblPrs = ref(null);
const dsblLoading = ref(false);
const dsblError = ref(null);

async function loadSupport() {
  const code = supCode.value;
  if (!code) {
    dsblError.value = "지원번호가 존재하지 않습니다.";
    return;
  }
  dsblLoading.value = true;
  dsblError.value = null;
  try {
    const res = await fetch(`/api/apply/support/${encodeURIComponent(code)}`);
    if (!res.ok) throw new Error("지원 정보 조회 실패");
    const data = await res.json();
    support.value = data.support || null;
    dsblPrs.value = data.dsbl_prs || null;
    // sup_code 기준 상태(req_yn)에 따라 우선순위/계획 탭 선로딩
    // - req_yn = e0_10 이면 우선순위 탭에서 사용할 rankData를 먼저 조회
    if (support.value?.req_yn === "e0_10") {
      await loadRankTab();
    }
  } catch (e) {
    dsblError.value = e.message;
    support.value = null;
    dsblPrs.value = null;
  } finally {
    dsblLoading.value = false;
  }
}

onMounted(() => {
  loadSupport();
  loadSurveyAnswers();
});

// 우측 상담내역 패널 표시 여부 — URL 진입 시 숨김, '상담내역 보기' 클릭 시 표시
const showRightPanel = ref(false);

// 좌측 탭: application(지원신청서) | rank(우선순위) | plan(지원계획) | result(지원결과)
// - 기본은 지원신청서, 쿼리스트링 tab 이 있을 경우 해당 탭으로 시작
const initialLeftTab = computed(() => {
  const t = route.query.tab;
  const allowed = ["application", "receipt", "rank", "plan", "result"];
  return allowed.includes(t) ? t : "application";
});
const leftTab = ref(initialLeftTab.value);

// ─── 지원계획 / 지원결과 (store 연동) ───
const authStore = useAuthStore();
const supportStore = useSupportStore();
const userAuth = computed(() => authStore.user?.m_auth || "");
const isApplicant = computed(() => userAuth.value === "a0_20");
const isManager = computed(() => userAuth.value === "a0_30");
const { planData, resultData, infoData } = storeToRefs(supportStore);

const {
  historyModal,
  openHistoryModalByTarget,
  closeHistoryModal,
  insertHistory,
} = useHistory();
const planLoading = ref(false);
const resultLoading = ref(false);
const selectedPlanCode = ref(null); // 결과조회 클릭 시 어떤 계획의 결과인지 기억

// ─── 계획 추가 / 결과 추가 ───
const showAddPlanForm = ref(false);
const planAddRef = ref(null);
const planCreateConfirm = ref(false);
const planApprovalConfirm = ref({ show: false, source: "add", payload: null });
const planCancelModal = ref({ show: false, context: "add", planCode: null });
const cancelRequestPlanCode = ref(null);

const showAddResultForm = ref(false);
const resultAddRef = ref(null);
const resultCreateConfirm = ref(false);
const resultApprovalConfirm = ref({
  show: false,
  source: "add",
  payload: null,
});
const resultCancelModal = ref({
  show: false,
  context: "add",
  resultCode: null,
});
const cancelRequestResultCode = ref(null);

// 보완/반려 사유 입력용 ConfirmModal (우선순위·지원계획·지원결과)
const { reasonModal, openReasonModal, closeReasonModal, onReasonConfirm } =
  useReasonModal();

// 우선순위 API 베이스 (호출 시점에 확인해 개발 시만 3000 직접 요청)
function getRankApiBase() {
  try {
    if (typeof window !== "undefined" && window.location?.origin) {
      if (
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
          window.location.origin,
        )
      )
        return "http://localhost:3000";
    }
  } catch {
    /* window 미접근 환경 */
  }
  return "";
}

// 계획/결과 보완이력 모달 (한 번이라도 보완 판정된 건에서 버튼 노출)
const planSuppleHistoryShow = ref(false);
const planSuppleHistoryList = ref([]);
const resultSuppleHistoryShow = ref(false);
const resultSuppleHistoryList = ref([]);
// 보완이력: 카드별로 해당 plan_code / result_code 체인만 조회 (클릭 시 API 호출)

async function openPlanSuppleHistory(planCode) {
  if (!planCode?.trim()) return;
  const code = supCode.value;
  if (!code) return;
  planSuppleHistoryList.value = [];
  try {
    const res = await fetch(
      `/api/support/${encodeURIComponent(code)}/plan/${encodeURIComponent(planCode)}/supple-history`,
    );
    const json = await res.json();
    planSuppleHistoryList.value = Array.isArray(json?.data) ? json.data : [];
  } catch (e) {
    console.error("[planSuppleHistory]", e);
  }
  if (planSuppleHistoryList.value.length === 0) {
    showAlert("info", "알림", "보완 이력이 존재하지 않습니다.");
    return;
  }
  planSuppleHistoryShow.value = true;
}
async function openResultSuppleHistory(resultCode) {
  if (!resultCode?.trim()) return;
  const code = supCode.value;
  if (!code) return;
  resultSuppleHistoryList.value = [];
  try {
    const res = await fetch(
      `/api/support/${encodeURIComponent(code)}/result/${encodeURIComponent(resultCode)}/supple-history`,
    );
    const json = await res.json();
    resultSuppleHistoryList.value = Array.isArray(json?.data) ? json.data : [];
  } catch (e) {
    console.error("[resultSuppleHistory]", e);
  }
  if (resultSuppleHistoryList.value.length === 0) {
    showAlert("info", "알림", "보완 이력이 존재하지 않습니다.");
    return;
  }
  resultSuppleHistoryShow.value = true;
}

/** 결과 추가 시 사용할 plan_code: 결과탭에서 선택된 계획 또는 계획 목록 첫 항목 */
const selectedPlanCodeForResult = computed(
  () => selectedPlanCode.value ?? planData.value?.[0]?.plan_code ?? null,
);

const alertModal = ref({
  show: false,
  type: "success",
  title: "알림",
  message: "",
});
function showAlert(type, title, message) {
  const m = (message ?? "").trim();
  if (!m || m === "조회 완료" || m === "조회 성공") return;
  alertModal.value = { show: true, type, title, message: m };
}
function closeAlertModal() {
  alertModal.value.show = false;
}

async function uploadFilesToServer(files, filePath, categoryPk, uploadMem) {
  for (const f of files) {
    const formData = new FormData();
    formData.append("file", f);
    formData.append("file_path", filePath);
    formData.append("file_category", categoryPk);
    if (uploadMem) formData.append("upload_mem", uploadMem);
    try {
      await fetch("/api/upload/file-content", {
        method: "POST",
        body: formData,
      });
    } catch (e) {
      console.error("파일 업로드 중 에러", e);
    }
  }
}

const planDetailRefs = {};
function setPlanDetailRef(planCode, el) {
  if (el) planDetailRefs[planCode] = el;
  else delete planDetailRefs[planCode];
}
const resultDetailRefs = {};
function setResultDetailRef(resultCode, el) {
  if (el) resultDetailRefs[resultCode] = el;
  else delete resultDetailRefs[resultCode];
}

async function loadPlanTab() {
  const code = supCode.value;
  if (!code) return;
  planLoading.value = true;
  await supportStore.supportPlanDetail(code);
  planLoading.value = false;
  if (planData.value.length === 0) {
    showAlert("error", "알림", "등록된 지원계획이 없습니다.");
    if (isManager.value) {
      planCreateConfirm.value = true;
    }
  }
}

async function loadResultForPlan(planCode) {
  const code = supCode.value;
  if (!code) return;
  selectedPlanCode.value = planCode;
  resultLoading.value = true;
  await supportStore.supportResultDetail(code, planCode);
  resultLoading.value = false;
  const hasResult = resultData.value.length > 0;
  if (!hasResult) {
    showAlert("error", "알림", "등록된 지원결과가 없습니다.");
    if (isManager.value) {
      resultCreateConfirm.value = true;
    }
    // 결과가 0건이면 지원결과 탭으로 자동 이동하지 않는다.
    return;
  }
  leftTab.value = "result";
}

async function loadResultTab() {
  const code = supCode.value;
  if (!code) return;
  resultLoading.value = true;
  await supportStore.supportResultDetail(
    code,
    selectedPlanCode.value ?? undefined,
  );
  resultLoading.value = false;
  if (resultData.value.length === 0) {
    showAlert("info", "알림", "등록된 지원결과가 없습니다.");
    if (isManager.value) {
      resultCreateConfirm.value = true;
    }
  }
}

// ─── 계획 추가: 폼 토글·승인요청·취소·수정완료 ───
function toggleAddPlan() {
  showAddPlanForm.value = !showAddPlanForm.value;
  if (!showAddPlanForm.value) {
    planAddRef.value?.reset();
  }
}
function onPlanCreateConfirmYes() {
  planCreateConfirm.value = false;
  if (!showAddPlanForm.value) {
    toggleAddPlan();
  }
}
function openPlanCancelModal(context, planCode = null) {
  planCancelModal.value = { show: true, context, planCode };
}
function closePlanCancelModal() {
  planCancelModal.value = { show: false, context: "add", planCode: null };
}
function onPlanCancelModalConfirm() {
  if (planCancelModal.value.context === "add") {
    showAddPlanForm.value = false;
    planAddRef.value?.reset();
  } else {
    cancelRequestPlanCode.value = planCancelModal.value.planCode;
    showAlert("success", "알림", "수정이 취소되었습니다.");
  }
  closePlanCancelModal();
}
function clearCancelRequestPlan() {
  cancelRequestPlanCode.value = null;
}
function onPlanApprovalRequestFromAdd(payload) {
  planApprovalConfirm.value = { show: true, source: "add", payload };
}
function onPlanApprovalRequest(payload) {
  planApprovalConfirm.value = { show: true, source: "detail", payload };
}
function closePlanApprovalConfirm() {
  planApprovalConfirm.value = { show: false, source: "add", payload: null };
}
async function onPlanApprovalConfirmYes() {
  const code = supCode.value;
  if (planApprovalConfirm.value.source === "add") {
    const payload = planApprovalConfirm.value.payload;
    closePlanApprovalConfirm();
    const res = await supportStore.insertPlan(code, {
      dsbl_no: infoData.value?.dsbl_no ?? null,
      plan_goal: payload?.title ?? "",
      plan_content: payload?.content ?? "",
      start_date: payload?.startDate || null,
      end_date: payload?.endDate || null,
    });
    if (res?.retCode === "Success") {
      const newPlanCode = res?.plan_code ?? null;
      if (newPlanCode && payload?.files?.length > 0) {
        await uploadFilesToServer(
          payload.files,
          "plan",
          newPlanCode,
          infoData.value?.mgr_no ?? null,
        );
      }
      await planAddRef.value?.deleteTempAfterInsert();
      await loadPlanTab();
      showAddPlanForm.value = false;
      planAddRef.value?.reset();
      const p = getAlertPreset("approvalRequestComplete", "plan");
      showAlert(p.type, p.title, res.retMsg ?? p.message);
    } else if (res != null) {
      showAlert("error", "알림", res.retMsg ?? "등록 중 오류가 발생했습니다.");
    } else {
      showAlert("error", "알림", "승인요청에 실패했습니다.");
    }
  } else {
    const payload = planApprovalConfirm.value.payload;
    closePlanApprovalConfirm();
    if (payload) {
      const res = await supportStore.updatePlan(payload.planCode, {
        plan_goal: payload.title,
        plan_content: payload.content,
      });
      if (res?.retCode === "Success") {
        await loadPlanTab();
        const p = getAlertPreset("approvalRequestComplete", "plan");
        showAlert(p.type, p.title, res.retMsg ?? p.message);
      } else if (res != null) {
        showAlert(
          "error",
          "알림",
          res.retMsg ?? "수정 중 오류가 발생했습니다.",
        );
      }
    }
  }
}
async function onPlanEditComplete(payload) {
  if (!payload?.planCode) return;
  const code = supCode.value;
  const before = (planData.value ?? []).find(
    (p) => p.plan_code === payload.planCode,
  );
  const isResubmitAfterSupple = before?.plan_tf === "e0_80";

  if (isResubmitAfterSupple) {
    // 보완 재신청: INSERT (prev_plan_code = 현재 plan_code), UPDATE 아님
    const res = await supportStore.insertPlan(code, {
      prev_plan_code: payload.planCode,
      dsbl_no: infoData.value?.dsbl_no ?? null,
      plan_goal: payload.title ?? "",
      plan_content: payload.content ?? "",
      start_date: payload.startDate ?? null,
      end_date: payload.endDate ?? null,
    });
    if (res?.retCode === "Success") {
      const newPlanCode = res?.plan_code ?? null;
      if (
        newPlanCode &&
        Array.isArray(payload.newFiles) &&
        payload.newFiles.length > 0
      ) {
        await uploadFilesToServer(
          payload.newFiles,
          "plan",
          newPlanCode,
          infoData.value?.mgr_no ?? null,
        );
      }
      await loadPlanTab();
      const p = getAlertPreset("approvalRequestComplete", "plan");
      showAlert(p.type, p.title, res.retMsg ?? p.message);
    } else if (res != null) {
      showAlert("error", "알림", res.retMsg ?? "승인 재요청에 실패했습니다.");
    } else {
      showAlert("error", "알림", "승인 재요청에 실패했습니다.");
    }
    return;
  }

  const res = await supportStore.updatePlan(payload.planCode, {
    plan_goal: payload.title ?? "",
    plan_content: payload.content ?? "",
    start_date: payload.startDate ?? null,
    end_date: payload.endDate ?? null,
  });
  if (res?.retCode === "Success") {
    const planFields = [
      { field: "목표", bv: before?.plan_goal ?? "", av: payload.title ?? "" },
      {
        field: "내용",
        bv: before?.plan_content ?? "",
        av: payload.content ?? "",
      },
      {
        field: "시작일",
        bv: before?.start_time ? String(before.start_time).slice(0, 10) : "",
        av: payload.startDate ?? "",
      },
      {
        field: "종료일",
        bv: before?.end_time ? String(before.end_time).slice(0, 10) : "",
        av: payload.endDate ?? "",
      },
    ];
    const changed = planFields.filter((f) => f.bv !== f.av);
    if (changed.length > 0) {
      insertHistory(code, "j0_20", {
        updTarget: payload.planCode,
        updMember: authStore.user?.m_no ?? "",
        beforeFields: changed.map((f) => ({ field: f.field, value: f.bv })),
        afterFields: changed.map((f) => ({ field: f.field, value: f.av })),
      });
    }
    const codesToDelete = Array.isArray(payload.deleteFileCodes)
      ? payload.deleteFileCodes
      : [];
    if (codesToDelete.length > 0) {
      try {
        await Promise.all(
          codesToDelete.map((c) =>
            fetch(`/api/upload/file/${encodeURIComponent(c)}`, {
              method: "DELETE",
            }),
          ),
        );
      } catch (e) {
        console.error("계획 첨부파일 삭제 중 에러", e);
      }
    }
    if (Array.isArray(payload.newFiles) && payload.newFiles.length > 0) {
      await uploadFilesToServer(
        payload.newFiles,
        "plan",
        payload.planCode,
        infoData.value?.mgr_no ?? null,
      );
    }
    await loadPlanTab();
    const detail = planDetailRefs[payload.planCode];
    if (detail?.reloadFiles) await detail.reloadFiles();
  } else if (res != null) {
    showAlert("error", "알림", res.retMsg ?? "수정 중 오류가 발생했습니다.");
  }
}
// ─── 임시저장 (지원계획 j0_20 - 상세 편집용) ───────────────────────────────
let _planTempPayloadOverride = null;

const { saveTemp: doPlanTempSave } = useTempStorage(
  () => supCode.value,
  "j0_20",
  {
    getPayload: () =>
      _planTempPayloadOverride ?? { save_title: "", save_content: "" },
    setPayload: () => {},
    validate: () => ({ valid: true }),
    onAlert: showAlert,
  },
);

function onTempSaveFromDetailPlan(payload) {
  _planTempPayloadOverride = {
    save_title: (payload?.title ?? "").trim(),
    save_content: JSON.stringify({ content: payload?.content ?? "" }),
  };
  doPlanTempSave().finally(() => {
    _planTempPayloadOverride = null;
  });
}

// ─── 결과 추가: 폼 토글·승인요청·취소·수정완료 ───
function toggleAddResultForm() {
  showAddResultForm.value = !showAddResultForm.value;
  if (!showAddResultForm.value) {
    resultAddRef.value?.reset();
  }
}
function onResultCreateConfirmYes() {
  resultCreateConfirm.value = false;
  if (!showAddResultForm.value) {
    toggleAddResultForm();
  }
  // 지원계획에서 결과조회 시 0건이어서 등록 유도 ConfirmModal에서
  // '예/확인'을 누르면 지원결과 탭으로 이동하도록 처리
  leftTab.value = "result";
}
function openResultCancelModal(context, resultCode = null) {
  resultCancelModal.value = { show: true, context, resultCode };
}
function closeResultCancelModal() {
  resultCancelModal.value = { show: false, context: "add", resultCode: null };
}
function onResultCancelModalConfirm() {
  if (resultCancelModal.value.context === "add") {
    showAddResultForm.value = false;
    resultAddRef.value?.reset();
  } else {
    const resultCode = resultCancelModal.value.resultCode;
    closeResultCancelModal();
    const detail = resultDetailRefs[resultCode];
    if (detail?.resetToViewMode) detail.resetToViewMode();
    cancelRequestResultCode.value = null;
    showAlert("success", "알림", "수정이 취소되었습니다.");
    return;
  }
  closeResultCancelModal();
}
function onResultApprovalRequestFromAdd(payload) {
  resultApprovalConfirm.value = { show: true, source: "add", payload };
}
function onResultApprovalRequest(payload) {
  resultApprovalConfirm.value = { show: true, source: "detail", payload };
}
function closeResultApprovalConfirm() {
  resultApprovalConfirm.value = { show: false, source: "add", payload: null };
}
async function onResultApprovalConfirmYes() {
  const code = supCode.value;
  const planCode = selectedPlanCodeForResult.value;
  if (resultApprovalConfirm.value.source === "add") {
    const payload = resultApprovalConfirm.value.payload;
    closeResultApprovalConfirm();
    if (!planCode) {
      showAlert(
        "error",
        "알림",
        "계획 정보가 없습니다. 지원계획에서 계획을 먼저 조회하거나 결과조회로 진입해 주세요.",
      );
      return;
    }
    const res = await supportStore.insertResult(
      code,
      planCode,
      payload?.title ?? "",
      payload?.content ?? "",
    );
    if (res?.retCode === "Success") {
      const newResultCode = res?.result_code ?? null;
      if (newResultCode && payload?.files?.length > 0) {
        await uploadFilesToServer(
          payload.files,
          "result",
          newResultCode,
          infoData.value?.mgr_no ?? null,
        );
      }
      await resultAddRef.value?.deleteTempAfterInsert();
      await supportStore.supportResultDetail(
        code,
        selectedPlanCode.value ?? undefined,
      );
      showAddResultForm.value = false;
      resultAddRef.value?.reset();
      const p = getAlertPreset("approvalRequestComplete", "result");
      showAlert(p.type, p.title, res.retMsg ?? p.message);
    } else if (res != null) {
      showAlert("error", "알림", res.retMsg ?? "등록 중 오류가 발생했습니다.");
    } else {
      showAlert("error", "알림", "승인요청에 실패했습니다.");
    }
  } else {
    const payload = resultApprovalConfirm.value.payload;
    closeResultApprovalConfirm();
    if (payload) {
      const res = await supportStore.updateResult(payload.resultCode, {
        result_title: payload.title ?? "",
        result_content: payload.content ?? "",
      });
      if (res?.retCode === "Success") {
        await supportStore.supportResultDetail(
          code,
          selectedPlanCode.value ?? undefined,
        );
        const p = getAlertPreset("approvalRequestComplete", "result");
        showAlert(p.type, p.title, res.retMsg ?? p.message);
      } else if (res != null) {
        showAlert(
          "error",
          "알림",
          res.retMsg ?? "수정 중 오류가 발생했습니다.",
        );
      }
    }
  }
}
async function onResultEditComplete(payload) {
  if (!payload?.resultCode) return;
  const code = supCode.value;
  const planCode = selectedPlanCode.value;
  const before = (resultData.value ?? []).find(
    (r) => r.result_code === payload.resultCode,
  );
  const isResubmitAfterSupple = before?.result_tf === "e0_80";

  if (isResubmitAfterSupple) {
    if (!planCode) {
      showAlert("error", "알림", "계획 정보가 없습니다.");
      return;
    }
    const res = await supportStore.insertResult(
      code,
      planCode,
      payload.title ?? "",
      payload.content ?? "",
      payload.resultCode,
    );
    if (res?.retCode === "Success") {
      const newResultCode = res?.result_code ?? null;
      if (
        newResultCode &&
        Array.isArray(payload.newFiles) &&
        payload.newFiles.length > 0
      ) {
        await uploadFilesToServer(
          payload.newFiles,
          "result",
          newResultCode,
          infoData.value?.mgr_no ?? null,
        );
      }
      await supportStore.supportResultDetail(
        code,
        selectedPlanCode.value ?? undefined,
      );
      const p = getAlertPreset("approvalRequestComplete", "result");
      showAlert(p.type, p.title, res.retMsg ?? p.message);
    } else if (res != null) {
      showAlert("error", "알림", res.retMsg ?? "승인 재요청에 실패했습니다.");
    } else {
      showAlert("error", "알림", "승인 재요청에 실패했습니다.");
    }
    return;
  }

  const res = await supportStore.updateResult(payload.resultCode, {
    result_title: payload.title ?? "",
    result_content: payload.content ?? "",
  });
  if (res?.retCode === "Success") {
    const resultFields = [
      {
        field: "제목",
        bv: before?.result_title ?? "",
        av: payload.title ?? "",
      },
      {
        field: "내용",
        bv: before?.result_content ?? "",
        av: payload.content ?? "",
      },
    ];
    const changed = resultFields.filter((f) => f.bv !== f.av);
    if (changed.length > 0) {
      insertHistory(code, "j0_30", {
        updTarget: payload.resultCode,
        updMember: authStore.user?.m_no ?? "",
        beforeFields: changed.map((f) => ({ field: f.field, value: f.bv })),
        afterFields: changed.map((f) => ({ field: f.field, value: f.av })),
      });
    }
    const codesToDelete = Array.isArray(payload.deleteFileCodes)
      ? payload.deleteFileCodes
      : [];
    if (codesToDelete.length > 0) {
      try {
        await Promise.all(
          codesToDelete.map((c) =>
            fetch(`/api/upload/file/${encodeURIComponent(c)}`, {
              method: "DELETE",
            }),
          ),
        );
      } catch (e) {
        console.error("결과 첨부파일 삭제 중 에러", e);
      }
    }
    if (Array.isArray(payload.newFiles) && payload.newFiles.length > 0) {
      await uploadFilesToServer(
        payload.newFiles,
        "result",
        payload.resultCode,
        infoData.value?.mgr_no ?? null,
      );
    }
    await supportStore.supportResultDetail(
      code,
      selectedPlanCode.value ?? undefined,
    );
    const detail = resultDetailRefs[payload.resultCode];
    if (detail?.reloadFiles) await detail.reloadFiles();
  } else if (res != null) {
    showAlert("error", "알림", res.retMsg ?? "수정 중 오류가 발생했습니다.");
  }
}
// ─── 임시저장 (지원결과 j0_30 - 상세 편집용) ───────────────────────────────
let _resultTempPayloadOverride = null;

const { saveTemp: doResultTempSave } = useTempStorage(
  () => supCode.value,
  "j0_30",
  {
    getPayload: () =>
      _resultTempPayloadOverride ?? { save_title: "", save_content: "" },
    setPayload: () => {},
    validate: () => ({ valid: true }),
    onAlert: showAlert,
  },
);

function onTempSaveFromDetailResult(payload) {
  _resultTempPayloadOverride = {
    save_title: (payload?.title ?? "").trim(),
    save_content: JSON.stringify({ content: payload?.content ?? "" }),
  };
  doResultTempSave().finally(() => {
    _resultTempPayloadOverride = null;
  });
}

// ─── 수정이력 모달 (plan_code / result_code 기준, 해당 PK의 upd_target 이력만) ───
async function openPlanHistory(planCode) {
  if (!planCode?.trim()) return;
  await openHistoryModalByTarget(planCode, "j0_20", "지원계획 수정이력");
  if (!historyModal.value.list || historyModal.value.list.length === 0) {
    showAlert("info", "알림", "수정 이력이 존재하지 않습니다.");
  }
}
async function openResultHistory(resultCode) {
  if (!resultCode?.trim()) return;
  await openHistoryModalByTarget(resultCode, "j0_30", "지원결과 수정이력");
  if (!historyModal.value.list || historyModal.value.list.length === 0) {
    showAlert("info", "알림", "수정 이력이 존재하지 않습니다.");
  }
}
function clearCancelRequestResult() {
  cancelRequestResultCode.value = null;
}

// ─── 우선순위 탭 ───────────────────────────────────────────────────────────
const rankData = ref(null); // GET /api/rank/:supCode 응답
const rankLoading = ref(false);
// RankDetail v-model 바인딩용 로컬 상태
const rankCodeLocal = ref("");
const rankCmtLocal = ref("");

async function loadRankTab() {
  const code = supCode.value;
  if (!code) return;
  rankLoading.value = true;
  try {
    const res = await fetch(`/api/rank/${encodeURIComponent(code)}`);
    const json = await res.json();
    rankData.value = json?.data ?? null;
    rankCodeLocal.value = rankData.value?.s_rank_code ?? "";
    rankCmtLocal.value = rankData.value?.rank_cmt ?? "";
  } catch (e) {
    console.error("[loadRankTab]", e);
    rankData.value = null;
  } finally {
    rankLoading.value = false;
  }
}

async function onRankApprovalRequest({
  s_rank_code,
  apply_for,
  prev_req_code,
}) {
  const code = supCode.value;
  if (!code) return;
  try {
    const res = await fetch("/api/rank/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sup_code: code,
        s_rank_code,
        // 우선순위 신청자 = 로그인한 기관담당자
        mgr_no: authStore.user?.m_no ?? null,
        apply_for: apply_for ?? "",
        prev_req_code: prev_req_code ?? null,
      }),
    });
    const json = await res.json();
    if (json?.retCode === "Success") {
      showAlert("success", "알림", "승인요청이 완료되었습니다.");
      await loadRankTab();
    } else {
      showAlert("error", "알림", json?.retMsg ?? "승인요청에 실패했습니다.");
    }
  } catch (e) {
    showAlert("error", "알림", "승인요청 중 오류가 발생했습니다.");
  }
}

async function onRankDecide(decision) {
  const reqCode = rankData.value?.req_code;
  const code = supCode.value;
  if (!reqCode || !code) return;
  const base = getRankApiBase();
  const decideUrl = base ? base + "/rank/decide" : "/api/rank/decide";
  try {
    const res = await fetch(decideUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ req_code: reqCode, sup_code: code, decision }),
    });
    const json = await res.json();
    if (json?.retCode === "Success") {
      const label = decision === "e0_10" ? "승인" : "반려";
      showAlert("success", "알림", `우선순위 ${label}이 완료되었습니다.`);
      await loadRankTab();
    } else {
      showAlert("error", "알림", json?.retMsg ?? "처리에 실패했습니다.");
    }
  } catch (e) {
    showAlert("error", "알림", "처리 중 오류가 발생했습니다.");
  }
}

function onRankCancel() {
  rankCodeLocal.value = rankData.value?.s_rank_code ?? "";
  rankCmtLocal.value = rankData.value?.rank_cmt ?? "";
}

/** 우선순위 반려 모달 확인 시 (reasonModal onConfirm) */
async function onRankRejectConfirm({ context, reason }) {
  const code = supCode.value;
  const base = getRankApiBase();
  const decideUrl = base ? base + "/rank/decide" : "/api/rank/decide";
  try {
    const res = await fetch(decideUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        req_code: context?.reqCode,
        sup_code: code,
        decision: "e0_99",
        rank_cmt: reason ?? null,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (json?.retCode === "Success") {
      showAlert("success", "알림", "우선순위 반려가 완료되었습니다.");
      await loadRankTab();
    } else {
      showAlert("error", "알림", json?.retMsg ?? "처리에 실패했습니다.");
    }
  } catch (e) {
    showAlert("error", "알림", "처리 중 오류가 발생했습니다.");
  }
}

/** 우선순위 보완 모달 확인 시 (reasonModal onConfirm) */
async function onRankSuppleConfirm({ context, reason }) {
  const base = getRankApiBase();
  const suppleUrl = base ? base + "/rank/supple" : "/api/rank/supple";
  try {
    const res = await fetch(suppleUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        req_code: context?.reqCode,
        rank_cmt: reason ?? null,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (json?.retCode === "Success") {
      showAlert("supple", "알림", "보완 처리가 완료되었습니다.");
      await loadRankTab();
    } else {
      showAlert("error", "알림", json?.retMsg ?? "보완 처리에 실패했습니다.");
    }
  } catch (e) {
    showAlert("error", "알림", "보완 처리 중 오류가 발생했습니다.");
  }
}

// ─── 우선순위 보완이력 모달 ──────────────────────────────────────────────────
const suppleHistoryShow = ref(false);
const suppleHistoryList = ref([]);
const suppleHistoryLoading = ref(false);

/** 한 번이라도 보완 판정이 있었는지 (버튼 노출 조건) */
const rankHasSupple = computed(
  () =>
    !!rankData.value &&
    (rankData.value.s_rank_res === "e0_80" || !!rankData.value.prev_req_code),
);

async function onOpenSuppleHistory() {
  const code = supCode.value;
  if (!code) return;
  suppleHistoryShow.value = true;
  suppleHistoryLoading.value = true;
  suppleHistoryList.value = [];
  try {
    const res = await fetch(
      `/api/rank/${encodeURIComponent(code)}/supple-history`,
    );
    const json = await res.json();
    suppleHistoryList.value = Array.isArray(json?.data) ? json.data : [];
  } catch (e) {
    console.error("[suppleHistory]", e);
    suppleHistoryList.value = [];
  } finally {
    suppleHistoryLoading.value = false;
  }
}

// 탭 전환 시 데이터 로드 및 노출 제어 관련 computed / watch
// 기관담당자용: 신청접수(접수/반려) 및 탭 노출 제어
const hasCounsel = computed(() => counselList.value.length > 0);
const reqYn = computed(() => support.value?.req_yn || "");
const rankApproved = computed(() => rankData.value?.s_rank_res === "e0_10");

// 상태별 탭 노출 규칙 (sup_code 기준 req_yn / 우선순위 판정)
// - req_yn = e0_00: 지원신청서 + 신청접수, 나머지 비노출
// - req_yn = e0_10: 지원신청서 + 우선순위 (우선순위 미승인)
// - req_yn = e0_10 && 우선순위 s_rank_res = e0_10: 지원신청서 + 우선순위 + 지원계획
const showReceiptTab = computed(
  () => isManager.value && hasCounsel.value && reqYn.value === "e0_00",
);
const showRankTab = computed(
  () => !isApplicant.value && reqYn.value === "e0_10",
);
const showPlanTab = computed(
  () => reqYn.value === "e0_10" && rankApproved.value,
);
const showResultTab = computed(
  () =>
    reqYn.value === "e0_10" &&
    rankApproved.value &&
    // 결정(승인/보완/반려) 처리 직후 재조회 과정에서 resultData가 잠깐 0이 되더라도
    // 결과 탭이 사라지며 "빈 화면"처럼 보이지 않게 현재 탭이면 유지한다.
    (leftTab.value === "result" ||
      selectedPlanCode.value ||
      resultData.value.length > 0),
);

// 탭 전환 시 데이터 로드
watch(leftTab, (tab) => {
  if (tab === "rank" && !rankData.value) loadRankTab();
  if (tab === "plan" && planData.value.length === 0) loadPlanTab();
  if (
    tab === "result" &&
    !selectedPlanCode.value &&
    resultData.value.length === 0
  ) {
    const code = supCode.value;
    if (code) {
      resultLoading.value = true;
      supportStore.supportResultDetail(code, null).finally(() => {
        resultLoading.value = false;
      });
    }
  }
});

// 우선순위 탭 노출이 불가능해지면(예: req_yn !== e0_10) 우선순위 탭에서 자동 이탈
watch(showRankTab, (visible) => {
  if (!visible && leftTab.value === "rank") {
    leftTab.value = "application";
  }
});

// 외부에서 쿼리스트링 tab 변경 시 탭 동기화
watch(
  () => route.query.tab,
  (val) => {
    if (!val) return;
    const allowed = ["application", "receipt", "rank", "plan", "result"];
    if (allowed.includes(val)) {
      leftTab.value = val;
    }
  },
);

// 지원신청서: survey_a 조사지 질문+답 (sup_code로 API 조회) — API는 { surveyName, items } 반환
const surveyAnswers = ref([]);
const surveyName = ref("");
const surveyAnswersLoading = ref(false);
const surveyAnswersError = ref(null);

async function loadSurveyAnswers() {
  const code = supCode.value;
  if (!code) return;
  surveyAnswersLoading.value = true;
  surveyAnswersError.value = null;
  try {
    const res = await fetch(
      `/api/apply/support/${encodeURIComponent(code)}/survey-answers`,
    );
    if (!res.ok) throw new Error("조사지 답변 조회 실패");
    const data = await res.json();
    const rawItems = Array.isArray(data) ? data : data?.items ?? [];
    surveyName.value = data?.surveyName ?? "";
    surveyAnswers.value = rawItems.map((r) => ({
      a_code: r.a_code ?? "",
      q_code: r.q_code ?? "",
      major_name: r.major_name ?? "",
      sub_name: r.sub_name ?? "",
      q_no: r.q_no,
      q_type: r.q_type ?? "f0_00",
      q_content: r.q_content ?? "",
      a_content: r.a_content ?? "",
      views: Array.isArray(r.views) ? r.views : [],
    }));
  } catch (e) {
    surveyAnswersError.value = e.message;
    surveyAnswers.value = [];
    surveyName.value = "";
  } finally {
    surveyAnswersLoading.value = false;
  }
}

// major_name > sub_name 기준으로 그룹화 (표시용)
function groupSurveyAnswers(items) {
  const groups = [];
  let curMajor = null;
  let curSub = null;
  let subGroup = null;
  for (const r of items) {
    if (r.major_name !== curMajor) {
      curMajor = r.major_name;
      curSub = null;
      groups.push({ type: "major", major_name: curMajor, subs: [] });
    }
    const majorObj = groups[groups.length - 1];
    if (r.sub_name !== curSub) {
      curSub = r.sub_name;
      subGroup = { sub_name: curSub, items: [] };
      majorObj.subs.push(subGroup);
    }
    subGroup.items.push(r);
  }
  return groups;
}

const surveyAnswersGrouped = computed(() =>
  groupSurveyAnswers(surveyAnswers.value),
);

// 지원신청서 수정하기 모드 (여러 컴포넌트에서 재사용 가능하도록 추후 composable 분리 가능)
const applicationEditMode = ref(false);
const applicationSaveLoading = ref(false);

function startApplicationEdit() {
  applicationEditMode.value = true;
}

async function saveApplicationEdit() {
  const code = supCode.value;
  if (!code) return;
  const answers = surveyAnswers.value
    .filter((r) => r.a_code)
    .map((r) => ({ a_code: r.a_code, a_content: r.a_content ?? "" }));
  if (answers.length === 0) {
    showAlert("error", "알림", "저장할 답변이 없습니다.");
    return;
  }
  applicationSaveLoading.value = true;
  try {
    const res = await fetch(
      `/api/apply/support/${encodeURIComponent(code)}/survey-answers`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "저장 실패");
    }
    applicationEditMode.value = false;
    await loadSurveyAnswers();
  } catch (e) {
    showAlert("error", "알림", e.message || "저장에 실패했습니다.");
  } finally {
    applicationSaveLoading.value = false;
  }
}

function cancelApplicationEdit() {
  applicationEditMode.value = false;
  loadSurveyAnswers();
}

// 상담 작성자 후보 (m_auth = a0_30 회원 목록, csl_writer select용)
const writerList = ref([]);
const writerListLoading = ref(false);

async function loadWriterList() {
  writerListLoading.value = true;
  try {
    const res = await fetch("/api/apply/members?m_auth=a0_30");
    if (!res.ok) throw new Error("작성자 목록 조회 실패");
    const data = await res.json();
    writerList.value = Array.isArray(data) ? data : [];
  } catch (e) {
    writerList.value = [];
  } finally {
    writerListLoading.value = false;
  }
}

// 상담내역 목록 (sup_code 기준 API 조회)
const counselList = ref([]);
const counselListLoading = ref(false);
const counselListError = ref(null);

async function loadCounsels() {
  const code = supCode.value;
  if (!code) return;
  counselListLoading.value = true;
  counselListError.value = null;
  try {
    const res = await fetch(
      `/api/apply/support/${encodeURIComponent(code)}/counsels`,
    );
    if (!res.ok) throw new Error("상담내역 조회 실패");
    const data = await res.json();
    counselList.value = Array.isArray(data) ? data : [];
  } catch (e) {
    counselListError.value = e.message;
    counselList.value = [];
  } finally {
    counselListLoading.value = false;
  }
}

// 상담내역 보기 패널을 열 때 목록 + 작성자 목록 로드
watch(showRightPanel, (visible) => {
  if (visible && supCode.value) {
    loadCounsels();
    loadWriterList();
  }
});

// 상세보기: 선택한 상담 건을 readonly로 표시
const selectedCounselDetail = ref(null);

function openDetail(item) {
  selectedCounselDetail.value = item;
}

function closeDetail() {
  selectedCounselDetail.value = null;
}

function toggleRightPanel() {
  showRightPanel.value = !showRightPanel.value;
  if (!showRightPanel.value) showForm.value = false;
}

// 상담등록 폼: 제목, 상담일, 내용, 첨부파일
const showForm = ref(false);
const counselForm = ref({
  csl_title: "",
  counselDate: "",
  csl_content: "",
  csl_writer: "",
});
const counselFormSaving = ref(false);
const counselFormFiles = ref(null); // 첨부파일 (UI만, DB 저장은 추후)
function setCounselFiles(files) {
  counselFormFiles.value = files;
}

const openAddForm = () => {
  showForm.value = true;
  closeDetail();
  counselForm.value = {
    csl_title: "",
    counselDate: new Date().toISOString().slice(0, 10),
    csl_content: "",
    csl_writer: writerList.value.length ? writerList.value[0].m_no : "",
  };
  counselFormFiles.value = null;
};

const cancelForm = () => {
  showForm.value = false;
};

// 임시저장 (상담등록 폼, j0_10 = 상담내역) — 재사용: 지원계획 j0_20, 지원결과 j0_30
const {
  showModal: tempStorageModalVisible,
  tempList: tempStorageList,
  tempListLoading: tempStorageListLoading,
  tempSaveLoading: tempSaveLoading,
  saveTemp: doTempSave,
  openLoadModal: openTempStorageModal,
  applyItem: applyTempStorageItem,
} = useTempStorage(() => supCode.value, "j0_10", {
  getPayload: () => ({
    save_title: (counselForm.value?.csl_title ?? "").trim(),
    save_content: JSON.stringify({
      counselDate: counselForm.value?.counselDate ?? "",
      csl_content: counselForm.value?.csl_content ?? "",
      csl_writer: counselForm.value?.csl_writer ?? "",
    }),
  }),
  setPayload: (item) => {
    if (!item) return;
    counselForm.value.csl_title = item.save_title ?? "";
    try {
      const o = JSON.parse(item.save_content || "{}");
      counselForm.value.counselDate = o.counselDate ?? "";
      counselForm.value.csl_content = o.csl_content ?? "";
      counselForm.value.csl_writer = o.csl_writer ?? "";
    } catch {
      // save_content가 JSON이 아닐 수 있음
    }
  },
  validate: (payload) => {
    if (!(payload.save_title && payload.save_title.trim())) {
      return { valid: false, message: "제목을 입력해주세요." };
    }
    return { valid: true };
  },
  onAlert: showAlert,
});

async function saveCounsel(payload) {
  const data =
    payload && typeof payload === "object" ? payload : counselForm.value;
  if (!data?.csl_title?.trim()) {
    showAlert("error", "알림", "제목을 입력해주세요.");
    return;
  }
  if (!data?.counselDate) {
    showAlert("error", "알림", "상담일을 선택해주세요.");
    return;
  }
  if (!data?.csl_writer?.trim()) {
    showAlert("error", "알림", "작성자를 선택해주세요.");
    return;
  }
  const code = supCode.value;
  if (!code) {
    showAlert("error", "알림", "지원번호가 없습니다.");
    return;
  }
  counselFormSaving.value = true;
  try {
    const res = await fetch(
      `/api/apply/support/${encodeURIComponent(code)}/counsels`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csl_title: data.csl_title.trim(),
          csl_date: data.counselDate,
          csl_content: data.csl_content || "",
          csl_writer: data.csl_writer || undefined,
          csl_name: data.csl_writer || undefined,
        }),
      },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "저장 실패");
    }
    showForm.value = false;
    await loadCounsels();
  } catch (e) {
    showAlert("error", "알림", e.message || "저장에 실패했습니다.");
  } finally {
    counselFormSaving.value = false;
  }
}

async function refreshResultTabAfterDecision() {
  if (leftTab.value !== "result") return;
  await loadResultTab();
}

async function updateReqYn(decision) {
  const code = supCode.value;
  if (!code) return;
  try {
    const res = await fetch(
      `/api/apply/support/${encodeURIComponent(code)}/req-yn`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ req_yn: decision }),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(data.message || "신청 상태 변경에 실패했습니다.");
    await loadSupport();
    const label =
      decision === "e0_10"
        ? "신청이 접수되었습니다."
        : "신청이 반려되었습니다.";
    showAlert("success", "알림", label);
    // 신청접수 탭에서 처리 완료 후 탭 이동
    // - 승인(e0_10) 시: 우선순위 탭으로 이동
    // - 반려(e0_99) 시: 지원신청서 탭으로 이동
    leftTab.value = decision === "e0_10" ? "rank" : "application";
  } catch (e) {
    showAlert(
      "error",
      "알림",
      e.message || "신청 상태 변경 중 오류가 발생했습니다.",
    );
  }
}

function onReceiptAccept() {
  updateReqYn("e0_10");
}

function onReceiptReject() {
  updateReqYn("e0_99");
}
</script>

<template>
  <div>
    <div class="container-fluid py-4">
      <div class="row g-4">
        <!-- ─── 좌측: 지원자 정보 + 지원신청서/지원계획/지원결과 (우측 표시 시 col-lg-5) ─── -->
        <div :class="showRightPanel ? 'col-lg-5' : 'col-12'">
          <!-- 상단: 지원자 정보 -->
          <CounselApplicantInfo
            :support="support"
            :dsbl-prs="dsblPrs"
            :dsbl-loading="dsblLoading"
            :dsbl-error="dsblError"
            :show-right-panel="showRightPanel"
            :is-applicant="isApplicant"
            @toggle-panel="toggleRightPanel"
          />

          <!-- 탭: 지원신청서 | 신청접수 | 우선순위 | 지원계획 | 지원결과 (스타일·정렬 통일) -->
          <div
            class="counsel-tab-bar d-flex flex-wrap align-items-center gap-2 mb-3"
          >
            <button
              type="button"
              class="counsel-tab-btn rounded px-3 py-1 text-decoration-none border-0"
              :class="
                leftTab === 'application'
                  ? 'counsel-tab-active fw-bold text-dark'
                  : 'text-muted bg-transparent'
              "
              @click="leftTab = 'application'"
            >
              지원신청서
            </button>
            <button
              v-if="showReceiptTab"
              type="button"
              class="counsel-tab-btn rounded px-3 py-1 text-decoration-none border-0"
              :class="
                leftTab === 'receipt'
                  ? 'counsel-tab-active fw-bold text-dark'
                  : 'text-muted bg-transparent'
              "
              @click="leftTab = 'receipt'"
            >
              신청접수
            </button>
            <button
              v-if="showRankTab"
              type="button"
              class="counsel-tab-btn rounded px-3 py-1 text-decoration-none border-0"
              :class="
                leftTab === 'rank'
                  ? 'counsel-tab-active fw-bold text-dark'
                  : 'text-muted bg-transparent'
              "
              @click="leftTab = 'rank'"
            >
              우선순위
            </button>
            <button
              v-if="showPlanTab"
              type="button"
              class="counsel-tab-btn rounded px-3 py-1 text-decoration-none border-0"
              :class="
                leftTab === 'plan'
                  ? 'counsel-tab-active fw-bold text-dark'
                  : 'text-muted bg-transparent'
              "
              @click="
                leftTab = 'plan';
                loadPlanTab();
              "
            >
              지원계획
            </button>
            <button
              v-if="showResultTab"
              type="button"
              class="counsel-tab-btn rounded px-3 py-1 text-decoration-none border-0"
              :class="
                leftTab === 'result'
                  ? 'counsel-tab-active fw-bold text-dark'
                  : 'text-muted bg-transparent'
              "
              @click="
                leftTab = 'result';
                loadResultTab();
              "
            >
              지원결과
            </button>
          </div>

          <!-- 탭별 컨텐츠 -->
          <div class="card shadow-sm">
            <div class="card-body">
              <!-- 지원신청서 -->
              <CounselApplicationTab
                v-if="leftTab === 'application'"
                :support="support"
                :survey-name="surveyName"
                :survey-answers-grouped="surveyAnswersGrouped"
                :survey-answers-loading="surveyAnswersLoading"
                :survey-answers-error="surveyAnswersError"
                :application-edit-mode="applicationEditMode"
                :application-save-loading="applicationSaveLoading"
                :is-applicant="isApplicant"
                @start-edit="startApplicationEdit"
                @save="saveApplicationEdit"
                @cancel="cancelApplicationEdit"
              />
              <!-- 신청접수 -->
              <CounselReceiptTab
                v-if="leftTab === 'receipt'"
                :has-counsel="hasCounsel"
                :support="support"
                :counsel-list="counselList"
                @accept="onReceiptAccept"
                @reject="onReceiptReject"
              />
              <!-- 우선순위: 탭 선택 시 RankDetail 직접 표시 -->
              <div v-if="leftTab === 'rank' && showRankTab">
                <div
                  class="counsel-section-header d-flex align-items-center justify-content-between mb-3"
                >
                  <h6
                    class="counsel-section-title text-sm text-uppercase text-muted mb-0"
                  >
                    우선순위
                  </h6>
                  <ArgonButton
                    type="button"
                    size="sm"
                    variant="outline"
                    color="secondary"
                    @click="loadRankTab"
                  >
                    새로고침
                  </ArgonButton>
                </div>
                <p v-if="rankLoading" class="text-muted text-sm mb-0">
                  로딩 중...
                </p>
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
                  :read-only="isApplicant"
                  @update:rank_code="(v) => (rankCodeLocal = v)"
                  @update:rank_cmt="(v) => (rankCmtLocal = v)"
                  @approval-request="onRankApprovalRequest"
                  @approve="onRankDecide('e0_10')"
                  @reject="
                    () =>
                      openReasonModal({
                        context: {
                          type: 'rank',
                          decision: 'e0_99',
                          reqCode: rankData?.req_code,
                        },
                        title: '반려 사유',
                        message: '우선순위 반려 사유를 입력해 주세요.',
                        reasonPlaceholder: '반려 사유를 입력해 주세요.',
                        onConfirm: onRankRejectConfirm,
                      })
                  "
                  @supple="
                    () =>
                      openReasonModal({
                        context: {
                          type: 'rank',
                          decision: 'e0_80',
                          reqCode: rankData?.req_code,
                        },
                        title: '보완 사유',
                        message: '우선순위 보완 사유를 입력해 주세요.',
                        reasonPlaceholder: '보완 사유를 입력해 주세요.',
                        onConfirm: onRankSuppleConfirm,
                      })
                  "
                  @cancel="onRankCancel"
                  @open-supple-history="onOpenSuppleHistory"
                />
              </div>
              <!-- 지원계획 -->
              <div v-if="leftTab === 'plan'">
                <!-- 지원계획 추가 폼 -->
                <PlanAdd
                  ref="planAddRef"
                  :sup-code="supCode"
                  :show="showAddPlanForm"
                  :read-only="isApplicant"
                  @toggle="toggleAddPlan"
                  @approval-request="onPlanApprovalRequestFromAdd"
                  @cancel="openPlanCancelModal('add')"
                  @alert="
                    (p) =>
                      showAlert(
                        p.type ?? 'error',
                        p.title ?? '알림',
                        p.message ?? '',
                      )
                  "
                />
                <!-- 지원계획 -->
                <SupportPlanDetail
                  v-for="plan in planData"
                  :key="plan.plan_code"
                  :ref="(el) => setPlanDetailRef(plan.plan_code, el)"
                  :plan_code="plan.plan_code"
                  :support_plan_title="plan.plan_goal"
                  :support_plan_content="plan.plan_content"
                  :start_time="plan.start_time"
                  :end_time="plan.end_time"
                  :support_plan_file="plan.origin_file_name"
                  :file_code="plan.file_code"
                  :plan_result="plan.plan_tf"
                  :plan_date="plan.plan_date"
                  :support_plan_comment="plan.plan_cmt"
                  :support_plan_reject_comment="plan.plan_cmt"
                  :support_plan_updday="plan.plan_updday"
                  :cancel-request="cancelRequestPlanCode"
                  :has_supple="
                    !!(plan.plan_tf === 'e0_80' || plan.prev_plan_code)
                  "
                  @result="loadResultForPlan"
                  @open-supple-history="openPlanSuppleHistory(plan.plan_code)"
                  @approve="
                    (pc) =>
                      supportStore
                        .decidePlan(pc, 'e0_10', null)
                        .then(() => loadPlanTab())
                  "
                  @supple="
                    (pc) =>
                      openReasonModal({
                        context: {
                          type: 'plan',
                          decision: 'e0_80',
                          planCode: pc,
                        },
                        title: '보완 사유',
                        message: '지원계획 보완 사유를 입력해 주세요.',
                        reasonPlaceholder: '보완 사유를 입력해 주세요.',
                        onConfirm: async ({ context, reason }) => {
                          const res = await supportStore.decidePlan(
                            context.planCode,
                            context.decision,
                            reason ?? null,
                          );
                          if (res?.retCode === 'Success') {
                            await loadPlanTab();
                            const p = getAlertPreset(
                              context.decision === 'e0_80'
                                ? 'suppleComplete'
                                : 'rejectComplete',
                              'plan',
                            );
                            showAlert(p.type, p.title, res.retMsg ?? p.message);
                          } else if (res != null) {
                            showAlert(
                              'error',
                              '알림',
                              res.retMsg ?? '처리에 실패했습니다.',
                            );
                          }
                        },
                      })
                  "
                  @reject="
                    (pc) =>
                      openReasonModal({
                        context: {
                          type: 'plan',
                          decision: 'e0_99',
                          planCode: pc,
                        },
                        title: '반려 사유',
                        message: '지원계획 반려 사유를 입력해 주세요.',
                        reasonPlaceholder: '반려 사유를 입력해 주세요.',
                        onConfirm: async ({ context, reason }) => {
                          const res = await supportStore.decidePlan(
                            context.planCode,
                            context.decision,
                            reason ?? null,
                          );
                          if (res?.retCode === 'Success') {
                            await loadPlanTab();
                            const p = getAlertPreset(
                              context.decision === 'e0_80'
                                ? 'suppleComplete'
                                : 'rejectComplete',
                              'plan',
                            );
                            showAlert(p.type, p.title, res.retMsg ?? p.message);
                          } else if (res != null) {
                            showAlert(
                              'error',
                              '알림',
                              res.retMsg ?? '처리에 실패했습니다.',
                            );
                          }
                        },
                      })
                  "
                  @edit-complete="onPlanEditComplete"
                  @approval-request="onPlanApprovalRequest"
                  @request-cancel="
                    (planCode) => openPlanCancelModal('edit', planCode)
                  "
                  @cancel-done="clearCancelRequestPlan"
                  @end="
                    (pc) => supportStore.endPlan(pc).then(() => loadPlanTab())
                  "
                  @temp-save="onTempSaveFromDetailPlan"
                  @history="(planCode) => openPlanHistory(planCode)"
                  @alert="
                    (p) => showAlert(p.type ?? 'error', '알림', p.message ?? '')
                  "
                />
              </div>
              <!-- 지원결과 -->
              <div v-if="leftTab === 'result'">
                <!-- 지원결과 추가 폼 -->
                <ResultAdd
                  ref="resultAddRef"
                  :sup-code="supCode"
                  :show="showAddResultForm"
                  :read-only="isApplicant"
                  @toggle="toggleAddResultForm"
                  @approval-request="onResultApprovalRequestFromAdd"
                  @cancel="openResultCancelModal('add')"
                  @alert="
                    (p) =>
                      showAlert(
                        p.type ?? 'error',
                        p.title ?? '알림',
                        p.message ?? '',
                      )
                  "
                />
                <!-- 지원결과 -->
                <SupportResultDetail
                  v-for="result in resultData"
                  :key="result.result_code"
                  :ref="(el) => setResultDetailRef(result.result_code, el)"
                  :result_code="result.result_code"
                  :result_title="result.result_title"
                  :result_content="result.result_content"
                  :result_date="result.result_date"
                  :result_tf="result.result_tf"
                  :result_cmt="result.result_cmt"
                  :result_updday="result.result_updday"
                  :result_result="result.result_tf"
                  :cancel-request="cancelRequestResultCode"
                  :has_supple="
                    !!(result.result_tf === 'e0_80' || result.prev_result_code)
                  "
                  @open-supple-history="
                    openResultSuppleHistory(result.result_code)
                  "
                  @approve="
                    async (rc) => {
                      const res = await supportStore.decideResult(
                        rc,
                        'e0_10',
                        null,
                      );
                      if (res?.retCode === 'Success') {
                        const p = getAlertPreset('approvalComplete', 'result');
                        showAlert(p.type, p.title, res.retMsg ?? p.message);
                        await refreshResultTabAfterDecision();
                      } else if (res != null) {
                        showAlert(
                          'error',
                          '알림',
                          res.retMsg ?? '처리에 실패했습니다.',
                        );
                      } else {
                        showAlert('error', '알림', '처리에 실패했습니다.');
                      }
                    }
                  "
                  @supple="
                    (rc) =>
                      openReasonModal({
                        context: {
                          type: 'result',
                          decision: 'e0_80',
                          resultCode: rc,
                        },
                        title: '보완 사유',
                        message: '지원결과 보완 사유를 입력해 주세요.',
                        reasonPlaceholder: '보완 사유를 입력해 주세요.',
                        onConfirm: async ({ context, reason }) => {
                          const code = supCode.value;
                          const res = await supportStore.decideResult(
                            context.resultCode,
                            context.decision,
                            reason ?? null,
                          );
                          if (res?.retCode === 'Success') {
                            await refreshResultTabAfterDecision();
                            const p = getAlertPreset(
                              context.decision === 'e0_80'
                                ? 'suppleComplete'
                                : 'rejectComplete',
                              'result',
                            );
                            showAlert(p.type, p.title, res.retMsg ?? p.message);
                          } else if (res != null) {
                            showAlert(
                              'error',
                              '알림',
                              res.retMsg ?? '처리에 실패했습니다.',
                            );
                          }
                        },
                      })
                  "
                  @reject="
                    (rc) =>
                      openReasonModal({
                        context: {
                          type: 'result',
                          decision: 'e0_99',
                          resultCode: rc,
                        },
                        title: '반려 사유',
                        message: '지원결과 반려 사유를 입력해 주세요.',
                        reasonPlaceholder: '반려 사유를 입력해 주세요.',
                        onConfirm: async ({ context, reason }) => {
                          const code = supCode.value;
                          const res = await supportStore.decideResult(
                            context.resultCode,
                            context.decision,
                            reason ?? null,
                          );
                          if (res?.retCode === 'Success') {
                            await refreshResultTabAfterDecision();
                            const p = getAlertPreset(
                              context.decision === 'e0_80'
                                ? 'suppleComplete'
                                : 'rejectComplete',
                              'result',
                            );
                            showAlert(p.type, p.title, res.retMsg ?? p.message);
                          } else if (res != null) {
                            showAlert(
                              'error',
                              '알림',
                              res.retMsg ?? '처리에 실패했습니다.',
                            );
                          }
                        },
                      })
                  "
                  @edit-complete="onResultEditComplete"
                  @approval-request="onResultApprovalRequest"
                  @request-cancel="
                    (resultCode) => openResultCancelModal('edit', resultCode)
                  "
                  @cancel-done="clearCancelRequestResult"
                  @temp-save="onTempSaveFromDetailResult"
                  @history="(resultCode) => openResultHistory(resultCode)"
                  @alert="
                    (p) => showAlert(p.type ?? 'error', '알림', p.message ?? '')
                  "
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ─── 우측: 상담내역 ─── -->
        <CounselRightPanel
          v-if="showRightPanel"
          class="col-lg-7"
          :read-only="isApplicant"
          :counsel-list="counselList"
          :counsel-list-loading="counselListLoading"
          :counsel-list-error="counselListError"
          :writer-list="writerList"
          :writer-list-loading="writerListLoading"
          :show-form="showForm"
          :counsel-form="counselForm"
          @update:counsel-form="
            (obj) => Object.assign(counselForm.value || {}, obj)
          "
          :counsel-form-saving="counselFormSaving"
          :temp-save-loading="tempSaveLoading"
          :temp-storage-list-loading="tempStorageListLoading"
          :selected-counsel-detail="selectedCounselDetail"
          @open-add-form="openAddForm"
          @close-detail="closeDetail"
          @open-detail="openDetail"
          @cancel-form="cancelForm"
          @save-counsel="(payload) => saveCounsel(payload)"
          @temp-save="doTempSave"
          @open-temp-load="openTempStorageModal"
          @set-counsel-files="setCounselFiles"
        />
      </div>
    </div>

    <!-- 임시저장 불러오기 모달 (공통 컴포넌트) -->
    <TempStorageModal
      v-model="tempStorageModalVisible"
      :list="tempStorageList"
      :loading="tempStorageListLoading"
      @select="applyTempStorageItem"
    />
    <!-- 지원계획: 승인요청 확인 / 취소 확인 -->
    <ConfirmModal
      :show="planApprovalConfirm.show"
      title="승인 요청"
      message="지원 계획 승인 요청을 하시겠습니까?"
      @close="closePlanApprovalConfirm"
      @confirm="onPlanApprovalConfirmYes"
    />
    <ConfirmModal
      :show="planCancelModal.show"
      title="지원 계획 취소"
      message="작성 중인 지원 계획을 취소하시겠습니까?"
      warning-message="임시저장 되지 않은 계획은 삭제 시 복구가 불가합니다."
      @close="closePlanCancelModal"
      @confirm="onPlanCancelModalConfirm"
    />
    <!-- 지원결과: 승인요청 확인 / 취소 확인 -->
    <ConfirmModal
      :show="resultApprovalConfirm.show"
      title="승인 요청"
      message="지원 결과 승인 요청을 하시겠습니까?"
      @close="closeResultApprovalConfirm"
      @confirm="onResultApprovalConfirmYes"
    />
    <ConfirmModal
      :show="resultCancelModal.show"
      title="지원 결과 취소"
      message="작성 중인 지원 결과를 취소하시겠습니까?"
      warning-message="임시저장 되지 않은 결과는 삭제 시 복구가 불가합니다."
      @close="closeResultCancelModal"
      @confirm="onResultCancelModalConfirm"
    />
    <!-- 계획/결과 0건일 때 등록 유도 -->
    <ConfirmModal
      :show="planCreateConfirm"
      title="지원계획 등록"
      message="등록된 지원계획이 없습니다. 새 지원계획을 등록하시겠습니까?"
      @close="planCreateConfirm = false"
      @confirm="onPlanCreateConfirmYes"
    />
    <ConfirmModal
      :show="resultCreateConfirm"
      title="지원결과 등록"
      message="등록된 지원결과가 없습니다. 새 지원결과를 등록하시겠습니까?"
      @close="resultCreateConfirm = false"
      @confirm="onResultCreateConfirmYes"
    />
    <!-- 보완/반려 사유 입력 (우선순위·지원계획·지원결과) -->
    <ConfirmModal
      :show="reasonModal.show"
      :title="reasonModal.title"
      :message="reasonModal.message"
      :show-reason="reasonModal.showReason"
      :reason-placeholder="reasonModal.reasonPlaceholder"
      :reason-label="reasonModal.reasonLabel"
      @close="closeReasonModal"
      @confirm="onReasonConfirm"
    />
    <!-- 알림 모달 -->
    <AlertModal
      :show="alertModal.show"
      :type="alertModal.type"
      :title="alertModal.title"
      :message="alertModal.message"
      @close="closeAlertModal"
    />
    <!-- 수정이력 모달 (계획/결과 공용) -->
    <HistoryModal
      :show="historyModal.show"
      :title="historyModal.title"
      :list="historyModal.list"
      :loading="historyModal.loading"
      @close="closeHistoryModal"
    />

    <!-- 우선순위 보완이력 모달 -->
    <SuppleHistoryModal
      :show="suppleHistoryShow"
      :list="suppleHistoryList"
      :loading="suppleHistoryLoading"
      variant="rank"
      @close="suppleHistoryShow = false"
    />

    <!-- 지원계획 보완이력 모달 -->
    <SuppleHistoryModal
      :show="planSuppleHistoryShow"
      :list="planSuppleHistoryList"
      :loading="false"
      variant="plan"
      @close="planSuppleHistoryShow = false"
    />

    <!-- 지원결과 보완이력 모달 -->
    <SuppleHistoryModal
      :show="resultSuppleHistoryShow"
      :list="resultSuppleHistoryList"
      :loading="false"
      variant="result"
      @close="resultSuppleHistoryShow = false"
    />
  </div>
</template>

<style scoped>
.ni {
  font-size: 1rem;
}
.counsel-survey-list .counsel-survey-item:last-child {
  border-bottom: none !important;
}
/* 탭 버튼: 전역 .counsel-tab-btn / .counsel-tab-active 사용, 비활성만 보완 */
.counsel-tab-btn {
  background: transparent;
  cursor: pointer;
}
.counsel-tab-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
