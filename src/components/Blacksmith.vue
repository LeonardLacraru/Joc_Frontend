<script setup>
import { ref, onMounted, computed } from "vue";
import { authFetch } from "../utils/authFetch.js";
import "../assets/inventory.css";
import Inventory from "./Inventory.vue";
import { useBackendMessage } from "../utils/useBackendMessage.js";

const { backendMessage, backendMessageType, showBackendMessage } = useBackendMessage();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

function generateStoneName(stoneName){
  if (!stoneName)
    return new URL("@/assets/stones/default-item-icon.png", import.meta.url).href;
  return new URL(`../assets/stones/${stoneName.toLowerCase()}.png`, import.meta.url).href;
}
</script>

<template>
    <div class = "mainInventory">
    <Inventory></Inventory>
    </div>
</template>