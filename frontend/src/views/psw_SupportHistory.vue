<script setup>
/**
 * psw_ 지원대상 이력 페이지.
 * - 기준 supCode 로 같은 지원대상자(mc_pn)의 모든 지원신청(support)을 조회
 * - 지원신청일자(sup_day)를 기준으로 블록을 나누고, 각 블록 안에서
 *   상담일지 / 지원계획 / 지원결과 목록을 스크롤로 연속해서 보여준다.
 *
 * API: GET /api/psw/support-history/:supCode
 */
// 연결할 때 해당 페이지의 라우터 연결 방법)
//  router.push({
//   name: "PswSupportHistory",      // 라우트 이름 예시
//   params: { sup_code: row.sup_code }, // 또는 supCode: row.sup_code
// });
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import HeaderNavbar from "@/components/HeaderNavbar.vue";

const route = useRoute();
const router = useRouter();

// 지원이력 조회 기준 코드
// - 지원신청 PK(sup_code)를 params 또는 query 로 받았을 때 모두 처리
//   예) /psw-support-history/ABC123  (params.supCode)
//       /psw-support-history/ABC123  (params.sup_code)
//       /psw-support-history?sup_code=ABC123 (query.sup_code)
const supCode = computed(() => {
  return (
    route.params.supCode ||
    route.params.sup_code ||
    route.query.supCode ||
    route.query.sup_code ||
    ""
  );
});

const loading = ref(false);
const error = ref("");
const target = ref(null); // 지원대상자(dsbl_prs) 정보
const supports = ref([]); // 지원신청별 이력 블록

