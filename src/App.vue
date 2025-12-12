<script setup>
import { onMounted, ref, provide, watchEffect, computed, watch} from "vue";
import { useRoute, useRouter } from "vue-router";
import { authFetch } from "./utils/authFetch";
import { useWorldBossTimer } from "./composables/useWorldBossTimer";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const isLoggedIn = ref(false);
const profile = ref(null);
provide("isLoggedIn", isLoggedIn);

// World Boss Timer
const { isActive: isBossActive, formattedTime: bossTimeRemaining } = useWorldBossTimer();

// Check localStorage on app load
// Only set isLoggedIn to true if we have both access and refresh tokens
if (localStorage.getItem("access") && localStorage.getItem("refresh")) {
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

// Navbar chapter expansion state - all expanded by default
const expandedChapters = ref({
  profile: true,
  activities: true,
  town: true,
});
</script>

<template>
  <div v-if="!['/login', '/register'].includes(route.path)" class="d-flex flex-column flex-shrink-0 p-3 sidebar-fantasy"
    style="width: 180px; position: fixed; top: 0; left: 0; height: 100vh; z-index: 100;">
    <!-- <router-link to="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-body-emphasis text-decoration-none">
      <span class="fs-4">Sidebar</span>
    </router-link> -->
    <ul class="nav nav-pills flex-column mb-auto">
      <!-- Guest Links -->
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

      <!-- PROFILE Chapter -->
      <li v-if="isLoggedIn" class="nav-chapter">
        <div class="chapter-header">
          <span class="chapter-title">PROFILE</span>
        </div>
        <ul class="subchapter-list">
          <li>
            <router-link to="/profile" class="nav-link subchapter">
              Character
            </router-link>
          </li>
          <li>
            <router-link to="/guild" class="nav-link subchapter">
              Guild
            </router-link>
          </li>
        </ul>
      </li>

      <!-- TOWN Chapter -->
      <li v-if="isLoggedIn" class="nav-chapter">
        <div class="chapter-header">
          <span class="chapter-title">TOWN</span>
        </div>
        <ul class="subchapter-list">
          <li>
            <router-link to="/marketplace" class="nav-link subchapter">
              Marketplace
            </router-link>
          </li>
          <li>
            <router-link to="/blacksmith" class="nav-link subchapter">
              Blacksmith
            </router-link>
          </li>
        </ul>
      </li>

      <!-- ACTIVITIES Chapter -->
      <li v-if="isLoggedIn" class="nav-chapter">
        <div class="chapter-header">
          <span class="chapter-title">ACTIVITIES</span>
        </div>
        <ul class="subchapter-list">
          <li>
            <router-link to="/battle" class="nav-link subchapter">
              Battle
            </router-link>
          </li>
          <li>
            <router-link to="/garden" class="nav-link subchapter">
              Lifeskill
            </router-link>
          </li>
          <li>
            <router-link to="/worldboss" class="nav-link subchapter">
              World Boss
            </router-link>
          </li>
        </ul>
      </li>

      <!-- Ranking (standalone) -->
      <li v-if="isLoggedIn">
        <router-link to="/ranking" class="nav-link">
          Ranking
        </router-link>
      </li>
    </ul>

    <!-- World Boss Timer -->
    <div v-if="isLoggedIn && isBossActive" class="world-boss-timer">
      <div class="boss-timer-icon">⚔️</div>
      <div class="boss-timer-content">
        <div class="boss-timer-title">World Boss Active</div>
        <div class="boss-timer-countdown">{{ bossTimeRemaining }}</div>
      </div>
    </div>

    <hr />
    <div v-if="isLoggedIn" class="dropdown">
      <a href="#" class="d-flex align-items-center text-decoration-none dropdown-toggle character-name-link"
        data-bs-toggle="dropdown" aria-expanded="false">
        <img
          :src="raceImage"
          alt=""
          width="64"
          height="64"
          class="rounded-circle me-2"
        />
        <span class="character-name">{{ profile?.character_name }}</span>
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
  background:
    linear-gradient(180deg, rgba(26, 15, 21, 0.85) 0%, rgba(34, 23, 27, 0.9) 30%, rgba(45, 26, 31, 0.9) 70%, rgba(26, 15, 21, 0.85) 100%),
    url('@/assets/navbar.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #e7d7b1 !important;
  border-radius: 0.5rem;
  box-shadow:
    0 0 30px rgba(139, 69, 19, 0.3),
    0 2px 16px rgba(40, 10, 20, 0.6),
    inset 0 0 60px rgba(0, 0, 0, 0.4);
  min-height: 100vh;
  border: 2px solid #4a2a1f;
  border-left: 3px solid #6d3a2a;
  position: relative;
  overflow: hidden;
}

.sidebar-fantasy::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(ellipse at top, rgba(139, 69, 19, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at bottom, rgba(75, 0, 130, 0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.sidebar-fantasy > * {
  position: relative;
  z-index: 1;
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

.character-name-link {
  color: #e7d7b1 !important;
}

.character-name {
  color: #e7d7b1 !important;
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  font-weight: normal;
}

/* Chapter/Subchapter Styles */
.nav-chapter {
  margin-bottom: 0.5rem;
}

.chapter-header {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 0.4rem;
  transition: all 0.3s ease;
  user-select: none;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid transparent;
}

.chapter-header:hover {
  background: linear-gradient(90deg, rgba(139, 69, 19, 0.3) 0%, rgba(58, 35, 35, 0.5) 100%);
  border-color: rgba(139, 69, 19, 0.4);
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.2);
}

.chapter-icon {
  font-size: 0.8rem;
  margin-right: 0.5rem;
  color: #d4af37;
  min-width: 1rem;
}

.chapter-title {
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  font-weight: bold;
  color: #d4af37;
  letter-spacing: 1px;
}

.chapter-header.nested {
  padding: 0.4rem 0.6rem;
  margin-left: 1rem;
}

.chapter-header.nested .chapter-title {
  font-size: 0.95rem;
  color: #c9b8a0;
}

.subchapter-list {
  list-style: none;
  padding-left: 1.5rem;
  margin: 0;
  margin-top: 0.25rem;
}

.subchapter-list.nested {
  padding-left: 1rem;
}

.nav-link.subchapter {
  font-size: 0.95rem;
  padding: 0.4rem 0.75rem;
  color: #c9b8a0 !important;
  border-radius: 0.4rem;
}

.nav-link.subchapter:hover,
.nav-link.subchapter.router-link-active {
  background: #3a2323 !important;
  color: #f5e6c8 !important;
}

.nested-chapter {
  margin-top: 0.25rem;
}

/* World Boss Timer */
.world-boss-timer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  margin: 0.5rem 0;
  background: linear-gradient(135deg, #6a0f19 0%, #4a0a12 100%);
  border: 2px solid #d4af37;
  border-radius: 8px;
  box-shadow: 0 0 16px rgba(212, 175, 55, 0.4), inset 0 0 20px rgba(212, 175, 55, 0.1);
  animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-border {
  0%, 100% {
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.4), inset 0 0 20px rgba(212, 175, 55, 0.1);
    border-color: #d4af37;
  }
  50% {
    box-shadow: 0 0 24px rgba(212, 175, 55, 0.6), inset 0 0 30px rgba(212, 175, 55, 0.2);
    border-color: #ffd700;
  }
}

.boss-timer-icon {
  font-size: 2rem;
  animation: shake 0.5s ease-in-out infinite;
}

@keyframes shake {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

.boss-timer-content {
  flex: 1;
}

.boss-timer-title {
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  font-weight: bold;
  color: #d4af37;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.boss-timer-countdown {
  font-family: 'Courier New', monospace;
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 8px rgba(212, 175, 55, 0.8);
  letter-spacing: 2px;
}
</style>
