<script setup>
import { ref, onMounted, computed } from 'vue';
import { authFetch } from '@/utils/authFetch';
import { useRouter } from 'vue-router';
import { useBackendMessage } from "../utils/useBackendMessage.js";
const router = useRouter();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const guild = ref('');
const loading = ref(true);
const donateAmount = ref('');
const levelUpLoading = ref(false);
const showLeaveConfirm = ref(false);
const showGuildInfo = ref(true); // New reactive variable
const showRequests = ref(false); // New reactive variable
const { backendMessage, backendMessageType, showBackendMessage } = useBackendMessage();

const isOnline = (member) => true; // or your logic


async function fetchGuilds() {
    try {
        const response = await authFetch(`${API_BASE_URL}/guild/guild/`);
        if (response && response.ok) {
            const data = await response.json();
            guild.value = data || [];
            loading.value = false;
            console.log('Guild data fetched successfully:', guild.value);
            return null;
        } else {
            const errData = await response.json();
            let msg = errData.error || errData.detail || JSON.stringify(errData);
            showBackendMessage(`Error! ${msg}`, 'error');
        }
    } catch (err) {
        showBackendMessage(`Error! ${err.message}`, 'error');
        loading.value = false;
        return err.message;
    }
}

async function levelUpGuild() {
    levelUpLoading.value = true;
    try {
        const response = await authFetch(`${API_BASE_URL}/guild/guild_stats/level_up/`, {
            method: 'POST'
        });
        if (response && response.ok) {
            await fetchGuilds();
        } else {
            const errData = await response.json();
            let msg = errData.error || errData.detail || JSON.stringify(errData);
            showBackendMessage(`Error! ${msg}`, 'error');
        }
    } catch (err) {
        showBackendMessage(errData.detail || JSON.stringify(errData), 'error');
    }
    levelUpLoading.value = false;
}

async function leaveGuild() {
    showLeaveConfirm.value = false; 
    levelUpLoading.value = true;
    try {
        const response = await authFetch(`${API_BASE_URL}/guild/leave_guild/`, {
            method: 'POST'
        });
        if (response && response.ok) {
            const errData = await response.json();
            let msg = errData.success || errData.detail || JSON.stringify(errData);
            console.log('Guild left successfully:', msg);
            showBackendMessage(Object.values(errData), 'success');
            // Add router navigation after successful guild leave
            router.push('/profile');
        } else {
            const errData = await response.json();
            let msg = errData.error || errData.detail || JSON.stringify(errData);
            showBackendMessage(`Error! ${msg}`, 'error'); 
        }
    } catch (err) {
        showBackendMessage(`Error! ${err.message}`, 'error');
    }
    levelUpLoading.value = false;
}

async function donateGold() {
  if (!donateAmount.value || donateAmount.value <= 0) {
    showBackendMessage('Error! Please enter a valid amount.', 'error');
    return;
  }
  try {
    const response = await authFetch(`${API_BASE_URL}/guild/guild_stats/donate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gold: Number(donateAmount.value) }),
    });
    if (response && response.ok) {
      showBackendMessage('Success! Gold donated.', 'success');
      donateAmount.value = '';
      await fetchGuilds();
    } else {
      const errData = await response.json();
      let msg = errData.error || errData.detail || JSON.stringify(errData);
      showBackendMessage(`Error! ${msg}`, 'error');
    }
  } catch (err) {
    showBackendMessage(`Error! ${err.message}`, 'error');
  }
}

async function upgradeStat(stat_name) {
  try {
    const response = await authFetch(`${API_BASE_URL}/guild/guild_stats/update_stats/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stat_name }),
    });
    if (response.ok) {
      await fetchGuilds();
      return null;
    } else {
      const errData = await response.json();
      let msg = errData.error || errData.detail || JSON.stringify(errData);
      showBackendMessage(`Error! ${msg}`, 'error');
    }
  } catch (err) {
    showBackendMessage(`Error! ${err.message}`, 'error');
  }
}

async function confirmLeaveGuild() {
    showLeaveConfirm.value = false;
    await leaveGuild();
}


onMounted(() => {
    fetchGuilds();
});

function getAvatar(race) {
    try {
        return new URL(`../assets/${race}.png`, import.meta.url).href;
    } catch {
        return new URL(`../assets/default.png`, import.meta.url).href;
    }
}

