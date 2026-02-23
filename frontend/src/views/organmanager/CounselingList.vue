<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// 더미 데이터 (나중에 API로 교체)
const counselingList = ref([
  {
    id: 1,
    applicantName: "홍길동",
    category: "취업",
    createdAt: "2026-02-22",
    status: "접수",
  },
  {
    id: 2,
    applicantName: "김영희",
    category: "심리",
    createdAt: "2026-02-21",
    status: "처리중",
  },
]);

const goDetail = (id) => {
  router.push(`/organmanager/counselings/${id}`);
};
</script>

<template>
  <div class="container-fluid py-3">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h4 class="mb-0">상담내역</h4>
    </div>

    <div class="card">
      <div class="card-header pb-0">
        <h6 class="mb-0">상담내역 목록</h6>
      </div>

      <div class="card-body px-0 pt-0 pb-2">
        <div class="table-responsive p-0">
          <table class="table align-items-center mb-0">
            <thead>
              <tr>
                <th
                  class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-4"
                >
                  신청자
                </th>
                <th
                  class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                >
                  분류
                </th>
                <th
                  class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                >
                  신청일
                </th>
                <th
                  class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                >
                  상태
                </th>
                <th class="text-secondary opacity-7 text-end pe-4"></th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="row in counselingList" :key="row.id">
                <td class="ps-4">
                  <p class="text-sm mb-0">{{ row.applicantName }}</p>
                </td>
                <td>
                  <p class="text-sm mb-0">{{ row.category }}</p>
                </td>
                <td>
                  <p class="text-sm mb-0">{{ row.createdAt }}</p>
                </td>
                <td>
                  <span class="badge badge-sm bg-gradient-success">{{
                    row.status
                  }}</span>
                </td>
                <td class="text-end pe-4">
                  <button
                    class="btn btn-sm btn-outline-primary mb-0"
                    @click="goDetail(row.id)"
                  >
                    보기
                  </button>
                </td>
              </tr>

              <tr v-if="counselingList.length === 0">
                <td colspan="5" class="text-center py-4 text-secondary">
                  상담내역이 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
