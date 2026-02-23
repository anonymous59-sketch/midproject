<!-- src/views/Dashboard.vue -->
<script setup>
import { ref, computed } from "vue";

/**
 * (임시) 화면 확인용 더미 데이터
 * 나중에 API 붙이면 여기만 교체하면 됨
 */
const keyword = ref("");
const status = ref("all"); // all | inReview | interview | passed
const dateFrom = ref("");
const dateTo = ref("");

const applicants = ref([
  {
    id: 101,
    name: "홍길동",
    phone: "010-1234-5678",
    appliedAt: "2026-02-20",
    status: "inReview",
  },
  {
    id: 102,
    name: "김영희",
    phone: "010-2222-3333",
    appliedAt: "2026-02-19",
    status: "interview",
  },
  {
    id: 103,
    name: "박철수",
    phone: "010-9999-8888",
    appliedAt: "2026-02-18",
    status: "passed",
  },
]);

const statusLabel = (s) => {
  if (s === "inReview") return "서류검토";
  if (s === "interview") return "면접";
  if (s === "passed") return "최종합격";
  return "전체";
};

const filteredApplicants = computed(() => {
  const k = keyword.value.trim();
  return applicants.value.filter((a) => {
    const matchKeyword =
      !k ||
      a.name.includes(k) ||
      a.phone.includes(k) ||
      String(a.id).includes(k);

    const matchStatus = status.value === "all" || a.status === status.value;

    const matchFrom = !dateFrom.value || a.appliedAt >= dateFrom.value;
    const matchTo = !dateTo.value || a.appliedAt <= dateTo.value;

    return matchKeyword && matchStatus && matchFrom && matchTo;
  });
});

const resetFilters = () => {
  keyword.value = "";
  status.value = "all";
  dateFrom.value = "";
  dateTo.value = "";
};
</script>

<template>
  <div class="py-4 container-fluid">
    <!-- 상단 헤더 영역 (view-008 메인화면 레이아웃 개요) -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex align-items-center justify-content-between">
          <div>
            <h5 class="mb-1">지원자 관리</h5>
            <p class="text-sm text-secondary mb-0">
              지원자 리스트를 조회하고 상태를 관리합니다.
            </p>
          </div>

          <!-- (선택) 우측 상단 액션 버튼 -->
          <div class="d-flex gap-2">
            <button
              class="btn btn-sm btn-outline-secondary mb-0"
              @click="resetFilters"
            >
              필터 초기화
            </button>
            <button class="btn btn-sm btn-primary mb-0">신규 등록</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 본문 2컬럼 레이아웃: 좌 필터 / 우 리스트 (view-009, view-010) -->
    <div class="row">
      <!-- 좌측: 필터 패널 (view-009 지원자리스트 레이아웃 상세) -->
      <div class="col-lg-3 col-12 mb-4">
        <div class="card">
          <div class="card-header pb-0">
            <h6 class="mb-0">검색/필터</h6>
          </div>

          <div class="card-body">
            <label class="form-label text-sm">키워드</label>
            <input
              v-model="keyword"
              type="text"
              class="form-control"
              placeholder="이름/전화번호/ID"
            />

            <div class="mt-3">
              <label class="form-label text-sm">상태</label>
              <select v-model="status" class="form-select">
                <option value="all">전체</option>
                <option value="inReview">서류검토</option>
                <option value="interview">면접</option>
                <option value="passed">최종합격</option>
              </select>
            </div>

            <div class="mt-3">
              <label class="form-label text-sm">지원일 (From)</label>
              <input v-model="dateFrom" type="date" class="form-control" />
            </div>

            <div class="mt-3">
              <label class="form-label text-sm">지원일 (To)</label>
              <input v-model="dateTo" type="date" class="form-control" />
            </div>

            <div class="mt-4 d-grid gap-2">
              <button class="btn btn-primary mb-0">검색</button>
              <button
                class="btn btn-outline-secondary mb-0"
                @click="resetFilters"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 우측: 리스트(테이블) 영역 (view-010 메인페이지 content 영역) -->
      <div class="col-lg-9 col-12">
        <div class="card">
          <div class="card-header pb-0">
            <div class="d-flex align-items-center justify-content-between">
              <h6 class="mb-0">지원자 리스트</h6>
              <span class="text-sm text-secondary">
                총 {{ filteredApplicants.length }}명
              </span>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table align-items-center mb-0">
              <thead>
                <tr>
                  <th
                    class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  >
                    ID
                  </th>
                  <th
                    class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  >
                    이름
                  </th>
                  <th
                    class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  >
                    전화번호
                  </th>
                  <th
                    class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  >
                    지원일
                  </th>
                  <th
                    class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  >
                    상태
                  </th>
                  <th
                    class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 text-end"
                  >
                    액션
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="a in filteredApplicants" :key="a.id">
                  <td class="text-sm">{{ a.id }}</td>
                  <td class="text-sm font-weight-bold">{{ a.name }}</td>
                  <td class="text-sm">{{ a.phone }}</td>
                  <td class="text-sm">{{ a.appliedAt }}</td>
                  <td class="text-sm">
                    <span
                      class="badge"
                      :class="{
                        'bg-gradient-info': a.status === 'inReview',
                        'bg-gradient-warning': a.status === 'interview',
                        'bg-gradient-success': a.status === 'passed',
                      }"
                    >
                      {{ statusLabel(a.status) }}
                    </span>
                  </td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary mb-0">
                      상세
                    </button>
                  </td>
                </tr>

                <tr v-if="filteredApplicants.length === 0">
                  <td colspan="6" class="text-center text-secondary py-4">
                    조건에 맞는 지원자가 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="card-footer d-flex justify-content-end">
            <!-- (나중에 페이지네이션 영역) -->
            <span class="text-xs text-secondary"
              >페이지네이션은 다음 단계에서 붙입니다.</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
