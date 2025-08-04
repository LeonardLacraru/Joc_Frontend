<script setup>
import { onMounted, ref, provide, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";

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
<ul
  v-if="!['/login', '/register'].includes(route.path)"
  class="nav flex-column position-fixed start-0 top-0 h-100 bg-dark text-white p-3 d-flex justify-content-between"
  style="width: 120px;"
>
  <div>
    <li class="nav-item" v-if="!isLoggedIn">
      <router-link class="nav-link text-white" to="/login">Login</router-link>
    </li>
    <li class="nav-item" v-if="!isLoggedIn">
      <router-link class="nav-link text-white" to="/register">Register</router-link>
    </li>
    <li class="nav-item" v-if="isLoggedIn">
      <router-link class="nav-link text-white" to="/profile">Profile</router-link>
    </li>
    <li class="nav-item" v-if="isLoggedIn">
      <router-link class="nav-link text-white" to="/battle">Battle</router-link>
    </li>
    <li class="nav-item" v-if="isLoggedIn">
      <router-link class="nav-link text-white" to="/ranking">Ranking</router-link>
    </li>
    <li class="nav-item" v-if="isLoggedIn">
      <router-link class="nav-link text-white" to="/marketplace">Marketplace</router-link>
    </li>
    <li class="nav-item" v-if="isLoggedIn">
      <router-link class="nav-link text-white" to="/guild">Guild</router-link>
    </li>
  </div>

  <div v-if="isLoggedIn">
    <li class="nav-item">
      <a class="nav-link text-danger" href="#" @click.prevent="logout">Logout</a>
    </li>
  </div>
</ul>

<router-view />

</template>
