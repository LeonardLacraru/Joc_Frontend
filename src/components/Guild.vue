<script setup>
import { ref, onMounted } from 'vue';
import { authFetch } from '@/utils/authFetch';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const guild = ref('');
const loading = ref(true);
async function fetchGuilds() {
    try {
        const response = await authFetch(`${API_BASE_URL}/guild/guild/`);
        if (response && response.ok) {
            const data = await response.json();
            guild.value = data || [];
            loading.value = false;
            console.log("Guilds data fetched:", guild.value);
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

onMounted(() => {
    fetchGuilds();
});

</script>

<template>
    <div class="screen-80">
        <nav class="navbar navbar-expand-lg bg-body-tertiary navbar bg-dark border-bottom border-body"
            data-bs-theme="dark">
            <div class="container-fluid">
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <a class="nav-link active" aria-current="page" href="/create_guild">Create Guild</a>
                        </li>
                    </ul>
                    <form class="d-flex ms-auto" role="search">
                        <input class="form-control me-2" type="search" placeholder="Guild Name" aria-label="Search" />
                        <button class="btn btn-outline-success" type="submit">Search</button>
                    </form>
                </div>
            </div>
        </nav>
        <div class="row mb-3 text-center">
            <div class="col-md-4 themed-grid-col">Nume</div>
            <div class="col-md-4 themed-grid-col">Leader</div>
            <div class="col-md-4 themed-grid-col">Level</div>
        </div>
        <div v-for="guild in guild" class="row mb-3 text-center">
            <template v-if="guild">
                <div class="col-md-4 themed-grid-col">{{guild.name}}</div>
                <div class="col-md-4 themed-grid-col">{{guild.leader}}</div>
                <div class="col-md-4 themed-grid-col">{{guild.level}}</div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.screen-80 {
    width: 80vw;
    height: 80vh;
    margin: auto;
    display: flex;
    flex-direction: column;
    background-color: aliceblue;
    border: 1px solid #ccc;

}



nav.navbar {
    width: 100%;
    margin-bottom: 1rem;
}
</style>