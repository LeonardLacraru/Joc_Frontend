<script setup>
import { ref, computed, onMounted } from "vue";
import { authFetch } from "../utils/authFetch.js";
import "../assets/inventory.css";
import Inventory from "./Inventory.vue";
import { useBackendMessage } from "../utils/useBackendMessage.js";

const { backendMessage, backendMessageType, showBackendMessage } = useBackendMessage();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const enchanting = ref(false);
const selectedItem = ref(null);
const enchantResources = ref(null);
const loadingEnchant = ref(false);
const profile = ref([]);
const inventory = ref([]);
const equippedItems = ref([]);
const loading = ref(true);
const error = ref(null);
const stoneLabels = {
  apprentice: "Stone of Apprentice",
  growth: "Stone of Growth",
  essence: "Stone of Essence",
  legends: "Stone of Legends",
};

onMounted(async () => {
  await fetchProfile();
});

async function fetchProfile() {
  try {
    const response = await authFetch(`${API_BASE_URL}/profile/`);
    if (response && response.ok) {
      const data = await response.json();
      profile.value = data || 0;
      inventory.value = data.inventory_items || "nimic";
      equippedItems.value = data.equipped_items || 0;
      loading.value = false;
      console.log("Profile data fetched successfully:", profile.value);
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

async function handleEnchant() {
  if (!selectedItem.value?.id) return;
  enchanting.value = true;
  try {
    const response = await authFetch(
      `${API_BASE_URL}/town/blacksmith/enchant_item/${selectedItem.value.id}/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (response.ok) {
      showBackendMessage("Item enchanted!", "success");
      await handleSelectItem(selectedItem.value);
    } else {
      const errData = await response.json();
      showBackendMessage(errData.detail || JSON.stringify(errData), "error");
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
  } finally {
    enchanting.value = false;
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
  event.target.src = new URL("../assets/items/image.png", import.meta.url).href;
}

function generateStoneName(stoneName) {
  if (!stoneName)
    return new URL("@/assets/stones/default-item-icon.png", import.meta.url)
      .href;
  return new URL(
    `../assets/stones/${stoneName.toLowerCase()}.png`,
    import.meta.url
  ).href;
}

async function handleSelectItem(item) {
  selectedItem.value = item;
  enchantResources.value = null;
  if (!item?.id) return;
  loadingEnchant.value = true;
  try {
    const response = await authFetch(
      `${API_BASE_URL}/town/blacksmith/enchant_item/${item.id}`
    );
    if (response.ok) {
      enchantResources.value = await response.json();
    } else {
      const errData = await response.json();
      showBackendMessage(errData.detail || JSON.stringify(errData), "error");
    }
  } catch (err) {
    showBackendMessage(err.message, "error");
  } finally {
    loadingEnchant.value = false;
  }
}

const filteredEnchantResources = computed(() =>
  enchantResources.value
    ? Object.entries(enchantResources.value).filter(
        ([key, val]) => val != 0 && key !== "target_level" && key !== "id"
      )
    : []
);
</script>

<template>
  <div class="section-80 mainInventory">
    <div>
    <div class="merchant-header">
      <span class="merchant-title">
        Blacksmith
      </span>
    </div>
        <div class="merchant-info-section">
      <div class="merchant-portrait">
        <img src="@/assets/blacksmith.jpg" alt="Merchant" />
      </div>
      <div class="merchant-info-text">
        <div class="merchant-greeting">
          Negustorul te primește...
        </div>
        <div class="merchant-description">
          Bine ai venit în modestul meu magazin. Cu ce te pot ajuta? Pot să-ți ofer câteva arme și obiecte folositoare, care îți vor îmbunătăți abilitățile! Te rog să alegi:
        </div>
      </div>
    </div>
    </div>
  <div>
    <Inventory @select-item="handleSelectItem" />
    <div v-if="selectedItem" class="selected-item-info dark-fantasy-box">
      <div class="selected-item-header">
        <img
          :src="generateImageName(selectedItem.item.name)"
          :alt="selectedItem.item.name"
          class="selected-item-img"
          @error="handleImageError"
        />
        <div class="selected-item-details">
          <div class="selected-item-title">
            {{ selectedItem.item.name
            }}<span v-if="enchantResources && enchantResources.target_level">
              + {{ enchantResources.target_level }}</span
            >
          </div>
          <div class="selected-item-level">
            Level: {{ selectedItem.item.required_level }}
          </div>
          <div class="selected-item-rarity">
            Rarity: {{ selectedItem.item.rarity }}
          </div>
        </div>
      </div>
      <div v-if="loadingEnchant" class="enchant-loading">
        Loading enchant resources...
      </div>
      <div v-else-if="enchantResources">
        <div class="enchant-resources-title">Resources needed for enchant:</div>
        <ul class="enchant-resources-list">
          <li v-for="[key, val] in filteredEnchantResources" :key="key">
            <span class="enchant-resource-key">{{ key }}</span
            >: <span class="enchant-resource-val">{{ val }}</span>
          </li>
        </ul>
        <button
          @click="handleEnchant"
          :disabled="enchanting || loadingEnchant"
          class="enchant-btn"
        >
          <span v-if="enchanting">Enchanting...</span>
          <span v-else>Enchant</span>
        </button>
        <div>
          Gold: {{ profile.gold }} 🟡
        </div>
        <div>
        <span v-for="(qty, stone, idx) in profile.inventory_enchant_items" :key="stone">
          {{ stoneLabels[stone] }}: {{ qty }}<span v-if="idx < Object.keys(profile.inventory_enchant_items).length - 1">, </span>
        </span>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<style scoped>
.screen-80 {
    width: 80vw;
    min-height: 10vh;
    max-height: 80vh;
    margin: auto;
    display: flex;
    flex-direction: column;
    background-color: #181012;
    /* very dark, almost black */
    overflow-y: auto;
}

.dark-fantasy-box {
  margin-bottom: 24px;
  border: 2px solid #3a1c0e;
  padding: 20px 28px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1a1a22 80%, #2d1a1a 100%);
  color: #e0cba8;
  box-shadow: 0 0 16px 2px #2d1a1a99, 0 2px 8px #000a;
  font-family: "Cinzel", "Merriweather", serif;
}
.selected-item-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 10px;
}
.selected-item-img {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  border: 2px solid #7c4d1e;
  background: #222;
  box-shadow: 0 0 8px #7c4d1e88;
}
.selected-item-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.selected-item-title {
  font-weight: bold;
  font-size: 1.3em;
  color: #ffdf8e;
  text-shadow: 0 2px 8px #7c4d1e88;
}
.selected-item-level,
.selected-item-rarity {
  font-size: 1em;
  color: #bfae8e;
}
.enchant-loading {
  margin-top: 14px;
  color: #e0cba8;
  font-style: italic;
}
.enchant-resources-title {
  margin-top: 16px;
  font-weight: bold;
  color: #ffdf8e;
  letter-spacing: 1px;
}
.enchant-resources-list {
  margin: 10px 0 18px 0;
  padding-left: 18px;
}
.enchant-resource-key {
  color: #e0cba8;
  font-weight: 600;
  text-shadow: 0 1px 4px #7c4d1e44;
}
.enchant-resource-val {
  color: #ffdf8e;
  font-weight: 700;
}
.enchant-btn {
  margin-top: 10px;
  padding: 10px 32px;
  font-size: 1.1em;
  background: linear-gradient(90deg, #7c4d1e 40%, #bfae8e 100%);
  color: #1a1a22;
  border: none;
  border-radius: 6px;
  font-family: "Cinzel", serif;
  font-weight: bold;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px #7c4d1e55;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.enchant-btn:disabled {
  background: #444;
  color: #bfae8e;
  cursor: not-allowed;
  opacity: 0.7;
}

.merchant-container {
  background: #2a181a;
  border: 2px solid #4a2323;
  border-radius: 8px;
  max-width: 700px;
  margin: 32px auto;
  font-family: 'Cinzel', serif;
  color: #e0cfa9;
  box-shadow: 0 0 24px #000a;
  padding-bottom: 24px;
}
.merchant-header, .goods-header {
  background: #1a1012;
  border-bottom: 1px solid #4a2323;
  padding: 10px 18px;
  font-size: 1.2em;
  font-weight: bold;
  color: #ffe600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.merchant-info-section {
  display: flex;
  background: #1a1012;
  padding: 18px;
  border-bottom: 1px solid #4a2323;
}
.merchant-portrait img {
  width: 210px;
  height: 210px;
  border-radius: 6px;
  border: 2px solid #4a2323;
  background: #181012;
  margin-right: 18px;
  object-fit: cover;
}
.merchant-info-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}
.merchant-greeting {
  font-size: 1.1em;
  color: #ffe600;
  font-weight: bold;
}
.merchant-name {
  color: #fff;
  font-weight: bold;
}
.merchant-description {
  font-size: 1em;
  color: #e0cfa9;
}
.merchant-inventory-info {
  font-size: 0.98em;
  color: #bfae8e;
}
.highlight {
  color: #ffe600;
  font-weight: bold;
}
.goods-section {
  background: #2a181a;
  padding: 18px;
  border-radius: 0 0 8px 8px;
}
.goods-header {
  margin-bottom: 8px;
}
.goods-filters {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.goods-filter-btn {
  background: #3a1818;
  color: #e0cfa9;
  border: 1px solid #4a2323;
  border-radius: 4px;
  padding: 5px 14px;
  font-size: 1em;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.goods-filter-btn.active,
.goods-filter-btn:hover {
  background: #ffe600;
  color: #2a181a;
  border-color: #ffe600;
}
.goods-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.level-input {
  width: 36px;
  background: #181012;
  color: #ffe600;
  border: 1px solid #4a2323;
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 1em;
}
.goods-dropdown {
  background: #181012;
  color: #e0cfa9;
  border: 1px solid #4a2323;
  border-radius: 3px;
  padding: 2px 8px;
  font-size: 1em;
}
.goods-view-label {
  margin-top: 10px;
  font-size: 1em;
  color: #bfae8e;
  font-style: italic;
}
</style>
