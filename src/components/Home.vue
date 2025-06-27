<template>
    <div class="main">
        <h1>
            <span v-if="isLoggedIn">Welcome, {{ username }} to MuieGrumpy!</span>
            <span v-else>Welcome guest to MuieGrumpy!</span>
        </h1>
        <h3>Welcome to MuieGrumpy!</h3>
        <p>This is the home page of the MuieGrumpy application.</p>
        <p>Use the navigation links to explore the app.</p>
    </div>
</template>

<script setup>
import { inject, ref, onMounted } from 'vue'
const isLoggedIn = inject('isLoggedIn')
const username = ref('')

onMounted(() => {
  username.value = localStorage.getItem('username') || ''
})
</script>