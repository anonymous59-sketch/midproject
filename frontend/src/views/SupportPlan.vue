<script setup>
/**
 * 지원계획 페이지 (SupportPlan)
 * ----------------------------------------
 * - 역할: 한 건의 지원(sup_code)에 대한 지원계획 목록 조회·추가·수정·승인/보완/반려·연장·종료
 * - URL: /support/:supportCode (supportCode = 지원 코드)
 * - 데이터: Pinia supportStore의 planData(계획 목록), infoData(지원 기본정보)
 * - 주요 플로우:
 *   1) 계획추가 → 추가 폼 오픈 → 승인요청 확인 → insertPlan + 첨부 업로드 → 목록 갱신
 *   2) 상세 수정 → 수정완료 → updatePlan + 첨부 삭제/추가 → 목록·첨부 재조회
 *   3) 승인/보완/반려 → 사유 모달 → decidePlan → 목록 갱신
 *   4) 연장 → 새 종료일 선택 모달 → updatePlan(end_date) → 목록 갱신
 *   5) 종료 → 확인 모달 → endPlan(end_time=NOW()) → 목록 갱신
 *   6) 결과조회 → 결과 0건이면 알림+확인 후 '네'일 때만 결과 페이지 이동(선택 시 추가폼 오픈)
 */
// ========== import ==========
import { ref, reactive, computed, onBeforeMount } from "vue";
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
/** URL 파라미터: 지원 코드. 이 값으로 계획 목록·정보 조회 API 호출 */
const supportCode = route.params.supportCode;

const supportStore = useSupportStore();
/** 계획 목록(배열), 지원 기본정보(대상자명·담당자 등). store 갱신 시 자동 반영 */
const { planData, infoData } = storeToRefs(supportStore);
const {
  supportPlanDetail,
  insertPlan,
  updatePlan,
  decidePlan,
  endPlan,
  fetchResultListForPlan,
} = supportStore;

/** 계획 추가 폼 표시 여부. true일 때 카드 형태의 추가 폼이 노출됨 */
const showAddPlanForm = ref(false);
/** 계획 추가 폼 입력값. 승인요청 시 insertPlan body로 전달됨 (plan_goal, plan_content, start_date, end_date) */
const addForm = reactive({
  title: "",
  content: "",
  startDate: "",
  endDate: "",
});
/** 추가 폼에서 선택한 File 객체 배열. 승인요청 완료 후 새 plan_code 기준으로 file-content 업로드 */
const addPlanFiles = ref([]);
/** <input type="file"> ref. 프로그래매틱 클릭으로 파일 선택 다이얼로그 띄움 */
const addPlanFileInput = ref(null);

/**
 * 추가 폼에서 파일 선택 시 호출.
 * 10MB 초과 파일이 있으면 AlertModal(error)로 목록 표시 후 선택 취소, 아니면 addPlanFiles 갱신.
 */
function onPlanFileChange(e) {
  const files = Array.from(e.target.files || []);
  // 10MB 초과 파일 필터링
  const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
  // 10MB 초과 파일이 있으면 AlertModal창 띄우고 선택 취소
  if (oversized.length > 0) {
    showAlert(
      "error",
      "알림",
      `파일 용량이 10MB를 초과합니다:\n${oversized
        .map((f) => f.name)
        .join("\n")}`,
    );
    if (addPlanFileInput.value) addPlanFileInput.value.value = "";
    return;
  }
  addPlanFiles.value = files;
}
/** "파일을 선택하세요" 영역 클릭 시 숨겨진 <input type="file">을 트리거해 파일 선택 다이얼로그 오픈 */
function openPlanFileDialog() {
  if (addPlanFileInput.value) addPlanFileInput.value.click();
}
/** 추가 폼에 선택된 파일이 있으면 파일명을 콤마로 이어 붙인 문자열, 없으면 빈 문자열 (UI 표시용) */
const addPlanFileNames = computed(() =>
  addPlanFiles.value.length
    ? addPlanFiles.value.map((f) => f.name).join(", ")
    : "",
);

