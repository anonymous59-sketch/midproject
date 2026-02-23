<script setup>
import { RouterLink, RouterView } from "vue-router";
import { computed } from "vue";

const user = {
  role: "ORG_ADMIN",
  orgName: "대구 남구 지원센터",
  userName: "김태균",
};

const greetingText = computed(
  () => `${user.orgName} 관리자, ${user.userName}님`,
);

const menuItems = computed(() => [
  { label: "홈", to: "/organmanager" },
  { label: "담당자 관리", to: "/organmanager/managers" },
  { label: "상담내역", to: "/organmanager/counselings" },
]);
</script>

<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-white">
      <div class="container-fluid">
        <RouterLink class="navbar-brand" to="/">On.Demand</RouterLink>

        <ul class="navbar-nav ms-auto">
          <li class="nav-item" v-for="item in menuItems" :key="item.to">
            <RouterLink class="nav-link" :to="item.to">{{
              item.label
            }}</RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <div class="container-fluid py-3">
      <h4 class="mb-0">{{ greetingText }}</h4>
    </div>

    <!-- ✅ 자식 페이지 출력 자리 -->
    <RouterView />
  </div>
</template>
