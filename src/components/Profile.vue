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
const activeTab = ref('gathering');
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
    if (response && response.ok) {
      const data = await response.json();
      profile.value = data || 0;
      inventory.value = data.inventory_items || 0;
      equippedItems.value = data.equipped_items || 0;
      current_hp.value = data.stats.current_hp || 0;
      enchantItems.value = data.inventory_enchant_items || {};
      gatheringItems.value = data.inventory_gathering_items || {};
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

function handleGatheringImageError(event) {
  event.target.src = new URL("../assets/gathering/default.png", import.meta.url).href;
}

function handleEnchantImageError(event) {
  event.target.src = new URL("../assets/stones/default.png", import.meta.url).href;
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
      showBackendMessage("Item equipped!", "success");
      selectedItem.value = null;
      selectedEquippedItem.value = null;
      showActionPanel.value = false;
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
    const response = await authFetch(`${API_BASE_URL}/inventory/${itemId}/`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      counter.value++;
      showButton.value = false;
      selectedItem.value = null;
      selectedEquippedItem.value = null;
      showActionPanel.value = false;
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

// Clear inventory confirmation
const showClearConfirm = ref(false);
const showSecondConfirm = ref(false);

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
}

async function clearInventory() {
  try {
    const response = await authFetch(`${API_BASE_URL}/clear_inventory/`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      showBackendMessage("Inventory cleared successfully!", "success");
      counter.value++;
      await fetchProfile();
    } else {
      const errData = await response.json();
      showBackendMessage(errData.detail || JSON.stringify(errData), "error");
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
  } finally {
    showSecondConfirm.value = false;
  }
}
</script>

<template>
  <div class="profile-container">
    <!-- Backend Toast Message -->
    <div v-if="backendMessage" :class="['backend-toast', backendMessageType]">
      {{ backendMessage }}
    </div>

    <!-- Main Grid Layout -->
    <div class="profile-grid">
      <!-- Column 1: Equipment -->
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
                :class="{ 'item-selected': selectedEquippedItem?.id === equippedByType[slot.type].id }"
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

      <!-- Column 2: Stats -->
      <div class="stats-section">
        <div class="stats-box">
          <h2 class="section-title">Character Stats</h2>
          <div class="stat-row">Level: {{ profile.level || 0 }}</div>
          <div v-if="profile.total_stats">
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
                <button class="stat-btn" @click="upgradeStat(key)">+</button>
              </span>
            </div>
          </div>
        </div>

        <div class="stats-box">
          <h2 class="section-title">Total Stats</h2>
          <div v-if="profile.total_stats">
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

        <!-- Experience bar -->
        <div class="experience-section">
          <div class="exp-label">Experience: {{ profile.experience }} / {{ profile.level * 40 || 0 }}</div>
          <div class="exp-bar-container">
            <div class="exp-bar" :style="{ width: `${(profile.experience / (profile.level * 40)) * 100}%` }"></div>
            <div class="exp-text">{{ Math.floor((profile.experience / (profile.level * 40)) * 100) }}%</div>
          </div>
        </div>

        <!-- Gold and trash -->
        <div class="gold-row">
          <span>Gold: {{ profile.gold }} 🟡</span>
          <span>Clear inventory</span>
          <span><button class="trash-btn" @click="openClearInventory" title="Clear Inventory">🗑️</button></span>
        </div>
      </div>

      <!-- Column 3: Inventory -->
      <div class="inventory-section">
        <h2 class="section-title">Inventory</h2>
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

        <!-- Materials Tabs Panel -->
        <div class="materials-panel">
          <div class="tabs-header">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'gathering' }"
              @click="activeTab = 'gathering'"
            >
              Gathering
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'enchant' }"
              @click="activeTab = 'enchant'"
            >
              Enchant
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'mining' }"
              @click="activeTab = 'mining'"
            >
              Mining
            </button>
          </div>

          <!-- Gathering Tab -->
          <div v-show="activeTab === 'gathering'" class="tab-content">
            <div class="materials-list">
              <div
                v-for="(quantity, itemName) in gatheringItems"
                :key="itemName"
                class="material-item tooltip-container"
              >
                <img
                  :src="generateGatheringImageName(itemName)"
                  :alt="itemName"
                  class="material-icon"
                  @error="handleGatheringImageError"
                />
                <span class="material-separator">:</span>
                <span class="material-quantity">{{ quantity }}</span>
                <div class="material-tooltip">{{ formatItemName(itemName) }}</div>
              </div>
            </div>
          </div>

          <!-- Enchant Tab -->
          <div v-show="activeTab === 'enchant'" class="tab-content">
            <div class="materials-list">
              <div
                v-for="(quantity, itemName) in enchantItems"
                :key="itemName"
                class="material-item tooltip-container"
              >
                <img
                  :src="generateEnchantImageName(itemName)"
                  :alt="itemName"
                  class="material-icon"
                  @error="handleEnchantImageError"
                />
                <span class="material-separator">:</span>
                <span class="material-quantity">{{ quantity }}</span>
                <div class="material-tooltip">Stone of {{ capitalize(itemName) }}</div>
              </div>
            </div>
          </div>

          <!-- Mining Tab -->
          <div v-show="activeTab === 'mining'" class="tab-content">
            <div class="materials-list">
              <div
                v-for="(quantity, itemName) in miningItems"
                :key="itemName"
                class="material-item tooltip-container"
              >
                <img
                  :src="generateGatheringImageName(itemName)"
                  :alt="itemName"
                  class="material-icon"
                  @error="handleGatheringImageError"
                />
                <span class="material-separator">:</span>
                <span class="material-quantity">{{ quantity }}</span>
                <div class="material-tooltip">{{ formatItemName(itemName) }}</div>
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
        <h3>Final Confirmation</h3>
        <p class="warning-text">⚠️ This will permanently delete ALL items in your inventory!</p>
        <p>Are you absolutely sure?</p>
        <div class="modal-buttons">
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

