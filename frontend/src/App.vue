<!--
=========================================================
* Vue Argon Dashboard 2 - v4.0.0
=========================================================

* Product Page: https://creative-tim.com/product/vue-argon-dashboard
* Copyright 2024 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
-->
<script setup>
import { computed } from "vue";
import { RouterView } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { onMounted } from "vue";

import MainLayout from "@/layouts/MainLayout.vue";
import AdminLayout from "@/layouts/AdminLayout.vue";

const authStore = useAuthStore();

const layout = computed(() => {
  // 시스템 관리자
  if (authStore.user?.m_auth === "a0_99") {
    return AdminLayout;
  }
  if (!authStore.user) {
    return null;
  }
  // 일반 사용자 / 기관 담당자 / 기관 관리자
  return MainLayout;
});

onMounted(() => {
  authStore.hydrateFromStorage();
});
</script>

<template>
  <!-- 레이아웃 있는 경우 -->
  <component v-if="layout" :is="layout">
    <RouterView />
  </component>

  <!-- 레이아웃 없는 경우 -->
  <RouterView v-else />
</template>
