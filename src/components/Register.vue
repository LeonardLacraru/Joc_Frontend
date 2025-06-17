<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import '../assets/form.css'

const email = ref('')
const username = ref('')
const password = ref('')
const race = ref('')
const router = useRouter()

async function handleRegister(e) {
  e.preventDefault()
  const payload = {
    email: email.value,
    username: username.value,
    password: password.value,
    race: race.value
  }
  console.log('Data sent to Django backend:', payload) // This logs the data to the console

  const response = await fetch('http://13.62.56.34:8000/api/register/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await response.json()
  if (response.ok) {
    // Registration successful, redirect or show message
    router.push('/login')
  } else {
    // Handle error (e.g., show error message)
    alert(data.message || 'Registration failed')
  }
}
</script>

<template>
  <div class="main">
    <h1>MuieGrumpy</h1>
    <h3>Enter your muiegrumpy credentials</h3>
    <form @submit="handleRegister">
      <label for="email">
        Email:
      </label>
      <input v-model="email" value = "email" type="email" id="email" name="email" placeholder="Enter your Email" required>
      <label for="first">
        Username:
      </label>
      <input v-model="username" value = "username"type="text" id="first" name="first" placeholder="Enter your Username" required>
      <label for="first">
        Race
      </label>
      <input v-model="race" value = "race" type="text" id="race" name="race" placeholder="Enter your Race" required>
      <label for="password">
        Password:
      </label>
      <input v-model="password" value ="password" type="password" id="password" name="password" placeholder="Enter your Password" required>
      <div class="wrap">
        <button type="submit">
          Submit
        </button>
      </div>
    </form>
    <p>Already registered?
      <a href="/login" style="text-decoration: none;">
        Login
      </a>
    </p>
  </div>
</template>