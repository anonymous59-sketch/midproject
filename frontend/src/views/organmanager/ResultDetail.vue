<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const id = computed(() => route.params.id);

// TODO: 나중에 API로 교체
const result = ref({
  applicantNo: Number(id.value),
  targetName: "홍영희",
  applicantName: "김보호",
  orgName: "대구 남구 지원센터",
  managerName: "최연희",
  stage: "종결",
  resultStatus: "반려", // 승인/반려/완료 등
  completedAt: "2024.02.28",
  summary: "상담 결과 지원 요건 미충족으로 반려 처리.",
  notes: "추가 서류 제출 요청(진단서/소득 증빙) 안내 완료.",
  attachments: [
    { name: "결과보고서.pdf", url: "#" },
    { name: "상담기록.txt", url: "#" },
  ],
});

const goBack = () => router.back();
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h5 class="mb-0">지원결과 상세</h5>
      <button class="btn btn-outline-secondary btn-sm mb-0" @click="goBack">
        뒤로
      </button>
    </div>

    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <div class="text-xs text-muted">신청번호</div>
            <div class="fw-semibold">{{ result.applicantNo }}</div>
          </div>
          <div class="col-md-3">
            <div class="text-xs text-muted">지원대상자</div>
            <div class="fw-semibold">{{ result.targetName }}</div>
          </div>
          <div class="col-md-3">
            <div class="text-xs text-muted">지원자명</div>
            <div class="fw-semibold">{{ result.applicantName }}</div>
          </div>
          <div class="col-md-3">
            <div class="text-xs text-muted">담당자</div>
            <div class="fw-semibold">{{ result.managerName || "-" }}</div>
          </div>

          <div class="col-md-3">
            <div class="text-xs text-muted">기관</div>
            <div class="fw-semibold">{{ result.orgName }}</div>
          </div>
          <div class="col-md-3">
            <div class="text-xs text-muted">단계</div>
            <div class="fw-semibold">{{ result.stage }}</div>
          </div>
          <div class="col-md-3">
            <div class="text-xs text-muted">결과상태</div>
            <span
              class="badge"
              :class="
                result.resultStatus === '승인'
                  ? 'bg-success'
                  : result.resultStatus === '반려'
                    ? 'bg-danger'
                    : 'bg-secondary'
              "
            >
              {{ result.resultStatus }}
            </span>
          </div>
          <div class="col-md-3">
            <div class="text-xs text-muted">처리일</div>
            <div class="fw-semibold">{{ result.completedAt || "-" }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header pb-0">
        <h6 class="mb-0">결과 요약</h6>
      </div>
      <div class="card-body">
        <p class="mb-2">{{ result.summary }}</p>
        <div class="text-xs text-muted">비고</div>
        <p class="mb-0">{{ result.notes }}</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header pb-0">
        <h6 class="mb-0">첨부</h6>
      </div>
      <div class="card-body">
        <div v-if="result.attachments?.length">
          <div
            v-for="(a, idx) in result.attachments"
            :key="idx"
            class="d-flex align-items-center justify-content-between py-2 border-bottom"
          >
            <span class="text-sm">{{ a.name }}</span>
            <a class="btn btn-outline-primary btn-sm mb-0" :href="a.url">
              다운로드
            </a>
          </div>
        </div>
        <div v-else class="text-sm text-muted">첨부 파일이 없습니다.</div>
      </div>
    </div>
  </div>
</template>
