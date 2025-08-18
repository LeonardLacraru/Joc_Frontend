<script setup>
import { ref, onMounted } from 'vue';
import { authFetch } from '@/utils/authFetch';
import { useRouter } from 'vue-router';
const router = useRouter();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const guild = ref('');
const loading = ref(true);
const donateAmount = ref('');
const levelUpLoading = ref(false);
const showLeaveConfirm = ref(false);

// Dummy online/offline for demo; replace with real status if available
const isOnline = (member) => true; // or your logic

const backendMessage = ref('');
const backendMessageType = ref(''); // e.g. 'error', 'success'

function showBackendMessage(msg, type = 'info') {
  backendMessage.value = msg;
  backendMessageType.value = type;
  setTimeout(() => {
    backendMessage.value = '';
  }, 3500);
}

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
            let msg = errData.success || errData.detail || errData.message || 'You have left the guild.';
            router.push({ 
                path: '/profile', 
                state: { backendMessage: msg, backendMessageType: 'success' }
            });
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
</script>



<template>
  <div class="guild-bg">
    <div v-if="backendMessage" :class="['backend-toast', backendMessageType]">
      {{ backendMessage }}
    </div>
    <div class="guild-container" v-if="!loading && guild">
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
          <div class="guild-progress" :style="{ width: (guild.gold / guild.gold_required_for_level_up * 100) + '%' }"></div>
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
        <div
          v-for="member in guild.member_names.slice(0, 6)"
          :key="member.character_name"
          class="guild-member-card"
        >
          <img :src="getAvatar(member.race)" class="member-avatar" />
          <div class="member-name">{{ member.character_name }}</div>
          <div class="member-level">Lv {{ member.level }}</div>
        </div>
      </div>
      <div class="guild-bottom-row">
        <div class="guild-donate">
          <div class="donate-title">DONATE</div>
          <input
            v-model="donateAmount"
            type="number"
            min="1"
            class="donate-input"
            placeholder="Amount"
          />
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
    <div v-else class="guild-loading-message">
      You are not part of any guild. Please join a guild from <router-link to="/ranking">Ranking</router-link> or create a new guild.
    </div>

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
.guild-bg {
  min-height: 100vh;
  background: #120a0a;
  padding: 0;
}
.guild-container {
  width: 50vw;
  margin-left: 10vw;
  margin-right: 10vw;
  margin-top: 2rem;
  margin-bottom: 2rem;
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
  margin-top: 10vw;
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
</style>