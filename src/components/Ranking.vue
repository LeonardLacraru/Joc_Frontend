<script setup>
import { ref, computed, onMounted } from 'vue';
import { authFetch } from '../utils/authFetch.js';
import router from '@/router/index.js';
import { pvp_battle_data } from '../utils/public_variables.js';

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

async function attackPlayer(playerId) {
    try {
        const response = await authFetch(`${API_BASE_URL}/attack_player/${playerId}/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'
            }
        });
        if (response && response.ok) {
            const data = await response.json();
            pvp_battle_data.value = data;
            // console.log("PVP Battle Data:", pvp_battle_data.value);
            router.push('/PVP');
        } else {
            const errData = await response.json();
            alert(errData.detail || JSON.stringify(errData));
        }
    } catch (err) {
        alert(err.message);
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
                    <th>Action</th>
                </tr>
                <tr v-for="(player, index) in ranking" :key="ranking.id">
                    <td>{{ index + 1 }}</td>
                    <td>{{ player.character_name }}</td>
                    <td>{{ player.level }}</td>
                    <td>{{ player.race }}</td>
                    <td button class="btn btn-dark px-3" type="button" @click="attackPlayer(player.id)">Attack</td>
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