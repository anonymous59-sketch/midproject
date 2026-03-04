<!-- 담당자(a0_30) 홈: 로그인한 담당자 m_no = support.mgr_no 로 담당 지원 목록 표시 -->
<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";

const router = useRouter();
const authStore = useAuthStore();

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

/** 검색 버튼/엔터 시에만 적용 */
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

function mapApiRow(r, index) {
  return {
    no: index + 1,
    sup_code: r.sup_code,
    targetName: r.target_name || "",
    applicantName: r.applicant_name || "",
    applyDate: formatApplyDate(r.sup_day),
    managerName: r.manager_name || "",
    stage: r.stage_name || r.req_yn || "",
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

async function loadManagerList() {
  const mNo = authStore.user?.m_no;
  if (!mNo) {
    listError.value = "로그인 정보가 없습니다.";
    rows.value = [];
    return;
  }
  listLoading.value = true;
  listError.value = "";
  try {
    const res = await fetch(`/api/apply/manager-list?m_no=${encodeURIComponent(mNo)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "목록 조회 실패");
    rows.value = Array.isArray(data) ? data.map((r, i) => mapApiRow(r, i)) : [];
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
    if (f.dateFrom && r.applyDate && r.applyDate < f.dateFrom.replace(/-/g, ".")) return false;
    if (f.dateTo && r.applyDate && r.applyDate > f.dateTo.replace(/-/g, ".")) return false;
    if (f.targetName && !String(r.targetName).includes(f.targetName)) return false;
    if (f.applicantName && !String(r.applicantName).includes(f.applicantName)) return false;
    if (f.managerName && !String(r.managerName || "").includes(f.managerName)) return false;
    if (f.stage !== "전체" && r.stage !== f.stage) return false;
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

onMounted(() => loadManagerList());

const viewApply = (row) => {
  if (row.sup_code) router.push(`/review/${encodeURIComponent(row.sup_code)}`);
  else alert("지원 정보를 찾을 수 없습니다.");
};
const viewPlan = (row) => {
  if (row.sup_code) router.push(`/support-plan/${encodeURIComponent(row.sup_code)}`);
  else alert("지원 정보를 찾을 수 없습니다.");
};
const viewResult = (row) => {
  if (row.sup_code) router.push(`/support-result/${encodeURIComponent(row.sup_code)}`);
  else alert("지원 정보를 찾을 수 없습니다.");
};
</script>

<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-lg-3 mb-4">
        <div class="card">
          <div class="card-header pb-0">
            <h6 class="mb-0">상세 검색</h6>
          </div>
          <form class="card-body" @submit.prevent="onSearch">
            <label class="form-label text-sm">지원신청일</label>
            <div class="d-flex gap-2">
              <input v-model="filters.dateFrom" type="date" class="form-control form-control-sm" />
              <input v-model="filters.dateTo" type="date" class="form-control form-control-sm" />
            </div>
            <hr class="horizontal dark my-3" />
            <label class="form-label text-sm">지원대상자명</label>
            <input v-model="filters.targetName" type="text" class="form-control form-control-sm" placeholder="보호대상자명" />
            <div class="mt-3">
              <label class="form-label text-sm">지원자명</label>
              <input v-model="filters.applicantName" type="text" class="form-control form-control-sm" placeholder="보호자 이름" />
            </div>
            <div class="mt-3">
              <label class="form-label text-sm">담당자명</label>
              <input v-model="filters.managerName" type="text" class="form-control form-control-sm" placeholder="담당자 이름" />
            </div>
            <hr class="horizontal dark my-3" />
            <label class="form-label text-sm">대기단계</label>
            <div class="d-flex flex-wrap gap-2">
              <button class="btn btn-sm mb-0" :class="filters.stage === '전체' ? 'btn-warning' : 'btn-outline-secondary'" @click="filters.stage = '전체'">전체</button>
              <button class="btn btn-sm mb-0" :class="filters.stage === '검토 중' ? 'btn-warning' : 'btn-outline-secondary'" @click="filters.stage = '검토 중'">검토 중</button>
              <button class="btn btn-sm mb-0" :class="filters.stage === '대기' ? 'btn-warning' : 'btn-outline-secondary'" @click="filters.stage = '대기'">대기</button>
              <button class="btn btn-sm mb-0" :class="filters.stage === '긴급' ? 'btn-warning' : 'btn-outline-secondary'" @click="filters.stage = '긴급'">긴급</button>
              <button class="btn btn-sm mb-0" :class="filters.stage === '종결' ? 'btn-warning' : 'btn-outline-secondary'" @click="filters.stage = '종결'">종결</button>
            </div>
            <hr class="horizontal dark my-3" />
            <label class="form-label text-sm">결재/결과 진행</label>
            <div class="form-check">
              <input id="m-p1" class="form-check-input" type="checkbox" v-model="filters.progress.review" />
              <label class="form-check-label text-sm" for="m-p1">검토</label>
            </div>
            <div class="form-check">
              <input id="m-p2" class="form-check-input" type="checkbox" v-model="filters.progress.approve" />
              <label class="form-check-label text-sm" for="m-p2">승인</label>
            </div>
            <div class="form-check">
              <input id="m-p3" class="form-check-input" type="checkbox" v-model="filters.progress.reject" />
              <label class="form-check-label text-sm" for="m-p3">반려</label>
            </div>
            <div class="form-check">
              <input id="m-p4" class="form-check-input" type="checkbox" v-model="filters.progress.done" />
              <label class="form-check-label text-sm" for="m-p4">결과</label>
            </div>
            <div class="mt-4 d-grid gap-2">
              <button type="submit" class="btn btn-success mb-0">검색</button>
              <button type="button" class="btn btn-outline-secondary mb-0" @click="onReset">초기화</button>
            </div>
          </form>
        </div>
      </div>

      <div class="col-lg-9">
        <div class="card">
          <div class="card-header pb-0">
            <h6 class="mb-0">담당 지원신청 내역</h6>
          </div>
          <div class="card-body pt-3">
            <p v-if="listError" class="text-danger small mb-2">{{ listError }}</p>
            <div class="table-responsive">
              <table class="table align-items-center">
                <thead>
                  <tr>
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
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="listLoading">
                    <td colspan="10" class="text-center text-muted py-4">불러오는 중...</td>
                  </tr>
                  <tr v-else-if="filteredRows.length === 0">
                    <td colspan="10" class="text-center text-sm text-muted py-4">검색 결과가 없습니다.</td>
                  </tr>
                  <tr v-else v-for="row in filteredRows" :key="row.sup_code || row.no">
                    <td class="text-center text-sm">{{ row.no }}</td>
                    <td class="text-center text-sm">{{ row.targetName }}</td>
                    <td class="text-center text-sm">{{ row.applicantName || "-" }}</td>
                    <td class="text-center text-sm">{{ row.applyDate }}</td>
                    <td class="text-center">
                      <button class="btn btn-sm btn-primary mb-0" @click="viewApply(row)">보기</button>
                    </td>
                    <td class="text-center text-sm">{{ row.managerName || "-" }}</td>
                    <td class="text-center text-sm">{{ row.stage }}</td>
                    <td class="text-center text-sm">
                      <div class="d-flex flex-column align-items-center gap-1">
                        <div class="d-flex justify-content-between" style="width: 120px">
                          <span class="text-xs">검토</span>
                          <span class="text-xs text-muted">{{ row.progress.review }}건</span>
                        </div>
                        <div class="d-flex justify-content-between" style="width: 120px">
                          <span class="text-xs">승인</span>
                          <span class="text-xs text-muted">{{ row.progress.approve }}건</span>
                        </div>
                        <div class="d-flex justify-content-between" style="width: 120px">
                          <span class="text-xs">반려</span>
                          <span class="text-xs text-muted">{{ row.progress.reject }}건</span>
                        </div>
                        <div class="d-flex justify-content-between" style="width: 120px">
                          <span class="text-xs">결과</span>
                          <span class="text-xs text-muted">{{ row.progress.done }}건</span>
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
                        :class="row.canResultView ? 'btn-primary' : 'btn-secondary disabled'"
                        @click="row.canResultView && viewResult(row)"
                      >
                        보기
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
