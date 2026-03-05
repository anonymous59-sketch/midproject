<script setup>
import HeaderNavbar from "@/components/HeaderNavbar.vue";
</script>

<template>
  <div>
    <HeaderNavbar />
    <div class="container-fluid pb-4">
      <router-view />
    </div>
  </div>
</template>
