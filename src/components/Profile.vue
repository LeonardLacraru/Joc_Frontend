<script setup>
//Import
import { ref, onMounted, computed, onUnmounted } from "vue";
import { authFetch } from "../utils/authFetch.js";
import Inventory from "./Inventory.vue";
import { useBackendMessage } from "../utils/useBackendMessage.js";

//Declarations
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const inventory = ref([]);
const loading = ref(true);
const error = ref(null);
const profile = ref([]);
const SLOT_COUNT = 30;
const current_hp = ref(0);
const str_cost = ref(0);
const dex_cost = ref(0);
const int_cost = ref(0);
const hp_cost = ref(0);
const showButton = ref(true);
const equippedItems = ref([]);
const { backendMessage, backendMessageType, showBackendMessage } = useBackendMessage();
const counter = ref(0);
const selectedItem = ref(null);
const selectedEquippedItem = ref(null);
const actionPanelPosition = ref({ x: 0, y: 0 });
const showActionPanel = ref(false);
const enchantItems = ref({});
const gatheringItems = ref({});
const miningItems = ref({});
const rightTab = ref('inventory'); // 'inventory', 'stats'
const inventorySubTab = ref('items'); // 'items', 'materials'
const materialsSubTab = ref('gathering'); // 'gathering', 'enchant', 'mining'
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
};

// Gathering items mapping
const gatheringItemsMapping = {
  'bloom': { displayName: 'Moonpetal Bloom', image: 'bloom.png' },
  'blossoms': { displayName: 'Nightshade Blossoms', image: 'blossoms.png' },
  'dew': { displayName: 'Dew of the Forgotten Grove', image: 'dew.png' },
  'fungus': { displayName: 'Ashcap Fungus', image: 'fungus.png' },
  'mushrooms': { displayName: 'Whispering Mushrooms', image: 'mushrooms.png' },
  'vines': { displayName: 'Bloodthorn Vines', image: 'vines.png' },
};

// Mining items mapping
const miningItemsMapping = {
  'bronze': { displayName: 'Bronze Ore', image: 'bronze.png' },
  'silver': { displayName: 'Silver Ore', image: 'silver.png' },
  'gold': { displayName: 'Gold Ore', image: 'gold.png' },
  'platinum': { displayName: 'Platinum Ore', image: 'platinum.png' },
  'emerald': { displayName: 'Emerald Gem', image: 'emerald.png' },
};

function selectInventoryItem(item, event) {
  if (selectedItem.value?.id === item.id) {
    selectedItem.value = null;
    selectedEquippedItem.value = null;
    showActionPanel.value = false;
  } else {
    selectedItem.value = item;
    selectedEquippedItem.value = null;
    actionPanelPosition.value = {
      x: event.clientX,
      y: event.clientY
    };
    showActionPanel.value = true;
  }
}

function selectEquippedItem(item, event) {
  if (selectedEquippedItem.value?.id === item.id) {
    selectedItem.value = null;
    selectedEquippedItem.value = null;
    showActionPanel.value = false;
  } else {
    selectedEquippedItem.value = item;
    selectedItem.value = null;
    actionPanelPosition.value = {
      x: event.clientX,
      y: event.clientY
    };
    showActionPanel.value = true;
  }
}

const equipmentSlots = [
  { type: "helmet", label: "Helmet", gridArea: "helmet" },
  { type: "weapon", label: "Weapon", gridArea: "weapon" },
  { type: "armor", label: "Armor", gridArea: "armor" },
  { type: "gloves", label: "Gloves", gridArea: "gloves" },
  { type: "pants", label: "Pants", gridArea: "pants" },
  { type: "boots", label: "Boots", gridArea: "boots" },
];

//Functions
function handleClickOutside(event) {
  const panel = document.querySelector('.floating-action-panel');
  const clickedItem = event.target.closest('.tooltip-container');

  if (panel && !panel.contains(event.target) && !clickedItem) {
    showActionPanel.value = false;
    selectedItem.value = null;
    selectedEquippedItem.value = null;
  }
}

