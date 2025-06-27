<script setup>
import { onMounted, ref } from 'vue'
import { authFetch } from '../utils/authFetch.js'

const inventory = ref(null)

onMounted(async () => {
  const response = await authFetch('http://13.62.56.34:8000/api/items/')
  if (response && response.ok) {
    const data = await response.json()
    inventory.value = data
    console.log('Inventory data:', data)
  } else {
    console.error('Failed to fetch inventory data')
    alert('Could not fetch inventory data. Please make sure you are logged in.')
  }
})
</script>

<template>
  <div class="main">
    <h1>Inventory</h1>
    <!-- You can display inventory here if you want -->
  </div>
</template>