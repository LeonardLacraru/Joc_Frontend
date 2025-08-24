<script setup>
import { ref, computed } from 'vue';
import { authFetch } from '../utils/authFetch.js';
import { pvp_battle_data } from '../utils/public_variables.js';

const expanded = ref({});
const showRounds = ref(false);
const statLabels = {
  damage: 'Damage given',
  hit_rate: 'Hit Rate',
  hp_left: 'HP Left',
  is_crit: 'Hit has been critical?',
  is_hit: 'Has been hit?',
  lifesteal: 'Lifesteal',
  regen: 'Life regenerated',
};

const filteredRounds = computed(() => {
  if (!pvp_battle_data.value) return {};
  return Object.fromEntries(
    Object.entries(pvp_battle_data.value).filter(([key]) => !isNaN(Number(key)))
  );
});

function toggle(section) {
  expanded.value[section] = !expanded.value[section];
}
</script>

<template>
  <div class="battle-bg">
    <div class="battle-panel">
      <div v-if="pvp_battle_data && typeof pvp_battle_data === 'object'" class="battle-data">
        <p class="winner">
          <span class="trophy">🏆</span>
          Winner: <span class="winner-name">{{ pvp_battle_data.winner }}</span>
        </p>
        <!-- Rounds Toggle Button -->
        <div class="rounds-toggle">
          <button v-if="!showRounds" class="battle-btn" @click="showRounds = true">Show detailed rounds</button>
          <button v-else class="battle-btn" @click="showRounds = false">Show less details</button>
        </div>
        <transition name="fade">
          <div v-if="showRounds" class="rounds-section">
            <h2>Rounds</h2>
            <div v-for="(roundData, roundKey) in filteredRounds" :key="roundKey" class="round-card">
              <div class="round-header">
                <h3>Round {{ roundData.round }}</h3>
                <button class="battle-btn small" @click="toggle(roundKey)">
                  {{ expanded[roundKey] ? 'Hide details' : 'Round details' }}
                </button>
              </div>
              <transition name="fade">
                <table v-if="expanded[roundKey]" class="battle-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>{{ pvp_battle_data.attacker }}</th>
                      <th>{{ pvp_battle_data.defender }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(label, key) in statLabels" :key="key">
                      <td><strong>{{ label }}</strong></td>
                      <td>
                        <strong>
                          {{ roundData[pvp_battle_data.attacker][key] }}
                          <span v-if="['hit_rate'].includes(key)">%</span>
                        </strong>
                      </td>
                      <td>
                        <strong>
                          {{ roundData[pvp_battle_data.defender][key] }}
                          <span v-if="['hit_rate'].includes(key)">%</span>
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

/* Fade transition for rounds */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>