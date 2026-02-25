<script setup>
import { RouterLink } from "vue-router";
import HeaderNavbar from "../components/HeaderNavbar.vue";
import { computed } from "vue";

const menuItems = computed(() => [
  { label: "홈", to: "/organmanager" },
  { label: "담당자 관리", to: "/organmanager/managers" },
  { label: "상담내역", to: "/organmanager/counselings" },
]);
</script>

<template>
  <div>
    <!-- Header -->
    <nav>
      <HeaderNavbar />
      <div class="container-fluid">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item" v-for="item in menuItems" :key="item.to">
            <RouterLink class="nav-link" :to="item.to">
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- ✅ 여기서부터 children 화면이 출력됨 -->
    <div class="container-fluid pb-4">
      <router-view />
    </div>
  </div>
</template>
