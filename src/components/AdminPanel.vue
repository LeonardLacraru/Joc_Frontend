<script setup>

import { ref } from 'vue';
import { authFetch } from '../utils/authFetch.js';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const backendMessage = ref('');
const backendMessageType = ref('');

function showBackendMessage(msg, type = 'info') {
  backendMessage.value = msg;
  backendMessageType.value = type;
  setTimeout(() => {
    backendMessage.value = '';
  }, 3500);
}

async function CreateEvent() {
  try {
    const response = await authFetch(`${API_BASE_URL}/world_boss/create_event/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      const data = await response.json();  
      console.log(data);
      showBackendMessage("You joined the world boss hunt!", "success");
      return null;
    } else {
      const errData = await response.json();
      console.error("Error participating:", errData);
      showBackendMessage(errData.detail || JSON.stringify(errData), 'error');
    }
  }
  catch (err) {
    showBackendMessage(err.message, 'error');
    return err.message;
  }
}

async function Start_World_Boss() {
  try {
    const response = await authFetch(`${API_BASE_URL}/world_boss/start_wb_event/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      const data = await response.json();
      console.log( data);
      showBackendMessage("You joined the world boss hunt!", "success");
      return null;
    } else {
      const errData = await response.json();
      console.error("Error participating:", errData);
      showBackendMessage(errData.detail || JSON.stringify(errData), 'error');
    }
  }
  catch (err) {
    showBackendMessage(err.message, 'error');
    return err.message;
  }
}


</script>
<template>
  <div class="admin-panel">
    <h1>Admin Panel</h1>
    <p>Welcome to the Admin Panel. Here you can manage users, monitor site activity, and perform administrative tasks.</p>
    <button class="participate-btn" @click="CreateEvent">Create World Boss Hunt</button>
    <button class="participate-btn" @click="Start_World_Boss">Start World Boss Hunt</button>
  </div>
</template>