/** 반려/보완 사유 모달 상태. type: 'reject'|'supple', planCode로 decidePlan 호출 */
const reasonModal = ref({
  show: false,
  type: "reject",
  planCode: null,
  planCmt: "",
});
/** 취소 확인 모달. context 'add'=추가폼 닫기, 'edit'=상세 수정 취소(planCode로 해당 카드에 cancelRequest 전달) */
const cancelModal = ref({ show: false, context: "add", planCode: null });
/** 취소 확인 후 SupportPlanDetail에 전달할 plan_code. 해당 카드가 cancelRequest와 일치하면 수정 취소 처리 */
const cancelRequestPlanCode = ref(null);
/** 승인요청 확인 모달. source 'add'=추가폼에서, 'detail'=상세에서( payload: { planCode, title, content } ) */
const approvalConfirm = ref({ show: false, source: "add", payload: null });

/** 단순 알림(AlertModal) 상태. type: success|error 등, message가 비거나 '조회 완료' 등이면 띄우지 않음 */
const alertModal = ref({
  show: false,
  type: "success",
  title: "알림",
  message: "",
});
/** 결과 0건 알림 닫은 뒤 '결과를 작성하시겠습니까?' 확인 모달을 띄우기 위한 플래그 */
const pendingNoResultConfirm = ref(false);
const noResultPlanCode = ref(null);
const noResultConfirmModal = ref({ show: false });

/** 계획 연장 모달. 연장 버튼 클릭 시 해당 계획 정보를 담고, 새 종료일 선택 후 updatePlan 호출 */
const extendModal = ref({
  show: false,
  planCode: null,
  plan_goal: "",
  plan_content: "",
  start_time: "",
  end_time: "",
});
/** 연장 모달에서 사용자가 선택한 새 종료일 (YYYY-MM-DD). 기본값은 현재 종료일+1년 */
const extendNewEndDate = ref("");

/** 계획 종료 확인 모달. 확인 시 endPlan(planCode) 호출 → end_time = NOW() */
const endConfirmModal = ref({ show: false, planCode: null });

// ========== 유틸 / 모달·알림 함수 ==========
/** API 등에서 오는 날짜(시간) 문자열을 input[type=date]용 YYYY-MM-DD로 자르기 */
function toDateOnly(val) {
  if (!val) return "";
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}
/** 날짜 문자열에 1년을 더한 YYYY-MM-DD 반환. 연장 모달 기본값 등에 사용 */
function addOneYear(dateStr) {
  if (!dateStr) return "";
  const d = new Date(toDateOnly(dateStr));
  if (Number.isNaN(d.getTime())) return "";
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}
/** AlertModal 띄우기. message가 없거나 '조회 완료'·'조회 성공'이면 무시 (불필요 알림 방지) */
function showAlert(type, title, message) {
  const m = (message ?? "").trim();
  if (!m || m === "조회 완료" || m === "조회 성공") return;
  alertModal.value = { show: true, type, title, message: m };
}
/** 알림 모달을 닫는다. (결과 0건 플로우면 이어서 확인 모달 오픈) */
function closeAlertModal() {
  alertModal.value.show = false;
  if (pendingNoResultConfirm.value) {
    pendingNoResultConfirm.value = false;
    noResultConfirmModal.value = { show: true };
  }
}

/** 계획 추가 폼을 열거나 닫고, 닫을 때 입력값을 비운다. */
function toggleAddPlan() {
  showAddPlanForm.value = !showAddPlanForm.value;
  if (!showAddPlanForm.value) {
    addForm.title = "";
    addForm.content = "";
    addForm.startDate = "";
    addForm.endDate = "";
    addPlanFiles.value = [];
  }
}

