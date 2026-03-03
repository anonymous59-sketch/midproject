<script setup>
/**
 * 지원결과 페이지 (SupportResult)
 * ----------------------------------------
 * - 역할: 한 건의 지원(sup_code) + 선택된 계획(planCode)에 대한 지원결과 목록 조회·추가·수정·승인/보완/반려
 * - URL: /support/:supportCode?planCode=xxx (planCode 없으면 planData[0] 기준)
 * - 데이터: Pinia supportStore의 resultData(결과 목록), planData(선택 계획), infoData(지원 기본정보)
 * - 주요 플로우:
 *   1) 결과추가 → 추가 폼 → 승인요청 확인 → insertResult + 첨부 업로드 → 목록 갱신
 *   2) 상세 수정 → 수정완료 → updateResult + 첨부 삭제/추가 → 목록·해당 카드 첨부 재조회
 *   3) 승인/보완/반려 → 사유 모달 → decideResult → 목록 갱신
 * - openAddForm 쿼리: SupportPlan에서 결과 0건 확인 후 '네'로 진입 시 추가 폼 자동 오픈
 */
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
const supportCode = route.params.supportCode; // URL의 지원코드
const planCodeFromQuery = route.query.planCode; // 쿼리로 넘어온 계획 코드

const supportStore = useSupportStore();
const { planData, infoData, resultData } = storeToRefs(supportStore);
const { supportResultDetail, insertResult, updateResult, decideResult } =
  supportStore;

/**
 * 결과 페이지에 표시할 기준 계획.
 * planData 첫 번째 항목을 사용한다. (URL 쿼리 planCode로 조회된 계획이 여기 담김)
 */
const selectedPlan = computed(() => (planData.value ?? [])[0] ?? null);

const showAddResultForm = ref(false); // 결과 추가 폼 표시 여부
const addForm = reactive({ title: "", content: "" }); // 결과 추가 폼 입력값
const cancelRequestResultCode = ref(null); // 취소 확인 후 리셋 지시할 result_code
const addResultFiles = ref([]);
const addResultFileInput = ref(null);
function onResultFileChange(e) {
  const files = Array.from(e.target.files || []);
  const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
  if (oversized.length > 0) {
    showAlert(
      "error",
      "알림",
      `파일 용량이 10MB를 초과합니다:\n${oversized
        .map((f) => f.name)
        .join("\n")}`,
    );
    if (addResultFileInput.value) addResultFileInput.value.value = "";
    return;
  }
  addResultFiles.value = files;
}
// "파일을 선택하세요" 영역 클릭 시 숨겨진 <input type="file">을 트리거해 파일 선택 다이얼로그 오픈
function openResultFileDialog() {
  if (addResultFileInput.value) addResultFileInput.value.click();
}
// 결과 추가 폼에 선택된 파일이 있으면 파일명을 콤마로 이어 붙인 문자열, 없으면 빈 문자열 (UI 표시용)
const addResultFileNames = computed(() =>
  addResultFiles.value.length
    ? addResultFiles.value.map((f) => f.name).join(", ")
    : "",
);

const approvalConfirm = ref({ show: false, source: "add", payload: null }); // 승인요청 확인 모달 상태
const cancelModal = ref({ show: false, context: "add", resultCode: null }); // 취소 확인 모달 상태
const reasonModal = ref({
  // 반려/보완 사유 모달 상태
  show: false,
  type: "reject",
  resultCode: null,
  resultCmt: "",
});

const alertModal = ref({
  // 단순 알림 모달 상태
  show: false,
  type: "success",
  title: "알림",
  message: "",
});

/**
 * 각 SupportResultDetail 컴포넌트 인스턴스를 result_code 키로 보관.
 * 취소 확인 시 해당 카드의 resetToViewMode()를 직접 호출하기 위해 사용한다.
 */
const resultDetailRefs = {};
/** v-for 내 :ref 콜백으로 호출 — el이 있으면 등록, null이면 해제 */
function setResultDetailRef(resultCode, el) {
  if (el) resultDetailRefs[resultCode] = el;
  else delete resultDetailRefs[resultCode];
}

