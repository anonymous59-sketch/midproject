<!-- 담당자(a0_30) 홈: 로그인한 담당자 m_no = support.mgr_no 로 담당 지원 목록 표시 -->
<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { usePagination } from "@/composables/usePagination";
import SearchNavbar from "@/views/components/SearchNavbar.vue";
import MainTable from "@/views/components/MainTable.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import ArgonInput from "@/components/ArgonInput.vue";

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
  managerName: "",
  stage: "전체",
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
      if (
        ["긴급", "중점", "계획", "반려"].includes(f.stage) &&
        stage !== f.stage
      )
        return false;
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

// 지원대상자명 클릭 시: 해당 지원신청의 sup_code 로 지원이력 페이지 이동
const goSupportHistory = (row) => {
  if (!row.sup_code) return;
  router.push({
    name: "SupportHistory",
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
          <ArgonInput v-model="filters.dateFrom" type="date" size="sm" />
          <ArgonInput v-model="filters.dateTo" type="date" size="sm" />
        </div>
        <hr class="horizontal dark my-3" />
        <label class="form-label text-sm">지원대상자명</label>
        <ArgonInput
          v-model="filters.targetName"
          type="text"
          size="sm"
          placeholder="보호대상자명"
        />
        <div class="mt-3">
          <label class="form-label text-sm">지원자명</label>
          <ArgonInput
            v-model="filters.applicantName"
            type="text"
            size="sm"
            placeholder="보호자 이름"
          />
        </div>
        <hr class="horizontal dark my-3" />
        <label class="form-label text-sm">지원진행상태</label>
        <div class="d-flex flex-wrap gap-2 align-items-center">
          <div class="form-check mb-0">
            <input
              id="mgr-stage-all"
              v-model="filters.stage"
              type="radio"
              value="전체"
              class="form-check-input"
            />
            <label class="form-check-label text-sm" for="mgr-stage-all"
              >전체</label
            >
          </div>
          <div class="form-check mb-0">
            <input
              id="mgr-stage-review"
              v-model="filters.stage"
              type="radio"
              value="검토"
              class="form-check-input"
            />
            <label class="form-check-label text-sm" for="mgr-stage-review"
              >검토</label
            >
          </div>
          <div class="form-check mb-0">
            <input
              id="mgr-stage-supple"
              v-model="filters.stage"
              type="radio"
              value="보완"
              class="form-check-input"
            />
            <label class="form-check-label text-sm" for="mgr-stage-supple"
              >보완</label
            >
          </div>
          <div class="form-check mb-0">
            <input
              id="mgr-stage-plan"
              v-model="filters.stage"
              type="radio"
              value="계획"
              class="form-check-input"
            />
            <label class="form-check-label text-sm" for="mgr-stage-plan"
              >계획</label
            >
          </div>
          <div class="form-check mb-0">
            <input
              id="mgr-stage-focus"
              v-model="filters.stage"
              type="radio"
              value="중점"
              class="form-check-input"
            />
            <label class="form-check-label text-sm" for="mgr-stage-focus"
              >중점</label
            >
          </div>
          <div class="form-check mb-0">
            <input
              id="mgr-stage-urgent"
              v-model="filters.stage"
              type="radio"
              value="긴급"
              class="form-check-input"
            />
            <label class="form-check-label text-sm" for="mgr-stage-urgent"
              >긴급</label
            >
          </div>
          <div class="form-check mb-0">
            <input
              id="mgr-stage-reject"
              v-model="filters.stage"
              type="radio"
              value="반려"
              class="form-check-input"
            />
            <label class="form-check-label text-sm" for="mgr-stage-reject"
              >반려</label
            >
          </div>
        </div>
        <hr class="horizontal dark my-3" />
        <label class="form-label text-sm">계획/결과 진행</label>
        <div class="d-flex flex-wrap gap-2 align-items-center">
          <div class="form-check mb-0">
            <input
              id="m-p1"
              class="form-check-input"
              type="checkbox"
              v-model="filters.progress.review"
            />
            <label class="form-check-label text-sm" for="m-p1">검토</label>
          </div>
          <div class="form-check mb-0">
            <input
              id="m-p2"
              class="form-check-input"
              type="checkbox"
              v-model="filters.progress.approve"
            />
            <label class="form-check-label text-sm" for="m-p2">승인</label>
          </div>
          <div class="form-check mb-0">
            <input
              id="m-p3"
              class="form-check-input"
              type="checkbox"
              v-model="filters.progress.reject"
            />
            <label class="form-check-label text-sm" for="m-p3">반려</label>
          </div>
          <div class="form-check mb-0">
            <input
              id="m-p4"
              class="form-check-input"
              type="checkbox"
              v-model="filters.progress.done"
            />
            <label class="form-check-label text-sm" for="m-p4">결과</label>
          </div>
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
        :colspan="8"
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
        </template>
        <template #body>
          <tr v-for="(row, idx) in pagedRows" :key="row.sup_code || row.no">
            <td class="text-center text-sm">
              {{ rowDisplayNo(idx) }}
            </td>
            <td
              class="text-center text-sm support-name-td"
              :class="{ 'support-name-td--clickable': !!row.targetName }"
              :role="row.targetName ? 'button' : null"
              :tabindex="row.targetName ? 0 : -1"
              @click.prevent="row.targetName && goSupportHistory(row)"
              @keydown.enter.prevent="row.targetName && goSupportHistory(row)"
              @keydown.space.prevent="row.targetName && goSupportHistory(row)"
            >
              <span v-if="!row.targetName">-</span>
              <span v-else>{{ row.targetName }}</span>
            </td>
            <td class="text-center text-sm">
              {{ row.applicantName || "-" }}
            </td>
            <td class="text-center text-sm">{{ row.applyDate }}</td>
            <td class="text-center">
              <ArgonButton
                size="sm"
                color="primary"
                class="mb-0"
                @click="viewApply(row)"
              >
                보기
              </ArgonButton>
            </td>
            <td class="text-center text-sm">
              {{ row.managerName || "미배정" }}
            </td>
            <td class="text-center text-sm">
              {{ stageDisplayForManager(row.stage) }}
            </td>
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
          </tr>
        </template>
      </MainTable>
    </div>
  </div>
</template>

<style scoped>
.support-name-td {
  transition: background-color 0.15s ease;
}
.support-name-td--clickable {
  cursor: pointer;
}
.support-name-td--clickable:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
.support-name-td--clickable:focus {
  outline: none;
  background-color: rgba(0, 0, 0, 0.06);
}
</style>
