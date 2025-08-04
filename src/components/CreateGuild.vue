<script setup>
import { ref, onMounted } from 'vue';
import { authFetch } from '@/utils/authFetch';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
async function createGuild() {
    try {
        const response = await authFetch(`${API_BASE_URL}/guild/create_guild/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: 'Description of the new guild',
                name: 'New Guild',
            })
        });
        if (response && response.ok) {
            const data = await response.json();
            console.log("Guild created:", data);
            fetchGuilds(); // Refresh the guild list
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
    <div class="screen-80">
        <nav class="navbar navbar-expand-lg bg-body-tertiary navbar bg-dark border-bottom border-body"
            data-bs-theme="dark">
            <div class="container-fluid">
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <a class="nav-link active" aria-current="page" href="/guild">Guilds</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
        <input type="text" v-model="guildName" placeholder="Guild Name" class ="input" />
        <input type="text" v-model="guildDescription" placeholder="Guild Description" class ="input" />
        <button @click="createGuild" class="btn btn-outline-success">Create Guild</button>
    </div>
</template>

<style scoped>
.screen-80 {
    width: 80vw;
    height: 80vh;
    margin: auto;
    display: flex;
    align-items: center;
    flex-direction: column;
    background-color: aliceblue;
    border: 1px solid #ccc;

}

nav.navbar {
    width: 100%;
    margin-bottom: 1rem;
}

.input {
  width: 25vw;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  margin-top: 3rem;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
  color: #212529;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.input:focus {
  border-color: #86b7fe;
  outline: none;
  box-shadow: 0 0 0 0.2rem rgba(13,110,253,.25);
}
</style>