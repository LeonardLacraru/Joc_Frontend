<script setup>
import { onMounted, ref, provide, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import "./assets/navbar.css";

const isLoggedIn = ref(false);
provide("isLoggedIn", isLoggedIn);

// Check localStorage on app load
if (localStorage.getItem("access")) {
  isLoggedIn.value = true;
}

const route = useRoute();
const router = useRouter();

watchEffect(() => {
  const noNavbarRoutes = ["/login", "/register"];
  if (noNavbarRoutes.includes(route.path)) {
    document.body.classList.add("no-navbar");
  } else {
    document.body.classList.remove("no-navbar");
  }
});

function logout() {
  isLoggedIn.value = false;
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  router.replace("/");
}
</script>

<template>
  <ul v-if="!['/login', '/register'].includes(route.path)" class="vertical">
    <li v-if="!isLoggedIn"><router-link to="/login">Login</router-link></li>
    <li v-if="!isLoggedIn">
      <router-link to="/register">Register</router-link>
    </li>
    <!-- <li v-if="isLoggedIn"><router-link to="/shop">Shop</router-link></li> -->
    <li v-if="isLoggedIn"><router-link to="/profile">Profile</router-link></li>
    <li v-if="isLoggedIn"><router-link to="/battle">Battle</router-link></li>
    <li v-if="isLoggedIn"><router-link to="/ranking">Ranking</router-link></li>
    <li v-if="isLoggedIn"><a href="#" @click.prevent="logout">Logout</a></li>
  </ul>
  <router-view />
</template>
