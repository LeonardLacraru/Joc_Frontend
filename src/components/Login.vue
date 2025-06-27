<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import '../assets/form.css'

const character_name = ref('')
const password = ref('')
const router = useRouter()
const isLoggedIn = inject('isLoggedIn')

async function handleLogin(e) {
  e.preventDefault()
  const payload = {
    username: character_name.value,
    password: password.value
  }

  const response = await fetch('http://13.62.56.34:8000/api/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await response.json()

  if (response.ok) {
    console.log('Data received from Django backend:', data) // This logs the data to the
    localStorage.setItem('access', data.access)
    localStorage.setItem('refresh', data.refresh)
    localStorage.setItem('character_name', character_name.value)
    isLoggedIn.value = true
    router.push('/') // Redirect to x page after successful login
  } else {
      if (data.detail) {
    alert(data.detail)
  } else if (typeof data === 'object') {
    // Show all field errors
    alert(Object.values(data).flat().join('\n'))
  } else {
    alert('An error occurred.')
  }
  }
}
</script>

<template>
  <div class="main">
    <h1>Login</h1>
    <h3>Enter your login credentials</h3>
    <form @submit="handleLogin">
      <label for="first">
        Character name:
      </label>
      <input v-model="character_name"  type="text" id="first" name="first" placeholder="Enter your Username" required>

      <label for="password">
        Password:
      </label>
      <input v-model="password"  type="password" id="password" name="password" placeholder="Enter your Password" required>

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