<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import TablePagination from "@/views/components/TablePagination.vue";

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

/** 검색 버튼 클릭 시에만 적용 */
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
    const res = await fetch(`/api/apply/organmanager-list?m_org=${encodeURIComponent(mOrg)}`);
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
    const res = await fetch(`/api/apply/support/${encodeURIComponent(assigningSupCode.value)}/manager`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mgr_no: assigningMgrNo.value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "담당자 배정에 실패했습니다.");
    assigningSupCode.value = "";
    assigningMgrNo.value = "";
    await loadOrganManagerList();
  } catch (e) {
    alert(e.message || "담당자 배정에 실패했습니다.");
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
    if (f.dateFrom && r.applyDate && r.applyDate < f.dateFrom.replace(/-/g, ".")) return false;
    if (f.dateTo && r.applyDate && r.applyDate > f.dateTo.replace(/-/g, ".")) return false;
    if (f.targetName && !String(r.targetName).includes(f.targetName)) return false;
    if (f.applicantName && !String(r.applicantName).includes(f.applicantName)) return false;
    if (f.managerName && !String(r.managerName || "").includes(f.managerName)) return false;
    const stageAny = f.stage.review || f.stage.wait || f.stage.apply || f.stage.approve || f.stage.reject;
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

// 페이징: 페이지당 10건, 번호는 전체 건수 기준 내림차순(첫 행이 가장 큰 번호)
const page = ref(1);
const pageSize = 10;
const totalRows = computed(() => filteredRows.value.length);
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredRows.value.slice(start, start + pageSize);
});
const rowDisplayNo = (indexInPage) =>
  totalRows.value - ((page.value - 1) * pageSize + indexInPage);

watch(
  () => filteredRows.value.length,
  () => {
    page.value = 1;
  },
);

onMounted(() => {
  loadOrganManagerList();
});

