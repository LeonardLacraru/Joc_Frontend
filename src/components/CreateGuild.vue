<script setup>
import { ref } from 'vue';
import { authFetch } from '@/utils/authFetch';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const guildName = ref('');
const guildDescription = ref('');
const backendMessage = ref('');
const backendMessageType = ref('');

function showBackendMessage(msg, type = 'info') {
  backendMessage.value = msg;
  backendMessageType.value = type;
  setTimeout(() => {
    backendMessage.value = '';
  }, 3500);
}

async function createGuild() {
    try {
        const response = await authFetch(`${API_BASE_URL}/guild/create_guild/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: guildDescription.value,
                name: guildName.value,
            })
        });
        if (response && response.ok) {
            const data = await response.json();
            showBackendMessage("Guild created!", "success");
        } else {
            const errData = await response.json();
            showBackendMessage(errData.detail || JSON.stringify(errData), "error");
        }
    } catch (err) {
        showBackendMessage(err.message, "error");
    }
}
</script>

<template>
  <div class="guild-bg">
    <div v-if="backendMessage" :class="['backend-toast', backendMessageType]">
      {{ backendMessage }}
    </div>
    <div class="guild-container">
      <div class="create-guild-form">
        <input
          type="text"
          v-model="guildName"
          placeholder="Guild Name"
          class="guild-input"
        />
        <input
          type="text"
          v-model="guildDescription"
          placeholder="Guild Description"
          class="guild-input"
        />
        <button @click="createGuild" class="guild-btn">Create Guild</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.guild-container {
  width: 50vw;
  background: #181010;
  color: #f5e6c8;
  border-radius: 18px;
  box-shadow: 0 2px 24px #000a;
  padding:  2.5rem 2.5rem;
  font-family: 'Georgia', serif;
  position: relative;
  max-width: none;
}
.guild-navbar {
  width: 100%;
  margin-bottom: 2rem;
  background: #221313 !important;
  border-radius: 10px;
  border: 1px solid #2d1818;
}
.create-guild-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
}
.guild-input {
  width: 60%;
  padding: 0.7rem 1.2rem;
  font-size: 1.1rem;
  border: 1px solid #2d1818;
  border-radius: 8px;
  background: #221313;
  color: #e0cfa9;
  margin-bottom: 1rem;
  box-shadow: 0 1px 2px #0003;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.guild-input:focus {
  border-color: #e0cfa9;
  outline: none;
  box-shadow: 0 0 0 0.2rem #6e4c1b55;
}
.guild-btn {
  width: 60%;
  color: #e0cfa9 !important;
  background: #3a1818;
  border: 1px solid #7a3a3a;
  border-radius: 8px;
  padding: 0.7rem 0;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 1rem;
}
.guild-btn:hover {
  background: #5a2222;
}
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