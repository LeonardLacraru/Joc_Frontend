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
const showEnchantModal = ref(false);
const enchantModalMessage = ref('');
const enchantModalType = ref(''); // 'success' or 'failed'
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
      const data = await response.json();
      // Check if enchant succeeded based on backend response
      if (data.success) {
        enchantModalMessage.value = data.success;
        enchantModalType.value = 'success';
      } else if (data.failed) {
        enchantModalMessage.value = data.failed;
        enchantModalType.value = 'failed';
      } else {
        // Fallback for other response formats
        enchantModalMessage.value = "Enchant succeeded!";
        enchantModalType.value = 'success';
      }

      // Show modal
      showEnchantModal.value = true;

      // Hide modal after 1 second
      setTimeout(() => {
        showEnchantModal.value = false;
      }, 1000);

      // Refresh profile to update enchant materials (gold, stones, etc.)
      await fetchProfile();
      // Refresh enchant resources for the selected item
      await handleSelectItem(selectedItem.value);
    } else {
      const errData = await response.json();
      enchantModalMessage.value = errData.failed || "Enchant failed!";
      enchantModalType.value = 'failed';
      showEnchantModal.value = true;
      setTimeout(() => {
        showEnchantModal.value = false;
      }, 1000);

      // Still refresh profile and resources even on failure to show updated materials
      await fetchProfile();
      await handleSelectItem(selectedItem.value);
    }
  } catch (err) {
    enchantModalMessage.value = "Enchant failed!";
    enchantModalType.value = 'failed';
    showEnchantModal.value = true;
    setTimeout(() => {
      showEnchantModal.value = false;
    }, 1000);
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

const hasEnoughMaterials = computed(() => {
  if (!enchantResources.value || !profile.value) return false;

  // Check gold
  if (enchantResources.value.gold && profile.value.gold < enchantResources.value.gold) {
    return false;
  }

  // Check apprentice stones
  if (enchantResources.value.quantity_apprentice &&
      (profile.value.inventory_enchant_items?.apprentice || 0) < enchantResources.value.quantity_apprentice) {
    return false;
  }

  // Check growth stones
  if (enchantResources.value.quantity_growth &&
      (profile.value.inventory_enchant_items?.growth || 0) < enchantResources.value.quantity_growth) {
    return false;
  }

  // Check essence stones
  if (enchantResources.value.quantity_essence &&
      (profile.value.inventory_enchant_items?.essence || 0) < enchantResources.value.quantity_essence) {
    return false;
  }

  // Check legends stones
  if (enchantResources.value.quantity_legends &&
      (profile.value.inventory_enchant_items?.legends || 0) < enchantResources.value.quantity_legends) {
    return false;
  }

  return true;
});
</script>

<template>
  <div class="container">
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
          The Blacksmith greets you...
        </div>
        <div class="merchant-description">
          Welcome to my forge! I can enhance your weapons and armor to make them more powerful. Select an item from your inventory to see the enchantment requirements.
        </div>
      </div>
    </div>
    </div>
  <div class="inventory-enchant-wrapper">
    <Inventory :items="inventory" @select-item="handleSelectItem" />
    <div v-if="selectedItem" class="selected-item-container">
      <div class="enchant-panel-unified dark-fantasy-box">
        <!-- Item Info Section -->
        <div class="selected-item-header">
          <img
            :src="generateImageName(selectedItem.item.name)"
            :alt="selectedItem.item.name"
            class="selected-item-img"
            :class="`rarity-border-${selectedItem.item.rarity}`"
            @error="handleImageError"
          />
          <div class="selected-item-details">
            <div class="selected-item-title" :class="`rarity-${selectedItem.item.rarity}`">
              {{ selectedItem.item.name
              }}<span v-if="enchantResources">
                +{{ selectedItem.item.enchant_level + 1 }}</span
              >
            </div>
            <div class="selected-item-level">
              Level: {{ selectedItem.item.required_level }}
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loadingEnchant" class="enchant-loading">Loading...</div>

        <!-- Max Enchant Level Reached -->
        <div v-else-if="selectedItem.item.enchant_level >= 7" class="max-enchant-message">
          <div class="max-enchant-title">Maximum Enchant Level Reached!</div>
          <div class="max-enchant-text">This item has reached the maximum enchantment level and cannot be enchanted further.</div>
        </div>

        <!-- Enchant Resources Section -->
        <div v-else-if="enchantResources" class="enchant-resources-section">
          <div class="enchant-resources-title">Resources:</div>

          <!-- Gold Requirement -->
          <div v-if="enchantResources.gold" class="resource-item">
            <span class="resource-label">Gold</span>
            <div class="resource-values">
              <span class="current-value">{{ profile.gold }}</span>
              <span class="separator">/</span>
              <span class="required-value" :class="{ 'insufficient': profile.gold < enchantResources.gold }">{{ enchantResources.gold }}</span>
              <span class="gold-icon">🟡</span>
            </div>
          </div>

          <!-- Stone Requirements -->
          <div v-if="enchantResources.quantity_apprentice" class="resource-item">
            <span class="resource-label">Apprentice</span>
            <div class="resource-values">
              <span class="current-value">{{ profile.inventory_enchant_items?.apprentice || 0 }}</span>
              <span class="separator">/</span>
              <span class="required-value" :class="{ 'insufficient': (profile.inventory_enchant_items?.apprentice || 0) < enchantResources.quantity_apprentice }">{{ enchantResources.quantity_apprentice }}</span>
            </div>
          </div>

          <div v-if="enchantResources.quantity_growth" class="resource-item">
            <span class="resource-label">Growth</span>
            <div class="resource-values">
              <span class="current-value">{{ profile.inventory_enchant_items?.growth || 0 }}</span>
              <span class="separator">/</span>
              <span class="required-value" :class="{ 'insufficient': (profile.inventory_enchant_items?.growth || 0) < enchantResources.quantity_growth }">{{ enchantResources.quantity_growth }}</span>
            </div>
          </div>

          <div v-if="enchantResources.quantity_essence" class="resource-item">
            <span class="resource-label">Essence</span>
            <div class="resource-values">
              <span class="current-value">{{ profile.inventory_enchant_items?.essence || 0 }}</span>
              <span class="separator">/</span>
              <span class="required-value" :class="{ 'insufficient': (profile.inventory_enchant_items?.essence || 0) < enchantResources.quantity_essence }">{{ enchantResources.quantity_essence }}</span>
            </div>
          </div>

          <div v-if="enchantResources.quantity_legends" class="resource-item">
            <span class="resource-label">Legends</span>
            <div class="resource-values">
              <span class="current-value">{{ profile.inventory_enchant_items?.legends || 0 }}</span>
              <span class="separator">/</span>
              <span class="required-value" :class="{ 'insufficient': (profile.inventory_enchant_items?.legends || 0) < enchantResources.quantity_legends }">{{ enchantResources.quantity_legends }}</span>
            </div>
          </div>

          <!-- Enchant Button -->
          <button
            @click="handleEnchant"
            :disabled="enchanting || loadingEnchant || !hasEnoughMaterials"
            class="enchant-btn"
          >
            <span v-if="enchanting">Enchanting...</span>
            <span v-else-if="!hasEnoughMaterials">Insufficient Materials</span>
            <span v-else>Enchant</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Enchant Result Modal -->
  <div v-if="showEnchantModal" class="enchant-modal-overlay">
    <div class="enchant-modal" :class="enchantModalType">
      <div class="enchant-modal-message">{{ enchantModalMessage }}</div>
    </div>
  </div>
  </div>
</template>

<style scoped>
/* Main container border styling */
.container {
    border: 3px solid #c62828;
    border-radius: 16px;
    box-shadow: 0 0 30px rgba(198, 40, 40, 0.4), inset 0 0 40px rgba(198, 40, 40, 0.08);
}

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

/* Wrapper for inventory and enchant panel side-by-side */
.inventory-enchant-wrapper {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  background-image: url('@/assets/inv_background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 2rem;
  border-radius: 12px;
  border: 2px solid #6a0f19;
  margin: 1rem 0;
}

/* Container for unified panel layout */
.selected-item-container {
  flex: 0 0 auto;
  min-width: 350px;
  max-width: 450px;
  margin-top: 0;
}

.dark-fantasy-box {
  border: 2px solid #3a1c0e;
  padding: 16px 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1a1a22 80%, #2d1a1a 100%);
  color: #e0cba8;
  box-shadow: 0 0 16px 2px #2d1a1a99, 0 2px 8px #000a;
  font-family: "Cinzel", "Merriweather", serif;
}

.enchant-panel-unified {
  max-width: 500px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.enchant-resources-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  border: 3px solid #7c4d1e;
  background: #222;
  box-shadow: 0 0 8px #7c4d1e88;
}

/* Rarity border colors for item image */
.rarity-border-common {
  border-color: #fff !important;
  box-shadow: 0 0 8px #ffffff88 !important;
}

.rarity-border-uncommon {
  border-color: #4caf50 !important;
  box-shadow: 0 0 8px #4caf5088 !important;
}

.rarity-border-rare {
  border-color: #2196f3 !important;
  box-shadow: 0 0 8px #2196f388 !important;
}

.rarity-border-epic {
  border-color: #9c27b0 !important;
  box-shadow: 0 0 8px #9c27b088 !important;
}

.rarity-border-legendary {
  border-color: #ff9800 !important;
  box-shadow: 0 0 8px #ff980088 !important;
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

.max-enchant-message {
  margin-top: 8px;
  padding: 16px;
  background: rgba(255, 152, 0, 0.1);
  border: 2px solid #ff9800;
  border-radius: 8px;
  text-align: center;
}

.max-enchant-title {
  font-weight: bold;
  font-size: 1.1em;
  color: #ff9800;
  margin-bottom: 8px;
  text-shadow: 0 0 8px #ff980088;
}

.max-enchant-text {
  color: #e0cba8;
  font-size: 0.95em;
  line-height: 1.4;
}
.enchant-resources-title {
  margin-bottom: 10px;
  font-weight: bold;
  color: #ffdf8e;
  letter-spacing: 1px;
  font-size: 1em;
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

/* New Resource Item Styles */
.resource-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  margin: 4px 0;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  border: 1px solid #3a1c0e;
}

.resource-label {
  color: #e0cba8;
  font-weight: 600;
  font-size: 0.85em;
}

.resource-values {
  display: flex;
  align-items: center;
  gap: 6px;
}

.current-value {
  color: #4caf50;
  font-weight: bold;
  font-size: 0.9em;
}

.separator {
  color: #7c4d1e;
  font-weight: bold;
  font-size: 0.9em;
}

.required-value {
  color: #ffdf8e;
  font-weight: bold;
  font-size: 0.9em;
}

.required-value.insufficient {
  color: #ff6b6b;
  text-shadow: 0 0 4px #ff6b6b66;
}

.gold-icon {
  font-size: 0.9em;
}
.enchant-btn {
  margin-top: 12px;
  padding: 10px 24px;
  font-size: 1em;
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
  width: 100%;
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

/* Enchant Result Modal */
.enchant-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
}

.enchant-modal {
  padding: 32px 48px;
  border-radius: 12px;
  font-family: 'Cinzel', serif;
  font-size: 1.5em;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  animation: modalPulse 0.3s ease-in-out;
}

.enchant-modal.success {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: #fff;
  border: 3px solid #2e7d32;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.enchant-modal.failed {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: #fff;
  border: 3px solid #c62828;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.enchant-modal-message {
  letter-spacing: 1px;
}

@keyframes modalPulse {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