/** 반려/보완 사유 모달을 연다. */
function openReasonModal(type, planCode, planCmt) {
  reasonModal.value = { show: true, type, planCode, planCmt: planCmt ?? "" };
}
/** 반려/보완 사유 모달을 닫는다. */
function closeReasonModal() {
  reasonModal.value = { ...reasonModal.value, show: false };
}

/** 취소 확인 모달을 연다. (context: 'add' | 'detail', planCode) */
function openCancelModal(context, planCode = null) {
  cancelModal.value = { show: true, context, planCode };
}
/** 취소 확인 모달을 닫는다. */
function closeCancelModal() {
  cancelModal.value = { show: false, context: "add", planCode: null };
}
/** 취소 확인 모달에서 확인 시: 추가 폼이면 폼만 닫고, 상세 취소면 취소 완료 알림 후 모달 닫기 */
function onCancelModalConfirm() {
  if (cancelModal.value.context === "add") {
    showAddPlanForm.value = false;
    addForm.title = "";
    addForm.content = "";
    addForm.startDate = "";
    addForm.endDate = "";
  } else {
    cancelRequestPlanCode.value = cancelModal.value.planCode;
    showAlert("success", "알림", "수정이 취소되었습니다.");
  }
  closeCancelModal();
}
/** 취소 요청 완료 후 알림용 plan_code를 초기화한다. */
function clearCancelRequest() {
  cancelRequestPlanCode.value = null;
}

/** 승인요청 확인 모달을 닫는다. */
function closeApprovalConfirm() {
  approvalConfirm.value = { show: false, source: "add", payload: null };
}

/** 수정이력 버튼. 현재는 구현 중 알림만 */
function updHistory() {
  showAlert("error", "알림", "구현 중입니다.");
}
/**
 * 결과조회 버튼 클릭 시 호출.
 * 해당 계획의 결과 건수를 조회하고, 0건이면 알림 후 확인 모달(결과 작성 여부)만 띄움.
 * 1건 이상이면 바로 SupportResult 페이지로 이동. 확인 모달에서 '네' 선택 시 이동하며 openAddForm=1 로 추가 폼 오픈.
 */
async function result(planCode) {
  const list = await fetchResultListForPlan(supportCode, planCode);
  if (list.length === 0) {
    showAlert("error", "알림", "지원결과가 존재하지 않습니다.");
    pendingNoResultConfirm.value = true;
    noResultPlanCode.value = planCode;
    return;
  }
  router.push({
    name: "SupportResult",
    params: { supportCode },
    query: planCode ? { planCode } : {},
  });
}
/** 결과 0건 확인 모달에서 '네' 선택 시: 결과 페이지로 이동하며 query.openAddForm=1 로 추가 폼 자동 오픈 */
function onNoResultConfirmYes() {
  const planCode = noResultPlanCode.value;
  noResultConfirmModal.value = { show: false };
  noResultPlanCode.value = null;
  router.push({
    name: "SupportResult",
    params: { supportCode },
    query: planCode ? { planCode, openAddForm: "1" } : { openAddForm: "1" },
  });
}
function closeNoResultConfirm() {
  noResultConfirmModal.value = { show: false };
  noResultPlanCode.value = null;
}
/**
 * 선택된 파일들을 서버에 업로드.
 * POST /api/upload/file-content (multipart) 호출. 한 건씩 순차 전송.
 * 서버에서 file_category(PK) 기준 DB INSERT + 물리 파일 저장까지 처리.
 * @param {File[]} files - 업로드할 File 객체 배열
 * @param {string} filePath - 저장 경로 구분 (예: 'plan', 'result')
 * @param {string} categoryPk - file_category (계획이면 plan_code, 결과면 result_code)
 * @param {string|null} uploadMem - 업로드자 mgr_no (없으면 서버에서 계획/결과 기준으로 조회)
 */
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

/**
 * v-for 내 SupportPlanDetail 인스턴스를 plan_code 키로 보관.
 * 수정 완료 후 해당 카드의 첨부파일만 재조회(reloadFiles)할 때 사용.
 */
