<script setup>
import { authFetch } from "../utils/authFetch.js";
import { ref, computed } from "vue";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const battle_data = ref(null);
const expanded = ref({});
const statLabels = {
  dmg: "Damage given",  
  hit_rate: "Hit rate",
  is_hit: "Has been hit?",
  hp_left: "HP left",
  regen: "Live regenerated",
  crit_rate: "Critical rate",
  crit_dmg: "Critical damage",
  is_crit: "Hit has been critical?",
  lifesteal: "Lifesteal",
  total_hp: "HP left",
};

async function startBattle(selectedDifficulty) {
    const payload ={ 
        difficulty : selectedDifficulty,
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
        if (typeof battle_data.value === 'object'){
          console.log("Battle started successfully:", battle_data.value);}
        else {
          alert(battle_data.value);
        }
    }else{
        const errData = await response.json();
        alert(errData.detail || JSON.stringify(errData));
        }
    } 
  catch (err) {
    alert(err.message);
    return err.message;
  }
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
      return null;
    } else {
      const errData = await response.json();
      alert(errData.detail || JSON.stringify(errData));
    }
  }
  catch (err) {
    alert(err.message);
    return err.message;
  }
}

</script>

<template>
  <div class="battle-container">
    <button @click="startBattle('easy')">Start Easy Battle</button>
    <button @click="startBattle('medium')">Start Medium Battle</button>
    <button @click="startBattle('hard')">Start Hard Battle</button>
  </div>
  <div v-if="battle_data && typeof battle_data === 'object'  " class="battle-data">
    <p><strong>🏆 Winner: {{ battle_data.winner }}</strong></p>
    <h2>Rundele bătăliei:</h2>
    <div v-for="(roundData, roundKey) in filteredRounds" :key="roundKey">
      <h3>Round: {{ roundData.Round }}</h3>
      <button @click="toggle(roundKey)">Detalii rundă</button>
      <table style="width:100%" v-if="expanded[roundKey]">
        <thead>
          <tr>
            <th>Acțiune</th>
            <th>Player</th>
            <th>NPC</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(val, key) in roundData.Player" :key="key">
            <td><strong>{{ statLabels[key]}}</strong></td>            
              <td><strong>{{ roundData.Player[key]}}<span v-if ="['crit_rate'].includes(key)">%</span></strong></td>
            <td><strong>{{ roundData.NPC[key] }}<span v-if ="['crit_rate'].includes(key)">%</span></strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div>
    <button @click="heal">Heal</button>
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