function formatDate(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateTime(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function disabilityLabel(code) {
  return code || "";
}

// function authLabel(auth) {
//   const map = {
//     a0_10: "대기자",
//     a0_20: "일반이용자",
//     a0_30: "기관담당자",
//     a0_40: "기관관리자",
//     a0_99: "시스템관리자",
//   };
//   return map[auth] || auth || "";
// }

async function loadHistory() {
  if (!supCode.value) {
    error.value = "지원번호(sup_code)가 없습니다.";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const { data } = await axios.get(
      `/api/viewAll/support-history/${encodeURIComponent(supCode.value)}`
    );

    target.value = data.target || null;

    const rawSupports = Array.isArray(data.supports)
      ? data.supports
      : [];

    supports.value = rawSupports.map((s) => ({
      ...s,
      activeTab: "counsel",
    }));
  } catch (e) {
    console.error(e);
    error.value =
      e.response?.data?.retMsg ||
      e.message ||
      "지원 이력 조회 중 오류가 발생했습니다.";

    target.value = null;
    supports.value = [];
  } finally {
    loading.value = false;
  }
}

// function changeTab(block, tab) {
//   block.activeTab = tab;
// }

function resolveReviewTab(activeTab) {
  if (activeTab === "plan") return "plan";
  if (activeTab === "result") return "result";
  // 상담일지는 별도 탭이 없으므로 기본 지원신청서 탭으로 진입
  return "application";
}

function goView(block) {
  const tab = resolveReviewTab(block?.activeTab);
  router.push({
    name: "review",
    params: { sup_code: block.sup_code },
    query: { tab },
  });
}

function contentPreview(text, max = 40) {
  if (!text) return "";
  return text.length <= max ? text : `${text.slice(0, max)}...`;
}

onMounted(() => {
  loadHistory();
});
</script>

<template>
  <div>
    <HeaderNavbar />
    <div class="container-fluid py-4">
      <h5 class="mb-3">지원대상 이력</h5>

      <!-- 상단: 지원대상 기본 정보 -->
      <div class="card shadow-sm mb-3">
        <div class="card-body">
          <div v-if="!target && loading" class="text-muted">로딩 중...</div>
          <div v-else-if="!target" class="text-muted">
            지원대상 정보를 찾을 수 없습니다.
          </div>
          <div v-else class="row g-3 align-items-center">
            <div class="col-md-3">
              <div class="mb-1 text-muted small">지원대상</div>
              <div class="fs-6 fw-semibold">{{ target.mc_nm }}</div>
              <div class="text-muted small">
                {{ formatDate(target.mc_bd) }} /
                {{ disabilityLabel(target.mc_type) }}
              </div>
            </div>
            <div class="col-md-3">
              <div class="mb-1 text-muted small">주소</div>
              <div class="small">{{ target.mc_address }}</div>
            </div>
            <div class="col-md-3">
              <div class="mb-1 text-muted small">등록일</div>
              <div class="small">{{ formatDate(target.mc_submitdate) }}</div>
            </div>
            <div class="col-md-3 text-md-end">
              <div class="mb-1 text-muted small">지원신청 건수</div>
              <div class="fs-6 fw-semibold">{{ supports.length }}건</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 에러 메시지 -->
      <p v-if="error" class="text-danger small mb-2">
        {{ error }}
      </p>

      <!-- 지원 이력 블록들 -->
      <div v-if="loading && supports.length === 0" class="text-muted">
        지원 이력을 불러오는 중입니다...
      </div>
      <div v-else-if="!loading && supports.length === 0" class="text-muted">
        지원 이력이 없습니다.
      </div>
      <div v-else class="psw-history-scroll">
        <div
          v-for="block in supports"
          :key="block.sup_code"
          class="card shadow-sm mb-4"
        >
          <!-- 블록 헤더: 지원신청일자 + 보기/등록 -->
          <div
            class="card-header d-flex flex-wrap justify-content-between align-items-center py-2"
          >
            <div class="d-flex flex-wrap align-items-center gap-2">
              <span class="badge bg-secondary me-1">지원신청일자</span>
              <span class="fw-semibold">
                {{ formatDate(block.sup_day) }}
              </span>
              <span class="text-muted small ms-2">
                ({{ block.sup_code }})
              </span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <!-- 유형 선택 (상담일지 / 지원계획 / 지원결과) -->
              <select
                v-model="block.activeTab"
                class="form-select form-select-sm w-auto"
              >
                <option value="counsel">상담일지</option>
                <option value="plan">지원계획</option>
                <option value="result">지원결과</option>
              </select>
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                @click="goView(block)"
              >
                해당지원신청서로 이동하기
              </button>
            </div>
          </div>

          <!-- 블록 본문: 3번 영역 (선택된 유형에 해당하는 목록을 카드 형태로 표시) -->
          <div class="card-body psw-block-body">
            <!-- 상담일지 -->
            <template v-if="block.activeTab === 'counsel'">
              <h6 class="mb-3">상담일지</h6>
              <div
                v-if="!block.counsels || block.counsels.length === 0"
                class="text-muted small"
              >
                등록된 상담일지가 없습니다.
              </div>
              <div v-else class="psw-entry-list">
                <div
                  v-for="csl in block.counsels"
                  :key="csl.csl_code"
                  class="psw-entry-card"
                >
                  <div
                    class="d-flex justify-content-between align-items-center mb-1"
                  >
                    <div class="fw-semibold">
                      {{ csl.csl_title }}
                    </div>
                    <div class="text-muted small">
                      {{ formatDate(csl.csl_date) }}
                    </div>
                  </div>
                  <div class="text-muted small mb-1">
                    작성자: {{ csl.csl_name || "-" }}
                  </div>
                  <div class="psw-entry-content">
                    {{ contentPreview(csl.csl_content) }}
                  </div>
                </div>
              </div>
            </template>

            <!-- 지원계획 -->
            <template v-else-if="block.activeTab === 'plan'">
              <h6 class="mb-3">지원계획</h6>
              <div
                v-if="!block.plans || block.plans.length === 0"
                class="text-muted small"
              >
                등록된 지원계획이 없습니다.
              </div>
              <div v-else class="psw-entry-list">
                <div
                  v-for="plan in block.plans"
                  :key="plan.plan_code"
                  class="psw-entry-card"
                >
                  <div
                    class="d-flex justify-content-between align-items-center mb-1"
                  >
                    <div class="fw-semibold">
                      {{ plan.plan_goal }}
                    </div>
                    <div class="text-muted small">
                      {{ formatDate(plan.plan_date) }}
                    </div>
                  </div>
                  <div class="text-muted small mb-1">
                    상태:
                    <span class="badge bg-light text-dark ms-1">
                      {{ plan.plan_tf }}
                    </span>
                  </div>
                  <div class="psw-entry-content">
                    {{ contentPreview(plan.plan_content) }}
                  </div>
                </div>
              </div>
            </template>

            <!-- 지원결과 -->
            <template v-else>
              <h6 class="mb-3">지원결과</h6>
              <div
                v-if="!block.results || block.results.length === 0"
                class="text-muted small"
              >
                등록된 지원결과가 없습니다.
              </div>
              <div v-else class="psw-entry-list">
                <div
                  v-for="result in block.results"
                  :key="result.result_code"
                  class="psw-entry-card"
                >
                  <div
                    class="d-flex justify-content-between align-items-center mb-1"
                  >
                    <div class="fw-semibold">
                      {{ result.result_title }}
                    </div>
                    <div class="text-muted small">
                      {{ formatDate(result.result_date) }}
                    </div>
                  </div>
                  <div class="text-muted small mb-1">
                    계획번호: {{ result.plan_code }}
                    <span class="badge bg-light text-dark ms-2">
                      {{ result.result_tf }}
                    </span>
                  </div>
                  <div class="psw-entry-content">
                    {{ contentPreview(result.result_content) }}
                  </div>
                  <div
                    v-if="result.result_updday"
                    class="text-muted text-end small mt-1"
                  >
                    최종수정: {{ formatDateTime(result.result_updday) }}
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.psw-history-scroll {
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}

.psw-block-body {
  background-color: #f9fafb;
}

.psw-entry-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.psw-entry-card {
  background-color: #ffffff;
  border-radius: 0.5rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--bs-border-color, #dee2e6);
}

.psw-entry-content {
  white-space: pre-line;
  font-size: 0.875rem;
}
</style>