const planDetailRefs = {};
function setPlanDetailRef(planCode, el) {
  if (el) planDetailRefs[planCode] = el;
  else delete planDetailRefs[planCode];
}
// 아래 두 함수는 현재 미사용 스텁 (추후 구현 예정)
function onCancel() {
  console.log("취소");
}
function onAddPlan() {
  console.log("계획추가");
}

/** 특정 계획에 대해 반려/보완 사유 모달을 연다. */
function openReasonModalForPlan(type, planCode) {
  openReasonModal(type, planCode, "");
}
/** 계획을 승인(e0_10) 처리한다. */
async function onApprove(planCode) {
  const res = await decidePlan(planCode, "e0_10", null);
  if (res?.retCode === "Success") {
    await supportPlanDetail(supportCode);
    const p = getAlertPreset("approvalComplete", "plan");
    showAlert(p.type, p.title, res.retMsg ?? p.message);
  } else if (res != null)
    showAlert("error", "알림", res.retMsg ?? "처리 중 오류가 발생했습니다.");
}
/** 보완 사유 모달을 연다. */
function supple(planCode) {
  openReasonModalForPlan("supple", planCode);
}
/** 반려 사유 모달을 연다. */
function reject(planCode) {
  openReasonModalForPlan("reject", planCode);
}
/** 반려/보완 사유 확인 시 decidePlan 호출 후 목록 갱신·알림 */
async function onReasonConfirm(reason) {
  const { planCode, type } = reasonModal.value;
  const decision = type === "reject" ? "e0_99" : "e0_80";
  const res = await decidePlan(planCode, decision, reason);
  closeReasonModal();
  if (res?.retCode === "Success") {
    await supportPlanDetail(supportCode);
    const presetKey =
      decision === "e0_99" ? "rejectComplete" : "suppleComplete";
    const p = getAlertPreset(presetKey, "plan");
    showAlert(p.type, p.title, res.retMsg ?? p.message);
  } else if (res != null)
    showAlert("error", "알림", res.retMsg ?? "처리 중 오류가 발생했습니다.");
}

/** 추가 폼에서 승인요청 확인 모달을 연다. */
function onApprovalRequestFromAdd() {
  approvalConfirm.value = { show: true, source: "add", payload: null };
}
/** 상세에서 승인요청 시 확인 모달을 연다. */
function onApprovalRequest(payload) {
  approvalConfirm.value = { show: true, source: "detail", payload };
}
/** 승인요청 확인 모달에서 확인: 추가면 insertPlan, 상세면 updatePlan 후 목록 갱신·알림 */
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
      // 첨부파일이 있으면 업로드 (DB INSERT + 물리 파일 저장 한 번에)
      const newPlanCode = res?.plan_code ?? null;
      if (newPlanCode && addPlanFiles.value.length > 0) {
        await uploadFilesToServer(
          addPlanFiles.value,
          "plan",
          newPlanCode,
          infoData?.mgr_no ?? null,
        );
      }
      await supportPlanDetail(supportCode);
      showAddPlanForm.value = false;
      addForm.title = "";
      addForm.content = "";
      addForm.startDate = "";
      addForm.endDate = "";
      addPlanFiles.value = [];
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
/**
 * 상세 카드에서 수정완료 시 호출.
 * updatePlan(제목·내용·시작일·종료일) 후, 삭제 대상 첨부 DELETE·신규 첨부 file-content 업로드,
 * 목록 재조회 및 해당 카드 reloadFiles로 첨부 목록 즉시 반영.
 */
