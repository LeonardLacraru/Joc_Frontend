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
  {path: "/create_guild", component: CreateGuild, meta: { requiresAuth: true } }, // Protected route
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem("access");
  if (to.meta.requiresAuth && !isLoggedIn) {
    next("/"); // Redirect to home if not logged in
  } else {
    next();
  }
});

export default router;
