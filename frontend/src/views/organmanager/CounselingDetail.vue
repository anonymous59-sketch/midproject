<script setup>
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const id = route.params.id;

const goBack = () => router.push("/organmanager/counselings");
</script>

<template>
  <div class="container-fluid py-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">상담 상세</h4>
      <button class="btn btn-sm btn-outline-secondary mb-0" @click="goBack">
        목록
      </button>
    </div>

    <div class="card">
      <div class="card-body">
        <p class="mb-0">
          상담 ID: <strong>{{ id }}</strong>
        </p>
        <hr />
        <p class="text-secondary mb-0">
          (임시 화면) 나중에 API 연결해서 상세 내용 출력
        </p>
      </div>
    </div>
  </div>
</template>
