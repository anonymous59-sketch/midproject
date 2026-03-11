<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { usePagination } from "@/composables/usePagination";
import SearchNavbar from "@/views/components/SearchNavbar.vue";
import MainTable from "@/views/components/MainTable.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import ArgonInput from "@/components/ArgonInput.vue";
import AlertModal from "@/views/modal/AlertModal.vue";

const router = useRouter();
const authStore = useAuthStore();

/**
 * [1] 좌측 검색(필터) 입력값
 */
const filters = ref({
  dateFrom: "",
  dateTo: "",
  targetName: "",
  applicantName: "",
  managerName: "",
  stage: "전체",
  progress: {
    review: false,
    approve: false,
    reject: false,
    done: false,
  },
});

/** 검색 버튼 클릭 시에만 적용 */
const appliedFilters = ref({
  dateFrom: "",
  dateTo: "",
  targetName: "",
  applicantName: "",
  managerName: "",
  stage: "전체",
  progress: {
    review: false,
    approve: false,
    reject: false,
    done: false,
  },
});

const rows = ref([]);
const listLoading = ref(false);
const listError = ref("");

const alertModal = ref({
  show: false,
  type: "error",
  title: "알림",
  message: "",
});

function showAlert(type, title, message) {
  alertModal.value = {
    show: true,
    type,
    title: title ?? "알림",
    message: message ?? "",
  };
}

// 기관 내 담당자 목록 (배정용)
const managers = ref([]);
const managersLoading = ref(false);
const assigningSupCode = ref("");
const assigningMgrNo = ref("");

