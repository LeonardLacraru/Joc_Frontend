<script setup>
import { authFetch } from "../utils/authFetch.js";
import { ref, computed, onMounted } from "vue";
import Inventory from "./Inventory.vue";
import "../assets/inventory.css";
import { useBackendMessage } from "../utils/useBackendMessage.js";

const { backendMessage, backendMessageType, showBackendMessage } = useBackendMessage();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const inventory = ref([]);
const loading = ref(true);
const SLOT_COUNT = 30;
const selectedItem = ref(null);
const sellPriceInput = ref(0);
const showSellPanel = ref(false);
const sellPanelPosition = ref({ x: 0, y: 0 });
const marketplace = ref([]);
const listed_items = ref([]);
const profile = ref({});
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

const gridInventory = computed(() => {
  // Only include unequipped items
  const unequipped = inventory.value;
  // Fill up to SLOT_COUNT with nulls
  const slots = Array(SLOT_COUNT).fill(null);
  for (let i = 0; i < unequipped.length && i < SLOT_COUNT; i++) {
    slots[i] = unequipped[i];
  }
  return slots;
});

function handleInventoryItemClick(item, event) {
  if (selectedItem.value?.id === item.id) {
    selectedItem.value = null;
    showSellPanel.value = false;
  } else {
    selectedItem.value = item;
    sellPriceInput.value = 0;
    sellPanelPosition.value = {
      x: event.clientX,
      y: event.clientY
    };
    showSellPanel.value = true;
  }
}

function handleClickOutside(event) {
  const panel = document.querySelector('.sell-price-panel');
  const clickedItem = event.target.closest('.tooltip-container');

  if (panel && !panel.contains(event.target) && !clickedItem) {
    showSellPanel.value = false;
    selectedItem.value = null;
    sellPriceInput.value = 0;
  }
}

function generateImageName(itemName) {
  if (!itemName)
    return new URL("@/assets/items/default-item-icon.png", import.meta.url)
      .href;
  const nameParts = itemName.split(" ");
  const fileName = nameParts[0].toLowerCase() + ".png";
  return new URL(`../assets/items/${fileName}`, import.meta.url).href;
}

function handleImageError(event) {
  event.target.src = new URL('../assets/items/image.png', import.meta.url).href;
}

onMounted(async () => {
  await fetchInventory();
  await fetchMarketplace();
  await GetListedItems();
  document.addEventListener('click', handleClickOutside);
});

function onUnmounted() {
  document.removeEventListener('click', handleClickOutside);
}