// ========== 함수 ==========
/** 결과 추가 폼을 열거나 닫고, 닫을 때 입력값을 비운다. */
function toggleAddResultForm() {
  showAddResultForm.value = !showAddResultForm.value;
  if (!showAddResultForm.value) {
    addForm.title = "";
    addForm.content = "";
    addResultFiles.value = [];
  }
}

/** 알림 모달을 띄운다. (조회 완료/성공 메시지는 표시하지 않음) */
function showAlert(type, title, message) {
  const m = (message ?? "").trim();
  if (!m || m === "조회 완료" || m === "조회 성공") return;
  alertModal.value = { show: true, type, title, message: m };
}
/** 알림 모달을 닫는다. */
function closeAlertModal() {
  alertModal.value.show = false;
}

/** 승인요청 확인 모달을 연다. (상세에서 호출 시 payload 필수) */
function openApprovalConfirm(source, payload) {
  if (source !== "add" && !payload) {
    showAlert("error", "알림", "결과를 입력한 후에 승인요청해 주세요.");
    return;
  }
  approvalConfirm.value = { show: true, source, payload };
}
/** 승인요청 확인 모달을 닫는다. */
function closeApprovalConfirm() {
  approvalConfirm.value = { show: false, source: "add", payload: null };
}

/** 반려/보완 사유 모달을 연다. */
function openReasonModal(type, resultCode, resultCmt = "") {
  reasonModal.value = { show: true, type, resultCode, resultCmt };
}
/** 반려/보완 사유 모달을 닫는다. */
function closeReasonModal() {
  reasonModal.value = {
    show: false,
    type: "reject",
    resultCode: null,
    resultCmt: "",
  };
}

/** 취소 확인 모달을 연다. */
function openCancelModal(context, resultCode = null) {
  cancelModal.value = { show: true, context, resultCode };
}
/** 취소 확인 모달을 닫는다. */
function closeCancelModal() {
  cancelModal.value = { show: false, context: "add", resultCode: null };
}
/** 취소 요청 완료 후 사용한 result_code를 초기화한다. */
function clearCancelRequest() {
  cancelRequestResultCode.value = null;
}
/**
 * 취소 확인 모달에서 '네' 선택 시.
 * - context 'add': 추가 폼만 닫고 모달 닫기.
 * - context 'edit': 해당 SupportResultDetail의 resetToViewMode() 호출해 수정 취소 후 취소 완료 알림.
 */
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
    showAlert("success", "알림", "수정이 취소되었습니다.");
  }
  closeCancelModal();
}

/** 수정이력 버튼. 현재는 구현 중 알림만 */
function updHistory() {
  showAlert("error", "알림", "구현 중입니다.");
}
/**
 * 결과 첨부파일을 서버에 업로드.
 * POST /api/upload/file-content (file_path='result', file_category=result_code) 호출.
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
/** 결과 추가 버튼: 추가 폼 토글 */
function onAddResult() {
  toggleAddResultForm();
}
/** 임시저장 불러오기 버튼. 현재는 구현 중 알림만 */
function onLoadTempResult() {
  showAlert("error", "알림", "구현 중입니다.");
}
/** 결과 추가 폼에서 임시저장 버튼. 현재는 구현 중 알림만 */
function onTempSaveFromAddResult() {
  showAlert("error", "알림", "구현 중입니다.");
}
/** 결과 상세(수정)에서 임시저장 버튼. 현재는 구현 중 알림만 */
function onTempSaveFromDetailResult() {
  showAlert("error", "알림", "구현 중입니다.");
}
/** 추가 폼에서 승인요청 확인 모달을 연다. */
function onApprovalRequestFromAdd() {
  openApprovalConfirm("add", null);
}
/** 상세에서 승인요청 시 확인 모달을 연다. */
function onApprovalRequest(payload) {
  openApprovalConfirm("detail", payload);
}
/** 결과를 승인(e0_10) 처리한다. */
async function onApprove(resultCode) {
  const res = await decideResult(resultCode, "e0_10", null);
  if (res?.retCode === "Success") {
    await supportResultDetail(supportCode, planCodeFromQuery ?? undefined);
    const p = getAlertPreset("approvalComplete", "result");
    showAlert(p.type, p.title, res.retMsg ?? p.message);
  } else if (res != null)
    showAlert("error", "알림", res.retMsg ?? "처리 중 오류가 발생했습니다.");
}
/** 보완 사유 모달을 연다. */
function onSupple(resultCode) {
  openReasonModal("supple", resultCode, reasonModal.value.resultCmt ?? "");
}
/** 반려 사유 모달을 연다. */
function onReject(resultCode) {
  openReasonModal("reject", resultCode, reasonModal.value.resultCmt ?? "");
}

