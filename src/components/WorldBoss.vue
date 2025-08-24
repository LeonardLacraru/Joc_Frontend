<script setup>
import { ref, computed } from 'vue';
import { authFetch } from '../utils/authFetch.js';

const backendMessage = ref('');
const backendMessageType = ref('');
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function showBackendMessage(msg, type = 'info') {
  backendMessage.value = msg;
  backendMessageType.value = type;
  setTimeout(() => {
    backendMessage.value = '';
  }, 3500);
}

async function Participate() {
  try {
    const response = await authFetch(`${API_BASE_URL}/world_boss/participate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      console.log("Participate successfully:");
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
    <div class="world-boss-container">
        <h1>World Boss</h1>
        <p>Join forces with other players to take down the mighty World Boss! Participate in epic battles and earn exclusive rewards.</p>
        <button class="participate-btn" @click="Participate">Participate in World Boss Hunt</button>
    </div>
</template>