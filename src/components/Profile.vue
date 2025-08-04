<script setup>
//Import
import { ref, onMounted, computed } from "vue";
import { authFetch } from "../utils/authFetch.js";
import "../assets/inventory.css";

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
const showSidebar = ref(false);
const showButton = ref(true);
const equippedItems = ref([]);
const counter = ref(0);
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
  { type: "pants", class: "leggings-slot", big: true },
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

async function heal() {
  try {
    const response = await authFetch(`${API_BASE_URL}/heal/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      await fetchProfile(); // Refresh profile after healing
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

async function sellItem(itemId) {
  try {
    const response = await authFetch(
      `${API_BASE_URL}/inventory/${itemId}/`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (response.ok) {
      counter.value++;
      showButton.value = false;
      await fetchProfile();
      setTimeout(() => { showButton.value = true }, 0.01)
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
  const unequipped = inventory.value
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

const filteredTotalStats = computed(() => {
  if (!profile.value.total_stats) return [];
  return Object.entries(profile.value.total_stats).filter(
    ([k]) =>
      ![
        "strength",
        "dexterity",
        "inteligence",
        "hp",
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
  <div class="mainInventory">
    <div class="top-section">
      <!-- Stânga sus: echipamente și statistici -->
      <div class="left-panel">
        <div class="sidebar-dropdown">
          <button class="sidebar-toggle" @click="showSidebar = !showSidebar">
            ⮜
          </button>
          <div class="sidebar-content" v-if="showSidebar">
            <h3>Total Stats</h3>
            <div v-for="[key, value] in filteredTotalStats" :key="key" class="stat-line">
              <template v-if="key === 'hp'">
                {{ statLabels[key] || key }}: {{ current_hp }}/{{ value }}
              </template>
              <template v-else>
                {{ statLabels[key] || key }}: {{ value }}
              </template>
            </div>
          </div>
        </div>
        <div class="equipment-box">
          <div v-for="slot in equipmentSlots" :key="slot.type"
            :class="['placeholder-slot', slot.class, { 'placeholder-slot-bigger-slot': slot.big }]">
            <template v-if="equippedByType[slot.type]">
              <div class="tooltip-container">
                <img :src="generateImageName(
                  equippedByType[slot.type].item.name,
                  equippedByType[slot.type].item.rarity
                )" class="item-icon" :alt="equippedByType[slot.type].item.name" @error="handleImageError" />
                <div class="custom-tooltip-equipped">
                  <div class="tt-font">{{equippedByType[slot.type].is_equipped ? 'Equipped' : ''}}</div>
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
              </div>
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
          <button @click="heal">Heal</button>
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
    <div class="stat-line">
      Experience: {{ profile.experience }} / {{ profile.level * 40 || 0 }}
      <div class="progress position-relative" role="progressbar" aria-valuemin="0" :aria-valuemax="profile.level * 40"
        :aria-valuenow="profile.experience" style="height: 1.5rem;">

        <!-- Bara verde -->
        <div class="progress-bar bg-success" :style="{ width: `${(profile.experience / (profile.level * 40)) * 100}%` }"
          style="font-weight: bold; color: black;">
        </div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
              font-weight: bold; color: black; pointer-events: none;">
          {{ Math.floor((profile.experience / (profile.level * 40)) * 100) }}%
        </div>
      </div>
    </div>
    <div class="stat-line">gold: {{ profile.gold }}🟡</div>
    <!-- Secțiunea de inventar -->
    <div class="inventory-grid">
      <div v-for="item in gridInventory" class="inventory-item">
        <template v-if="item">
          <div class="tooltip-container">
            <img :src="generateImageName(item.item.name, item.item.rarity)" :alt="item.name" class="item-icon"
              @error="handleImageError" />
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
            <button class="inventory-action-btn" @click="equipItem(item.id)">Equip</button>
            <button class="inventory-action-btn" v-if="showButton" @click="sellItem(item.id)">Sell</button>
          </div>
        </template>
        <template v-else>
          <div class="item-icon" style="opacity: 0.2">Empty</div>
        </template>
      </div>
    </div>
  </div>
</template>