async function fetchInventory() {
  try {
    const response = await authFetch(`${API_BASE_URL}/profile/`);
    if (!response) {
      return;
    }
    if (response.ok) {
      const data = await response.json();
      profile.value = data || {};
      inventory.value = data.inventory_items || [];
      loading.value = false;
      return null;
    } else {
      const errData = await response.json();
      showBackendMessage(errData.detail || JSON.stringify(errData), "error");
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
    loading.value = false;
    return err.message;
  }
}

async function fetchMarketplace() {
  try {
    const response = await authFetch(`${API_BASE_URL}/marketplace/marketplace/`);
    if (!response) {
      return;
    }
    if (response.ok) {
      const data = await response.json();
      marketplace.value = data || [];
      loading.value = false;
      return null;
    } else {
      const errData = await response.json();
      showBackendMessage(errData.detail || JSON.stringify(errData), "error");
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
    loading.value = false;
    return err.message;
  }
}

async function confirmSell() {
  if (!selectedItem.value) {
    return;
  }

  if (!sellPriceInput.value || sellPriceInput.value <= 0) {
    showBackendMessage("Set a valid price first!", "error");
    return;
  }

  try {
    const response = await authFetch(`${API_BASE_URL}/marketplace/${selectedItem.value.id}/sell/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: sellPriceInput.value }),
    });

    if (!response) {
      return;
    }

    if (response.ok) {
      await fetchInventory();
      await GetListedItems();
      sellPriceInput.value = 0;
      selectedItem.value = null;
      showSellPanel.value = false;
      showBackendMessage("Item listed for sale successfully!", "success");
    } else {
      const errData = await response.json();
      showBackendMessage(errData.detail || JSON.stringify(errData), "error");
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
    return err.message;
  }
}

async function BuyItem(itemId) {
  try {
    const response = await authFetch(`${API_BASE_URL}/marketplace/${itemId}/buy/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response) {
      return;
    }

    if (response.ok) {
      await fetchInventory();
      await fetchMarketplace();
      showBackendMessage("Item purchased successfully!", "success");
    } else {
      const errData = await response.json();
      showBackendMessage(errData.detail || JSON.stringify(errData), "error");
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
    return err.message;
  }
}

async function GetListedItems() {
  try {
    const response = await authFetch(`${API_BASE_URL}/marketplace/get_listed_items/`);
    if (!response) {
      return;
    }
    if (response.ok) {
      const data = await response.json();
      listed_items.value = data || [];
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

async function CancelSell(itemId) {
  try {
    const response = await authFetch(`${API_BASE_URL}/marketplace/${itemId}/cancel/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response) {
      return;
    }

    if (response.ok) {
      await fetchInventory();
      await GetListedItems();
      showBackendMessage("Sale canceled successfully!", "success");
    } else {
      const errData = await response.json();
      showBackendMessage(errData.detail || JSON.stringify(errData), "error");
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
    return err.message;
  }
}
</script>

<template>
  <div class="marketplace-container">
    <div v-if="backendMessage" :class="['backend-toast', backendMessageType]">
      {{ backendMessage }}
    </div>

    <div class="top-section">
      <!-- Player Inventory Section -->
      <div class="inventory-section">
        <h2 class="section-title">Your Inventory</h2>
        <div class="gold-display">Gold: {{ profile.gold }}🟡</div>
        <Inventory
          :items="gridInventory"
          :loading="loading"
          :selectedItem="selectedItem"
          @select-item="handleInventoryItemClick"
        />
      </div>

      <!-- Listed Items Section -->
      <div class="listed-section">
        <h2 class="section-title">Your Listed Items</h2>
        <div class="listed-items-container">
          <div
            v-for="item in listed_items"
            :key="item.id"
            class="market-item-card"
          >
            <div class="item-image-wrapper" :class="`rarity-border-${item.item.item.rarity}`">
              <img
                :src="generateImageName(item.item.item.name)"
                :alt="item.item.item.name"
                class="market-item-image"
                @error="handleImageError"
              />
              <div class="custom-tooltip">
                <div class="tt-font-name" :class="`rarity-${item.item.item.rarity}`">
                  {{ item.item.item.name }} +{{ item.item.item.enchant_level }}
                </div>
                <div class="tt-font">
                  Required Level: {{ item.item.item.required_level }}
                </div>
                <div class="tt-stats" v-if="item.item.item.stats && item.item.item.stats.length">
                  Stats:
                  <div v-for="(stat, sidx) in item.item.item.stats" :key="sidx" class="tt-stat">
                    {{ statLabels[stat.name] || stat.name }}:
                    <span>
                      {{
                        ["crit_rate", "hit_rate", "lifesteal", "crit_dmg"].includes(stat.name)
                          ? stat.value.toFixed(2) + "%"
                          : stat.value.toFixed(2)
                      }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="item-info-wrapper">
              <div class="item-price-large">{{ item.price }}🟡</div>
              <button class="market-action-btn cancel-btn" @click="CancelSell(item.id)">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Sell Price Panel -->
    <div
      v-if="showSellPanel && selectedItem"
      class="sell-price-panel"
      :style="{ left: sellPanelPosition.x + 'px', top: sellPanelPosition.y + 'px' }"
      @click.stop
    >
      <h4 class="panel-title">Set Sale Price</h4>
      <div class="price-input-wrapper">
        <input
          v-model.number="sellPriceInput"
          type="number"
          min="1"
          placeholder="Enter price"
          class="price-input"
          @keyup.enter="confirmSell"
        />
        <span class="gold-icon">🟡</span>
      </div>
      <div class="panel-actions">
        <button class="btn-cancel" @click="showSellPanel = false; selectedItem = null">
          Cancel
        </button>
        <button class="btn-confirm" @click="confirmSell">
          List Item
        </button>
      </div>
    </div>

    <!-- Marketplace Section -->
    <div class="marketplace-section">
      <h2 class="section-title">Marketplace</h2>
      <div class="marketplace-items-container">
        <div
          v-for="item in marketplace"
          :key="item.id"
          class="market-item-card"
        >
          <div class="item-image-wrapper" :class="`rarity-border-${item.item.item.rarity}`">
            <img
              :src="generateImageName(item.item.item.name)"
              :alt="item.item.item.name"
              class="market-item-image"
              @error="handleImageError"
            />
            <div class="custom-tooltip">
              <div class="tt-font-name" :class="`rarity-${item.item.item.rarity}`">
                {{ item.item.item.name }} +{{ item.item.item.enchant_level }}
              </div>
              <div class="tt-font">
                Required Level: {{ item.item.item.required_level }}
              </div>
              <div class="tt-stats" v-if="item.item.item.stats && item.item.item.stats.length">
                Stats:
                <div v-for="(stat, sidx) in item.item.item.stats" :key="sidx" class="tt-stat">
                  {{ statLabels[stat.name] || stat.name }}:
                  <span>
                    {{
                      ["crit_rate", "hit_rate", "lifesteal", "crit_dmg"].includes(stat.name)
                        ? stat.value.toFixed(2) + "%"
                        : stat.value.toFixed(2)
                    }}
                  </span>
                </div>
              </div>
              <div class="tt-font seller-info">
                Seller: {{ item.seller }}
              </div>
            </div>
          </div>
          <div class="item-info-wrapper">
            <div class="item-price-large">{{ item.price }}🟡</div>
            <button class="market-action-btn buy-btn" @click="BuyItem(item.id)">
              Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.marketplace-container {
  padding: 1rem;
  max-width: 1800px;
  margin: 0 auto;
  color: #e7d7b1;
  font-family: 'Cinzel', serif;
}

.section-title {
  font-size: 1.4rem;
  color: #d4af37;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: bold;
}

.top-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.inventory-section,
.listed-section {
  background-image: url('@/assets/inv_background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #6a0f19;
}

.gold-display {
  text-align: center;
  font-size: 1.2rem;
  color: #d4af37;
  margin-bottom: 1rem;
  font-weight: bold;
}

.marketplace-section {
  background-image: url('@/assets/inv_background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #6a0f19;
  margin-top: 2rem;
}

/* Listed Items and Marketplace Card Layout */
.listed-items-container,
.marketplace-items-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.market-item-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(180deg, rgba(34, 23, 27, 0.85) 70%, rgba(24, 16, 18, 0.85) 100%);
  border: 2px solid #6a0f19;
  border-radius: 8px;
  padding: 0.75rem;
  transition: all 0.3s ease;
}

.market-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.item-image-wrapper {
  position: relative;
  width: 90px;
  height: 90px;
  flex-shrink: 0;
  border-radius: 8px;
  padding: 0.25rem;
  overflow: visible;
  background: linear-gradient(180deg, #22171b 70%, #181012 100%);
  border: 2.5px solid transparent;
  box-sizing: border-box;
}

.item-image-wrapper:hover {
  z-index: 100;
}

/* Rarity border colors */
.item-image-wrapper.rarity-border-common {
  border-color: #fff;
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.2);
}

.item-image-wrapper.rarity-border-uncommon {
  border-color: #4caf50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
}

.item-image-wrapper.rarity-border-rare {
  border-color: #2196f3;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.4);
}

.item-image-wrapper.rarity-border-epic {
  border-color: #9c27b0;
  box-shadow: 0 2px 8px rgba(156, 39, 176, 0.4);
}

.item-image-wrapper.rarity-border-legendary {
  border-color: #ff9800;
  box-shadow: 0 2px 10px rgba(255, 152, 0, 0.5);
}

.market-item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 5px;
}

/* Tooltip for market items */
.item-image-wrapper .custom-tooltip {
  display: none;
  position: absolute;
  z-index: 99999;
  left: 100%;
  top: 50%;
  margin-left: 10px;
  transform: translateY(-70%);
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

.item-image-wrapper:hover .custom-tooltip {
  display: block;
}

/* Adjust tooltip for listed items to prevent going off-screen at top */
.listed-section .item-image-wrapper .custom-tooltip {
  transform: translateY(-50%);
  max-height: 300px;
  overflow-y: auto;
}

.item-info-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
}

.item-price-large {
  font-size: 1.3rem;
  font-weight: bold;
  color: #ffe600;
  text-shadow: 0 2px 6px #000;
  text-align: center;
}

.market-action-btn {
  width: 100%;
  max-width: 120px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
}

.buy-btn {
  background: linear-gradient(135deg, #3a6b1f 0%, #2d5016 100%);
  color: #fff;
}

.buy-btn:hover {
  background: linear-gradient(135deg, #4a7b2f 0%, #3d6026 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(58, 107, 31, 0.4);
}

.cancel-btn {
  background: linear-gradient(135deg, #7a3a3a 0%, #5a2a2a 100%);
  color: #fff;
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #8a4a4a 0%, #6a3a3a 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(122, 58, 58, 0.4);
}

.seller-info {
  margin-top: 0.5rem;
  color: #c9b8a0;
  font-style: italic;
}

/* Floating Sell Price Panel */
.sell-price-panel {
  position: fixed;
  z-index: 10000;
  background: linear-gradient(135deg, #1a1a22 80%, #2d1a1a 100%);
  border: 2px solid #7a3a3a;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  transform: translate(-50%, 10px);
  min-width: 250px;
}

.panel-title {
  font-size: 1.1rem;
  color: #d4af37;
  margin-bottom: 0.75rem;
  text-align: center;
}

.price-input-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.price-input {
  width: 100%;
  padding: 0.6rem 2.5rem 0.6rem 0.75rem;
  font-size: 1rem;
  background: #2b2b2b;
  color: #fff;
  border: 2px solid #4a3c2e;
  border-radius: 6px;
  font-family: 'Cinzel', serif;
}

.price-input:focus {
  outline: none;
  border-color: #d4af37;
  box-shadow: 0 0 0 0.2rem rgba(212, 175, 55, 0.25);
}

.gold-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.2rem;
}

.panel-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 0.5rem;
  font-size: 0.9rem;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
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

@media (max-width: 1200px) {
  .top-section {
    grid-template-columns: 1fr;
  }

  .listed-items-container,
  .marketplace-items-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .market-item-card {
    flex-direction: column;
    text-align: center;
  }

  .item-info-wrapper {
    width: 100%;
  }

  .market-action-btn {
    max-width: 100%;
  }
}
</style>