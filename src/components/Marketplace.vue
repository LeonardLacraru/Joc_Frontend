<script setup>
import { authFetch } from "../utils/authFetch.js";
import { ref, computed, onMounted } from "vue";
import "../assets/inventory.css";
import { useBackendMessage } from "../utils/useBackendMessage.js";

const { backendMessage, backendMessageType, showBackendMessage } = useBackendMessage();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const inventory = ref([]);
const loading = ref(true);
const SLOT_COUNT = 33;
const activeItemId = ref(null);
const marketplace = ref([]);
const listed_items = ref([]);
const prices = ref({});
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
  const unequipped = inventory.value
  // Fill up to SLOT_COUNT with nulls
  const slots = Array(SLOT_COUNT).fill(null);
  for (let i = 0; i < unequipped.length && i < SLOT_COUNT; i++) {
    slots[i] = unequipped[i];
  }
  return slots;
});

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
});

async function fetchInventory() {
  try {
    const response = await authFetch(`${API_BASE_URL}/profile/`);
    if (response && response.ok) {
      const data = await response.json();
      profile.value = data || {};
      inventory.value = data.inventory_items || 0;
      loading.value = false;
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

async function fetchMarketplace() {
  try {
    const response = await authFetch(`${API_BASE_URL}/marketplace/marketplace/`);
    if (response && response.ok) {
      const data = await response.json();
      marketplace.value = data || [];
      loading.value = false;
      console.log("Marketplace data fetched:", data);
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

async function confirmSell(itemId) {
  const itemPrice = prices.value[itemId];

  if (!itemPrice || itemPrice <= 0) {
    showBackendMessage("Set a valid price first!", "error");
    return;
  }

  try {
    const response = await authFetch(`${API_BASE_URL}/marketplace/${itemId}/sell/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: itemPrice }),
    });

    if (response.ok) {
      await fetchInventory();
      await GetListedItems();
      prices.value[itemId] = 0;
      activeItemId.value = null;
      showBackendMessage("Item listed for sale successfully!", "success");
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

async function BuyItem(itemId) {
  try {
    const response = await authFetch(`${API_BASE_URL}/marketplace/${itemId}/buy/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      await fetchInventory();
      await fetchMarketplace();
      activeItemId.value = null;
      showBackendMessage("Item purchased successfully!", "success");
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

async function GetListedItems() {
  try {
    const response = await authFetch(`${API_BASE_URL}/marketplace/get_listed_items/`);
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
    error.value = err.message;
    loading.value = false;
    return err.message;
  }
}

async function CancelSell(itemId) {
  try {
    const response = await authFetch(`${API_BASE_URL}/marketplace/${itemId}/cancel/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      await fetchInventory();
      await GetListedItems();
      activeItemId.value = null;
      showBackendMessage("Sale canceled successfully!", "success");
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
</script>

<template>
  <div class="screen-80">
    <div v-if="backendMessage" :class="['backend-toast', backendMessageType]">
      {{ backendMessage }}
    </div>
    <div class="mainInventory">
      <div class="top-section">
        <div class="left-panelMarket">
          <h2 class="tt-stats">Inventory</h2>
          <div class="tt-stats">Gold: {{ profile.gold }}🟡</div>
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
                  <button class="inventory-action-btn" @click="activeItemId = item.id">Sell</button>
                  <div v-if="activeItemId === item.id" style="margin-top: 6px;">
                    <input type="number" v-model.number="prices[item.id]" placeholder="Enter price"
                      style="width: 80px; padding: 4px; font-size: 0.8rem; border-radius: 0.3rem;" />
                    <button @click="confirmSell(item.id)"
                      style="margin-left: 5px; padding: 4px 8px; font-size: 0.8rem; border-radius: 0.3rem;">
                      Confirm
                    </button>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="item-icon" style="opacity: 0.2">Empty</div>
              </template>
            </div>
          </div>
        </div>
        <div class="right-panel">
          <h2 class="tt-stats">Listed Items</h2>
          <div class="inventory-grid">
            <div v-for="item in listed_items" class="inventory-item">
              <template v-if="item">
                <div class="tooltip-container">
                  <img :src="generateImageName(item.item.item.name, item.item.item.rarity)" :alt="item.name"
                    class="item-icon" @error="handleImageError" />
                  <div class="custom-tooltip">
                    <div class="tt-font-name" :class="`rarity-${item.item.item.rarity}`">
                      {{ item.item.item.name }}
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
                            ["crit_rate", "hit_rate", "lifesteal"].includes(stat.name)
                              ? stat.value + "%"
                              : stat.value
                          }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="tt-font">
                    Price: {{ item.price }}🟡
                  </div>
                  <button class="inventory-action-btn" @click="CancelSell(item.id)">Cancel</button>
                </div>
              </template>
              <template v-else>
                <div class="item-icon" style="opacity: 0.2">Empty</div>
              </template>
            </div>
          </div>
        </div>
      </div>
      <h2 class="tt-stats">Marketplace</h2>
      <div class="inventory-grid">
        <div v-for="item in marketplace" class="inventory-item">
          <template v-if="item">
            <div class="tooltip-container">
              <img :src="generateImageName(item.item.item.name, item.item.item.rarity)" :alt="item.name" class="item-icon"
                @error="handleImageError" />
              <div class="custom-tooltip">
                <div class="tt-font-name" :class="`rarity-${item.item.item.rarity}`">
                  {{ item.item.item.name }}
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
                        ["crit_rate", "hit_rate", "lifesteal"].includes(stat.name)
                          ? stat.value + "%"
                          : stat.value
                      }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="tt-font">
                Seller: {{ item.seller }}
              </div>
              <div class="tt-font">
                Price: {{ item.price }}🟡
              </div>
              <button class="inventory-action-btn" @click="BuyItem(item.id)">Buy</button>
            </div>
          </template>
          <template v-else>
            <div class="item-icon" style="opacity: 0.2">Empty</div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-sectionMarket {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4vw;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 1vw;
}

.left-panelMarket,
.right-panelMarket {
  flex: 1 1 350px;
  min-width: 280px;
  box-sizing: border-box;
  padding: 1vw;
  background: transparent;
  border-radius: 0.7rem;
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
</style>