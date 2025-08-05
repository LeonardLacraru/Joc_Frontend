<script setup>
import { ref, onMounted, computed } from 'vue';
import { authFetch } from '../utils/authFetch.js';
import router from '@/router/index.js';
import { pvp_battle_data } from '../utils/public_variables.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const rankingType = ref('players'); // 'players' or 'guilds'
const ranking = ref([]);
const loading = ref(false);

async function fetchPlayersRanking() {
    loading.value = true;
    try {
        const response = await authFetch(`${API_BASE_URL}/ranking/`);
        if (response && response.ok) {
            ranking.value = await response.json();
        } else {
            const errData = await response.json();
            alert(errData.detail || JSON.stringify(errData));
        }
    } catch (err) {
        alert(err.message);
    }
    loading.value = false;
}

async function fetchGuildsRanking() {
    loading.value = true;
    try {
        const response = await authFetch(`${API_BASE_URL}/guild/guilds/`);
        if (response && response.ok) {
            ranking.value = await response.json();
        } else {
            const errData = await response.json();
            alert(errData.detail || JSON.stringify(errData));
        }
    } catch (err) {
        alert(err.message);
    }
    loading.value = false;
}

// Load players ranking by default
onMounted(fetchPlayersRanking);

function showPlayers() {
    rankingType.value = 'players';
    fetchPlayersRanking();
}

function showGuilds() {
    rankingType.value = 'guilds';
    fetchGuildsRanking();
}

