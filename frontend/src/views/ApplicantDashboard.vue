<script setup>
import { ref, computed } from "vue";

/**
 * [1] 좌측 검색(필터) 상태값
 */
const filters = ref({
  dateFrom: "2023-05-07",
  dateTo: "2023-07-10",
  targetName: "",
  applicantName: "",
  managerName: "",
  stage: "전체", // 대기단계: 전체/검토중/대기/긴급/종결 등
  progress: {
    review: false, // 검토
    approve: false, // 승인
    reject: false, // 반려
    done: false, // 결과(완료)
  },
});

/**
 * [2] 우측 테이블 더미 데이터 (나중에 API로 교체)
 */
const rows = ref([
  {
    no: 12,
    targetName: "홍길순",
    applicantName: "홍길동",
    applyDate: "2024.01.27",
    managerName: "",
    stage: "검토 중",
    progress: { review: 0, approve: 0, reject: 0, done: 0 },
    canPlanView: false,
    canResultView: false,
  },
  {
    no: 11,
    targetName: "홍영희",
    applicantName: "홍길동",
    applyDate: "2024.02.15",
    managerName: "최연희",
    stage: "종결",
    progress: { review: 0, approve: 0, reject: 1, done: 0 },
    canPlanView: true,
    canResultView: true,
  },
  {
    no: 10,
    targetName: "홍철수",
    applicantName: "홍정희",
    applyDate: "2023.12.22",
    managerName: "박하선",
    stage: "대기",
    progress: { review: 0, approve: 2, reject: 0, done: 0 },
    canPlanView: true,
    canResultView: false,
  },
  {
    no: 9,
    targetName: "홍철수",
    applicantName: "홍민구",
    applyDate: "2023.12.20",
    managerName: "조인성",
    stage: "긴급",
    progress: { review: 0, approve: 0, reject: 1, done: 0 },
    canPlanView: false,
    canResultView: false,
  },
]);

/**
 * [3] “검색” 버튼을 눌렀을 때, 실제로는 API 호출해야 함.
 * 지금은 일단 콘솔 출력만.
 */
const onSearch = () => {
  console.log("검색 조건:", filters.value);
  // TODO: 나중에 API 붙일 때 여기서 axios로 호출
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
};

/**
 * [4] 화면에서 바로 필터링되는 느낌을 주기 위한 computed (선택)
 * - 실제 서비스면 서버검색(API)로 바꾸는 게 일반적
 */
const filteredRows = computed(() => {
  const f = filters.value;

  return rows.value.filter((r) => {
    // 지원대상자명
    if (f.targetName && !r.targetName.includes(f.targetName)) return false;

    // ✅ 지원자명
    if (f.applicantName && !r.applicantName.includes(f.applicantName))
      return false;

    // 담당자명
    if (f.managerName && !r.managerName.includes(f.managerName)) return false;

    // 대기단계
    if (f.stage !== "전체" && r.stage !== f.stage) return false;

    // 진행 체크(하나라도 체크되어 있으면 해당 진행값이 1 이상인 row만)
    const progressChecks = f.progress;
    const anyProgressChecked =
      progressChecks.review ||
      progressChecks.approve ||
      progressChecks.reject ||
      progressChecks.done;

    if (anyProgressChecked) {
      if (progressChecks.review && r.progress.review <= 0) return false;
      if (progressChecks.approve && r.progress.approve <= 0) return false;
      if (progressChecks.reject && r.progress.reject <= 0) return false;
      if (progressChecks.done && r.progress.done <= 0) return false;
    }

    return true;
  });
});

// 보기 버튼 (일단 동작만)
const viewApply = (row) => alert(`지원신청서 보기: ${row.no}`);
const viewPlan = (row) => alert(`지원계획 보기: ${row.no}`);
const viewResult = (row) => alert(`지원결과 보기: ${row.no}`);
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

          <div class="card-body">
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

            <!-- 대기단계 (PDF처럼 버튼 느낌) -->
            <label class="form-label text-sm">대기단계</label>
            <div class="d-flex flex-wrap gap-2">
              <button
                class="btn btn-sm mb-0"
                :class="
                  filters.stage === '전체'
                    ? 'btn-warning'
                    : 'btn-outline-secondary'
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
                  filters.stage === '대기'
                    ? 'btn-warning'
                    : 'btn-outline-secondary'
                "
                @click="filters.stage = '대기'"
              >
                대기
              </button>
              <button
                class="btn btn-sm mb-0"
                :class="
                  filters.stage === '긴급'
                    ? 'btn-warning'
                    : 'btn-outline-secondary'
                "
                @click="filters.stage = '긴급'"
              >
                긴급
              </button>
              <button
                class="btn btn-sm mb-0"
                :class="
                  filters.stage === '종결'
                    ? 'btn-warning'
                    : 'btn-outline-secondary'
                "
                @click="filters.stage = '종결'"
              >
                종결
              </button>
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
              <button class="btn btn-success mb-0" @click="onSearch">
                검색
              </button>
              <button class="btn btn-outline-secondary mb-0" @click="onReset">
                초기화
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 우측: 지원신청 내역 테이블 -->
      <div class="col-lg-9">
        <div class="card">
          <div class="card-header pb-0">
            <h6 class="mb-0">지원신청 내역</h6>
          </div>

          <div class="card-body pt-3">
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
                  <tr v-for="row in filteredRows" :key="row.no">
                    <td class="text-center text-sm">{{ row.no }}</td>
                    <td class="text-center text-sm">{{ row.targetName }}</td>
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
                      {{ row.managerName || "-" }}
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

                  <tr v-if="filteredRows.length === 0">
                    <td
                      colspan="10"
                      class="text-center text-sm text-muted py-4"
                    >
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- (선택) 페이지네이션은 다음 단계에서 붙이자 -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
