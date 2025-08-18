<script setup>
import { ref, inject } from "vue";
import { useRouter } from "vue-router";
import "../assets/form.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const username = ref("");
const password = ref("");
const router = useRouter();
const isLoggedIn = inject("isLoggedIn");

const backendMessage = ref('');
const backendMessageType = ref('');

function showBackendMessage(msg, type = 'info') {
  backendMessage.value = msg;
  backendMessageType.value = type;
  setTimeout(() => {
    backendMessage.value = '';
  }, 3500);
}

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
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    localStorage.setItem("username", username.value);
    isLoggedIn.value = true;
    showBackendMessage("Login successful!", "success");
    router.push("/profile");
  } else {
    if (data.detail) {
      showBackendMessage(data.detail, "error");
    } else if (typeof data === "object") {
      showBackendMessage(Object.values(data).flat().join("\n"), "error");
    } else {
      showBackendMessage("An error occurred.", "error");
    }
  }
}
</script>

<template>
  <div class="main">
    <div v-if="backendMessage" :class="['backend-toast', backendMessageType]">
      {{ backendMessage }}
    </div>
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

<style scoped>
.backend-toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: #221313;
  color: #e0cfa9;
  border: 1px solid #7a3a3a;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  z-index: 9999;
  box-shadow: 0 2px 12px #000a;
  font-size: 1rem;
  min-width: 180px;
  max-width: 320px;
  transition: opacity 0.3s;
}
.backend-toast.error {
  border-color: #a33;
  color: #ffbdbd;
}
.backend-toast.success {
  border-color: #3a7a3a;
  color: #bdf7bd;
}
</style>