/** 반려/보완 사유 확인 시 decideResult 호출 후 목록 갱신·알림 */
async function onReasonConfirm(reason) {
  const { resultCode, type } = reasonModal.value;
  if (!resultCode) return;
  const decision = type === "reject" ? "e0_99" : "e0_80";
  const res = await decideResult(resultCode, decision, reason);
  closeReasonModal();
  if (res?.retCode === "Success") {
    await supportResultDetail(supportCode, planCodeFromQuery ?? undefined);
    const presetKey =
      decision === "e0_99" ? "rejectComplete" : "suppleComplete";
    const p = getAlertPreset(presetKey, "result");
    showAlert(p.type, p.title, res.retMsg ?? p.message);
  } else if (res != null)
    showAlert("error", "알림", res.retMsg ?? "처리 중 오류가 발생했습니다.");
}
/**
 * 승인요청 확인 모달에서 '네' 선택 시 호출.
 * - source "add": insertResult(supportCode, planCode, 제목, 내용) 후 새 result_code로 첨부 업로드, 목록 갱신.
 * - source "detail": updateResult(payload.resultCode, 제목, 내용) 후 목록 갱신.
 * planCode는 selectedPlan(현재 표시 중인 계획) 또는 URL query planCode 순으로 사용.
 */
async function onApprovalConfirmYes() {
  const { source, payload } = approvalConfirm.value;
  closeApprovalConfirm();

  if (source === "add") {
    /** 계획 코드: 화면 기준 계획(selectedPlan) → URL 쿼리(planCodeFromQuery) 순. ?? 는 null/undefined일 때만 다음 값 사용 */
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
      const newResultCode = res?.result_code ?? null;
      if (newResultCode && addResultFiles.value.length > 0) {
        await uploadFilesToServer(
          addResultFiles.value,
          "result",
          newResultCode,
          infoData?.mgr_no ?? null,
        );
      }
      await supportResultDetail(supportCode, planCodeFromQuery ?? undefined);
      showAddResultForm.value = false;
      addForm.title = "";
      addForm.content = "";
      addResultFiles.value = [];
      const p = getAlertPreset("approvalRequestComplete", "result");
      showAlert(p.type, p.title, res.retMsg ?? p.message);
    } else if (res != null) {
      showAlert("error", "알림", res.retMsg ?? "처리 중 오류가 발생했습니다.");
    }
    return;
  }

  // source === "detail": 상세 카드에서 수정 후 승인요청 → 기존 결과 UPDATE
  if (!payload) return;
  const res = await updateResult(payload.resultCode, {
    result_title: payload.title ?? "",
    result_content: payload.content ?? "",
  });
  if (res?.retCode === "Success") {
    await supportResultDetail(supportCode, planCodeFromQuery ?? undefined);
    const p = getAlertPreset("approvalRequestComplete", "result");
    showAlert(p.type, p.title, res.retMsg ?? p.message);
  } else if (res != null)
    showAlert("error", "알림", res.retMsg ?? "처리 중 오류가 발생했습니다.");
}
/**
 * 상세 카드에서 수정완료 시 호출.
 * updateResult(제목·내용) 후 삭제 표시된 첨부 DELETE, 신규 첨부 file-content 업로드,
 * 목록 재조회 및 해당 카드 reloadFiles()로 첨부 목록 즉시 반영.
 */
