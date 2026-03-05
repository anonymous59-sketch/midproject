<!-- 담당자(a0_30) 홈: 로그인한 담당자 m_no = support.mgr_no 로 담당 지원 목록 표시 -->
<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { usePagination } from "@/composables/usePagination";
import SearchNavbar from "@/views/components/SearchNavbar.vue";
import MainTable from "@/views/components/MainTable.vue";

const router = useRouter();
const authStore = useAuthStore();

/** 로그인한 담당자 정보 — support.mgr_no = 이 m_no 로 목록 조회 */
const loginMNo = computed(() => authStore.user?.m_no ?? "");
const loginMName = computed(() => authStore.user?.m_nm ?? "");

const filters = ref({
  dateFrom: "",
  dateTo: "",
  targetName: "",
  applicantName: "",
  stage: {
    review: false,
    wait: false,
    apply: false,
    approve: false,
    reject: false,
  },
  progress: {
    review: false,
    approve: false,
    reject: false,
    done: false,
  },
});

/** 검색 버튼 클릭 시에만 적용되는 조건 */
const appliedFilters = ref({
  dateFrom: "",
  dateTo: "",
  targetName: "",
  applicantName: "",
  managerName: "",
  stage: {
    review: false,
    wait: false,
    apply: false,
    approve: false,
    reject: false,
  },
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

function formatApplyDate(val) {
  if (!val) return "";
  const d = typeof val === "string" ? new Date(val) : val;
  if (isNaN(d.getTime())) return val;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/** 대기단계 코드 → 한글 (e0_00 검토, e0_10 승인 등) */
function stageLabel(codeOrName) {
  const map = { e0_00: "검토", e0_10: "승인", e0_80: "보완", e0_99: "반려", e1_00: "대기", e1_10: "신청", e1_20: "승인", e1_99: "반려" };
  const s = (codeOrName || "").trim();
  return map[s] || s || "";
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
  };
}

function toRowArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.list)) return data.list;
  if (data && Array.isArray(data.rows)) return data.rows;
  return [];
}

async function loadManagerList() {
  const mNo = loginMNo.value;
  if (!mNo) {
    listError.value = "로그인 정보가 없습니다.";
    rows.value = [];
    return;
  }
  listLoading.value = true;
  listError.value = "";
  try {
    // support.mgr_no = 로그인한 담당자 m_no 로 담당 건만 조회
    const res = await fetch(
      `/api/apply/manager-list?m_no=${encodeURIComponent(mNo)}`,
    );
    const data = await res.json();
    console.log(data);
    if (!res.ok) throw new Error(data.message || "목록 조회 실패");
    const rawRows = toRowArray(data);
    rows.value = rawRows.map((r, i) => mapApiRow(r, i));
  } catch (e) {
    listError.value = e.message || "담당 지원신청 목록을 불러오지 못했습니다.";
    rows.value = [];
  } finally {
    listLoading.value = false;
  }
}

const onSearch = () => {
  appliedFilters.value = JSON.parse(JSON.stringify(filters.value));
  loadManagerList();
};

const onReset = () => {
  filters.value.dateFrom = "";
  filters.value.dateTo = "";
  filters.value.targetName = "";
  filters.value.applicantName = "";
  filters.value.stage.review = false;
  filters.value.stage.wait = false;
  filters.value.stage.apply = false;
  filters.value.stage.approve = false;
  filters.value.stage.reject = false;
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
    const stageAny =
      f.stage.review || f.stage.wait || f.stage.apply || f.stage.approve || f.stage.reject;
    if (stageAny) {
      const allowed = [];
      if (f.stage.review) allowed.push("검토");
      if (f.stage.wait) allowed.push("대기");
      if (f.stage.apply) allowed.push("신청");
      if (f.stage.approve) allowed.push("승인");
      if (f.stage.reject) allowed.push("반려");
      if (allowed.length && !allowed.includes(r.stage)) return false;
    }
    const pc = f.progress;
    const progressAny = pc.review || pc.approve || pc.reject || pc.done;
    if (progressAny) {
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
  loadManagerList();
  // 로그인 복원이 아직 안 됐을 수 있으므로 한 번 더 시도
  if (!loginMNo.value) {
    setTimeout(() => {
      if (loginMNo.value) loadManagerList();
    }, 300);
  }
});