function formatApplyDate(val) {
  if (!val) return "";
  const d = typeof val === "string" ? new Date(val) : val;
  if (isNaN(d.getTime())) return val;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/** 지원진행상태: 백엔드 코드 → 한글 */
function stageLabel(codeOrName) {
  const map = {
    e0_00: "검토",
    e0_10: "승인",
    e0_80: "보완",
    e0_99: "반려",
    e1_00: "대기",
    e1_10: "신청",
    e1_20: "승인",
    e1_99: "반려",
    d0_20: "계획",
    d0_30: "중점",
    d0_40: "긴급",
  };
  const s = (codeOrName || "").trim();
  return map[s] || s || "";
}

/** 담당자/관리자용 테이블 표시: 승인 → 검토(우선순위 미승인 등), 나머지 그대로 */
function stageDisplayForManager(stage) {
  const s = String(stage || "").trim();
  if (s === "승인") return "검토";
  return s || "—";
}

function mapApiRow(r, index) {
  const rawStage = r.stage_name || r.req_yn || "";
  return {
    no: index + 1,
    sup_code: r.sup_code,
    targetName: r.target_name || "",
    applicantName: r.applicant_name || "",
    applyDate: formatApplyDate(r.sup_day),
    managerName: r.manager_name || "",
    stage: stageLabel(rawStage) || rawStage,
    progress: {
      review: Number(r.review_cnt) || 0,
      approve: Number(r.approve_cnt) || 0,
      reject: Number(r.reject_cnt) || 0,
      done: Number(r.result_cnt) || 0,
    },
    canPlanView: !!r.has_plan,
    canResultView: !!r.has_result,
    canCounselView: true,
  };
}

async function loadOrganManagerList() {
  const mOrg = authStore.user?.m_org;
  if (!mOrg) {
    listError.value = "로그인한 기관 정보가 없습니다.";
    rows.value = [];
    return;
  }
  listLoading.value = true;
  listError.value = "";
  try {
    const res = await fetch(
      `/api/apply/organmanager-list?m_org=${encodeURIComponent(mOrg)}`,
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "목록 조회 실패");
    rows.value = Array.isArray(data) ? data.map((r, i) => mapApiRow(r, i)) : [];
  } catch (e) {
    listError.value = e.message || "지원신청 목록을 불러오지 못했습니다.";
    rows.value = [];
  } finally {
    listLoading.value = false;
  }
}

// 기관 내 담당자 목록 조회 (a0_30, m_org=로그인 기관)
async function loadManagersForOrg() {
  const mOrg = authStore.user?.m_org;
  if (!mOrg) {
    managers.value = [];
    return;
  }
  managersLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.set("m_org", mOrg);
    const res = await fetch(`/api/admin/managers?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "담당자 목록 조회 실패");
    managers.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("[loadManagersForOrg] error:", e);
    managers.value = [];
  } finally {
    managersLoading.value = false;
  }
}

function beginAssignManager(row) {
  if (!row?.sup_code) return;
  assigningSupCode.value = row.sup_code;
  assigningMgrNo.value = "";
  if (managers.value.length === 0 && !managersLoading.value) {
    loadManagersForOrg();
  }
}

async function confirmAssignManager() {
  if (!assigningSupCode.value || !assigningMgrNo.value) return;
  try {
    const res = await fetch(
      `/api/apply/support/${encodeURIComponent(assigningSupCode.value)}/manager`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mgr_no: assigningMgrNo.value }),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "담당자 배정에 실패했습니다.");
    assigningSupCode.value = "";
    assigningMgrNo.value = "";
    await loadOrganManagerList();
  } catch (e) {
    showAlert("error", "알림", e.message || "담당자 배정에 실패했습니다.");
  }
}

function cancelAssignManager() {
  assigningSupCode.value = "";
  assigningMgrNo.value = "";
}

/**
 * [3] “검색” 버튼을 눌렀을 때, 실제로는 API 호출해야 함.
 * 지금은 일단 콘솔 출력만.
 */
const onSearch = () => {
  appliedFilters.value = JSON.parse(JSON.stringify(filters.value));
  loadOrganManagerList();
};

const onReset = () => {
  filters.value.dateFrom = "";
  filters.value.dateTo = "";
  filters.value.targetName = "";
  filters.value.applicantName = "";
  filters.value.managerName = "";
  filters.value.stage = "전체";
  filters.value.progress.review = false;
  filters.value.progress.approve = false;
  filters.value.progress.reject = false;
  filters.value.progress.done = false;
  appliedFilters.value = JSON.parse(JSON.stringify(filters.value));
};

const filteredRows = computed(() => {
  const f = appliedFilters.value;
  return rows.value.filter((r) => {
    if (
      f.dateFrom &&
      r.applyDate &&
      r.applyDate < f.dateFrom.replace(/-/g, ".")
    )
      return false;
    if (f.dateTo && r.applyDate && r.applyDate > f.dateTo.replace(/-/g, "."))
      return false;
    if (f.targetName && !String(r.targetName).includes(f.targetName))
      return false;
    if (f.applicantName && !String(r.applicantName).includes(f.applicantName))
      return false;
    if (f.managerName && !String(r.managerName || "").includes(f.managerName))
      return false;
    if (f.stage !== "전체") {
      const stage = String(r.stage || "").trim();
      if (f.stage === "검토" && !["검토", "승인"].includes(stage)) return false;
      if (f.stage === "보완" && stage !== "보완") return false;
      if (["긴급", "중점", "계획", "반려"].includes(f.stage) && stage !== f.stage) return false;
    }
    const pc = f.progress;
    const any = pc.review || pc.approve || pc.reject || pc.done;
    if (any) {
      if (pc.review && (r.progress?.review ?? 0) <= 0) return false;
      if (pc.approve && (r.progress?.approve ?? 0) <= 0) return false;
      if (pc.reject && (r.progress?.reject ?? 0) <= 0) return false;
      if (pc.done && (r.progress?.done ?? 0) <= 0) return false;
    }
    return true;
  });
});

// 페이징: 공통 composable 사용 (페이지당 10건, 번호는 전체 건수 기준 내림차순)
const {
  page,
  pageSize,
  totalItems: totalRows,
  pagedItems: pagedRows,
  rowDisplayNo,
} = usePagination(() => filteredRows.value, 10);

onMounted(() => {
  loadOrganManagerList();
});

const viewApply = (row) => {
  if (row.sup_code) router.push(`/review/${encodeURIComponent(row.sup_code)}`);
  else showAlert("error", "알림", "지원 정보를 찾을 수 없습니다.");
};
const viewCounseling = (row) => {
  if (row.sup_code) router.push(`/review/${encodeURIComponent(row.sup_code)}`);
  else showAlert("error", "알림", "지원 정보를 찾을 수 없습니다.");
};
</script>

<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <SearchNavbar title="상세 검색" @search="onSearch" @reset="onReset">
        <!-- 날짜 -->
        <label class="form-label text-sm">작성일</label>
        <div class="d-flex gap-2">
          <ArgonInput v-model="filters.dateFrom" type="date" size="sm" />
          <ArgonInput v-model="filters.dateTo" type="date" size="sm" />
        </div>

        <hr class="horizontal dark my-3" />

        <!-- 지원대상자 -->
        <label class="form-label text-sm">지원대상자</label>
        <ArgonInput
          v-model="filters.targetName"
          type="text"
          size="sm"
          placeholder="예) 홍길동"
        />

        <div class="mt-3">
          <label class="form-label text-sm">지원자명</label>
          <ArgonInput
            v-model="filters.applicantName"
            type="text"
            size="sm"
            placeholder="예) 보호자 이름"
          />
        </div>

        <div class="mt-3">
          <label class="form-label text-sm">담당자명</label>
          <ArgonInput
            v-model="filters.managerName"
            type="text"
            size="sm"
            placeholder="예) 담당자 이름"
          />
        </div>

        <hr class="horizontal dark my-3" />

        <!-- 지원진행상태 (담당자/관리자: 전체 / 검토 / 보완 / 계획·중점·긴급 / 반려) -->
        <label class="form-label text-sm">지원진행상태</label>
        <div class="d-flex flex-wrap gap-2 align-items-center">
          <div class="form-check mb-0">
            <input id="org-stage-all" v-model="filters.stage" type="radio" value="전체" class="form-check-input" />
            <label class="form-check-label text-sm" for="org-stage-all">전체 (기본값)</label>
          </div>
          <div class="form-check mb-0">
            <input id="org-stage-review" v-model="filters.stage" type="radio" value="검토" class="form-check-input" />
            <label class="form-check-label text-sm" for="org-stage-review">검토</label>
          </div>
          <div class="form-check mb-0">
            <input id="org-stage-supple" v-model="filters.stage" type="radio" value="보완" class="form-check-input" />
            <label class="form-check-label text-sm" for="org-stage-supple">보완</label>
          </div>
          <div class="form-check mb-0">
            <input id="org-stage-plan" v-model="filters.stage" type="radio" value="계획" class="form-check-input" />
            <label class="form-check-label text-sm" for="org-stage-plan">계획</label>
          </div>
          <div class="form-check mb-0">
            <input id="org-stage-focus" v-model="filters.stage" type="radio" value="중점" class="form-check-input" />
            <label class="form-check-label text-sm" for="org-stage-focus">중점</label>
          </div>
          <div class="form-check mb-0">
            <input id="org-stage-urgent" v-model="filters.stage" type="radio" value="긴급" class="form-check-input" />
            <label class="form-check-label text-sm" for="org-stage-urgent">긴급</label>
          </div>
          <div class="form-check mb-0">
            <input id="org-stage-reject" v-model="filters.stage" type="radio" value="반려" class="form-check-input" />
            <label class="form-check-label text-sm" for="org-stage-reject">반려</label>
          </div>
        </div>

        <hr class="horizontal dark my-3" />

        <!-- 계획/결과 진행 -->
        <label class="form-label text-sm">계획/결과 진행</label>
        <div class="d-flex flex-wrap gap-2 align-items-center">
          <div class="form-check mb-0">
            <input
              id="p1"
              class="form-check-input"
              type="checkbox"
              v-model="filters.progress.review"
            />
            <label class="form-check-label text-sm" for="p1">검토</label>
          </div>
          <div class="form-check mb-0">
            <input
              id="p2"
              class="form-check-input"
              type="checkbox"
              v-model="filters.progress.approve"
            />
            <label class="form-check-label text-sm" for="p2">승인</label>
          </div>
          <div class="form-check mb-0">
            <input
              id="p3"
              class="form-check-input"
              type="checkbox"
              v-model="filters.progress.reject"
            />
            <label class="form-check-label text-sm" for="p3">반려</label>
          </div>
          <div class="form-check mb-0">
            <input
              id="p4"
              class="form-check-input"
              type="checkbox"
              v-model="filters.progress.done"
            />
            <label class="form-check-label text-sm" for="p4">결과</label>
          </div>
        </div>
      </SearchNavbar>

      <MainTable
        title="지원신청 내역"
        :list-error="listError"
        :loading="listLoading"
        :rows-count="filteredRows.length"
        empty-text="검색 결과가 없습니다."
        :colspan="9"
        v-model:page="page"
        :page-size="pageSize"
        :total="totalRows"
      >
        <template #header>
          <th class="text-center text-xs">번호</th>
          <th class="text-center text-xs">지원대상자명</th>
          <th class="text-center text-xs">지원자명</th>
          <th class="text-center text-xs">지원신청일</th>
          <th class="text-center text-xs">지원신청서</th>
          <th class="text-center text-xs">담당자</th>
          <th class="text-center text-xs">지원진행상태</th>
          <th class="text-center text-xs">계획/결과 진행</th>
          <th class="text-center text-xs">상담내역</th>
        </template>
        <template #body>
          <tr v-for="(row, idx) in pagedRows" :key="row.sup_code || row.no">
            <td class="text-center text-sm">{{ rowDisplayNo(idx) }}</td>
            <td class="text-center text-sm">{{ row.targetName }}</td>
            <td class="text-center text-sm">{{ row.applicantName }}</td>
            <td class="text-center text-sm">{{ row.applyDate }}</td>

            <td class="text-center">
              <ArgonButton size="sm" color="primary" class="mb-0" @click="viewApply(row)">
                보기
              </ArgonButton>
            </td>

            <td class="text-center text-sm">
              <template v-if="row.managerName">
                {{ row.managerName }}
              </template>
              <template v-else>
                <div v-if="assigningSupCode === row.sup_code">
                  <div class="d-flex align-items-center gap-1">
                    <select
                      v-model="assigningMgrNo"
                      class="form-select form-select-sm"
                      style="min-width: 140px"
                    >
                      <option value="" disabled>담당자 선택</option>
                      <option
                        v-for="m in managers"
                        :key="m.m_no || m.id"
                        :value="m.m_no || m.id"
                      >
                        {{ m.m_nm }} ({{ m.organ_name || m.m_org || "" }})
                      </option>
                    </select>
                    <ArgonButton
                      type="button"
                      size="sm"
                      color="primary"
                      @click="confirmAssignManager"
                    >
                      배정
                    </ArgonButton>
                    <ArgonButton
                      type="button"
                      size="sm"
                      variant="outline"
                      color="secondary"
                      @click="cancelAssignManager"
                    >
                      취소
                    </ArgonButton>
                  </div>
                </div>
                <ArgonButton
                  v-else
                  type="button"
                  size="sm"
                  variant="outline"
                  color="danger"
                  class="p-0 text-decoration-none"
                  @click="beginAssignManager(row)"
                >
                  미배정
                </ArgonButton>
              </template>
            </td>
            <td class="text-center text-sm">{{ stageDisplayForManager(row.stage) }}</td>

            <td class="text-center text-sm">
              <div class="d-flex flex-column align-items-center gap-1">
                <div
                  class="d-flex justify-content-between"
                  style="width: 120px"
                >
                  <span class="text-xs">검토</span
                  ><span class="text-xs text-muted"
                    >{{ row.progress.review }}건</span
                  >
                </div>
                <div
                  class="d-flex justify-content-between"
                  style="width: 120px"
                >
                  <span class="text-xs">승인</span
                  ><span class="text-xs text-muted"
                    >{{ row.progress.approve }}건</span
                  >
                </div>
                <div
                  class="d-flex justify-content-between"
                  style="width: 120px"
                >
                  <span class="text-xs">반려</span
                  ><span class="text-xs text-muted"
                    >{{ row.progress.reject }}건</span
                  >
                </div>
                <div
                  class="d-flex justify-content-between"
                  style="width: 120px"
                >
                  <span class="text-xs">결과</span
                  ><span class="text-xs text-muted"
                    >{{ row.progress.done }}건</span
                  >
                </div>
              </div>
            </td>

            <td class="text-center">
              <ArgonButton
                size="sm"
                class="mb-0"
                :color="row.canCounselView ? 'info' : 'secondary'"
                :disabled="!row.canCounselView"
                @click="row.canCounselView && viewCounseling(row)"
              >
                보기
              </ArgonButton>
            </td>
          </tr>
        </template>
      </MainTable>
    </div>
  </div>

  <AlertModal
    :show="alertModal.show"
    :type="alertModal.type"
    :title="alertModal.title"
    :message="alertModal.message"
    @close="alertModal.show = false"
  />
</template>
