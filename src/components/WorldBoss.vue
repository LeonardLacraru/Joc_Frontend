<script setup>
import { ref, computed, onMounted } from "vue";
import { authFetch } from "../utils/authFetch.js";
import { useBackendMessage } from "../utils/useBackendMessage.js";

const { backendMessage, backendMessageType, showBackendMessage } = useBackendMessage();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const profile = ref({});
const ranking = ref([]);

// Fetch profile info (assume API endpoint /profile/)
async function fetchProfile() {
  try {
    const response = await authFetch(`${API_BASE_URL}/profile/`);
    if (response.ok) {
      const data = await response.json();
      profile.value = data;
      console.log(profile.value);
    }
  } catch {}
}
fetchProfile();

async function fetchRanking() {
  try {
    const response = await authFetch(`${API_BASE_URL}/world_boss/participate/`);
    const data = await response.json();
    if (response.ok && (Array.isArray(data) || Array.isArray(data.ranking))) {
      ranking.value = Array.isArray(data) ? data : data.ranking;
      backendMessage.value = "";
      backendMessageType.value = "";
    } else if (
      data.error &&
      typeof data.error === "string" &&
      data.error.includes("World boss did not end yet")
    ) {
      ranking.value = [];
      backendMessage.value = data.error;
      backendMessageType.value = "error";
    } else {
      ranking.value = [];
      backendMessage.value = data.error || "Failed to fetch ranking.";
      backendMessageType.value = "error";
    }
  } catch (err) {
    ranking.value = [];
    backendMessage.value = err.message || "Failed to fetch ranking.";
    backendMessageType.value = "error";
  }
}

onMounted(() => {
  fetchRanking();
});

async function Participate() {
  try {
    const response = await authFetch(
      `${API_BASE_URL}/world_boss/participate/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (response.ok) {
      const data = await response.json();
      const msg =
        data.success || data.detail || data.message || JSON.stringify(data);
      showBackendMessage(msg, "success");
      return null;
    } else {
      const errData = await response.json();
      console.error("Error participating:", errData);
      // If errData.error exists, show only the message
      const msg = errData.error || errData.detail || JSON.stringify(errData);
      showBackendMessage(msg, "error");
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
    return err.message;
  }
}

async function createEvent() {
  try {
    const response = await authFetch(
      `${API_BASE_URL}/world_boss/create_event/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (response.ok) {
      const data = await response.json();
      const msg =
        data.success || data.detail || data.message || JSON.stringify(data);
      showBackendMessage(msg, "success");
    } else {
      const errData = await response.json();
      const msg = errData.error || errData.detail || JSON.stringify(errData);
      showBackendMessage(msg, "error");
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
  }
}

async function startEvent() {
  try {
    const response = await authFetch(
      `${API_BASE_URL}/world_boss/start_wb_event/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (response.ok) {
      const data = await response.json();
      const msg =
        data.success || data.detail || data.message || JSON.stringify(data);
      showBackendMessage(msg, "success");
      // Wait 10 seconds, then fetch ranking
      setTimeout(() => {
        fetchRanking();
      }, 10000);
    } else {
      const errData = await response.json();
      const msg = errData.error || errData.detail || JSON.stringify(errData);
      showBackendMessage(msg, "error");
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
  }
}
</script>

<template>
  <div class="world-boss-container">
    <h1>World Boss</h1>
    <p>
      Join forces with other players to take down the mighty World Boss!
      Participate in epic battles and earn exclusive rewards.
    </p>
    <button class="participate-btn" @click="Participate">
      Participate in World Boss Hunt
    </button>
    <!-- Button only visible if user is admin -->
    <button
      class="participate-btn"
      v-if="profile.is_admin"
      @click="createEvent"
    >
      Create World Boss Event
    </button>
    <button class="participate-btn" v-if="profile.is_admin" @click="startEvent">
      Start World Boss Event
    </button>
    <!-- Ranking Table -->
    <div v-if="ranking.length" class="ranking-table">
      <h2>World Boss Ranking</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Character</th>
            <th>Level</th>
            <th>Damage</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(entry, idx) in ranking"
            :key="entry.character_name || idx"
          >
            <td>{{ idx + 1 }}</td>
            <td>{{ entry.character_name }}</td>
            <td>{{ entry.level }}</td>
            <td>{{ entry.damage_dealt }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div
      v-if="backendMessage"
      :class="['backend-toast', backendMessageType]"
      style="position: fixed; top: 2rem; right: 2rem; z-index: 9999"
    >
      {{ backendMessage }}
    </div>
  </div>
</template>

<style scoped>
body {
  background: none !important;
}
.world-boss-container {
  max-width: 600px;
  margin: 2rem auto;
  background: #181010;
  color: #f5e6c8;
  border-radius: 18px;
  box-shadow: 0 2px 24px #000a;
  padding: 2.5rem;
  font-family: "Georgia", serif;
  position: relative;
  z-index: 1;
}
.participate-btn {
  background: linear-gradient(90deg, #2d161a 60%, #181012 100%);
  color: #e7d7b1;
  border: 2px solid #6a0f19;
  border-radius: 10px;
  padding: 0.8rem 2.2rem;
  font-size: 1.1rem;
  font-family: "Cinzel", serif;
  font-weight: bold;
  box-shadow: 0 2px 8px #181012;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  margin-bottom: 1.5rem;
}
.participate-btn:hover {
  background: linear-gradient(90deg, #6a0f19 60%, #2d161a 100%);
  color: #fffbe6;
  border-color: #ffe600;
}
.backend-toast {
  margin-top: 1.5rem;
  background: #221313;
  color: #e0cfa9;
  border: 1px solid #7a3a3a;
  border-radius: 8px;
  padding: 1rem 1.5rem;
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
/* Ranking Table Styles */
.ranking-table {
  margin: 2rem auto;
  background: #221313;
  color: #e0cfa9;
  border-radius: 12px;
  box-shadow: 0 2px 12px #000a;
  padding: 1.5rem;
  max-width: 500px;
}
.ranking-table table {
  width: 100%;
  border-collapse: collapse;
}
.ranking-table th,
.ranking-table td {
  border: 1px solid #7a3a3a;
  padding: 0.6rem 1rem;
  text-align: left;
}
.ranking-table th {
  background: #2d161a;
  color: #ffe600;
}
.ranking-table tr:nth-child(even) {
  background: #181012;
}
</style>