async function onEditComplete(payload) {
  if (!payload?.planCode) return;
  const res = await updatePlan(payload.planCode, {
    plan_goal: payload.title ?? "",
    plan_content: payload.content ?? "",
    start_date: payload.startDate ?? null,
    end_date: payload.endDate ?? null,
  });
  if (res?.retCode === "Success") {
    // 첨부파일 삭제/추가 처리
    const codesToDelete = Array.isArray(payload.deleteFileCodes)
      ? payload.deleteFileCodes
      : payload.deleteFile && payload.fileCode
        ? [payload.fileCode]
        : [];
    if (codesToDelete.length > 0) {
      try {
        await Promise.all(
          codesToDelete.map((code) =>
            fetch(`/api/upload/file/${encodeURIComponent(code)}`, {
              method: "DELETE",
            }),
          ),
        );
      } catch (e) {
        console.error("계획 첨부파일 삭제 호출 중 에러", e);
      }
    }
    if (Array.isArray(payload.newFiles) && payload.newFiles.length > 0) {
      await uploadFilesToServer(
        payload.newFiles,
        "plan",
        payload.planCode,
        infoData?.mgr_no ?? null,
      );
    }
    await supportPlanDetail(supportCode);
    const detail = planDetailRefs[payload.planCode];
    if (detail?.reloadFiles) {
      await detail.reloadFiles();
    }
  } else if (res != null) {
    showAlert("error", "알림", res.retMsg ?? "수정 중 오류가 발생했습니다.");
  }
}
/** 임시저장 버튼 (추가 폼). */
function onTempSaveFromAdd() {
  showAlert("error", "알림", "구현 중입니다.");
}
/** 상세(수정)에서 임시저장 버튼. */
function onTempSaveFromDetail() {
  showAlert("error", "알림", "구현 중입니다.");
}
/** 임시저장 불러오기 버튼. */
function onLoadTemp() {
  showAlert("error", "알림", "구현 중입니다.");
}

/**
 * 연장 버튼 클릭 시: planData에서 해당 계획을 찾아 연장 모달에 넣고, 새 종료일 기본값을 현재 종료일+1년으로 설정.
 */
function onExtend(planCode) {
  const plan = (planData.value ?? []).find((p) => p.plan_code === planCode);
  if (!plan) return;
  extendModal.value = {
    show: true,
    planCode: plan.plan_code,
    plan_goal: plan.plan_goal ?? "",
    plan_content: plan.plan_content ?? "",
    start_time: plan.start_time ?? "",
    end_time: plan.end_time ?? "",
  };
  extendNewEndDate.value =
    addOneYear(plan.end_time) || toDateOnly(plan.end_time) || "";
}
function closeExtendModal() {
  extendModal.value = {
    show: false,
    planCode: null,
    plan_goal: "",
    plan_content: "",
    start_time: "",
    end_time: "",
  };
  extendNewEndDate.value = "";
}
/** 연장 모달 확인: 선택한 새 종료일로 updatePlan(plan_goal, plan_content, start_date, end_date) 호출 후 목록·알림 처리 */
async function onExtendConfirm() {
  const { planCode, plan_goal, plan_content, start_time } = extendModal.value;
  if (!planCode || !extendNewEndDate.value) {
    showAlert("error", "알림", "새 종료일을 선택해 주세요.");
    return;
  }
  const res = await updatePlan(planCode, {
    plan_goal,
    plan_content,
    start_date: toDateOnly(start_time) || null,
    end_date: extendNewEndDate.value,
  });
  closeExtendModal();
  if (res?.retCode === "Success") {
    await supportPlanDetail(supportCode);
    showAlert("success", "알림", "계획 연장이 완료되었습니다.");
  } else if (res != null) {
    showAlert("error", "알림", res.retMsg ?? "연장 처리에 실패했습니다.");
  }
}

/** 종료 버튼 클릭 시: 종료 확인 모달만 오픈. 확인 시 onEndConfirm에서 endPlan 호출 */
function onEndPlan(planCode) {
  endConfirmModal.value = { show: true, planCode };
}
function closeEndConfirm() {
  endConfirmModal.value = { show: false, planCode: null };
}
/** 종료 확인 모달에서 '네' 선택: PUT /plan/:planCode/end 호출(end_time=NOW()), 목록 재조회 후 성공 알림 */
async function onEndConfirm() {
  const planCode = endConfirmModal.value.planCode;
  closeEndConfirm();
  if (!planCode) return;
  const res = await endPlan(planCode);
  if (res?.retCode === "Success") {
    await supportPlanDetail(supportCode);
    showAlert("success", "알림", res.retMsg ?? "계획이 종료되었습니다.");
  } else if (res != null) {
    showAlert("error", "알림", res.retMsg ?? "종료 처리에 실패했습니다.");
  }
}