async function onEditComplete(payload) {
  if (!payload?.resultCode) return;
  const res = await updateResult(payload.resultCode, {
    result_title: payload.title ?? "",
    result_content: payload.content ?? "",
  });
  if (res?.retCode === "Success") {
    // 삭제 표시된 파일 일괄 DELETE
    const codesToDelete = Array.isArray(payload.deleteFileCodes)
      ? payload.deleteFileCodes
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
        console.error("결과 첨부파일 삭제 호출 중 에러", e);
      }
    }
    // 새로 선택된 파일 업로드 (물리 파일 저장 + DB INSERT)
    if (Array.isArray(payload.newFiles) && payload.newFiles.length > 0) {
      await uploadFilesToServer(
        payload.newFiles,
        "result",
        payload.resultCode,
        infoData?.mgr_no ?? null,
      );
    }
    await supportResultDetail(supportCode, planCodeFromQuery ?? undefined);
    const detail = resultDetailRefs[payload.resultCode];
    if (detail?.reloadFiles) {
      await detail.reloadFiles();
    }
  } else if (res != null)
    showAlert("error", "알림", res.retMsg ?? "수정 중 오류가 발생했습니다.");
}

// ========== 라이프사이클 훅 ==========
onBeforeMount(async () => {
  // 계획·결과 목록 최초 조회
  await supportResultDetail(supportCode, planCodeFromQuery ?? undefined);
  // SupportPlan에서 결과 0건 확인 후 '네' 선택 시 쿼리로 넘어온 경우 추가 폼 자동 오픈
  if (route.query.openAddForm) showAddResultForm.value = true;
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
      :plan_content="selectedPlan?.plan_content ?? ''"
      :plan_start_time="selectedPlan?.start_time ?? ''"
      :plan_end_time="selectedPlan?.end_time ?? ''"
      :plan_file_name="selectedPlan?.origin_file_name ?? ''"
    />
    <div class="d-flex justify-content-end gap-2 mb-2">
      <button
        type="button"
        class="btn btn-sm btn-outline-primary"
        @click="onAddResult"
      >
        결과추가
      </button>
    </div>
    <!-- 결과 추가 폼: 제목, 내용, 첨부파일 -->
    <div v-if="showAddResultForm" class="card shadow-sm border-radius-lg mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-end gap-2 mb-3">
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="onLoadTempResult"
          >
            임시저장 불러오기
          </button>
          <button
            type="button"
            class="btn btn-sm btn-secondary"
            @click="onTempSaveFromAddResult"
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
            placeholder="지원 결과 제목"
          />
        </div>
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">내용</label>
          <textarea
            v-model="addForm.content"
            class="form-control form-control-sm support-result-textarea"
            placeholder="결과"
          >
          </textarea>
        </div>
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">첨부파일</label>
          <input
            ref="addResultFileInput"
            type="file"
            class="d-none"
            multiple
            @change="onResultFileChange"
          />
          <button
            type="button"
            class="form-control form-control-sm text-start bg-white"
            @click="openResultFileDialog"
          >
            <span v-if="addResultFileNames">{{ addResultFileNames }}</span>
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
      @history="updHistory"
      @result="(resultCode) => result(resultCode)"
      @edit-complete="onEditComplete"
      @approve="onApprove"
      @supple="onSupple"
      @reject="onReject"
      :cancel-request="cancelRequestResultCode"
      @cancel-done="clearCancelRequest"
      @approval-request="onApprovalRequest"
      @request-cancel="(resultCode) => openCancelModal('edit', resultCode)"
      @temp-save="onTempSaveFromDetailResult"
      @add-result="onAddResult"
      :result_result="item.result_tf"
      @alert="(p) => showAlert(p.type ?? 'error', '알림', p.message ?? '')"
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