const viewApply = (row) => {
  if (row.sup_code) router.push(`/review/${encodeURIComponent(row.sup_code)}`);
};
const viewPlan = (row) => {
  if (row.sup_code)
    router.push(`/support-plan/${encodeURIComponent(row.sup_code)}`);
};
const viewResult = (row) => {
  if (row.sup_code)
    router.push(`/support-result/${encodeURIComponent(row.sup_code)}`);
};

// 지원대상자명 클릭 시: 해당 지원신청의 sup_code 로 지원이력 페이지 이동
const goSupportHistory = (row) => {
  if (!row.sup_code) return;
  router.push({
    name: "pswSupportHistory",
    params: { supCode: row.sup_code },
  });
};
</script>

<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <SearchNavbar
        :subtitle="loginMName ? `담당자: ${loginMName}` : ''"
        @search="onSearch"
        @reset="onReset"
      >
        <label class="form-label text-sm">지원신청일</label>
        <div class="d-flex gap-2">
          <input
            v-model="filters.dateFrom"
            type="date"
            class="form-control form-control-sm"
          />
          <input
            v-model="filters.dateTo"
            type="date"
            class="form-control form-control-sm"
          />
        </div>
        <hr class="horizontal dark my-3" />
        <label class="form-label text-sm">지원대상자명</label>
        <input
          v-model="filters.targetName"
          type="text"
          class="form-control form-control-sm"
          placeholder="보호대상자명"
        />
        <div class="mt-3">
          <label class="form-label text-sm">지원자명</label>
          <input
            v-model="filters.applicantName"
            type="text"
            class="form-control form-control-sm"
            placeholder="보호자 이름"
          />
        </div>
        <hr class="horizontal dark my-3" />
        <label class="form-label text-sm">대기단계</label>
        <div class="d-flex flex-wrap gap-2">
          <button
            class="btn btn-sm mb-0"
            :class="
              filters.stage === '전체' ? 'btn-warning' : 'btn-outline-secondary'
            "
            @click="filters.stage = '전체'"
          >
            전체
          </button>
          <button
            class="btn btn-sm mb-0"
            :class="
              filters.stage === '검토 중'
                ? 'btn-warning'
                : 'btn-outline-secondary'
            "
            @click="filters.stage = '검토 중'"
          >
            검토 중
          </button>
          <button
            class="btn btn-sm mb-0"
            :class="
              filters.stage === '대기' ? 'btn-warning' : 'btn-outline-secondary'
            "
            @click="filters.stage = '대기'"
          >
            대기
          </button>
          <button
            class="btn btn-sm mb-0"
            :class="
              filters.stage === '긴급' ? 'btn-warning' : 'btn-outline-secondary'
            "
            @click="filters.stage = '긴급'"
          >
            긴급
          </button>
          <button
            class="btn btn-sm mb-0"
            :class="
              filters.stage === '종결' ? 'btn-warning' : 'btn-outline-secondary'
            "
            @click="filters.stage = '종결'"
          >
            종결
          </button>
        </div>
        <hr class="horizontal dark my-3" />
        <label class="form-label text-sm">결재/결과 진행</label>
        <div class="form-check">
          <input
            id="m-p1"
            class="form-check-input"
            type="checkbox"
            v-model="filters.progress.review"
          />
          <label class="form-check-label text-sm" for="m-p1">검토</label>
        </div>
        <div class="form-check">
          <input
            id="m-p2"
            class="form-check-input"
            type="checkbox"
            v-model="filters.progress.approve"
          />
          <label class="form-check-label text-sm" for="m-p2">승인</label>
        </div>
        <div class="form-check">
          <input
            id="m-p3"
            class="form-check-input"
            type="checkbox"
            v-model="filters.progress.reject"
          />
          <label class="form-check-label text-sm" for="m-p3">반려</label>
        </div>
        <div class="form-check">
          <input
            id="m-p4"
            class="form-check-input"
            type="checkbox"
            v-model="filters.progress.done"
          />
          <label class="form-check-label text-sm" for="m-p4">결과</label>
        </div>
      </SearchNavbar>

      <MainTable
        title="담당 지원신청 내역"
        :subtitle="loginMName ? `${loginMName} 담당 건만 표시됩니다` : ''"
        :list-error="listError"
        :loading="listLoading"
        :rows-count="filteredRows.length"
        :empty-text="
          rows.length === 0
            ? '담당으로 지정된 지원신청이 없습니다.'
            : '검색 조건에 맞는 결과가 없습니다.'
        "
        :colspan="10"
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
          <th class="text-center text-xs">대기단계</th>
          <th class="text-center text-xs">결재/결과 진행</th>
          <th class="text-center text-xs">지원계획</th>
          <th class="text-center text-xs">지원결과</th>
        </template>
        <template #body>
          <tr v-for="(row, idx) in pagedRows" :key="row.sup_code || row.no">
            <td class="text-center text-sm">
              {{ rowDisplayNo(idx) }}
            </td>
            <td class="text-center text-sm">
              <span v-if="!row.targetName">-</span>
              <a
                v-else
                href="javascript:;"
                class="text-sm text-primary text-decoration-underline"
                @click.prevent="goSupportHistory(row)"
              >
                {{ row.targetName }}
              </a>
            </td>
            <td class="text-center text-sm">
              {{ row.applicantName || "-" }}
            </td>
            <td class="text-center text-sm">{{ row.applyDate }}</td>
            <td class="text-center">
              <button
                class="btn btn-sm btn-primary mb-0"
                @click="viewApply(row)"
              >
                보기
              </button>
            </td>
            <td class="text-center text-sm">
              {{ row.managerName || "미배정" }}
            </td>
            <td class="text-center text-sm">{{ row.stage }}</td>
            <td class="text-center text-sm">
              <div class="d-flex flex-column align-items-center gap-1">
                <div
                  class="d-flex justify-content-between"
                  style="width: 120px"
                >
                  <span class="text-xs">검토</span>
                  <span class="text-xs text-muted"
                    >{{ row.progress.review }}건</span
                  >
                </div>
                <div
                  class="d-flex justify-content-between"
                  style="width: 120px"
                >
                  <span class="text-xs">승인</span>
                  <span class="text-xs text-muted"
                    >{{ row.progress.approve }}건</span
                  >
                </div>
                <div
                  class="d-flex justify-content-between"
                  style="width: 120px"
                >
                  <span class="text-xs">반려</span>
                  <span class="text-xs text-muted"
                    >{{ row.progress.reject }}건</span
                  >
                </div>
                <div
                  class="d-flex justify-content-between"
                  style="width: 120px"
                >
                  <span class="text-xs">결과</span>
                  <span class="text-xs text-muted"
                    >{{ row.progress.done }}건</span
                  >
                </div>
              </div>
            </td>
            <td class="text-center">
              <button
                class="btn btn-sm btn-primary mb-0"
                @click="viewPlan(row)"
              >
                보기
              </button>
            </td>
            <td class="text-center">
              <button
                class="btn btn-sm mb-0"
                :class="
                  row.canResultView ? 'btn-primary' : 'btn-secondary disabled'
                "
                @click="row.canResultView && viewResult(row)"
              >
                보기
              </button>
            </td>
          </tr>
        </template>
      </MainTable>
    </div>
  </div>
</template>
