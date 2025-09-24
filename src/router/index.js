import { createRouter, createWebHistory } from "vue-router";
import Login from "../components/Login.vue";
import Register from "../components/Register.vue";
import Home from "../components/Home.vue";
import Profile from "../components/Profile.vue";
import Battle from "../components/Battle.vue";
import Ranking from "../components/Ranking.vue"; 
import Attack_player from "@/components/Attack_player.vue";
import Marketplace from "@/components/Marketplace.vue"; 
import Guild from "@/components/Guild.vue"; 
import CreateGuild from "@/components/CreateGuild.vue"; 
import WorldBoss from "@/components/WorldBoss.vue";
import AdminPanel from "@/components/AdminPanel.vue";
import Village from "@/components/Village.vue"; 
import Blacksmith from "@/components/Blacksmith.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/profile", component: Profile, meta: { requiresAuth: true } }, // Protected route
  { path: "/battle", component: Battle, meta: { requiresAuth: true } }, // Protected route
  {path : "/ranking", component: Ranking , meta:{requiresAuth: true}},//
  {path: "/PVP", component: Attack_player, meta: { requiresAuth: true } }, // Protected route
  {path:"/marketplace", component: Marketplace, meta: { requiresAuth: true } }, // Protected route
  {path: "/guild", component: Guild, meta: { requiresAuth: true } }, // Protected route
  {path: "/create_guild", component: CreateGuild, meta: { requiresAuth: true } },
  {path:"/worldboss", component: WorldBoss, meta:{requestAuth: true}}, // Protected route
  {path:"/adminpanel", component: AdminPanel, meta:{requiresAuth: true}}, // Protected route
  {path:"/village", component: Village, meta: { requiresAuth: true}}, 
  {path:"/blacksmith", component: Blacksmith, meta: { requiresAuth: true}}, 
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const isLoggedIn = !!localStorage.getItem("access");
  if (to.meta.requiresAuth && !isLoggedIn) {
    next("/"); // Redirect to home if not logged in
    return;
  }
  if (to.meta.requiresAdmin) {
    // Try to get profile from localStorage
    let profile = null;
    try {
      profile = JSON.parse(localStorage.getItem("profile"));
    } catch (e) {}
    // If not found, fetch from API
    if (!profile) {
      try {
        const res = await import("../utils/authFetch.js").then(m => m.authFetch)(`${import.meta.env.VITE_API_BASE_URL}/profile/`);
        if (res && res.ok) {
          profile = await res.json();
          localStorage.setItem("profile", JSON.stringify(profile)); // <-- FIXED HERE
        }
      } catch (e) {}
    }
    if (!profile?.is_admin) {
      next("/"); // Not admin, redirect
      return;
    }
  }
  next();
});

export default router;
