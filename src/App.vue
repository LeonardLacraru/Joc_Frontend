<script setup>
import { ref, provide } from 'vue'
import { useRoute } from 'vue-router'
import './assets/navbar.css'
const isLoggedIn = ref(false)
provide('isLoggedIn', isLoggedIn)
const route = useRoute()
</script>

<template>
  <ul v-if="!['/login', '/register'].includes(route.path)" class="vertical">
    <li v-if="!isLoggedIn"><router-link to="/login">Login</router-link></li>
    <li v-if="!isLoggedIn"><router-link to="/register">Register</router-link></li>
    <li v-if="isLoggedIn"><router-link to="/shop">Shop</router-link></li>
    <li v-if="isLoggedIn"><router-link to="/profile">Profile</router-link></li>
    <li v-if="isLoggedIn"><router-link to="/inventory">Inventory</router-link></li>
    <li v-if="isLoggedIn"><router-link to="/about">About</router-link></li>
    <li v-if="isLoggedIn"><a href="#" @click.prevent="isLoggedIn = false">Logout</a></li>
  </ul>
  <router-view />
</template>

