<script setup>
import { ref, inject } from "vue";
import { useRouter } from "vue-router";
import "../assets/form.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const username = ref("");
const password = ref("");
const router = useRouter();
const isLoggedIn = inject("isLoggedIn");

async function handleLogin(e) {
  e.preventDefault();
  const payload = {
    username: username.value,
    password: password.value,
  };

  const response = await fetch(`${API_BASE_URL}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (response.ok) {
    console.log("Data received from Django backend:", data); // This logs the data to the
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    localStorage.setItem("username", username.value);
    isLoggedIn.value = true;
    router.push("/profile"); // Redirect to x page after successful login
  } else {
    if (data.detail) {
      alert(data.detail);
    } else if (typeof data === "object") {
      // Show all field errors
      alert(Object.values(data).flat().join("\n"));
    } else {
      alert("An error occurred.");
    }
  }
}
</script>

<template>
  <div class="main">
    <h1>Login</h1>
    <h3>Enter your login credentials</h3>
    <form @submit="handleLogin">
      <label for="first"> Username: </label>
      <input
        v-model="username"
        type="text"
        id="first"
        name="first"
        placeholder="Enter your Username"
        required
      />
      <label for="password"> Password: </label>
      <input
        v-model="password"
        type="password"
        id="password"
        name="password"
        placeholder="Enter your Password"
        required
      />
      <div class="wrap">
        <button type="submit">Submit</button>
      </div>
    </form>
    <p>
      Not registered?
      <a href="/register" style="text-decoration: none"> Create an account </a>
    </p>
  </div>
</template>
