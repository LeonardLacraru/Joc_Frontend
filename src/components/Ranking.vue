<script setup>
import { ref, computed, onMounted } from 'vue';
import { authFetch } from '../utils/authFetch.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ranking = ref(null);

onMounted(async () => {
    await fetchRanking();
});

async function fetchRanking() {
    try {
        const response = await authFetch(`${API_BASE_URL}/ranking/`);
        if (response && response.ok) {
            const data = await response.json();
            ranking.value = data;
            console.log("Ranking data:", ranking.value);
            return data;
        } else {
            const errData = await response.json();
            alert(errData.detail || JSON.stringify(errData));
            return null;
        }
    } catch (err) {
        alert(err.message);
        return [];
    }
}
</script>

<template>
    <div>
        <table style="width:100%">
            <thead>
                Character Ranking
                <tr>
                    <th>Rank</th>
                    <th>Character Name</th>
                    <th>Level</th>
                    <th>Race</th>
                </tr>
                <tr v-for="(player, index) in ranking" :key="ranking.id">
                    <td>{{ index + 1 }}</td>
                    <td>{{ player.character_name }}</td>
                    <td>{{ player.level }}</td>
                    <td>{{ player.race }}</td>
                </tr>
            </thead>
        </table>
    </div>
</template>

<style scoped>
table,
th,
td {
    border: 1px solid yellow;
    background-color: black;
    color: red;
    font-size: 30px;
    text-align: center;
}
</style>