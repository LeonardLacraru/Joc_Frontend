<script setup>
import { onMounted, ref, provide, watchEffect, computed, watch} from "vue";
import { useRoute, useRouter } from "vue-router";
import { authFetch } from "./utils/authFetch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const isLoggedIn = ref(false);
const profile = ref(null);
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

async function fetchProfile() {
  try {
    const response = await authFetch(`${API_BASE_URL}/profile/`);
    if (response && response.ok) {
      const data = await response.json();
      profile.value = data || 0;
      return null;
    } else {
      const errData = await response.json();
      alert(errData.detail || JSON.stringify(errData));
    }
  } catch (err) {
    alert(err.message);
    error.value = err.message;
    loading.value = false;
    return err.message;
  }
}



onMounted(() => {
  if (isLoggedIn.value === true) {
    fetchProfile();
  }
});
const raceImage = computed(() => {
  if (profile.value?.race) {
    return new URL(`./assets/${profile.value.race}.png`, import.meta.url).href;
  }
});

watch(isLoggedIn, (newVal) => {
  if (newVal) {
    fetchProfile();
  } else {
    profile.value = null;
  }
});
</script>

<template>
  <div v-if="!['/login', '/register'].includes(route.path)" class="d-flex flex-column flex-shrink-0 p-3 sidebar-fantasy"
    style="width: 180px; position: fixed; top: 0; left: 0; height: 100vh; z-index: 100;">
    <!-- <router-link to="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-body-emphasis text-decoration-none">
      <span class="fs-4">Sidebar</span>
    </router-link> -->
    <ul class="nav nav-pills flex-column mb-auto">
      <li v-if="!isLoggedIn">
        <router-link to="/" class="nav-link active" aria-current="page">
          Home
        </router-link>
      </li>
      <li v-if="!isLoggedIn">
        <router-link to="/login" class="nav-link link-body-emphasis">
          Log in
        </router-link>
      </li>
      <li v-if="!isLoggedIn">
        <router-link to="/register" class="nav-link link-body-emphasis">
          Register
        </router-link>
      </li>
      <li v-if="isLoggedIn">
        <router-link to="/profile" class=" nav-link">
          Profile
        </router-link>
      </li>
      <li v-if="isLoggedIn">
        <router-link to="/battle" class="nav-link">
          Battle
        </router-link>
      </li>
      <li v-if="isLoggedIn">
        <router-link to="/ranking" class="nav-link">
          Ranking
        </router-link>
      </li>
      <li v-if="isLoggedIn">
        <router-link to="/marketplace" class="nav-link">
          Marketplace
        </router-link>
      </li>
      <li v-if="isLoggedIn">
        <router-link to="/guild" class="nav-link">
          Guild
        </router-link>
      </li>
      <li v-if="isLoggedIn">
        <router-link to="/worldboss" class="nav-link">
          World Boss
        </router-link>
      </li>
      <li v-if="isLoggedIn && profile?.is_admin">
        <router-link to="/village" class="nav-link">
          Village
        </router-link>
      </li>
    </ul>
    <hr />
    <div v-if="isLoggedIn" class="dropdown">
      <a href="#" class="d-flex align-items-center link-body-emphasis text-decoration-none dropdown-toggle"
        data-bs-toggle="dropdown" aria-expanded="false">
        <img
          :src="raceImage"
          alt=""
          width="64"
          height="64"
          class="rounded-circle me-2"
        />
        <strong>{{ profile?.character_name }}</strong>
      </a>
      <ul class="dropdown-menu text-small shadow">
        <li>
          <a class="dropdown-item" href="#" @click.prevent="logout">Sign out</a>
        </li>
      </ul>
  </div>
  </div>
  <router-view />
</template>

<style>
/* Dark Fantasy RPG Sidebar Theme */
.sidebar-fantasy {
  background: linear-gradient(180deg, #22171b 70%, #181012 100%) !important;
  color: #e7d7b1 !important;
  border-radius: 0.5rem;
  box-shadow: 0 2px 16px rgba(40, 10, 20, 0.4);
  min-height: 100vh;
  border: 1.5px solid #2d161a;
}

.sidebar-fantasy .nav-link,
.sidebar-fantasy .dropdown-toggle,
.sidebar-fantasy .link-body-emphasis {
  color: #e7d7b1 !important;
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  border-radius: 0.4rem;
  transition: background 0.2s, color 0.2s;
}

.sidebar-fantasy .nav-link.active,
.sidebar-fantasy .nav-link:hover,
.sidebar-fantasy .dropdown-item:hover {
  background: #3a2323 !important;
  color: #f5e6c8 !important;
  box-shadow: 0 2px 8px #0005 !important;
  border-radius: 8px !important;
  font-weight: bold;
  letter-spacing: 1px;
  transition: background 0.2s, color 0.2s;
}

.sidebar-fantasy .dropdown-menu {
  background: #22171b;
  color: #e7d7b1;
  border: 1px solid #6a0f19;
  font-family: 'Cinzel', serif;
}

.sidebar-fantasy .dropdown-item {
  color: #e7d7b1;
}

.sidebar-fantasy .dropdown-divider {
  border-top: 1px solid #6a0f19;
}

.sidebar-fantasy .fs-4 {
  color: #ffe600;
  font-family: 'Cinzel', serif;
  font-weight: bold;
  text-shadow: 0 1px 6px #181012;
}

.sidebar-fantasy hr {
  border-top: 1px solid #6a0f19;
}

.sidebar-fantasy .rounded-circle {
  border: 2px solid #6a0f19;
}
</style>
