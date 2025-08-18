<script setup>
import { authFetch } from "../utils/authFetch.js";
import { ref, computed } from "vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const battle_data = ref(null);
const expanded = ref({});
const showRounds = ref(false);
const statLabels = {
  crit_dmg: "Critical Damage",
  crit_rate: "Critical Rate",
  dexterity: "Dexterity",
  hit_rate: "Hit Rate",
  hp: "HP",
  intelligence: "Intelligence",
  lifesteal: "Lifesteal",
  magic_def: "Magic Defense",
  phys_def: "Physical Defense",
  strength: "Strength",
  dmg: "Damage given",
  hit_rate: "Hit rate",
  is_hit: "Has been hit?",
  hp_left: "HP left",
  regen: "Life regenerated",
  crit_rate: "Critical rate",
  crit_dmg: "Critical damage",
  is_crit: "Hit has been critical?",
  lifesteal: "Lifesteal",
  total_hp: "Total HP",
};

const backendMessage = ref('');
const backendMessageType = ref('');

function showBackendMessage(msg, type = 'info') {
  backendMessage.value = msg;
  backendMessageType.value = type;
  setTimeout(() => {
    backendMessage.value = '';
  }, 3500);
}

async function startBattle(selectedDifficulty) {
  const payload = {
    difficulty: selectedDifficulty,
  };
  try {
    const response = await authFetch(`${API_BASE_URL}/create_battle/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      battle_data.value = data;
      if (typeof battle_data.value === 'object') {
        console.log("Battle started successfully:", battle_data.value);
      }
      else {
        showBackendMessage(battle_data.value, 'error');
      }
    } else {
      const errData = await response.json();
      showBackendMessage(errData.detail || JSON.stringify(errData), 'error');
    }
  }
  catch (err) {
    showBackendMessage(err.message, 'error');
    return err.message;
  }
  showRounds.value = false;
}

function toggle(section) {
  expanded.value[section] = !expanded.value[section]
}

const filteredRounds = computed(() => {
  if (!battle_data.value) return {};
  return Object.fromEntries(
    Object.entries(battle_data.value).filter(([key]) => !isNaN(Number(key)))
  );
});

async function heal() {
  try {
    const response = await authFetch(`${API_BASE_URL}/heal/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      console.log("Healed successfully:");
      showBackendMessage("Healed successfully!", "success");
      return null;
    } else {
      const errData = await response.json();
      showBackendMessage(errData.detail || JSON.stringify(errData), 'error');
    }
  }
  catch (err) {
    showBackendMessage(err.message, 'error');
    return err.message;
  }
}

// Add or ensure these utility functions exist:
function generateImageName(itemName, rarity) {
  if (!itemName)
    return new URL("@/assets/items/default-item-icon.png", import.meta.url).href;
  const nameParts = itemName.split(" ");
  const fileName = nameParts.join("_").toLowerCase() + "_" + rarity + ".png";
  return new URL(`../assets/items/${fileName}`, import.meta.url).href;
}
function handleImageError(event) {
  event.target.src = new URL('../assets/items/image.png', import.meta.url).href;
}

</script>

