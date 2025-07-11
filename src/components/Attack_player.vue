<script setup>
import { ref, computed, onMounted } from 'vue';
import { authFetch } from '../utils/authFetch.js';
import {pvp_battle_data} from '../utils/public_variables.js';

console.log("PVP Battle Data:", pvp_battle_data.value);
const expanded = ref({});
const statLabels = [
  { key: 'damage', label: 'Damage given' },
  { key: 'hit_rate', label: 'Hit Rate' },
  { key: 'hp_left', label: 'HP Left' },
  { key: 'is_crit', label: 'Hit has been critical?' },
  { key: 'is_hit', label: 'Has been hit?' },
  { key: 'lifesteal', label: 'Lifesteal' },
  { key: 'regen', label: 'Life regenerated' },
]

const filteredPlayers = computed(() => {
  const data = pvp_battle_data.value || {}
  const entries = Object.entries(data)
  return entries.filter(([key, val]) => key !== 'round')
})

const filteredRounds = computed(() => {
  if (!pvp_battle_data.value) return {};
  return Object.fromEntries(
    Object.entries(pvp_battle_data.value).filter(([key]) => !isNaN(Number(key)))
  );
});

function toggle(section) {
  expanded.value[section] = !expanded.value[section]
}
</script>

<template>
  <div v-if="pvp_battle_data && typeof pvp_battle_data === 'object'" class="battle-data">
    <p><strong>🏆 Winner: {{ pvp_battle_data.winner }}</strong></p>
    <h2>Rundele bătăliei:</h2>
    <div v-for="(roundData, roundKey) in filteredRounds" :key="roundKey" class="round-block">
      <h3>Round: {{ roundData.round }}</h3>
      <button @click="toggle(roundKey)">
        {{ expanded[roundKey] ? 'Ascunde detalii' : 'Detalii rundă' }}
      </button>
      <table style="width:100%" v-if="expanded[roundKey]">
        <thead>
          <tr>
            <th>Actiune</th>
            <th>{{ pvp_battle_data.attacker }}</th>
            <th>{{ pvp_battle_data.defender }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stat in statLabels" :key="stat.key">
            <td>{{ stat.label }}</td>
            <td>{{  roundData[pvp_battle_data.attacker][stat.key] }}<span v-if="['crit_rate'].includes(stat.key)">%</span></td>
            <td>{{  roundData[pvp_battle_data.defender][stat.key] }}<span v-if="['crit_rate'].includes(key)">%</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.battle-data {
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  background-color: black;
  max-height: 500px;
  overflow: auto;
  width: 1500px;
}
.details {
  margin-top: 15px;
  padding: 15px;
  border-left: 3px solid #0077cc;
  background-color: #f4faff;
  border-radius: 8px;
}

button {
  display: inline-block;
  margin: 8px 0;
  background-color: #0077cc;
  color: white;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: bold;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

button:hover {
  background-color: #005fa3;
}

ul {
  margin: 12px 0 16px 0;
  padding: 12px;
  background-color: #ffffff;
  border: 1px solid #ccc;
  border-radius: 6px;
  max-height: 200px;
  width: 980px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 14px;
  color: #222;
  list-style-type: none;
}

li {
  padding: 6px 8px;
  border-bottom: 1px solid #eee;
  width : 900px;
}

li:last-child {
  border-bottom: none;
}

strong {
  color: #0077cc;
  font-weight: bold;
  font-size: 18px;
}

table,
th,
td {
    border: 1px solid yellow;
    background-color: black;
    color: red;
    font-size: 20px;
    text-align: center;
}
</style>