/* Grid Layout */
.profile-grid {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 2rem;
  align-items: start;
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
  min-width: 350px;
  background-image: url('@/assets/inv_background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #6a0f19;
}

.equipment-grid {
  display: grid;
  grid-template-areas:
    ". helmet ."
    "weapon armor gloves"
    ". pants ."
    ". boots .";
  gap: 1rem;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto auto auto auto;
}

.equipment-slot {
  background: linear-gradient(180deg, rgba(34, 23, 27, 0.85) 70%, rgba(24, 16, 18, 0.85) 100%);
  border: 2px solid #6a0f19;
  border-radius: 8px;
  padding: 0.25rem;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-wrapper {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 120px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-wrapper:hover {
  transform: scale(1.05);
}

.item-wrapper.item-selected {
  outline: 3px solid #d4af37;
  outline-offset: 2px;
  border-radius: 4px;
}

.item-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.empty-slot {
  color: #6a4a3a;
  font-size: 0.9rem;
  text-align: center;
}

.item-tooltip {
  display: none;
  position: absolute;
  z-index: 1000;
  left: 50%;
  top: -10px;
  transform: translate(-50%, -100%);
  background: #22171b;
  color: #e7d7b1;
  border: 1px solid #6a0f19;
  box-shadow: 0 2px 8px rgba(120, 10, 30, 0.3);
  padding: 0.75rem 1rem;
  min-width: 180px;
  border-radius: 4px;
  pointer-events: none;
}

.item-wrapper:hover .item-tooltip {
  display: block;
}

.tooltip-equipped {
  font-weight: bold;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.tooltip-name {
  font-weight: bold;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.tooltip-info {
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.tooltip-stats {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #b3e5fc;
}

/* Rarity Colors */
.rarity-common { color: #fff; }
.rarity-uncommon { color: #4caf50; }
.rarity-rare { color: #2196f3; }
.rarity-epic { color: #9c27b0; }
.rarity-legendary { color: #ff9800; }

/* Stats Section */
.stats-section {
  min-width: 300px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stats-box {
  background: linear-gradient(180deg, #22171b 70%, #181012 100%);
  border: 2px solid #6a0f19;
  border-radius: 8px;
  padding: 1rem;
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
}

.stat-row-upgrade:last-child {
  border-bottom: none;
}

.stat-label {
  flex: 1;
}

.stat-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.stat-btn:hover {
  background: #ffe600;
  color: #333;
  transform: scale(1.1);
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

/* Gold Row */
.gold-row {
  background: linear-gradient(180deg, #22171b 70%, #181012 100%);
  border: 2px solid #6a0f19;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trash-btn {
  background: transparent;
  border: 1px solid #7a3a3a;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.trash-btn:hover {
  background: #7a3a3a;
}

/* Inventory Section */
.inventory-section {
  min-width: 0;
}

/* Materials Panels */
.materials-panel {
  margin-top: 1.5rem;
  background: linear-gradient(180deg, #22171b 70%, #181012 100%);
  border: 2px solid #6a0f19;
  border-radius: 8px;
  padding: 0.75rem;
}

/* Tabs Header */
.tabs-header {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #6a0f19;
  padding-bottom: 0.5rem;
}

.tab-btn {
  flex: 1;
  padding: 0.4rem 0.75rem;
  background: linear-gradient(180deg, rgba(34, 23, 27, 0.5) 70%, rgba(24, 16, 18, 0.5) 100%);
  border: 1px solid #2d161a;
  border-radius: 6px;
  color: #c9b8a0;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: linear-gradient(180deg, rgba(34, 23, 27, 0.7) 70%, rgba(24, 16, 18, 0.7) 100%);
  border-color: #6a0f19;
}

.tab-btn.active {
  background: linear-gradient(135deg, #6a0f19 0%, #4a0a12 100%);
  border-color: #d4af37;
  color: #d4af37;
  font-weight: bold;
}

/* Tab Content */
.tab-content {
  min-height: 80px;
}

.materials-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.material-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: linear-gradient(180deg, rgba(34, 23, 27, 0.5) 70%, rgba(24, 16, 18, 0.5) 100%);
  border: 1.5px solid #2d161a;
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  transition: all 0.3s ease;
}

.material-item:hover {
  border-color: #d4af37;
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.3);
  transform: translateY(-2px);
}

.material-tooltip {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #22171b;
  color: #e7d7b1;
  border: 1px solid #6a0f19;
  box-shadow: 0 2px 8px rgba(120, 10, 30, 0.3);
  font-family: 'Cinzel', serif;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  white-space: nowrap;
  font-size: 0.85rem;
  pointer-events: none;
  margin-bottom: 0.25rem;
  z-index: 1000;
}

.material-item:hover .material-tooltip {
  display: block;
}

.material-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.material-separator {
  color: #6a4a3a;
  font-size: 1rem;
  font-weight: bold;
}

.material-quantity {
  font-size: 0.95rem;
  font-weight: bold;
  color: #ffe600;
  text-shadow: 0 1px 4px #000;
  min-width: 20px;
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

/* Responsive Design */
@media (max-width: 1400px) {
  .profile-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .equipment-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .stats-section {
    max-width: 100%;
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
}
</style>