// ========== 라이프사이클 훅 ==========
// 마운트 전 해당 지원(supportCode)의 계획 목록 최초 조회
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
    <div class="d-flex justify-content-end gap-2 mb-2">
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
        <div class="d-flex justify-content-end gap-2 mb-3">
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="onLoadTemp"
          >
            임시저장 불러오기
          </button>
          <button
            type="button"
            class="btn btn-sm btn-secondary"
            @click="onTempSaveFromAdd"
          >
            임시저장
          </button>
        </div>
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
          <input
            ref="addPlanFileInput"
            type="file"
            class="d-none"
            multiple
            @change="onPlanFileChange"
          />
          <button
            type="button"
            class="form-control form-control-sm text-start bg-white"
            @click="openPlanFileDialog"
          >
            <span v-if="addPlanFileNames">{{ addPlanFileNames }}</span>
            <span v-else class="text-muted">
              파일을 선택하세요. 10MB 초과 불가.
            </span>
          </button>
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
    <SupportPlanDetail
      v-for="item in planData ?? []"
      :key="item.plan_code"
      :ref="(el) => setPlanDetailRef(item.plan_code, el)"
      :plan_code="item.plan_code"
      :support_plan_title="item.plan_goal"
      :support_plan_content="item.plan_content"
      :start_time="item.start_time ?? ''"
      :end_time="item.end_time ?? ''"
      :support_plan_file="item.origin_file_name"
      :file_code="item.file_code"
      :support_plan_updday="item.plan_updday"
      :support_plan_tf="item.plan_tf"
      :support_plan_comment="item.plan_cmt"
      :plan_date="item.plan_date"
      @history="updHistory"
      @result="result"
      @edit-complete="onEditComplete"
      @approve="onApprove"
      @supple="supple"
      @reject="reject"
      :cancel-request="cancelRequestPlanCode"
      @cancel-done="clearCancelRequest"
      @approval-request="onApprovalRequest"
      @request-cancel="(planCode) => openCancelModal('edit', planCode)"
      @temp-save="onTempSaveFromDetail"
      @cancel="onCancel"
      @add-plan="onAddPlan"
      :plan_result="item.plan_tf"
      @alert="(p) => showAlert(p.type ?? 'error', '알림', p.message ?? '')"
      @extend="onExtend"
      @end="onEndPlan"
    />
    <!-- 계획 연장 모달: 새 종료일 선택 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="extendModal.show"
          class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style="background: rgba(0, 0, 0, 0.5); z-index: 1050"
          @click.self="closeExtendModal"
        >
          <div class="card shadow rounded" style="min-width: 20rem">
            <div class="card-header rounded-top">계획 연장</div>
            <div class="card-body">
              <p class="mb-2">새 종료일을 선택하세요.</p>
              <input
                v-model="extendNewEndDate"
                type="date"
                class="form-control form-control-sm mb-3"
              />
              <div class="d-flex gap-2 justify-content-end">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary"
                  @click="closeExtendModal"
                >
                  취소
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-primary"
                  @click="onExtendConfirm"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <ConfirmModal
      :show="endConfirmModal.show"
      title="계획 종료"
      message="이 계획을 종료하시겠습니까? 종료일이 오늘로 설정됩니다."
      @close="closeEndConfirm"
      @confirm="onEndConfirm"
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
    <ConfirmModal
      :show="noResultConfirmModal.show"
      title="알림"
      message="결과를 작성하시겠습니까?"
      @close="closeNoResultConfirm"
      @confirm="onNoResultConfirmYes"
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
