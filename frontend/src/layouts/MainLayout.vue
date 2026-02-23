<script setup>
import { RouterView } from "vue-router";
import HeaderNavbar from "@/components/HeaderNavbar.vue";
</script>

<template>
  <div class="min-height-300 bg-gray-100">
    <HeaderNavbar />

    <main class="main-content position-relative border-radius-lg">
      <RouterView />
    </main>
  </div>
</template>
