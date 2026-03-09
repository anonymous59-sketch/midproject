<!-- 일반 이용자 / 기관담당자 / 기관관리자 레이아웃 (Argon Dashboard 스타일) -->
<script setup>
// import { RouterView } from "vue-router";
import HeaderNavbar from "@/components/HeaderNavbar.vue";
</script>

<template>
  <div class="layout-main min-vh-100 position-relative">
    <!-- 배경: 아래쪽 회색 (Argon 스타일) -->
    <div
      class="position-absolute top-0 start-0 w-100 h-100 bg-gray-100"
      aria-hidden="true"
    />
    <!-- 배경: 위쪽 녹색 띠 (사이트 정체성 색감, Argon 그라데이션) -->
    <div
      class="position-absolute top-0 start-0 w-100 min-height-300 bg-gradient-success"
      aria-hidden="true"
    />
    <HeaderNavbar class="position-relative z-index-1" />
    <main
      class="main-content position-relative z-index-1 border-radius-xl mt-3 mt-md-4 mx-2 mx-md-4 bg-white shadow"
    >
      <div class="container-fluid py-4 pb-4">
        <slot />
      </div>
    </main>
  </div>
</template>