const statList = [
  { key: 'strength', label: 'Strength' },
  { key: 'dexterity', label: 'Dexterity' },
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'crit_rate', label: 'Crit Rate' },
  { key: 'crit_dmg', label: 'Crit Damage' },
  { key: 'hit_rate', label: 'Hit Rate' },
];

const sortedMembers = computed(() => {
  if (!guild.value?.member_names) return [];
  return [...guild.value.member_names].sort((a, b) => {
    if (a.character_name === guild.value.leader) return -1;
    if (b.character_name === guild.value.leader) return 1;
    return b.level - a.level;
  });
});

const requests = ref([]);

async function fetchRequests() {
    try {
        const response = await authFetch(`${API_BASE_URL}/guild/requests/`);
        if (response && response.ok) {
            requests.value = await response.json();
        } else {
            const errData = await response.json();
            showBackendMessage(`Error! ${errData.error || errData.detail}`, 'error');
        }
    } catch (err) {
        showBackendMessage(`Error! ${err.message}`, 'error');
    }
}

async function handleRequest(requestId, action) {
    try {
        const response = await authFetch(`${API_BASE_URL}/guild/${requestId}/${action}_request/`, {
            method: 'POST'
        });
        
        if (response && response.ok) {
            await fetchRequests(); // First fetch new requests
            
            // Only show success message if we still have requests
            if (requests.value.length > 0) {
                showBackendMessage(`Request ${action}ed successfully!`, 'success');
            }
        } else {
            const errData = await response.json();
            // Always show error messages
            showBackendMessage(`Error! ${errData.error || errData.detail}`, 'error');
        }
    } catch (err) {
        // Always show error messages
        showBackendMessage(`Error! ${err.message}`, 'error');
    }
}
</script>



