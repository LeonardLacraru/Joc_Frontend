<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import "../assets/form.css";
import { useBackendMessage } from "../utils/useBackendMessage.js";

const { backendMessage, backendMessageType, showBackendMessage } = useBackendMessage();
const email = ref("");
const character_name = ref("");
const password = ref("");
const confirmPassword = ref("");
const race = ref("");
const username = ref("");
const router = useRouter();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function handleRegister(e) {
  e.preventDefault();
  if (password.value !== confirmPassword.value) {
    showBackendMessage("Passwords do not match!", "error");
    return;
  }
  const payload = {
    email: email.value,
    username: username.value,
    character_name: character_name.value,
    password: password.value,
    password_confirm: confirmPassword.value,
    race: race.value,
  };
  const response = await fetch(`${API_BASE_URL}/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (response.ok) {
    showBackendMessage("Registration successful!", "success");
    setTimeout(() => router.push("/login"), 1500);
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
    <h1>Register</h1>
    <h3>Enter your register credentials</h3>

    <form @submit="handleRegister">
      <label for="email"> Email: </label>
      <input
        v-model="email"
        type="email"
        id="email"
        name="email"
        placeholder="Enter your Email"
        required
      />

      <label for="charater_name"> Character name: </label>
      <input
        v-model="character_name"
        type="text"
        id="first"
        name="first"
        placeholder="Enter your Character Name"
        required
      />
      <label for="username"> Username: </label>
      <input
        v-model="username"
        type="text"
        id="username"
        name="username"
        placeholder="Enter your Username"
        required
      />
      <label for="race"> Race </label>
      <select v-model="race" id="race" name="race" required>
        <option disabled value="">Select your race</option>
        <option value="mage">Mage</option>
        <option value="warrior">Warrior</option>
        <option value="assassin">Assassin</option>
      </select>

      <label for="password"> Password: </label>
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        required
      />

      <label for="confirm_password"> Confirm Password: </label>
      <input
        v-model="confirmPassword"
        type="password"
        placeholder="Confirm Password"
        required
      />

      <div class="wrap">
        <button type="submit">Submit</button>
      </div>
    </form>
    <p>
      Already registered?
      <a href="/login" style="text-decoration: none"> Login </a>
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
