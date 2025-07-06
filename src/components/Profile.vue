<script setup>
//Import
import { ref, onMounted, computed } from "vue";
import { authFetch } from "../utils/authFetch.js";

//Declarations
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const inventory = ref([]);
const loading = ref(true);
const error = ref(null);
const profile = ref([]);
const SLOT_COUNT = 33;
const current_hp = ref(0);
const str_cost = ref(0);
const dex_cost = ref(0);
const int_cost = ref(0);
const hp_cost = ref(0);
const equippedItems = ref([]);
const statLabels = {
  crit_dmg: "Critical Damage",
  crit_rate: "Critical Rate",
  dexterity: "Dexterity",
  hit_rate: "Hit Rate",
  hp: "HP",
  inteligence: "Intelligence",
  lifesteal: "Lifesteal",
  magic_def: "Magic Defense",
  phys_def: "Physical Defense",
  strength: "Strength",
};

const equipmentSlots = [
  { type: "weapon", class: "weapon-slot" },
  { type: "helmet", class: "helmet-slot" },
  { type: "armor", class: "armor-slot", big: true },
  { type: "leggings", class: "leggings-slot", big: true },
  { type: "boots", class: "boots-slot" },
  { type: "gloves", class: "gloves-slot" },
];

//Functions
onMounted(async () => {
  await fetchProfile();
});

async function fetchProfile() {
  try {
    const response = await authFetch(`${API_BASE_URL}/profile/`);
    if (response && response.ok) {
      const data = await response.json();
      profile.value = data || 0;
      inventory.value = data.inventory_items || 0;
      equippedItems.value = data.equipped_items || 0;
      current_hp.value = data.stats.current_hp || 0;
      loading.value = false;
      console.log("Profile data fetched successfully:", profile.value);
      console.log("Inventory data fetched successfully:", inventory.value);
      await getStatsCost();
      return null;
    } else {
      const errData = await response.json();
      alert(errData.detail || JSON.stringify(errData));
    }
  } catch (err) {
    alert(err.message);
    error.value = err.message;
    loading.value = false;
    return err.message;
  }
}

