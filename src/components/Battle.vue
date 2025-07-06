<script setup>
import { authFetch } from "../utils/authFetch.js";
import { ref } from "vue";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function startBattle(selectedDifficulty) {
    const payload ={ 
        difficulty : selectedDifficulty,
    };
    try {
        const response = await authFetch(`${API_BASE_URL}/create_battle/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        });
   
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error: ${errorData.detail || 'Failed to start battle'}`);
    }else{
        const data = await response.json();
        console.log("Battle started successfully:", data);
        // Handle successful battle start, e.g., navigate to battle details page
        }
    } catch (error) {
        console.error("Error starting battle:", error);
        // Handle error, e.g., show an error message to the user
    }

}

</script>

<template>
    <div class="battle-container">
        <h1>Battle</h1>
        <p>Welcome to the battle page!</p>
        <p>Here you can engage in battles with other players.</p>
        <button @click="startBattle('easy')">Start Easy Battle</button>
        <button @click="startBattle('medium')">Start Medium Battle</button>
        <button @click="startBattle('hard')">Start Hard Battle</button>
    </div>

</template>