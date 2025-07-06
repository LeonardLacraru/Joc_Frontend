import { createRouter, createWebHistory } from "vue-router";
import Login from "../components/Login.vue";
import Register from "../components/Register.vue";
import Home from "../components/Home.vue";
import Profile from "../components/Profile.vue";
import Battle from "../components/Battle.vue";
const routes = [
  { path: "/", component: Home },
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/profile", component: Profile },
  { path: "/battle", component: Battle }, //, meta: { requiresAuth: true } },
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
