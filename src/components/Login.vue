<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import '../assets/form.css'

const username = ref('')
const password = ref('')
const router = useRouter()
const isLoggedIn = inject('isLoggedIn')

async function handleLogin(e) {
  e.preventDefault()
  const payload = {
    username: username.value,
    password: password.value
  }

  const response = await fetch('http://13.62.56.34:8000/api/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await response.json() // <--- This is how you get the response data

  if (response.ok) {
    // Login successful, use data (e.g., save token, redirect)
    console.log('Login success:', data)
  } else {
    // Handle error
    alert(data.message || 'Login failed')
  }
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
      <input v-model="username" value="username" type="text" id="first" name="first" placeholder="Enter your Username" required>

      <label for="password">
        Password:
      </label>
      <input v-model="password" value="password" type="password" id="password" name="password" placeholder="Enter your Password" required>

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