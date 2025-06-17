<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import '../assets/form.css'

const username = ref('')
const password = ref('')
const router = useRouter()
const isLoggedIn = inject('isLoggedIn')

function handleLogin(e) {
  e.preventDefault()
  // Here you would normally check credentials with your backend
  // For now, just redirect to home
  isLoggedIn.value = true
  router.push('/')
}
</script>

<template>
  <div class="main">
    <h1>MuieGrumpy</h1>
    <h3>Enter your muiegrumpy credentials</h3>
    <form @submit="handleLogin">
      <label for="first">
        Username:
      </label>
      <input v-model="username" type="text" id="first" name="first" placeholder="Enter your Username" required>

      <label for="password">
        Password:
      </label>
      <input v-model="password" type="password" id="password" name="password" placeholder="Enter your Password" required>

      <div class="wrap">
        <button type="submit">
          Submit
        </button>
      </div>
    </form>
    <p>Not registered?
      <a href="/register" style="text-decoration: none;">
        Create an account
      </a>
    </p>
  </div>
</template>