import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Register from '../components/Register.vue'
import Inventory from '../components/Inventory.vue'  
const routes = [
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/inventory', component: Inventory },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router