<template>
  <div class="guild-bg">
    <div v-if="backendMessage" :class="['backend-toast', backendMessageType]">
      {{ backendMessage }}
    </div>
    <div class="guild-container" v-if="!loading && guild">
      <nav class="navbar-fantasy">
        <ul class="navbar-links">
          <li><a href="#" @click.prevent="showGuildInfo = true; showRequests = false" 
                 :class="{ 'active-link': showGuildInfo }">Guild</a></li>
          <li><a href="#" @click.prevent="showGuildInfo = false; showRequests = false" 
                 :class="{ 'active-link': !showGuildInfo && !showRequests }">Members</a></li>
          <li><a href="#" @click.prevent="showGuildInfo = false; showRequests = true; fetchRequests()" 
                 :class="{ 'active-link': showRequests }">Requests</a></li>
        </ul>
      </nav>

      <!-- Content Section -->
      <div v-if="showGuildInfo">
        <!-- Your existing guild panel code -->
        <div class="guild-panel">
          <div class="guild-level-points">
            <div class="guild-level-block">
              <span class="guild-level-label">Level</span>
              <span class="guild-level-value">{{ guild.level }}</span>
            </div>
            <div class="guild-level-block">
              <span class="guild-level-label">Name:</span>
              <span class="guild-level-value">{{ guild.name }}</span>
            </div>
            <div class="guild-level-block">
              <span class="guild-level-label">Leader:</span>
              <span class="guild-level-value">{{ guild.leader }}</span>
            </div>
            <div class="guild-points-block">
              <span class="guild-points-label">Points</span>
              <span class="guild-points-value">{{ guild.stat_points }}</span>
            </div>
          </div>
          <div class="guild-progress-bar">
            <div class="guild-progress" :style="{ width: (guild.gold / guild.gold_required_for_level_up * 100) + '%' }">
            </div>
          </div>
          <div class="guild-progress-label">
            Gold: {{ guild.gold }} / {{ guild.gold_required_for_level_up }}
          </div>
          <div class="guild-levelup-row">
            <button class="levelup-btn" @click="levelUpGuild" :disabled="levelUpLoading">
              {{ levelUpLoading ? 'Leveling Up...' : 'Level Up Guild' }}
            </button>
          </div>
        </div>
        <div class="guild-members-row">
          <div v-for="member in sortedMembers.slice(0, 6)" :key="member.character_name" class="guild-member-card">
            <img :src="getAvatar(member.race)" class="member-avatar" />
            <div class="member-name">{{ member.character_name }}</div>
            <div class="member-level">Lv {{ member.level }}</div>
          </div>
        </div>
        <div class="guild-bottom-row">
          <div class="guild-donate">
            <div class="donate-title">DONATE</div>
            <input v-model="donateAmount" type="number" min="1" class="donate-input" placeholder="Amount" />
            <button class="donate-btn" @click="donateGold">Donate</button>
          </div>
          <div class="guild-upgrades">
            <div class="upgrade-title">UPGRADES</div>
            <div class="upgrade-list">
              <div class="upgrade-row" v-for="stat in statList" :key="stat.key">
                <span class="upgrade-label">{{ stat.label }}</span>
                <span class="upgrade-value">{{ Number(guild.stats[stat.key]).toFixed(2) }}%</span>
                <button class="upgrade-btn" @click="upgradeStat(stat.key)">Upgrade</button>
              </div>
            </div>
          </div>
        </div>
        <div class="guild-leave-row">
          <button class="leave-btn" @click="showLeaveConfirm = true">Leave Guild</button>
        </div>
      </div>

      <div v-else>
        <!-- Members and Requests section -->
        <div v-if="showRequests" class="requests-table-container">
          <div v-if="requests.length === 0" class="no-requests-message">
            No requests
          </div>
          <table v-else class="members-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Level</th>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="request in requests" :key="request.id">
                    <td class="name-cell">
                        <img :src="getAvatar(request.sender.race)" class="member-table-avatar" />
                        {{ request.sender.character_name }}
                    </td>
                    <td>{{ request.sender.level }}</td>
                    <td class="request-message">{{ request.description }}</td>
                    <td class="action-buttons">
                    <button 
                        class="btn btn-dark btn-sm mx-1" 
                        @click="handleRequest(request.id, 'accept')"
                    >
                        Accept
                    </button>
                    <button 
                        class="btn btn-dark btn-sm mx-1" 
                        @click="handleRequest(request.id, 'deny')"
                    >
                        Deny
                    </button>
                  </td>
                </tr>
            </tbody>
        </table>
        </div>
        <div v-else class="members-table-container">
          <!-- Your existing members table -->
          <table class="members-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Level</th>
                <th>Gold donated</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in sortedMembers" :key="member.character_name">
                <td class="name-cell">
                  <img :src="getAvatar(member.race)" class="member-table-avatar" />
                  {{ member.character_name }}
                  <span v-if="member.character_name === guild.leader" class="leader-badge">Leader</span>
                </td>
                <td>{{ member.level }}</td>
                <td>{{ member.gold_donated || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="guild-loading-message">
      You are not part of any guild. Please join a guild from <router-link to="/ranking">Ranking</router-link> or
      <router-link to="/create_guild">create a new guild.</router-link>
    </div>

    <!-- Leave Confirmation Modal -->
    <div v-if="showLeaveConfirm" class="modal-backdrop">
      <div class="modal-content">
        <p>Are you sure you want to leave the guild?</p>
        <button @click="leaveGuild">Yes</button>
        <button @click="showLeaveConfirm = false">No</button>
      </div>
    </div>
  </div>
</template>

<style scoped>

.navbar-fantasy {
  width: 100%;
  background: linear-gradient(90deg, #23181a 80%, #181012 100%);
  border-bottom: 2px solid #3a2323;
  box-shadow: 0 2px 16px #000a, 0 0 0 2px #3a2323;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 2.5rem;
  font-family: 'Cinzel', serif;
  border-radius: 14px 14px 0 0;
  margin-bottom: 2rem;
}

.navbar-logo .navbar-title:hover {
  color: #fffbe6;
}

.navbar-links {
  list-style: none;
  display: flex;
  gap: 2.2rem;
  margin: 0;
  padding: 0;
  justify-content: center; /* Center the links horizontally */
  flex: 1;
}

.navbar-links li {
  display: flex;
  align-items: center;
}

.navbar-links a {
  color: #e0cfa9;
  font-size: 1.15rem;
  font-family: 'Cinzel', serif;
  text-decoration: none;
  padding: 0.3rem 1.1rem;
  border-radius: 8px;
  transition: background 0.2s, color 0.2s;
  font-weight: bold;
  letter-spacing: 1px;
}

.navbar-links a:hover,
.navbar-links .active-link {
  background: #3a2323;
  color: #f5e6c8;
  box-shadow: 0 2px 8px #0005;
}

@media (max-width: 700px) {
  .navbar-fantasy {
    flex-direction: column;
    align-items: flex-start;
    padding: 0.7rem 1rem;
  }
  .navbar-links {
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }
  .navbar-logo .navbar-title {
    font-size: 1.3rem;
  }
}
.guild-container {
  width: 50vw;
  background: #181010;
  color: #f5e6c8;
  border-radius: 18px;
  box-shadow: 0 2px 24px #000a;
  padding: 0 2.5rem 2.5rem 2.5rem;
  font-family: 'Georgia', serif;
  position: relative;
  max-width: none;
}
.guild-panel {
  background: #1a1010;
  border: 1px solid #2d1818;
  border-radius: 10px;
  padding: 1.2rem 1.5rem 1rem 1.5rem;
  margin-bottom: 1.5rem;
}
.guild-level-points {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.1rem;
  gap: 2rem;
}
.guild-level-block, .guild-points-block {
  background: #221313;
  border: 1px solid #2d1818;
  border-radius: 8px;
  padding: 0.7rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
  box-shadow: 0 1px 6px #0004;
}
.guild-level-label, .guild-points-label {
  color: #a89c8e;
  font-size: 0.95rem;
  letter-spacing: 1px;
  margin-bottom: 0.2rem;
}

.guild-level-value, .guild-points-value {
  color: #e0cfa9;
  font-size: 1.5rem;
  font-weight: bold;
  letter-spacing: 1px;
}
.guild-loading-message {
  color: #ffd700;
  font-size: 1.15rem;
  font-weight: bold;
  letter-spacing: 1.5px;
  text-shadow: 0 1px 4px #000a, 0 0px 1px #fff6;
  background: linear-gradient(90deg, #ffe066 0%, #ffd700 60%, #fffbe6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  display: inline-block;
}
.leave-btn {
  background: #3a1818;
  color: #ffd7b3;
  border: 1px solid #7a3a3a;
  border-radius: 6px;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.leave-btn:hover {
  background: #5a2222;
}
.guild-progress-bar {
  background: #2d1818;
  border-radius: 6px;
  height: 14px;
  margin-bottom: 0.3rem;
  overflow: hidden;
}
.guild-progress {
  background: linear-gradient(90deg, #6e4c1b 60%, #a08b5b 100%);
  height: 100%;
  border-radius: 6px;
  transition: width 0.4s;
}
.guild-progress-label {
  text-align: right;
  color: #e0cfa9 !important;
  font-size: 0.98rem;
  margin-bottom: 0.2rem;
}
.guild-members-row {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}
.guild-member-card {
  background: #221313;
  border: 1px solid #2d1818;
  border-radius: 10px;
  width: 110px;
  padding: 1rem 0.5rem 0.7rem 0.5rem;
  text-align: center;
  box-shadow: 0 2px 8px #0005;
}
.member-avatar {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  object-fit: cover;
  background: #181010;
  border: 1px solid #2d1818;
}
.member-name {
  color: #e0cfa9 !important;
  font-weight: bold;
  font-size: 1.08rem;
  margin-bottom: 0.1rem;
}
.member-level {
  color: #fffbe6;
  font-size: 0.98rem;
  margin-bottom: 0.1rem;
}
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.modal-content {
  background: #221313;
  color: #e0cfa9;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 12px #000a;
  text-align: center;
}
.modal-content button {
  margin: 0 1rem;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  border: none;
  font-weight: bold;
  cursor: pointer;
}
.member-status {
  font-size: 0.95rem;
  font-weight: bold;
}
.member-status.online {
  color: #4fdc4f;
}
.member-status.offline {
  color: #b0a9a9;
}
.guild-bottom-row {
  display: flex;
  flex-direction: row;
  gap: 2rem;
  justify-content: center;
  align-items: flex-start;
  margin-top: 1.5rem;
  flex-wrap: nowrap;
}
.guild-donate{
  flex: 1 1 0;
  max-width: 260px;
  min-width: 180px;
  background: #221313;
  border: 1px solid #2d1818;
  border-radius: 10px;
  padding: 1.2rem 1.2rem 1rem 1.2rem;
  box-shadow: 0 2px 8px #0005;
}

.guild-upgrades {
  flex: 1 1 0;
  max-width: 30vw;
  min-width: 180px;
  background: #221313;
  border: 1px solid #2d1818;
  border-radius: 10px;
  padding: 1.2rem 1.2rem 1rem 1.2rem;
  box-shadow: 0 2px 8px #0005;
}

.donate-title, .upgrade-title {
  color: #e0cfa9 !important;
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 0.7rem;
  text-align: center;
}

.donate-input {
  width: 100%;
  padding: 0.4rem 0.7rem;
  border-radius: 6px;
  border: 1px solid #3a2323;
  background: #181010;
  color: #e0cfa9;
  font-size: 1rem;
  margin-bottom: 0.7rem;
}
.donate-btn {
  width: 100%;
  color: #e0cfa9 !important;
  background: #3a1818;
  border: 1px solid #7a3a3a;
  border-radius: 6px;
  padding: 0.4rem 0;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.donate-btn:hover {
  background: #3a2323;
}
.upgrade-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
}
.upgrade-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #221313;
  border-radius: 8px;
  padding: 0.5rem 0.7rem;
  border: 1px solid #2d1818;
  box-shadow: 0 1px 4px #0003;
  margin-bottom: 0;
}
.upgrade-label {
  color: #e0cfa9;
  font-weight: 500;
  font-size: 1rem;
  flex: 1;
}
.upgrade-value {
  color: #f5e6c8;
  font-weight: bold;
  font-size: 1.05rem;
  margin: 0 0.7rem;
  min-width: 32px;
  text-align: center;
}
.upgrade-btn {
  background: #2d1818;
  color: #e0cfa9 !important;
  border: 1px solid #3a2323;
  border-radius: 6px;
  padding: 0.2rem 0.9rem;
  font-size: 0.98rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  width:5vw;
}
.upgrade-btn:hover {
  background: #3a2323;
}
.guild-leave-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 2.2rem;
}
.guild-loading {
  text-align: center;
  color: #d4af37;
  font-size: 1.2rem;
  margin-top: 3rem;
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

.guild-levelup-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}
.levelup-btn {
  background: #2d1818;
  color: #e0cfa9;
  border: 1px solid #3a2323;
  border-radius: 6px;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.levelup-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.levelup-btn:hover:enabled {
  background: #3a2323;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.modal-content {
  background: #181010;
  color: #f5e6c8;
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  border: 1px solid #2d1818;
  box-shadow: 0 2px 12px #000a;
  width: 90%;
  max-width: 400px;
  position: relative;
}

.modal-content p {
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.modal-content button {
  background: #3a1818;
  color: #e0cfa9;
  border: 1px solid #7a3a3a;
  border-radius: 6px;
  padding: 0.7rem 1.2rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  margin: 0 0.5rem;
}

.modal-content button:hover {
  background: #5a2222;
}

.members-table-container {
  background: #221313;
  border: 1px solid #2d1818;
  border-radius: 10px;
  padding: 1.5rem;
  margin-top: 1rem;
  box-shadow: 0 2px 8px #0005;
}

.members-table {
  width: 100%;
  border-collapse: collapse;
  color: #e0cfa9;
}

.members-table th {
  text-align: left;
  padding: 1rem;
  border-bottom: 2px solid #3a2323;
  color: #f5e6c8;
  font-size: 1.1rem;
  font-weight: bold;
}

.members-table td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #2d1818;
}

.members-table tr:last-child td {
  border-bottom: none;
}

.member-table-avatar {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  margin-right: 1rem;
  vertical-align: middle;
}

.name-cell {
  display: flex;
  align-items: center;
}

.leader-badge {
  background: #6e4c1b;
  color: #f5e6c8;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-left: 0.8rem;
}

.rank-cell {
  color: #b0a9a9;
  font-weight: bold;
}

.status-indicator {
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
}

.status-indicator.online {
  background: #2d3a23;
  color: #7fff00;
}

.status-indicator.offline {
  background: #3a2323;
  color: #ff7f7f;
}
.action-buttons {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
}

.btn-dark {
    background: linear-gradient(90deg, #2d161a 60%, #181012 100%);
    color: #e7d7b1;
    border: 1.5px solid #3a232b;
    font-family: 'Cinzel', serif;
    font-size: 0.9rem;
    letter-spacing: 1px;
    box-shadow: 0 1px 6px #181012;
    transition: background 0.2s, border-color 0.2s;
    padding: 0.3rem 1rem;
}

.btn-dark:hover {
    background: linear-gradient(90deg, #3a232b 60%, #2d161a 100%);
    border-color: #e7d7b1;
    color: #fffbe6;
}

/* Remove the old button styles */
.accept-btn, .deny-btn {
    display: none; /* or you can just delete these classes */
}

.no-requests-message {
    text-align: center;
    color: #b0a9a9;
    padding: 2rem;
    font-size: 1.1rem;
    font-style: italic;
}
</style>