<script setup>
import { ref, onMounted, computed, defineEmits, defineProps } from "vue";
import { authFetch } from "../utils/authFetch.js";
import "../assets/inventory.css";
import { useBackendMessage } from "../utils/useBackendMessage.js";

//Declarations
const props = defineProps({
  items: Array,
  loading: Boolean,
  error: String,
  showButton: Boolean,
  selectedItem: Object
});
const emit = defineEmits(["refreshProfile", "select-item"]);
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const { backendMessage, backendMessageType, showBackendMessage } =
  useBackendMessage();
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
  intelligence: "Intelligence",
  lifesteal: "Lifesteal",
  magic_def: "Magic Defense",
  phys_def: "Physical Defense",
  strength: "Strength",
};

onMounted(async () => {
  // Always fetch profile data
  await fetchProfile();
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
  event.target.src = new URL("../assets/items/image.png", import.meta.url).href;
}

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
      emit('refreshProfile');
      await fetchProfile(); // Refresh profile after equipping
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
</script>

<template>
  <div class="inventory-grid">
    <div v-for="item in props.items" class="inventory-item" :key="item?.id || Math.random()">
      <template v-if="item">
        <div
          class="tooltip-container"
          :class="{ 'item-selected': props.selectedItem?.id === item.id }"
          @click="$emit('select-item', item, $event)"
        >
          <img
            :src="generateImageName(item.item.name)"
            :alt="item.name"
            class="item-icon"
            @error="handleImageError"
          />
          <div class="custom-tooltip">
            <div class="tt-font-name" :class="`rarity-${item.item.rarity}`">
              {{ item.item.name }} +{{ item.item.enchant_level }}
            </div>
            <div class="tt-font">
              Required Level: {{ item.item.required_level }}
            </div>
            <div class="tt-font">Sell: {{ item.item.required_gold }} 🟡</div>
            <div
              class="tt-stats"
              v-if="item.item.stats && item.item.stats.length"
            >
              Stats:
              <div
                v-for="(stat, sidx) in item.item.stats"
                :key="sidx"
                class="tt-stat"
              >
                {{ statLabels[stat.name] || stat.name }}:
                <span>
                  {{
                    ["crit_rate", "hit_rate", "lifesteal", "crit_dmg"].includes(stat.name)
                      ? stat.value.toFixed(2) + "%"
                      : stat.value
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="item-icon" style="opacity: 0.2">Empty</div>
      </template>
    </div>
  </div>
</template>