async function upgradeStat(stat_name) {
  try {
    const response = await authFetch(`${API_BASE_URL}/update_stats/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stat_name }),
    });
    if (response.ok) {
      await fetchProfile();
      return null;
    } else {
      const errData = await response.json();
      alert(errData.detail || JSON.stringify(errData));
    }
  } catch (err) {
    alert(err.message);
    return err.message;
  }
}

async function getStatsCost() {
  try {
    const response = await authFetch(`${API_BASE_URL}/update_stats/`);
    if (response.ok) {
      const data = await response.json();
      str_cost.value = data.str_cost || 0;
      dex_cost.value = data.dex_cost || 0;
      int_cost.value = data.int_cost || 0;
      hp_cost.value = data.hp_cost || 0;
      return null;
    } else {
      const errData = await response.json();
      alert(errData.detail || JSON.stringify(errData));
    }
  } catch (err) {
    alert(err.message);
    return err.message;
  }
}

function generateImageName(itemName, rarity) {
  if (!itemName)
    return new URL("@/assets/items/default-item-icon.png", import.meta.url)
      .href;
  const nameParts = itemName.split(" ");
  const fileName = nameParts.join("_").toLowerCase() + "_" + rarity + ".png";
  return new URL(`../assets/items/${fileName}`, import.meta.url).href;
}

function handleImageError(event) {
  event.target.src = new URL('../assets/items/image.png', import.meta.url).href;
}

async function equipItem(itemId) {
  try {
    const response = await authFetch(
      `${API_BASE_URL}/inventory/equip/${itemId}/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (response.ok) {
      console.log("Item equipped successfully");
      await fetchProfile(); // Refresh profile after equipping
    } else {
      const errData = await response.json();
      alert(errData.detail || JSON.stringify(errData));
    }
  } catch (err) {
    alert(err.message);
    return err.message;
  }
}

function formatQuantity(qty) {
  return qty > 1 ? `x${qty}` : "";
}

const gridInventory = computed(() => {
  // Only include unequipped items
  const unequipped = inventory.value.filter(
    (item) => item && item.is_equipped === false
  );
  // Fill up to SLOT_COUNT with nulls
  const slots = Array(SLOT_COUNT).fill(null);
  for (let i = 0; i < unequipped.length && i < SLOT_COUNT; i++) {
    slots[i] = unequipped[i];
  }
  return slots;
});

const filteredStats = computed(() => {
  if (!profile.value.total_stats) return [];
  return Object.entries(profile.value.total_stats).filter(
    ([k]) =>
      ![
        "lifesteal",
        "crit_dmg",
        "crit_rate",
        "hit_rate",
        "magic_def",
        "phys_def",
      ].includes(k)
  );
});

const equippedByType = computed(() => {
  const mapping = {};
  for (const item of equippedItems.value) {
    if (item.item && item.item.type) {
      mapping[item.item.type] = item;
    }
  }
  console.log("Equipped items by type:", mapping);
  return mapping;
});
</script>

<template>
  <div class="main">
    <div class="top-section">
      <!-- Stânga sus: echipamente și statistici -->
      <div class="left-panel">
        <div class="equipment-box">
          <div v-for="slot in equipmentSlots" :key="slot.type"
            :class="['placeholder-slot', slot.class, { 'placeholder-slot-bigger-slot': slot.big }]">
            <template v-if="equippedByType[slot.type]">
              <div class="tooltip-container">
                <img :src="generateImageName(
            equippedByType[slot.type].item.name,
            equippedByType[slot.type].item.rarity
            )" class="item-icon" :alt="equippedByType[slot.type].item.name" @error="handleImageError" />
                <div class="custom-tooltip">
                  <div class="tt-font-name" :class="`rarity-${equippedByType[slot.type].item.rarity}`">
                    {{ equippedByType[slot.type].item.name }}
                  </div>
                  <div class="tt-font">
                    Required Level: {{ equippedByType[slot.type].item.required_level }}
                  </div>
                  <div class="tt-font">
                    Sell: {{ equippedByType[slot.type].item.required_gold }} 🟡
                  </div>
                  <div class="tt-stats" v-if="equippedByType[slot.type].item.stats?.length">
                    Stats:
                    <div v-for="(stat, sidx) in equippedByType[slot.type].item.stats" :key="sidx" class="tt-stat">
                      {{ statLabels[stat.name] || stat.name }}:
                      <span>
                        {{
                        ['crit_rate', 'hit_rate', 'lifesteal'].includes(stat.name)
                        ? stat.value + '%'
                        : stat.value
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>>
            </template>
            <template v-else>
              {{ slot.type.charAt(0).toUpperCase() + slot.type.slice(1) }}
            </template>
          </div>
        </div>
      </div>
  <!-- Dreapta sus: Add stat points -->
  <div class="right-panel">
    <div class="stats-box">
      <h2>Character stats</h2>
      <div class="stat-line">Level: {{ profile.level || 0 }}</div>
      <div class="stat-line">
        Experience: {{ profile.experience }} /
        {{ profile.level * 40 || 0 }}
      </div>
      <div v-if="profile.total_stats">
        <div v-for="[key, value] in filteredStats" :key="key" class="stat-line">
          <template v-if="key === 'hp'">
            {{ statLabels[key] || key }}: {{ current_hp }}/{{ value }}
          </template>
          <template v-else>
            {{ statLabels[key] || key }}: {{ value }}
          </template>
        </div>
      </div>
    </div>
    <div class="add-stats-box">
      <h2>Add stat points</h2>
      <div v-if="profile.stats" class="stat-points-container">
        <div class="stat-upgrade">
          <span>Strength</span>
          <span> Cost: {{ str_cost }} 🟡 </span>
          <button @click="upgradeStat('strength')">+</button>
        </div>
        <div class="stat-upgrade">
          <span>Dexterity</span>
          <span> Cost: {{ dex_cost }} 🟡 </span>
          <button @click="upgradeStat('dexterity')">+</button>
        </div>
        <div class="stat-upgrade">
          <span>Intelligence</span>
          <span> Cost: {{ int_cost }} 🟡 </span>
          <button @click="upgradeStat('inteligence')">+</button>
        </div>
        <div class="stat-upgrade">
          <span>HP</span>
          <span> Cost: {{ hp_cost }} 🟡 </span>
          <button @click="upgradeStat('hp')">+</button>
        </div>
      </div>
      <div v-else>No stat points available</div>
    </div>
    </div> 
  </div>
  <div>gold: {{ profile.gold }}🟡</div>
  <!-- Secțiunea de inventar -->
  <div class="inventory-grid">
    <div v-for="item in gridInventory" class="inventory-item">
      <template v-if="item">
        <div class="tooltip-container">
          <img :src="generateImageName(item.item.name, item.item.rarity)" :alt="item.name" class="item-icon" @error="handleImageError" />
          <div class="custom-tooltip">
            <div class="tt-font-name" :class="`rarity-${item.item.rarity}`">
              {{ item.item.name }}
            </div>
            <div class="tt-font">
              Required Level: {{ item.item.required_level }}
            </div>
            <div class="tt-font">Sell: {{ item.item.required_gold }} 🟡</div>
            <div class="tt-stats" v-if="item.item.stats && item.item.stats.length">
              Stats:
              <div v-for="(stat, sidx) in item.item.stats" :key="sidx" class="tt-stat">
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
          <div class="item-quantity">{{ formatQuantity(item.quantity) }}</div>
          <button class="inventory-action-btn" @click="equipItem(item.id)">
            Equip
          </button>
        </div>
      </template>
      <template v-else>
        <div class="item-icon" style="opacity: 0.2">Empty</div>
      </template>
    </div>
  </div>
    </div>
</template>

<style scoped>
.main {
  width: 95vw;
  max-width: 1200px;
  min-width: 320px;
  min-height: 80vh;
  margin: 2vw auto;
  background: #000;
  position: relative;
  box-sizing: border-box;
  border-radius: 1.2rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
}

.top-section {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8vw;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 1vw;
}

.left-panel,
.right-panel {
  flex: 1 1 350px;
  min-width: 280px;
  box-sizing: border-box;
  border: 1px solid yellow;
  padding: 1vw;
  background: transparent;
  border-radius: 0.7rem;
}

.equipment-box {
  display: grid;
  grid-template-columns: repeat(3, 8.1rem);
  grid-template-rows: repeat(4, 5.5rem);
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  min-width: 18.75rem;
}

.weapon-slot {
  grid-column: 1;
  grid-row: 1 / span 4;
  align-self: middle;
}

.helmet-slot {
  grid-column: 2;
  grid-row: 1;
}

.armor-slot {
  grid-column: 2;
  grid-row: 2 / span 2;
}

.leggings-slot {
  grid-column: 2;
  grid-row: 4 / span 2;
}

.boots-slot {
  grid-column: 2;
  grid-row: 6;
}

.gloves-slot {
  grid-column: 3;
  grid-row: 1 / span 4;
  align-self: middle;
}

.placeholder-slot {
  width: 90px;
  height: 90px;
  border: 1px solid rgb(255, 0, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  background: transparent;
  border-radius: 0.4rem;
}

.placeholder-slot-bigger-slot {
  width: 90px;
  height: 150px;
  border: 1px solid rgb(255, 0, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  background: transparent;
  border-radius: 0.4rem;
}

.stats-box,
.add-stats-box {
  border: 0.9px solid rgb(92, 92, 70);
  padding: 0.5rem;
  border-radius: 0.4rem;
  margin-bottom: 1vw;
  background: transparent;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 0.7rem;
  margin-top: 1vw;
  width: 100%;
  box-sizing: border-box;
}

.inventory-item {
  background: #222;
  border-radius: 0.75rem;
  padding: 0.75rem;
  text-align: center;
  color: #eee;
  cursor: pointer;
  transition: transform 0.2s;
  min-width: 70px;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.inventory-item:hover {
  transform: scale(1.07);
  box-shadow: 0 0 0.625rem #ffcc00;
}

.item-icon {
  width: 4vw;
  height: 4vw;
  max-width: 70px;
  max-height: 70px;
  min-width: 36px;
  min-height: 36px;
  margin-bottom: 0.5rem;
}

.stat-points-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.stat-upgrade {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-upgrade button {
  width: 32px;
  height: 32px;
  padding: 0;
  font-size: 1.2rem;
  background: #333;
  color: #ffe600;
  border: 1px solid #ffe600;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-upgrade button:hover {
  background: #ffe600;
  color: #000;
}

.stat-line {
  font-size: 0.9rem;
  padding: 0.25rem 0;
}

.inventory-section {
  border: 1px solid yellow;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #111;
  border-radius: 0.5rem;
}

.tooltip-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.custom-tooltip {
  display: none;
  position: absolute;
  z-index: 1000;
  left: 50%;
  top: -10px;
  transform: translate(-50%, -100%);
  background: #222;
  color: #fff;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  min-width: 180px;
  box-shadow: 0 0 10px #000a;
  font-size: 0.95rem;
  pointer-events: none;
  white-space: pre-line;
}

.tooltip-container:hover .custom-tooltip {
  display: block;
}

.tt-font-name {
  font-weight: bold;
  font-size: 1.05rem;
  margin-bottom: 0.25rem;
}

.tt-font {
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.tt-rarity {
  color: #ccc;
  margin-bottom: 0.25rem;
}

.rarity-common {
  color: #fff;
}

.rarity-uncommon {
  color: #4caf50;
}

.rarity-rare {
  color: #2196f3;
}

.rarity-epic {
  color: #9c27b0;
}

.rarity-legendary {
  color: #ff9800;
}

.tt-stats {
  margin-top: 0.5rem;
}

.tt-stat {
  font-size: 0.85rem;
  color: #b3e5fc;
}

.tt-value {
  color: gold;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  font-weight: bold;
}

.inventory-action-btn {
  display: none;
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 2;
  padding: 0.3rem 0.7rem;
  background: #ffe600;
  color: #222;
  border: none;
  border-radius: 0.4rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.inventory-item:hover .inventory-action-btn {
  display: block;
}

/* Responsive Styles */
@media (max-width: 1200px) {
  .main {
    padding: 1vw 0.5vw;
  }

  .top-section {
    flex-direction: column;
    gap: 2vw;
  }

  .left-panel,
  .right-panel {
    min-width: 0;
    width: 100%;
    margin-bottom: 1vw;
  }

  .inventory-grid {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 0.5rem;
  }
}

@media (max-width: 900px) {
  .main {
    padding: 0.5rem 0.2rem;
  }

  .inventory-grid {
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    gap: 0.4rem;
  }

  .inventory-item {
    min-width: 50px;
    min-height: 50px;
    font-size: 0.8rem;
    padding: 0.4rem;
  }

  .item-icon {
    width: 40px;
    height: 40px;
  }

  .placeholder-slot {
    width: 60px;
    height: 60px;
    font-size: 0.9rem;
  }
}

@media (max-width: 600px) {
  .main {
    padding: 0.2rem 0.1rem;
    border-radius: 0;
  }

  .top-section {
    flex-direction: column;
    gap: 1rem;
    height: auto;
  }

  .left-panel,
  .right-panel {
    width: 100%;
    min-width: 0;
    padding: 0.5rem;
    border-width: 1px;
  }

  .equipment-box {
    gap: 0.2rem;
  }

  .placeholder-slot {
    width: 40px;
    height: 40px;
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
  }

  .inventory-grid {
    grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
    gap: 0.2rem;
    margin-top: 0.5rem;
  }

  .inventory-item {
    min-width: 30px;
    min-height: 30px;
    font-size: 0.7rem;
    padding: 0.2rem;
    height: 40px;
    width: 100%;
  }

  .item-icon {
    width: 24px;
    height: 24px;
    margin-bottom: 0.2rem;
  }

  .custom-tooltip {
    min-width: 90px;
    font-size: 0.7rem;
    padding: 0.3rem 0.3rem;
  }
}
</style>