const viewApply = (row) => {
  if (row.sup_code) router.push(`/review/${encodeURIComponent(row.sup_code)}`);
  else alert("지원 정보를 찾을 수 없습니다.");
};
const viewPlan = (row) => {
  if (row.sup_code) router.push(`/support-plan/${encodeURIComponent(row.sup_code)}`);
  else alert("지원 정보를 찾을 수 없습니다.");
};
const viewCounseling = (row) => {
  if (row.sup_code) router.push(`/review/${encodeURIComponent(row.sup_code)}`);
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
      <!-- 좌측: 상세검색 -->
      <div class="col-lg-3 mb-4">
        <div class="card">
          <div class="card-header pb-0">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="mb-0">상세 검색</h6>
              <!-- <small class="text-muted">초기화 가능</small> -->
            </div>
          </div>

          <form class="card-body" @submit.prevent="onSearch">
            <!-- 날짜 -->
            <label class="form-label text-sm">작성일</label>
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

            <!-- 지원대상자 -->
            <label class="form-label text-sm">지원대상자</label>
            <input
              v-model="filters.targetName"
              type="text"
              class="form-control form-control-sm"
              placeholder="예) 홍길동"
            />

            <div class="mt-3">
              <label class="form-label text-sm">지원자명</label>
              <input
                v-model="filters.applicantName"
                type="text"
                class="form-control form-control-sm"
                placeholder="예) 보호자 이름"
              />
            </div>

            <div class="mt-3">
              <label class="form-label text-sm">담당자명</label>
              <input
                v-model="filters.managerName"
                type="text"
                class="form-control form-control-sm"
                placeholder="예) 담당자 이름"
              />
            </div>

            <hr class="horizontal dark my-3" />

            <label class="form-label text-sm">대기단계</label>
            <div class="form-check">
              <input id="o-s0" class="form-check-input" type="checkbox" v-model="filters.stage.review" />
              <label class="form-check-label text-sm" for="o-s0">검토</label>
            </div>
            <div class="form-check">
              <input id="o-s1" class="form-check-input" type="checkbox" v-model="filters.stage.wait" />
              <label class="form-check-label text-sm" for="o-s1">대기</label>
            </div>
            <div class="form-check">
              <input id="o-s2" class="form-check-input" type="checkbox" v-model="filters.stage.apply" />
              <label class="form-check-label text-sm" for="o-s2">신청</label>
            </div>
            <div class="form-check">
              <input id="o-s3" class="form-check-input" type="checkbox" v-model="filters.stage.approve" />
              <label class="form-check-label text-sm" for="o-s3">승인</label>
            </div>
            <div class="form-check">
              <input id="o-s4" class="form-check-input" type="checkbox" v-model="filters.stage.reject" />
              <label class="form-check-label text-sm" for="o-s4">반려</label>
            </div>

            <hr class="horizontal dark my-3" />

            <!-- 결재/결과 진행 -->
            <label class="form-label text-sm">결재/결과 진행</label>
            <div class="form-check">
              <input
                id="p1"
                class="form-check-input"
                type="checkbox"
                v-model="filters.progress.review"
              />
              <label class="form-check-label text-sm" for="p1">검토</label>
            </div>
            <div class="form-check">
              <input
                id="p2"
                class="form-check-input"
                type="checkbox"
                v-model="filters.progress.approve"
              />
              <label class="form-check-label text-sm" for="p2">승인</label>
            </div>
            <div class="form-check">
              <input
                id="p3"
                class="form-check-input"
                type="checkbox"
                v-model="filters.progress.reject"
              />
              <label class="form-check-label text-sm" for="p3">반려</label>
            </div>
            <div class="form-check">
              <input
                id="p4"
                class="form-check-input"
                type="checkbox"
                v-model="filters.progress.done"
              />
              <label class="form-check-label text-sm" for="p4">결과</label>
            </div>

            <div class="mt-4 d-grid gap-2">
              <button type="submit" class="btn btn-success mb-0">
                검색
              </button>
              <button type="button" class="btn btn-outline-secondary mb-0" @click="onReset">
                초기화
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 우측: 지원신청 내역 테이블 -->
      <div class="col-lg-9">
        <div class="card">
          <div class="card-header pb-0">
            <h6 class="mb-0">지원신청 내역</h6>
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
                    <th class="text-center text-xs">상담내역</th>
                    <th class="text-center text-xs">지원결과</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-if="listLoading">
                    <td colspan="11" class="text-center text-muted py-4">불러오는 중...</td>
                  </tr>
                  <tr v-else-if="filteredRows.length === 0">
                    <td colspan="11" class="text-center text-sm text-muted py-4">검색 결과가 없습니다.</td>
                  </tr>
                  <tr v-else v-for="(row, idx) in pagedRows" :key="row.sup_code || row.no">
                    <td class="text-center text-sm">{{ rowDisplayNo(idx) }}</td>
                    <td class="text-center text-sm">{{ row.targetName }}</td>
                    <td class="text-center text-sm">{{ row.applicantName }}</td>
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
                            <button
                              type="button"
                              class="btn btn-sm btn-primary"
                              @click="confirmAssignManager"
                            >
                              배정
                            </button>
                            <button
                              type="button"
                              class="btn btn-sm btn-outline-secondary"
                              @click="cancelAssignManager"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                        <button
                          v-else
                          type="button"
                          class="btn btn-link btn-sm p-0 text-danger text-decoration-none"
                          @click="beginAssignManager(row)"
                        >
                          미배정
                        </button>
                      </template>
                    </td>
                    <td class="text-center text-sm">{{ row.stage }}</td>

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
                      <button
                        class="btn btn-sm mb-0"
                        :class="
                          row.canPlanView
                            ? 'btn-primary'
                            : 'btn-secondary disabled'
                        "
                        @click="row.canPlanView && viewPlan(row)"
                      >
                        보기
                      </button>
                    </td>

                    <!-- ✅ 상담내역 보기 추가 -->
                    <td class="text-center">
                      <button
                        class="btn btn-sm mb-0"
                        :class="
                          row.canCounselView
                            ? 'btn-info'
                            : 'btn-secondary disabled'
                        "
                        @click="
                          row.canCounselView && viewCounseling(row)
                        "
                      >
                        보기
                      </button>
                    </td>

                    <td class="text-center">
                      <button
                        class="btn btn-sm mb-0"
                        :class="
                          row.canResultView
                            ? 'btn-primary'
                            : 'btn-secondary disabled'
                        "
                        @click="row.canResultView && viewResult(row)"
                      >
                        보기
                      </button>
                    </td>
                  </tr>

                  </tbody>
              </table>
            </div>

            <TablePagination
              v-if="totalRows > pageSize"
              v-model:page="page"
              :total="totalRows"
              :page-size="pageSize"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
