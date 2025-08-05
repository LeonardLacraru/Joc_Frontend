<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import "../assets/form.css";

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
    alert("Passwords do not match!");
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
    // Registration successful, redirect or show message
    router.push("/login");
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
