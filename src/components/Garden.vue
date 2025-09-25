<script setup>
</script>

<template>
    <div class = "screen-80">
        <nav class="navbar navbar-expand-lg bg-body-tertiary navbar bg-dark border-bottom border-body custom-navbar"
            data-bs-theme="dark">
            <div class="container-fluid">
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <button class="btn btn-dark mx-2" @click="showPlayers">Gathering</button>
                        </li>
                        <li class="nav-item">
                            <button class="btn btn-dark mx-2" @click="showGuilds">Mining</button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
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
}
</style>