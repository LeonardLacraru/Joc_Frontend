<template>
  <div class="main">
    <h1>
      <span v-if="isLoggedIn">Welcome, {{ username }} to OurGame!</span>
      <span v-else>Welcome guest to OurGame!</span>
    </h1>
    <p>This is the home page of the OurGame application.</p>
    <p>Use the navigation links to explore the app.</p>
  </div>
</template>

<script setup>
import { inject, ref, onMounted } from "vue";
const isLoggedIn = inject("isLoggedIn");
const username = ref("");

onMounted(() => {
  username.value = localStorage.getItem("username") || "";
});
</script>
