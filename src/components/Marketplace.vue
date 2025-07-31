<script setup>
import { authFetch } from "../utils/authFetch.js";
import { ref, computed, onMounted } from "vue";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const inventory = ref([]);
const loading = ref(true);
const SLOT_COUNT = 33;
const activeItemId = ref(null);
const marketplace = ref([]);
const prices = ref({});
const profile = ref({});
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

const gridInventory = computed(() => {
  // Only include unequipped items
  const unequipped = inventory.value.filter(
    (item) => item && item.is_equipped === false && item.is_listed === false

  );
  // Fill up to SLOT_COUNT with nulls
  const slots = Array(SLOT_COUNT).fill(null);
  for (let i = 0; i < unequipped.length && i < SLOT_COUNT; i++) {
    slots[i] = unequipped[i];
  }
  return slots;
});

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

onMounted(async () => {
  await fetchInventory();
  await fetchMarketplace();
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
      alert(errData.detail || JSON.stringify(errData));
    }
  } catch (err) {
    alert(err.message);
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

async function confirmSell(itemId) {
  const itemPrice = prices.value[itemId];

  if (!itemPrice || itemPrice <= 0) {
    alert("Set a valid price first!");
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
      await fetchMarketplace();
      prices.value[itemId] = 0;
      activeItemId.value = null;
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


</script>

<template>
  <div class="main">
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
    <div class ="stat-line">Gold:{{ profile.gold }} 🟡</div>
  </div>
  <div>
    <!-- <div v-for="item in marketplace" :key="item.id">
      {{ item.price }} gold - {{ item.item.item.name }} - seller {{ item.seller }}
    </div> -->
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
              <div class="tt-font">
                Seller: {{ item.seller }}
              </div>
              <div class="tt-font">
                Price: {{ item.price }}🟡
              </div>
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
</template>

<style scoped>
.main {
  width: 95vw;
  max-width: 1200px;
  min-width: 320px;
  min-height: 40vh;
  margin: 5vw;
  background: #000;
  position: relative;
  box-sizing: border-box;
  border-radius: 1.2rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
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

.tooltip-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.item-icon {
  width: 5vw;
  height: 4vw;
  max-width: 90px;
  max-height: 90px;
  min-width: 50px;
  min-height: 50px;
  margin-bottom: 0.5rem;
}

.inventory-action-btn {
  display: none;
  background: #444;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s, transform 0.2s;
}

.custom-tooltip {
  display: none;
  position: absolute;
  z-index: 1000;
  left: 50%;
  top: -10px;
  transform: translate(-50%, -100%);
  /* transform: translateX(0, -50%); */
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

.inventory-item:hover .inventory-action-btn {
  display: block;
}

.tooltip-container:hover .custom-tooltip {
  display: block;
}

.tooltip-container:hover .custom-tooltip-equipped {
  display: block;
}

.stat-line {
  font-size: 1.5rem;
  padding: 0.25rem 0;
  color: white;
}
</style>