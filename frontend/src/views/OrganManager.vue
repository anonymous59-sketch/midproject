<script setup>
import HeaderNavbar from "../components/HeaderNavbar.vue";
</script>

<template>
  <div>
    <nav>
      <HeaderNavbar />
    </nav>
    <div class="container-fluid pb-4">
      <router-view />
    </div>
  </div>
</template>