onMounted(async () => {
  await fetchProfile();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

async function fetchProfile() {
  try {
    const response = await authFetch(`${API_BASE_URL}/profile/`);
    if (!response) {
      // Token refresh failed, user is being redirected to login
      return null;
    }
    if (response.ok) {
      const data = await response.json();
      profile.value = data || 0;
      inventory.value = data.inventory_items || 0;
      equippedItems.value = data.equipped_items || 0;
      current_hp.value = data.stats.current_hp || 0;
      enchantItems.value = data.inventory_enchant_items || {};
      gatheringItems.value = data.inventory_gathering_items || {};
      miningItems.value = data.inventory_mining_items || {};
      loading.value = false;
      await getStatsCost();
      return null;
    } else {
      const errData = await response.json();
      showBackendMessage(errData.detail || JSON.stringify(errData), "error");
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
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
    if (!response) {
      return null;
    }
    if (response.ok) {
      await fetchProfile();
      showBackendMessage("Stat upgraded!", "success");
      return null;
    } else {
      const errData = await response.json();
      showBackendMessage(errData.detail || JSON.stringify(errData), "error");
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
    return err.message;
  }
}

async function getStatsCost() {
  try {
    const response = await authFetch(`${API_BASE_URL}/update_stats/`);
    if (!response) {
      return null;
    }
    if (response.ok) {
      const data = await response.json();
      str_cost.value = data.str_cost || 0;
      dex_cost.value = data.dex_cost || 0;
      int_cost.value = data.int_cost || 0;
      hp_cost.value = data.hp_cost || 0;
      return null;
    } else {
      const errData = await response.json();
      showBackendMessage(errData.detail || JSON.stringify(errData), "error");
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
    return err.message;
  }
}

function generateImageName(itemName) {
  if (!itemName)
    return new URL("@/assets/items/default-item-icon.png", import.meta.url).href;
  const nameParts = itemName.split(" ");
  const fileName = nameParts[0].toLowerCase() + ".png";
  return new URL(`../assets/items/${fileName}`, import.meta.url).href;
}

function handleImageError(event) {
  event.target.src = new URL("../assets/items/image.png", import.meta.url).href;
}

function generateGatheringImageName(itemName) {
  if (!itemName) return new URL("../assets/gathering/default.png", import.meta.url).href;
  const fileName = itemName.toLowerCase() + ".png";
  return new URL(`../assets/gathering/${fileName}`, import.meta.url).href;
}

function generateEnchantImageName(itemName) {
  if (!itemName) return new URL("../assets/stones/default.png", import.meta.url).href;
  const fileName = itemName.toLowerCase() + ".png";
  return new URL(`../assets/stones/${fileName}`, import.meta.url).href;
}

function generateMiningImageName(itemName) {
  if (!itemName) return new URL("../assets/mining/default.png", import.meta.url).href;
  const fileName = itemName.toLowerCase() + ".png";
  return new URL(`../assets/mining/${fileName}`, import.meta.url).href;
}

function handleGatheringImageError(event) {
  event.target.src = new URL("../assets/gathering/default.png", import.meta.url).href;
}

function handleEnchantImageError(event) {
  event.target.src = new URL("../assets/stones/default.png", import.meta.url).href;
}

function handleMiningImageError(event) {
  event.target.src = new URL("../assets/mining/default.png", import.meta.url).href;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatItemName(itemName) {
  if (!itemName) return '';
  // Capitalize first letter and replace underscores with spaces
  return itemName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getGatheringDisplayName(itemName) {
  if (!itemName) return '';
  return gatheringItemsMapping[itemName]?.displayName || formatItemName(itemName);
}

function getMiningDisplayName(itemName) {
  if (!itemName) return '';
  return miningItemsMapping[itemName]?.displayName || formatItemName(itemName);
}

async function equipItem(itemId) {
  try {
    // Hide action panel and clear selections BEFORE the API call
    selectedItem.value = null;
    selectedEquippedItem.value = null;
    showActionPanel.value = false;

    const response = await authFetch(
      `${API_BASE_URL}/inventory/equip/${itemId}/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!response) {
      return null;
    }
    if (response.ok) {
      showBackendMessage("Item equipped!", "success");
      await fetchProfile();
    } else {
      const errData = await response.json();
      showBackendMessage(errData.detail || JSON.stringify(errData), "error");
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
    return err.message;
  }
}

async function sellItem(itemId) {
  try {
    // Hide action panel and clear selections BEFORE the API call
    selectedItem.value = null;
    selectedEquippedItem.value = null;
    showActionPanel.value = false;

    const response = await authFetch(`${API_BASE_URL}/inventory/${itemId}/`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (!response) {
      return null;
    }
    if (response.ok) {
      counter.value++;
      showButton.value = false;
      await fetchProfile();
      showBackendMessage("Item sold!", "success");
      setTimeout(() => {
        showButton.value = true;
      }, 0.01);
    } else {
      const errData = await response.json();
      showBackendMessage(errData.detail || JSON.stringify(errData), "error");
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
    return err.message;
  }
}

const gridInventory = computed(() => {
  const unequipped = inventory.value;
  const slots = Array(SLOT_COUNT).fill(null);
  for (let i = 0; i < unequipped.length && i < SLOT_COUNT; i++) {
    slots[i] = unequipped[i];
  }
  return slots;
});

const filteredStats = computed(() => {
  if (!profile.value.total_stats) return [];
  return Object.entries(profile.value.total_stats).filter(
    ([k]) => !["lifesteal", "hit_rate", "crit_rate", "crit_dmg", "magic_def", "phys_def"].includes(k)
  );
});

const filteredTotalStats = computed(() => {
  if (!profile.value.total_stats) return [];
  return Object.entries(profile.value.total_stats).filter(
    ([k]) => !["strength", "dexterity", "intelligence", "hp"].includes(k)
  );
});

const equippedByType = computed(() => {
  const mapping = {};
  for (const item of equippedItems.value) {
    if (item.item && item.item.type) {
      mapping[item.item.type] = item;
    }
  }
  return mapping;
});

// Convert materials to grid format (like inventory items)
const MATERIAL_SLOT_COUNT = 30; // 6 rows x 5 columns = 30 slots

const materialsGridData = computed(() => {
  let items = [];

  if (materialsSubTab.value === 'gathering') {
    items = Object.entries(gatheringItems.value).map(([name, quantity]) => ({
      name,
      quantity,
      type: 'gathering',
      displayName: gatheringItemsMapping[name]?.displayName || formatItemName(name)
    }));
  } else if (materialsSubTab.value === 'enchant') {
    items = Object.entries(enchantItems.value).map(([name, quantity]) => ({
      name,
      quantity,
      type: 'enchant',
      displayName: `Stone of ${capitalize(name)}`
    }));
  } else if (materialsSubTab.value === 'mining') {
    items = Object.entries(miningItems.value).map(([name, quantity]) => ({
      name,
      quantity,
      type: 'mining',
      displayName: miningItemsMapping[name]?.displayName || formatItemName(name)
    }));
  }

  // Fill remaining slots with null
  const slots = Array(MATERIAL_SLOT_COUNT).fill(null);
  for (let i = 0; i < items.length && i < MATERIAL_SLOT_COUNT; i++) {
    slots[i] = items[i];
  }

  return slots;
});

// Clear inventory confirmation
const showClearConfirm = ref(false);
const showSecondConfirm = ref(false);
const isClearing = ref(false);
const countdown = ref(2000);
let countdownInterval = null;

function openClearInventory() {
  showClearConfirm.value = true;
}

function confirmFirstStep() {
  showClearConfirm.value = false;
  showSecondConfirm.value = true;
}

function cancelClear() {
  showClearConfirm.value = false;
  showSecondConfirm.value = false;
  isClearing.value = false;
  countdown.value = 2000;
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

async function clearInventory() {
  isClearing.value = true;
  countdown.value = 2000;

  // Start countdown timer
  const startTime = Date.now();
  countdownInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    countdown.value = Math.max(0, 2000 - elapsed);

    if (countdown.value === 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }, 10); // Update every 10ms for smooth animation

  try {
    const response = await authFetch(`${API_BASE_URL}/clear_inventory/`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (!response) {
      showSecondConfirm.value = false;
      isClearing.value = false;
      countdown.value = 2000;
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      return;
    }
    if (response.ok) {
      showBackendMessage("Inventory cleared successfully!", "success");
      counter.value++;
      await fetchProfile();

      // Wait for countdown to finish
      setTimeout(() => {
        showSecondConfirm.value = false;
        isClearing.value = false;
        countdown.value = 2000;
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
      }, 2000);
    } else {
      const errData = await response.json();
      showBackendMessage(errData.detail || JSON.stringify(errData), "error");
      showSecondConfirm.value = false;
      isClearing.value = false;
      countdown.value = 2000;
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
    showSecondConfirm.value = false;
    isClearing.value = false;
    countdown.value = 2000;
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }
}
</script>

<template>
  <div class="profile-container">
    <!-- Backend Toast Message -->
    <div v-if="backendMessage" :class="['backend-toast', backendMessageType]">
      {{ backendMessage }}
    </div>

    <!-- Main Layout: Left Equipment, Right Content -->
    <div class="main-layout">
      <!-- Left Side: Equipment (Always Visible) -->
      <div class="left-panel">
        <div class="equipment-section">
          <h2 class="section-title">Equipment</h2>
          <div class="equipment-grid">
            <div
              v-for="slot in equipmentSlots"
              :key="slot.type"
              class="equipment-slot"
              :style="{ gridArea: slot.gridArea }"
            >
              <template v-if="equippedByType[slot.type]">
                <div
                  class="item-wrapper"
                  :class="[
                    { 'item-selected': selectedEquippedItem?.id === equippedByType[slot.type].id },
                    `rarity-border-${equippedByType[slot.type].item.rarity}`
                  ]"
                  @click="selectEquippedItem(equippedByType[slot.type], $event)"
                >
                  <img
                    :src="generateImageName(equippedByType[slot.type].item.name)"
                    class="item-img"
                    :alt="equippedByType[slot.type].item.name"
                    @error="handleImageError"
                  />
                  <div class="item-tooltip">
                    <div class="tooltip-equipped">Equipped</div>
                    <div class="tooltip-name" :class="`rarity-${equippedByType[slot.type].item.rarity}`">
                      {{ equippedByType[slot.type].item.name }} +{{ equippedByType[slot.type].item.enchant_level }}
                    </div>
                    <div class="tooltip-info">Required Level: {{ equippedByType[slot.type].item.required_level }}</div>
                    <div class="tooltip-info">Sell: {{ equippedByType[slot.type].item.required_gold }} 🟡</div>
                    <div v-if="equippedByType[slot.type].item.stats?.length" class="tooltip-stats">
                      Stats:
                      <div v-for="(stat, sidx) in equippedByType[slot.type].item.stats" :key="sidx">
                        {{ statLabels[stat.name] || stat.name }}:
                        {{ ["crit_rate", "hit_rate", "lifesteal"].includes(stat.name) ? stat.value + "%" : stat.value }}
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="empty-slot">{{ slot.label }}</div>
              </template>
            </div>
          </div>
        </div>

        <!-- Level Info Section -->
        <div class="level-info-section">
          <div class="level-display">
            <div class="level-text">Character Level: {{ profile.level || 0 }}</div>
            <div class="level-bar-container">
              <div class="level-bar" :style="{ width: `${(profile.experience / (profile.level * 40)) * 100}%` }"></div>
              <div class="level-bar-text">{{ Math.floor((profile.experience / (profile.level * 40)) * 100) }}%</div>
            </div>
          </div>
          <div class="lifeskill-display">
            <div class="lifeskill-text">Lifeskill level: {{ profile.lifeskill_level || 0 }}</div>
            <div class="lifeskill-bar-container-small">
              <div class="lifeskill-bar-small" :style="{ width: `${((profile.lifeskill_experience || 0) / ((profile.lifeskill_level || 1) * 20)) * 100}%` }"></div>
              <div class="lifeskill-bar-text">{{ Math.floor(((profile.lifeskill_experience || 0) / ((profile.lifeskill_level || 1) * 20)) * 100) }}%</div>
            </div>
          </div>
        </div>

        <!-- Gold and Clear Inventory -->
        <div class="equipment-info-section">
          <div class="gold-display">Gold: {{ profile.gold }} 🟡</div>
          <button class="clear-inventory-btn" @click="openClearInventory" title="Clear Inventory">
            🗑️ Clear Inventory
          </button>
        </div>
      </div>

      <!-- Right Side: Inventory/Stats Tabs -->
      <div class="right-panel">
        <!-- Right Tabs Header -->
        <div class="right-tabs-header">
          <button
            class="right-tab-btn"
            :class="{ active: rightTab === 'inventory' }"
            @click="rightTab = 'inventory'"
          >
            Inventory
          </button>
          <button
            class="right-tab-btn"
            :class="{ active: rightTab === 'stats' }"
            @click="rightTab = 'stats'"
          >
            Stats
          </button>
        </div>

        <!-- Inventory Tab -->
        <div v-show="rightTab === 'inventory'" class="inventory-tab-content">
        <!-- Inventory Sub-tabs -->
        <div class="sub-tabs-header">
          <button
            class="sub-tab-btn"
            :class="{ active: inventorySubTab === 'items' }"
            @click="inventorySubTab = 'items'"
          >
            Items ({{ inventory.length }}/30)
          </button>
          <button
            class="sub-tab-btn"
            :class="{ active: inventorySubTab === 'materials' }"
            @click="inventorySubTab = 'materials'"
          >
            Materials
          </button>
        </div>

        <!-- Items Sub-tab -->
        <div v-show="inventorySubTab === 'items'" class="inventory-section">
          <Inventory
            :key="counter"
            :items="gridInventory"
            :loading="loading"
            :error="error"
            :showButton="showButton"
            :selectedItem="selectedItem"
            @select-item="selectInventoryItem"
            @equipItem="equipItem"
            @sellItem="sellItem"
            @refreshProfile="fetchProfile"
          />
        </div>

        <!-- Materials Sub-tab -->
        <div v-show="inventorySubTab === 'materials'" class="materials-section">
          <!-- Materials Type Tabs -->
          <div class="materials-tabs-header">
            <button
              class="materials-tab-btn"
              :class="{ active: materialsSubTab === 'gathering' }"
              @click="materialsSubTab = 'gathering'"
            >
              Gathering
            </button>
            <button
              class="materials-tab-btn"
              :class="{ active: materialsSubTab === 'enchant' }"
              @click="materialsSubTab = 'enchant'"
            >
              Enchant Stones
            </button>
            <button
              class="materials-tab-btn"
              :class="{ active: materialsSubTab === 'mining' }"
              @click="materialsSubTab = 'mining'"
            >
              Mining
            </button>
          </div>

          <!-- Materials Grid Display -->
          <div class="materials-grid">
            <div
              v-for="(material, index) in materialsGridData"
              :key="index"
              class="material-grid-item"
              :class="{ empty: !material }"
            >
              <template v-if="material">
                <div class="material-item-wrapper">
                  <img
                    v-if="material.type === 'gathering'"
                    :src="generateGatheringImageName(material.name)"
                    :alt="material.displayName"
                    class="material-img"
                    @error="handleGatheringImageError"
                  />
                  <img
                    v-else-if="material.type === 'enchant'"
                    :src="generateEnchantImageName(material.name)"
                    :alt="material.displayName"
                    class="material-img"
                    @error="handleEnchantImageError"
                  />
                  <img
                    v-else-if="material.type === 'mining'"
                    :src="generateMiningImageName(material.name)"
                    :alt="material.displayName"
                    class="material-img"
                    @error="handleMiningImageError"
                  />
                  <div class="material-quantity-badge">{{ material.quantity }}</div>
                  <div class="material-grid-tooltip">{{ material.displayName }}</div>
                </div>
              </template>
              <template v-else>
                <div class="material-img" style="opacity: 0.2">Empty</div>
              </template>
            </div>
          </div>
        </div>
      </div>

        <!-- Stats Tab -->
        <div v-show="rightTab === 'stats'" class="stats-tab-content">
          <!-- Character Stats Section -->
          <div class="stats-section">
            <h2 class="stats-section-header">Character Stats</h2>
            <div class="stats-content" v-if="profile.total_stats">
              <div v-for="[key, value] in filteredStats" :key="key" class="stat-row-upgrade">
                <span class="stat-label">
                  <template v-if="key === 'hp'">
                    {{ statLabels[key] || key }}: {{ current_hp }}/{{ value }}
                  </template>
                  <template v-else>
                    {{ statLabels[key] || key }}: {{ value.toFixed(2) }}
                  </template>
                </span>
                <span class="stat-controls">
                  <span class="stat-price">{{
                    key === 'strength' ? str_cost :
                    key === 'dexterity' ? dex_cost :
                    key === 'intelligence' ? int_cost :
                    key === 'hp' ? hp_cost : 0
                  }} 🟡</span>
                  <button
                    class="stat-btn"
                    @click="upgradeStat(key)"
                    :disabled="profile.gold < (
                      key === 'strength' ? str_cost :
                      key === 'dexterity' ? dex_cost :
                      key === 'intelligence' ? int_cost :
                      key === 'hp' ? hp_cost : 0
                    )"
                  >+</button>
                </span>
              </div>
            </div>
          </div>

          <!-- Advanced Stats Section -->
          <div class="stats-section">
            <h2 class="stats-section-header">Advanced Stats</h2>
            <div class="stats-content" v-if="profile.total_stats">
              <div v-for="[key, value] in filteredTotalStats" :key="key" class="stat-row">
                {{ statLabels[key] || key }}:
                {{
                  key === "hp" ? current_hp + "/" + value :
                  ["lifesteal", "crit_rate", "crit_dmg", "hit_rate"].includes(key) ?
                  (typeof value === "number" ? value.toFixed(2) : value) + "%" :
                  typeof value === "number" ? value.toFixed(2) : value
                }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating action panel -->
    <div
      v-if="showActionPanel && (selectedItem || selectedEquippedItem)"
      class="floating-action-panel"
      :style="{ left: actionPanelPosition.x + 'px', top: actionPanelPosition.y + 'px' }"
      @click.stop
    >
      <button v-if="selectedItem" class="action-btn equip-btn" @click="equipItem(selectedItem.id)">
        Equip
      </button>
      <button class="action-btn sell-btn" @click="sellItem((selectedItem || selectedEquippedItem).id)">
        Sell
      </button>
    </div>

    <!-- Modals -->
    <div v-if="showClearConfirm" class="modal-overlay" @click="cancelClear">
      <div class="modal-box" @click.stop>
        <h3>Clear Inventory?</h3>
        <p>Are you sure you want to clear your entire inventory?</p>
        <p class="warning-text">This action cannot be undone!</p>
        <div class="modal-buttons">
          <button class="btn-cancel" @click="cancelClear">Cancel</button>
          <button class="btn-confirm" @click="confirmFirstStep">Yes, Continue</button>
        </div>
      </div>
    </div>

    <div v-if="showSecondConfirm" class="modal-overlay" @click="cancelClear">
      <div class="modal-box" @click.stop>
        <h3 v-if="!isClearing">Final Confirmation</h3>
        <h3 v-else>Clearing Inventory...</h3>

        <p v-if="!isClearing" class="warning-text">⚠️ This will permanently delete ALL items in your inventory!</p>
        <p v-if="!isClearing">Are you absolutely sure?</p>

        <div v-if="isClearing" class="countdown-display">
          <div class="countdown-text">Please wait...</div>
          <div class="countdown-timer">
            {{ Math.floor(countdown / 1000) }}:{{ String(countdown % 1000).padStart(3, '0').substring(0, 2) }}
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${(countdown / 2000) * 100}%` }"></div>
          </div>
        </div>

        <div v-if="!isClearing" class="modal-buttons">
          <button class="btn-cancel" @click="cancelClear">No, Cancel</button>
          <button class="btn-danger" @click="clearInventory">Yes, Clear Everything</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  padding: 1rem;
  max-width: 1600px;
  color: #e7d7b1;
  font-family: 'Cinzel', serif;
}

/* Main Layout */
.main-layout {
  display: grid;
  grid-template-columns: 450px 1fr;
  gap: 1.5rem;
  min-height: 600px;
}

/* Left Panel (Equipment - Always Visible) */
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Right Panel (Inventory/Stats Tabs) */
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Right Tabs Header */
.right-tabs-header {
  display: flex;
  gap: 1rem;
  border-bottom: 3px solid #6a0f19;
  padding-bottom: 0;
}

.right-tab-btn {
  flex: 1;
  padding: 1rem 2rem;
  background: linear-gradient(180deg, rgba(34, 23, 27, 0.6) 70%, rgba(24, 16, 18, 0.6) 100%);
  border: 2px solid #3a1c0e;
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  color: #c9b8a0;
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.right-tab-btn:hover {
  background: linear-gradient(180deg, rgba(34, 23, 27, 0.8) 70%, rgba(24, 16, 18, 0.8) 100%);
  border-color: #6a0f19;
  color: #d4af37;
  transform: translateY(-2px);
}

.right-tab-btn.active {
  background: linear-gradient(135deg, #6a0f19 0%, #4a0a12 100%);
  border-color: #d4af37;
  color: #d4af37;
  box-shadow: 0 -2px 16px rgba(212, 175, 55, 0.4), inset 0 0 20px rgba(212, 175, 55, 0.1);
  transform: translateY(0);
}

/* Section Titles */
.section-title {
  font-size: 1.3rem;
  color: #d4af37;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: bold;
}

/* Equipment Section */
.equipment-section {
  width: 100%;
  background-image: url('@/assets/inv_background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #6a0f19;
}

/* Level Info Section */
.level-info-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(180deg, #22171b 70%, #181012 100%);
  border: 2px solid #6a0f19;
  border-radius: 8px;
}

.level-display, .lifeskill-display {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.level-text, .lifeskill-text {
  font-size: 1rem;
  font-weight: bold;
  color: #d4af37;
  text-align: center;
}

.level-bar-container, .lifeskill-bar-container-small {
  position: relative;
  width: 100%;
  height: 1.25rem;
  background: #1a0f15;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #6a0f19;
}

.level-bar {
  height: 100%;
  background: linear-gradient(90deg, #4caf50 0%, #2e7d32 100%);
  transition: width 0.3s ease;
}

.lifeskill-bar-small {
  height: 100%;
  background: linear-gradient(90deg, #9c27b0 0%, #6a1b9a 100%);
  transition: width 0.3s ease;
}

.level-bar-text, .lifeskill-bar-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  color: #fff;
  font-size: 0.85rem;
  text-shadow: 0 0 4px #000;
  pointer-events: none;
}

/* Equipment Info Section */
.equipment-info-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(180deg, #22171b 70%, #181012 100%);
  border: 2px solid #6a0f19;
  border-radius: 8px;
}

.gold-display {
  font-size: 1.2rem;
  font-weight: bold;
  color: #d4af37;
}

.clear-inventory-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #7a3a3a 0%, #5a2a2a 100%);
  border: 2px solid #a33;
  border-radius: 8px;
  color: #e0cfa9;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-inventory-btn:hover {
  background: linear-gradient(135deg, #8a4a4a 0%, #6a3a3a 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(163, 51, 51, 0.4);
}

.equipment-grid {
  display: grid;
  grid-template-areas:
    ". helmet ."
    "weapon armor gloves"
    ". pants ."
    ". boots .";
  gap: 0.75rem;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto auto auto auto;
  max-width: 400px;
  margin: 0 auto;
}

.equipment-slot {
  background: linear-gradient(180deg, rgba(34, 23, 27, 0.85) 70%, rgba(24, 16, 18, 0.85) 100%);
  border: 2px solid #6a0f19;
  border-radius: 8px;
  padding: 0.25rem;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.equipment-slot:hover {
  z-index: 100;
}

.item-wrapper {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2.5px solid transparent;
  border-radius: 8px;
  overflow: visible;
  background: linear-gradient(180deg, #22171b 70%, #181012 100%);
  padding: 0;
  box-sizing: border-box;
}

.item-wrapper .item-img {
  border-radius: 5px;
  overflow: hidden;
}

.item-wrapper:hover {
  transform: scale(1.05);
}

.item-wrapper.item-selected {
  outline: 3px solid #d4af37;
  outline-offset: 2px;
  border-radius: 8px;
}

/* Rarity border colors for equipped items */
.item-wrapper.rarity-border-common {
  border-color: #fff;
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.2);
}

.item-wrapper.rarity-border-uncommon {
  border-color: #4caf50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
}

.item-wrapper.rarity-border-rare {
  border-color: #2196f3;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.4);
}

.item-wrapper.rarity-border-epic {
  border-color: #9c27b0;
  box-shadow: 0 2px 8px rgba(156, 39, 176, 0.4);
}

.item-wrapper.rarity-border-legendary {
  border-color: #ff9800;
  box-shadow: 0 2px 10px rgba(255, 152, 0, 0.5);
}

.item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 5px;
  display: block;
  margin: 0;
  padding: 0;
}

.empty-slot {
  color: #6a4a3a;
  font-size: 0.9rem;
  text-align: center;
}

.item-tooltip {
  display: none;
  position: absolute;
  z-index: 99999;
  left: 100%;
  top: 50%;
  margin-left: 10px;
  transform: translateY(-50%);
  background: #0d0508;
  color: #e7d7b1;
  border: 3px solid #6a0f19;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 1), 0 0 0 2px rgba(106, 15, 25, 0.8);
  padding: 0.6rem 0.8rem;
  min-width: 160px;
  max-width: 240px;
  border-radius: 6px;
  pointer-events: none;
  white-space: normal;
  word-wrap: break-word;
  line-height: 1.4;
  opacity: 1;
}

.item-wrapper:hover .item-tooltip {
  display: block;
}

.tooltip-equipped {
  font-weight: bold;
  font-size: 0.8rem;
  margin-bottom: 0.3rem;
  color: #4caf50;
}

.tooltip-name {
  font-weight: bold;
  font-size: 0.95rem;
  margin-bottom: 0.3rem;
}

.tooltip-info {
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
  color: #e7d7b1;
}

.tooltip-stats {
  margin-top: 0.4rem;
  font-size: 0.8rem;
  color: #e7d7b1;
}

.tooltip-stats > div {
  color: #b3e5fc;
  margin-bottom: 0.15rem;
}

/* Rarity Colors */
.rarity-common { color: #fff; }
.rarity-uncommon { color: #4caf50; }
.rarity-rare { color: #2196f3; }
.rarity-epic { color: #9c27b0; }
.rarity-legendary { color: #ff9800; }

/* Stats Tab Content */
.stats-tab-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.stats-section {
  background: linear-gradient(180deg, #22171b 70%, #181012 100%);
  border: 2px solid #6a0f19;
  border-radius: 8px;
  overflow: hidden;
}

.stats-section-header {
  background: linear-gradient(135deg, #6a0f19 0%, #4a0a12 100%);
  color: #d4af37;
  padding: 1rem;
  text-align: center;
  font-size: 1.3rem;
  font-weight: bold;
  border-bottom: 3px solid #d4af37;
  letter-spacing: 1px;
  margin: 0;
}

.stats-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-row {
  padding: 0.4rem 0;
  font-size: 1rem;
  color: #e7d7b1;
  border-bottom: 1px solid rgba(106, 15, 25, 0.3);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row-upgrade {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
  font-size: 1rem;
  color: #e7d7b1;
  border-bottom: 1px solid rgba(106, 15, 25, 0.3);
  gap: 1.5rem;
}

.stat-row-upgrade:last-child {
  border-bottom: none;
}

.stat-label {
  flex: 1;
  min-width: 0;
}

.stat-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.stat-price {
  font-size: 0.85rem;
  color: #d4af37;
}

.stat-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  font-size: 1rem;
  background: #333;
  color: #ffe600;
  border: 1px solid #ffe600;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.stat-btn:hover:not(:disabled) {
  background: #ffe600;
  color: #333;
  transform: scale(1.1);
}

.stat-btn:disabled {
  background: #222;
  color: #666;
  border-color: #444;
  cursor: not-allowed;
  opacity: 0.5;
}

/* Experience Section */
.experience-section {
  background: linear-gradient(180deg, #22171b 70%, #181012 100%);
  border: 2px solid #6a0f19;
  border-radius: 8px;
  padding: 1rem;
}

.exp-label {
  text-align: center;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.exp-bar-container {
  position: relative;
  width: 100%;
  height: 1.5rem;
  background: #1a0f15;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #6a0f19;
}

.exp-bar {
  height: 100%;
  background: linear-gradient(90deg, #4caf50 0%, #2e7d32 100%);
  transition: width 0.3s ease;
}

.exp-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 4px #000;
  pointer-events: none;
}

/* Lifeskill Section */
.lifeskill-section {
  background: linear-gradient(180deg, #22171b 70%, #181012 100%);
  border: 2px solid #6a0f19;
  border-radius: 8px;
  padding: 1rem;
}

.lifeskill-exp-label {
  text-align: center;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.lifeskill-bar-container {
  position: relative;
  width: 100%;
  height: 1.5rem;
  background: #1a0f15;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #6a0f19;
}

.lifeskill-bar {
  height: 100%;
  background: linear-gradient(90deg, #9c27b0 0%, #6a1b9a 100%);
  transition: width 0.3s ease;
}

/* Inventory Tab Content */
.inventory-tab-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Sub-tabs Header */
.sub-tabs-header {
  display: flex;
  gap: 0.75rem;
  border-bottom: 2px solid #6a0f19;
  padding-bottom: 0.5rem;
}

.sub-tab-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(180deg, rgba(34, 23, 27, 0.5) 70%, rgba(24, 16, 18, 0.5) 100%);
  border: 2px solid #3a1c0e;
  border-radius: 8px 8px 0 0;
  color: #c9b8a0;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.sub-tab-btn:hover {
  background: linear-gradient(180deg, rgba(34, 23, 27, 0.7) 70%, rgba(24, 16, 18, 0.7) 100%);
  border-color: #6a0f19;
  color: #d4af37;
}

.sub-tab-btn.active {
  background: linear-gradient(135deg, #6a0f19 0%, #4a0a12 100%);
  border-color: #d4af37;
  color: #d4af37;
  font-weight: bold;
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.3);
}

/* Inventory Section */
.inventory-section {
  background-image: url('@/assets/inv_background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #6a0f19;
}

/* Materials Section */
.materials-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Materials Tabs Header */
.materials-tabs-header {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0;
}

.materials-tab-btn {
  flex: 1;
  padding: 0.6rem 1rem;
  background: linear-gradient(180deg, rgba(34, 23, 27, 0.9) 70%, rgba(24, 16, 18, 0.9) 100%);
  border: 2px solid #3a1c0e;
  border-radius: 8px;
  color: #c9b8a0;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.materials-tab-btn:hover {
  background: linear-gradient(180deg, rgba(34, 23, 27, 1) 70%, rgba(24, 16, 18, 1) 100%);
  border-color: #6a0f19;
  color: #d4af37;
  transform: translateY(-1px);
}

.materials-tab-btn.active {
  background: linear-gradient(135deg, #6a0f19 0%, #4a0a12 100%);
  border-color: #d4af37;
  color: #d4af37;
  font-weight: bold;
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.4);
}

/* Materials Grid */
.materials-grid {
  display: grid;
  grid-template-columns: repeat(6, 90px);
  gap: 0.7rem;
  margin-top: 0;
  width: auto;
  box-sizing: border-box;
  background-image: url('@/assets/inv_background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #6a0f19;
}

.material-grid-item {
  position: relative;
  width: 90px;
  height: 90px;
  background: linear-gradient(180deg, #22171b 70%, #181012 100%);
  border: 2px solid #2d161a;
  border-radius: 0.75rem;
  color: #e7d7b1;
  box-shadow: 0 2px 8px rgba(40, 10, 20, 0.3);
  font-family: 'Cinzel', serif;
  font-size: 1.05rem;
  transition: box-shadow 0.2s, border-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: visible;
  box-sizing: border-box;
  z-index: 1;
}

.material-grid-item:hover:not(.empty) {
  box-shadow: 0 0 0.625rem #6a0f19;
  border-color: #e7d7b1;
  z-index: 100;
}

.material-item-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.material-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.55rem;
  margin: 0;
  padding: 0;
  display: block;
}

.material-quantity-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #d4af37;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: bold;
  color: #ffe600;
  min-width: 20px;
  text-align: center;
}

.material-grid-tooltip {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #0d0508;
  color: #e7d7b1;
  border: 2px solid #6a0f19;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.8);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  white-space: nowrap;
  font-size: 0.9rem;
  pointer-events: none;
  margin-bottom: 0.5rem;
  z-index: 1000;
}

.material-item-wrapper:hover .material-grid-tooltip {
  display: block;
}

/* Floating Action Panel */
.floating-action-panel {
  position: fixed;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: linear-gradient(135deg, #1a1a22 80%, #2d1a1a 100%);
  border: 2px solid #7a3a3a;
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  transform: translate(-50%, 10px);
}

.action-btn {
  padding: 0.4rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #fff;
  white-space: nowrap;
}

.equip-btn {
  background: linear-gradient(135deg, #3a6b1f 0%, #2d5016 100%);
}

.equip-btn:hover {
  background: linear-gradient(135deg, #4a7b2f 0%, #3d6026 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(58, 107, 31, 0.4);
}

.sell-btn {
  background: linear-gradient(135deg, #7a5c30 0%, #5a4020 100%);
}

.sell-btn:hover {
  background: linear-gradient(135deg, #8a6c40 0%, #6a5030 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(122, 92, 48, 0.4);
}

/* Backend Toast */
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

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.modal-box {
  background: linear-gradient(135deg, #1a1a22 80%, #2d1a1a 100%);
  border: 2px solid #7a3a3a;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}

.modal-box h3 {
  color: #d4af37;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 1.5rem;
}

.modal-box p {
  color: #e0cfa9;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 1.1rem;
}

.warning-text {
  color: #ff6b6b;
  font-weight: bold;
  font-size: 1rem;
}

.modal-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.btn-cancel, .btn-confirm, .btn-danger {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: #4a4a4a;
  color: #fff;
}

.btn-cancel:hover {
  background: #5a5a5a;
  transform: translateY(-2px);
}

.btn-confirm {
  background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
  color: #1a1a22;
}

.btn-confirm:hover {
  background: linear-gradient(135deg, #e4bf47 0%, #c8a42f 100%);
  transform: translateY(-2px);
}

.btn-danger {
  background: linear-gradient(135deg, #d32f2f 0%, #a52222 100%);
  color: #fff;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #e33f3f 0%, #b53232 100%);
  transform: translateY(-2px);
}

/* Countdown Display */
.countdown-display {
  text-align: center;
  padding: 2rem 1rem;
}

.countdown-text {
  font-size: 1.1rem;
  color: #e0cfa9;
  margin-bottom: 1rem;
}

.countdown-timer {
  font-size: 3rem;
  font-weight: bold;
  color: #d4af37;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
  margin-bottom: 1.5rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #22171b;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #6a0f19;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #d4af37 0%, #b8941f 100%);
  transition: width 0.1s linear;
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
}

/* Responsive Design */
@media (max-width: 1400px) {
  .main-layout {
    grid-template-columns: 400px 1fr;
  }
}

@media (max-width: 1024px) {
  .main-layout {
    grid-template-columns: 1fr;
  }

  .stats-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .profile-container {
    margin-left: 0;
    padding: 1rem;
  }

  .equipment-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-title {
    font-size: 1.1rem;
  }

  .right-tab-btn {
    font-size: 1rem;
    padding: 0.75rem 1rem;
  }

  .materials-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 0.4rem;
  }

  .material-grid-item {
    width: 70px;
    height: 70px;
  }
}
</style>