<template>
  <div class="battle-bg">
    <div class="battle-panel">
      <div class="battle-header">
        <button class="battle-btn" @click="startBattle('easy')">Start Easy Battle</button>
        <button class="battle-btn" @click="startBattle('medium')">Start Medium Battle</button>
        <button class="battle-btn" @click="startBattle('hard')">Start Hard Battle</button>
      </div>
      <div v-if="battle_data && typeof battle_data === 'object'" class="battle-data">
        <p class="winner">
          <span class="trophy">🏆</span>
          Winner: <span class="winner-name">{{ battle_data.winner }}</span>
        </p>
        <!-- Rewards Section -->
        <div class="rewards-section">
          <h3 class="rewards-title">Rewards</h3>
          <div class="rewards-list">
            <span class="reward-label">EXP:</span>
            <span class="reward-value">{{ battle_data.exp_gained }}</span>
            <span class="reward-label">Gold:</span>
            <span class="reward-value">{{ battle_data.gold_earned }}</span>
            <template v-if="battle_data.reward">
              <span class="reward-label">Item:</span>
              <div class="tooltip-container reward-item">
                <img
                  :src="generateImageName(battle_data.reward.name, battle_data.reward.rarity)"
                  :alt="battle_data.reward.name"
                  class="item-icon"
                  @error="handleImageError"
                />
                <div class="custom-tooltip">
                  <div class="tt-font-name" :class="`rarity-${battle_data.reward.rarity}`">
                    {{ battle_data.reward.name }}
                  </div>
                  <div class="tt-font">
                    Required Level: {{ battle_data.reward.required_level }}
                  </div>
                  <div class="tt-stats" v-if="battle_data.reward.stats && battle_data.reward.stats.length">
                    Stats:
                    <div v-for="(stat, sidx) in battle_data.reward.stats" :key="sidx" class="tt-stat">
                      {{ statLabels[stat.name] || stat.name }}:
                      <span>
                        {{  
                          ["crit_rate", "hit_rate", "lifesteal"].includes(stat.name)
                            ? stat.value + "%"
                            : stat.value
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
        <!-- End Rewards Section -->
        <div class="rounds-toggle">
          <button v-if="!showRounds" class="battle-btn" @click="showRounds = true">Show detailed rounds</button>
          <button v-else class="battle-btn" @click="showRounds = false">Show less details</button>
        </div>
        <transition name="fade">
          <div v-if="showRounds" class="rounds-section">
            <h2>Rounds</h2>
            <div v-for="(roundData, roundKey) in filteredRounds" :key="roundKey" class="round-card">
              <div class="round-header">
                <h3>Round {{ roundData.Round }}</h3>
                <button class="battle-btn small" @click="toggle(roundKey)">
                  {{ expanded[roundKey] ? 'Hide details' : 'Round details' }}
                </button>
              </div>
              <transition name="fade">
                <table v-if="expanded[roundKey]" class="battle-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Player</th>
                      <th>NPC</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(val, key) in roundData.Player" :key="key">
                      <td><strong>{{ statLabels[key] }}</strong></td>
                      <td>
                        <strong>
                          {{ roundData.Player[key] }}
                          <span v-if="['crit_rate', 'hit_rate'].includes(key)">%</span>
                        </strong>
                      </td>
                      <td>
                        <strong>
                          {{ roundData.NPC[key] }}
                          <span v-if="['crit_rate', 'hit_rate'].includes(key)">%</span>
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </transition>
            </div>
          </div>
        </transition>
      </div>
      <div class="battle-footer">
        <button class="battle-btn heal" @click="heal">Heal</button>
      </div>
      <div v-if="backendMessage" :class="['backend-toast', backendMessageType]">
        {{ backendMessage }}
      </div>
    </div>
  </div>
</template>

<style scoped>


.battle-panel {
  background: linear-gradient(180deg, #22171b 80%, #181012 100%);
  border-radius: 24px;
  box-shadow: 0 0 32px 8px #000a, 0 0 0 4px #6a0f19;
  padding: 2.5rem 2.5rem 1.5rem 2.5rem;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  border: 2.5px solid #6a0f19;
  position: relative;
  font-family: 'Cinzel', serif;
}

.battle-header {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.battle-btn {
  background: linear-gradient(90deg, #2d161a 60%, #181012 100%);
  color: #e7d7b1;
  border: 2px solid #6a0f19;
  border-radius: 10px;
  padding: 0.8rem 2.2rem;
  font-size: 1.1rem;
  font-family: 'Cinzel', serif;
  font-weight: bold;
  box-shadow: 0 2px 8px #181012;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  margin-bottom: 0.5rem;
}
.battle-btn:hover, .battle-btn:focus {
  background: linear-gradient(90deg, #6a0f19 60%, #2d161a 100%);
  color: #fffbe6;
  border-color: #ffe600;
}
.battle-btn.small {
  padding: 0.4rem 1.2rem;
  font-size: 1rem;
  margin-left: 1rem;
}
.battle-btn.heal {
  background: linear-gradient(90deg, #1a2d16 60%, #181012 100%);
  color: #bdf7bd;
  border-color: #3a7a3a;
}
.battle-btn.heal:hover {
  background: linear-gradient(90deg, #3a7a3a 60%, #1a2d16 100%);
  color: #fff;
  border-color: #ffe600;
}

.battle-data {
  margin: 2rem 0 1rem 0;
  background: rgba(24, 16, 18, 0.95);
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(40, 10, 20, 0.4);
  padding: 2rem 2rem 1.5rem 2rem;
}

.winner {
  font-size: 1.3rem;
  color: #e7d7b1;
  font-family: 'Cinzel', serif;
  margin-bottom: 1.5rem;
  text-align: center;
  text-shadow: 0 1px 6px #181012;
}
.trophy {
  font-size: 1.5rem;
  vertical-align: middle;
  margin-right: 0.5rem;
}
.winner-name {
  color: #7a3a3a;
  font-weight: bold;
  font-size: 1.2em;
}

.rewards-section {
  margin: 1.5rem 0 2rem 0;
  background: linear-gradient(90deg, #2d161a 80%, #181012 100%);
  border-radius: 12px;
  box-shadow: 0 1px 8px #181012;
  padding: 1.2rem 1.5rem;
  border: 1.5px solid #6a0f19;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.rewards-title {
  color: #ffe600;
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
  margin-bottom: 0.7rem;
  text-shadow: 0 1px 6px #181012;
}

.rewards-list {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  flex-wrap: wrap;
  font-size: 1.1rem;
}

.reward-label {
  color: #ffe600;
  font-weight: bold;
  font-family: 'Cinzel', serif;
}

.reward-value {
  color: #e7d7b1;
  font-family: 'Cinzel', serif;
}

.reward-item {
  display: inline-block;
  vertical-align: middle;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
  position: relative;
}

.item-icon {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  border: 1.5px solid #ffe600;
  background: #22171b;
  box-shadow: 0 1px 6px #181012;
}

.tooltip-container {
  position: relative;
  display: inline-block;
}

.custom-tooltip {
  display: none;
  position: absolute;
  z-index: 1000;
  left: 50%;
  top: -10px;
  transform: translate(-50%, -100%);
  background: #22171b;
  color: #ffe600;
  border: 1.5px solid #ffe600;
  box-shadow: 0 2px 8px #ffe60044;
  font-family: 'Cinzel', serif;
  padding: 0.75rem 1rem;
  min-width: 180px;
  pointer-events: none;
  white-space: pre-line;
}

.tooltip-container:hover .custom-tooltip {
  display: block;
}

.rounds-toggle {
  text-align: center;
  margin-bottom: 1.5rem;
}

.rounds-section {
  margin-top: 1.5rem;
}

.round-card {
  background: linear-gradient(90deg, #2d161a 80%, #181012 100%);
  border-radius: 12px;
  box-shadow: 0 1px 8px #181012;
  margin-bottom: 1.5rem;
  padding: 1.2rem 1.5rem;
  border: 1.5px solid #6a0f19;
}

.round-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.7rem;
}

.round-header h3 {
  color: #ffe600;
  font-size: 1.1rem;
  margin: 0;
  font-family: 'Cinzel', serif;
  text-shadow: 0 1px 6px #181012;
}

.battle-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
  color: #e7d7b1;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1rem;
  font-family: 'Cinzel', serif;
}

.battle-table th, .battle-table td {
  border: 1.5px solid #2d161a;
  padding: 0.7rem 1rem;
  text-align: center;
}

.battle-table th {
  background: #2d161a;
  color: #ffe600;
  font-weight: bold;
  font-size: 1.1rem;
  text-shadow: 0 1px 6px #181012;
}

.battle-table tr:nth-child(even) {
  background: #181012;
}

.battle-table tr:nth-child(odd) {
  background: #22171b;
}

.battle-table tr:hover {
  background: #3a1818;
  color: #ffe600;
  transition: background 0.2s, color 0.2s;
}

.battle-footer {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
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

/* Fade transition for rounds */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>