<script setup>
import { ref } from "vue";
import GatheringTab from "./GatheringTab.vue";
import MiningTab from "./MiningTab.vue";

const activeTab = ref("gathering");
</script>

<template>
  <div class="garden-container">
    <!-- Tabs navigation outside the main container -->
    <nav class="lifeskill-tabs">
      <button
        class="tab-btn gathering-tab-btn"
        :class="{ active: activeTab === 'gathering' }"
        @click="activeTab = 'gathering'"
      >
        Gathering
      </button>
      <button
        class="tab-btn mining-tab-btn"
        :class="{ active: activeTab === 'mining' }"
        @click="activeTab = 'mining'"
      >
        Mining
      </button>
    </nav>

    <!-- Main content container -->
    <div class="screen-80">
      <div class="content-area">
        <GatheringTab v-if="activeTab === 'gathering'" />
        <MiningTab v-if="activeTab === 'mining'" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.garden-container {
  width: 80vw;
  margin: auto;
}

.lifeskill-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  justify-content: center;
}

.tab-btn {
  padding: 0.75rem 2rem;
  background-color: #2b2b2b;
  color: #c9b8a0;
  border: 2px solid #3a1c0e;
  border-radius: 8px 8px 0 0;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* Gathering tab - green theme */
.gathering-tab-btn.active {
  background: linear-gradient(135deg, #3a6b1f 0%, #2d5016 100%);
  color: #fff;
  border-bottom: 2px solid #3a6b1f;
  border-color: #2d5016;
}

.gathering-tab-btn:hover {
  background: linear-gradient(135deg, #3a6b1f 0%, #2d5016 100%);
  color: #fff;
}

/* Mining tab - brown theme */
.mining-tab-btn.active {
  background: linear-gradient(135deg, #7a5c30 0%, #5a4020 100%);
  color: #fff;
  border-bottom: 2px solid #7a5c30;
  border-color: #5a4020;
}

.mining-tab-btn:hover {
  background: linear-gradient(135deg, #7a5c30 0%, #5a4020 100%);
  color: #fff;
}

.screen-80 {
  width: 100%;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  background-color: #181012;
  overflow-y: auto;
  border: 2px solid #3a1c0e;
  border-radius: 0 14px 14px 14px;
}

.content-area {
  flex-grow: 1;
  padding: 1rem;
}
</style>