async function attackPlayer(playerId) {
    try {
        const response = await authFetch(`${API_BASE_URL}/attack_player/${playerId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response && response.ok) {
            const data = await response.json();
            pvp_battle_data.value = data;
            router.push('/PVP');
        } else {
            const errData = await response.json();
            alert(errData.detail || JSON.stringify(errData));
        }
    } catch (err) {
        alert(err.message);
    }
}

function getRaceImage(race) {
    if (race) {
        return new URL(`../assets/${race}.png`, import.meta.url).href;
    }
    return "https://github.com/mdo.png";
}

</script>

<template>
    <div class="screen-80">
        <nav class="navbar navbar-expand-lg bg-body-tertiary navbar bg-dark border-bottom border-body custom-navbar"
            data-bs-theme="dark">
            <div class="container-fluid">
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <button class="btn btn-dark mx-2" @click="showPlayers">Players Ranking</button>
                        </li>
                        <li class="nav-item">
                            <button class="btn btn-dark mx-2" @click="showGuilds">Guilds Ranking</button>
                        </li>
                    </ul>
                    <form class="d-flex ms-auto" role="search">
                        <input class="form-control me-2" type="search" aria-label="Search" />
                        <button class="btn btn-outline-success" type="submit">Search</button>
                    </form>
                </div>
            </div>
        </nav>

        <div v-if="loading">Loading...</div>
        <div v-if="rankingType === 'players' && ranking.length">
            <div class="row mb-2 text-center fw-bold">
                <div class="col-md-3 themed-grid-col">Rank</div>
                <div class="col-md-3 themed-grid-col">Character Name</div>
                <div class="col-md-3 themed-grid-col">Level</div>
                <div class="col-md-3 themed-grid-col">Action</div>
            </div>
            <div v-for="(player, index) in ranking" :key="player.id" class="row mb-2 text-center align-items-center">
                <div class="col-md-3 themed-grid-col">{{ index + 1 }}</div>
<div class="col-md-3 themed-grid-col player-info">
  <span class="player-name">{{ player.character_name }}</span>
  <img :src="getRaceImage(player.race)" alt="" width="60" height="60" class="player-img" />
</div>
                <div class="col-md-3 themed-grid-col">{{ player.level }}</div>
                <div class="col-md-3 themed-grid-col">
                    <button class="btn btn-dark px-3" type="button" @click="attackPlayer(player.id)">Attack</button>
                </div>
            </div>
        </div>

        <div v-if="rankingType === 'guilds' && ranking.length">
            <div class="row mb-3 text-center fw-bold">
                <div class="col-md-4 themed-grid-col">Nume</div>
                <div class="col-md-4 themed-grid-col">Leader</div>
                <div class="col-md-4 themed-grid-col">Level</div>
            </div>
            <div v-for="guild in ranking" :key="guild.id" class="row mb-2 text-center">
                <div class="col-md-4 themed-grid-col">{{ guild.name }}</div>
                <div class="col-md-4 themed-grid-col">{{ guild.leader }}</div>
                <div class="col-md-4 themed-grid-col">{{ guild.level }}</div>
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
    overflow-x: hidden;
}

.themed-grid-col {
    color: #e7d7b1;
    /* muted gold for text */
    border: 1px solid #2d161a;
    /* deep muted red-black border */
    border-radius: 8px;
    background: linear-gradient(180deg, #22171b 70%, #181012 100%);
    box-shadow: 0 2px 8px rgba(40, 10, 20, 0.3);
    padding: 0.7rem 0.2rem;
    font-family: 'Cinzel', serif;
    font-size: 1.15rem;
    font-weight: 500;
    letter-spacing: 1px;
    text-shadow: 0 1px 6px #181012;
    transition: background 0.2s, border-color 0.2s;
    min-height: 85px; /* adăugat pentru uniformizare */
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;

}

.row.mb-2.text-center.align-items-center,
.row.mb-2.text-center {
    background: linear-gradient(90deg, #22171b 0%, #181012 100%);
    border-radius: 8px;
    margin-bottom: 8px;
    box-shadow: 0 1px 8px rgba(40, 10, 20, 0.2);
}

.row.mb-3.text-center.fw-bold {
    background: linear-gradient(90deg, #2d161a 0%, #181012 100%);
    border-radius: 8px;
    margin-bottom: 16px;
    color: #e7d7b1;
    /* muted gold for header */
    font-size: 1.2rem;
    font-family: 'Cinzel', serif;
    font-weight: 700;
    letter-spacing: 2px;
    text-shadow: 0 1px 8px #181012;
}

.btn-dark {
    background: linear-gradient(90deg, #2d161a 60%, #181012 100%);
    color: #e7d7b1;
    border: 1.5px solid #3a232b;
    font-family: 'Cinzel', serif;
    font-size: 1.1rem;
    letter-spacing: 1px;
    box-shadow: 0 1px 6px #181012;
    transition: background 0.2s, border-color 0.2s;
}

.btn-dark:hover {
    background: linear-gradient(90deg, #3a232b 60%, #2d161a 100%);
    border-color: #e7d7b1;
    color: #fffbe6;
}

.custom-navbar {
    background: linear-gradient(90deg, #2d161a 0%, #181012 100%);
    padding: 0.7rem 1.5rem;
    border-bottom: 2px solid #3a232b;
    box-shadow: 0 2px 10px rgba(40, 10, 20, 0.3);
    font-family: 'Cinzel', serif;
}

.custom-navbar .nav-item .btn {
    background: linear-gradient(90deg, #2d161a 60%, #181012 100%);
    color: #e7d7b1;
    border: 1.5px solid #3a232b;
    font-size: 1.1rem;
    letter-spacing: 1px;
    box-shadow: 0 1px 6px #181012;
}

.custom-navbar .nav-item .btn:hover {
    background: linear-gradient(90deg, #3a232b 60%, #2d161a 100%);
    border-color: #e7d7b1;
    color: #fffbe6;
}

/* Search bar */
.custom-navbar input.form-control {
    background-color: #22171b;
    color: #e7d7b1;
    border: 1px solid #3a232b;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);
}

.custom-navbar input.form-control::placeholder {
    color: #b9a276;
}

.custom-navbar .btn-outline-success {
    color: #e7d7b1;
    border-color: #3a232b;
    font-family: 'Cinzel', serif;
    box-shadow: 0 1px 6px #181012;
}

.custom-navbar .btn-outline-success:hover {
    background-color: #3a232b;
    border-color: #e7d7b1;
    color: #fffbe6;
}

.screen-80::-webkit-scrollbar {
    width: 10px;
}

.screen-80::-webkit-scrollbar-track {
    background: #181012; 
    border-radius: 5px;
}

.screen-80::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #3a232b, #2d161a); /* bordo închis */
    border-radius: 5px;
    border: 2px solid #181012; /* spațiu între thumb și track */
}

.screen-80::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #4b2b34, #3a232b); /* highlight mai deschis */
}

.screen-80::-webkit-scrollbar-corner {
    background: #181012;
}

.player-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.player-name {
    flex-grow: 1;
    text-align: center;
    padding-right: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.player-img {
    flex-shrink: 0;
    border-radius: 50%;
    width: 60px;
    height: 60px;
}
</style>