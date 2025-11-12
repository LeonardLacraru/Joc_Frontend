<script setup>
import { ref, reactive, onMounted } from "vue";
import { authFetch } from "@/utils/authFetch";
import { useBackendMessage } from "../utils/useBackendMessage.js";

const { backendMessage, backendMessageType, showBackendMessage } = useBackendMessage();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://ourgame.onrender.com/api";
const API_BASE_WS = import.meta.env.VITE_API_BASE_URL_WSS || "wss://ourgame.onrender.com/ws";

/*
  Module scoped manager so state and websockets survive component unmount/remount
*/
const wsManager = {
  ws: null,
  timer: { active: false, minutes: 0, seconds: 0 },
  isProcessingCompletion: false,
};

// reactive wrapper around manager timer so template updates
const timer = ref({ active: false, minutes: 0, seconds: 0 });

// load persisted timer if any
try {
  const saved = JSON.parse(localStorage.getItem("mining_timer"));
  if (saved && typeof saved === "object") {
    wsManager.timer = { ...wsManager.timer, ...saved };
    timer.value = { ...wsManager.timer };
  }
} catch (e) {
  /* ignore parse errors */
}

const saveTimer = () => {
  try {
    localStorage.setItem("mining_timer", JSON.stringify(wsManager.timer));
  } catch (e) {}
};

const selectedDuration = ref(10);

const durations = [
  { value: 1, label: "1 minute" },
  { value: 10, label: "10 minutes" },
  { value: 20, label: "20 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "60 minutes" },
  { value: 240, label: "4 hours" },
  { value: 480, label: "8 hours" },
];

// Item data mapping
const miningItems = {
  'bronze': { displayName: 'Bronze Ore', image: 'bronze.png' },
  'silver': { displayName: 'Silver Ore', image: 'silver.png' },
  'gold': { displayName: 'Gold Ore', image: 'gold.png' },
  'platinum': { displayName: 'Platinum Ore', image: 'platinum.png' },
  'emerald': { displayName: 'Emerald Gem', image: 'emerald.png' },
};

// Store task completion results (load from localStorage if available)
const loadMiningResult = () => {
  try {
    const saved = localStorage.getItem("mining_last_reward");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error loading mining result:", e);
  }
  return null;
};

const miningResult = ref(loadMiningResult());

// Track if the result card is minimized
const isResultMinimized = ref(false);

// Get image path for mining item
const getMiningImage = (itemName) => {
  if (!itemName) return null;
  try {
    const itemData = miningItems[itemName.toLowerCase()];
    if (itemData && itemData.image) {
      return new URL(`../assets/mining/${itemData.image}`, import.meta.url).href;
    }
  } catch (e) {
    console.error("Error loading image:", e);
  }
  return null;
};

// Get display name for mining item
const getDisplayName = (itemName) => {
  if (!itemName) return '';
  const itemData = miningItems[itemName.toLowerCase()];
  return itemData ? itemData.displayName : itemName;
};

// helper to get token
const getAuthToken = () => {
  return (
    localStorage.getItem("access") || localStorage.getItem("token") || null
  );
};

const setTimerState = (minutes, seconds) => {
  const mins = Number(minutes) || 0;
  const secs = Number(seconds) || 0;
  const active = mins > 0 || secs > 0;

  timer.value = { active, minutes: mins, seconds: secs };
  wsManager.timer = { active, minutes: mins, seconds: secs };
  saveTimer();
};

const clearTimerState = () => {
  timer.value = { active: false, minutes: 0, seconds: 0 };
  wsManager.timer = { active: false, minutes: 0, seconds: 0 };
  saveTimer();
};

const closeWebsocket = () => {
  try {
    if (wsManager.ws) {
      wsManager.ws.close();
      wsManager.ws = null;
    }
  } catch (e) {}
};

// Fetch mining result on mount
const getMiningTask = async () => {
  try {
    const resp = await authFetch(
      `${API_BASE_URL}/town/mining/get_mining_task/`
    );
    if (!resp) {
      return;
    }

    // If 404, there's no active task - this is normal
    if (resp.status === 404) {
      return;
    }

    const data = await resp.json().catch(() => null);
    if (resp.ok && data && (data.item || data.description || data.gold != null)) {
      // Store in localStorage
      const result = {
        item: data.item ? String(data.item) : "",
        description: data.description ? String(data.description) : "",
        gold: data.gold != null ? Number(data.gold) : 0,
      };
      localStorage.setItem("mining_last_reward", JSON.stringify(result));
      // Update reactive ref
      miningResult.value = result;
      isResultMinimized.value = false;
    }
  } catch (err) {
    console.error("Error fetching mining result:", err);
  }
};

// open websocket for mining
const openTimerWebsocket = (token) => {
  if (!token) return;
  if (wsManager.ws) return; // already open

  const base = (API_BASE_WS || "").replace(/\/+$/, "");
  const wsUrl = `${base}/timer/?token=${encodeURIComponent(token)}&activity=mining`;

  try {
    const w = new WebSocket(wsUrl);
    wsManager.ws = w;

    w.onopen = () => {
      // no-op
    };
    w.onmessage = async (ev) => {
      try {
        const payload = JSON.parse(ev.data);

        // Check if this message is for mining task
        const taskType = payload.task_type ?? payload["task_type"];
        if (taskType && taskType !== "mining") {
          // Ignore messages that are not for mining
          return;
        }

        const mins =
          payload["remaining minutes"] ??
          payload["remaining_minutes"] ??
          payload.remaining_minutes ??
          0;
        const secs =
          payload["remaining_seconds"] ??
          payload["remaining seconds"] ??
          payload.remainingSeconds ??
          0;
        setTimerState(mins, secs);

        // if finished, call backend endpoint
        if ((Number(mins) || 0) === 0 && (Number(secs) || 0) === 0) {
          // Check if already processing to prevent multiple calls
          if (wsManager.isProcessingCompletion) {
            return;
          }

          // Check if timer was active (to avoid processing if already completed)
          if (!timer.value.active) {
            return;
          }

          wsManager.isProcessingCompletion = true;

          // clean up websocket and timer first
          try { closeWebsocket(); } catch (e) {}
          try { clearTimerState(); } catch (e) {}

          // Wait a bit to let backend process the task completion
          await new Promise(resolve => setTimeout(resolve, 500));

          try {
            const resp = await authFetch(
              `${API_BASE_URL}/town/mining/get_mining_task/`
            );
            if (!resp) {
              wsManager.isProcessingCompletion = false;
              return;
            }

            const data = await resp.json().catch(() => null);

            if (resp.ok && data) {
              // Store in localStorage
              localStorage.setItem("mining_last_reward", JSON.stringify({
                item: data.item ? String(data.item) : "",
                description: data.description ? String(data.description) : "",
                gold: data.gold != null ? Number(data.gold) : 0,
              }));

              showBackendMessage("Mining task completed!", "success");

              // Reload page after 1 second
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          } catch (err) {
            console.error("Failed to fetch mining result:", err);
          } finally {
            wsManager.isProcessingCompletion = false;
          }
        }
      } catch (err) {
        console.error("ws message parse error", err);
      }
    };
    w.onclose = () => {
      wsManager.ws = null;
    };
    w.onerror = (e) => {
      console.error("timer websocket error:", e);
    };
  } catch (err) {
    console.error("WebSocket constructor error:", err);
  }
};

// Start mining activity
const startMiningActivity = async () => {
  if (!selectedDuration.value) {
    showBackendMessage("Please select a duration", "error");
    return;
  }
  try {
    const response = await authFetch(
      `${API_BASE_URL}/town/mining/start_mining_task/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: selectedDuration.value }),
      }
    );
    if (!response) {
      return;
    }
    const body = await response.json().catch(() => null);
    if (response.ok) {
      showBackendMessage("Mining task started successfully", "success");
      const token = getAuthToken();
      openTimerWebsocket(token);
    } else {
      showBackendMessage(
        (body && (body.message || body.detail)) || "Failed to start mining task",
        "error"
      );
    }
  } catch (error) {
    console.error("Error starting task:", error);
    showBackendMessage("Failed to start mining task", "error");
  }
};

// On component mount
onMounted(async () => {
  const token = getAuthToken();
  if (!token) return;
  if (timer.value.active) openTimerWebsocket(token);

  // Always check for mining results on mount
  await getMiningTask();
});
</script>

<template>
  <div class="mining-tab">
    <!-- floating backend message (top-right) -->
    <div v-if="backendMessage" class="backend-alert-wrapper">
      <div
        :class="[
          'alert backend-alert',
          backendMessageType === 'success'
            ? 'alert-success'
            : backendMessageType === 'error'
            ? 'alert-danger'
            : 'alert-info',
        ]"
        role="alert"
      >
        {{ backendMessage }}
      </div>
    </div>

    <!-- Introduction section - compact -->
    <div class="mining-info-section">
      <div class="mining-portrait">
        <img src="@/assets/mining.png" alt="Mining" />
      </div>
      <div class="mining-info-text">
        <div class="mining-greeting">
          Mining Depths
        </div>
        <div class="mining-description">
          Descend into the dark caverns and extract valuable ores, gems, and minerals from the earth's depths.
        </div>
      </div>
    </div>

    <!-- Activity section -->
    <div class="activity-section">
      <!-- Show duration selector and button only when no active timer -->
      <div v-if="!timer.active" class="duration-selector">
        <div class="duration-row">
          <label class="duration-label">Select Duration:</label>
          <select
            v-model="selectedDuration"
            class="form-select"
            aria-label="Select duration"
          >
            <option
              v-for="duration in durations"
              :key="duration.value"
              :value="duration.value"
            >
              {{ duration.label }}
            </option>
          </select>
        </div>
        <button
          class="btn btn-success btn-mine"
          @click="startMiningActivity"
          :disabled="!selectedDuration"
        >
          Start Mining
        </button>
      </div>

      <!-- timer display - only shown when active -->
      <div v-if="timer.active" class="timer-display">
        <strong>Time remaining:</strong>
        <span class="timer-value">
          <template v-if="timer.minutes >= 60">
            {{ Math.floor(timer.minutes / 60) }}h
            {{ timer.minutes % 60 }}m:
            {{ String(timer.seconds).padStart(2, "0") }}s
          </template>
          <template v-else>
            {{ timer.minutes }}m:{{
              String(timer.seconds).padStart(2, "0")
            }}s
          </template>
        </span>
      </div>
    </div>

    <!-- Mining result display -->
    <div v-if="miningResult" class="result-card mt-4">
      <div class="card bg-dark text-light">
        <div
          class="card-header d-flex justify-content-between align-items-center"
          @click="isResultMinimized = !isResultMinimized"
          style="cursor: pointer;"
        >
          <h5 class="mb-0">Last Mining Reward</h5>
          <button
            type="button"
            class="btn btn-sm btn-outline-light minimize-btn"
            @click.stop="isResultMinimized = !isResultMinimized"
            :aria-label="isResultMinimized ? 'Maximize' : 'Minimize'"
          >
            {{ isResultMinimized ? '+' : '−' }}
          </button>
        </div>
        <div v-show="!isResultMinimized" class="card-body">
          <div class="reward-info">
            <!-- Item image with hover tooltip -->
            <div v-if="miningResult.item" class="item-display mb-3">
              <div class="item-image-wrapper">
                <img
                  v-if="getMiningImage(miningResult.item)"
                  :src="getMiningImage(miningResult.item)"
                  :alt="getDisplayName(miningResult.item)"
                  class="item-image"
                />
                <!-- Tooltip on hover with name and description -->
                <div class="item-tooltip">
                  <div class="tooltip-title">{{ getDisplayName(miningResult.item) }}</div>
                  <div v-if="miningResult.description" class="tooltip-description">
                    {{ miningResult.description }}
                  </div>
                </div>
              </div>
            </div>

            <p v-if="miningResult.gold !== undefined" class="mb-0 gold-amount">
              <strong>Gold:</strong> <span class="text-warning">+{{ miningResult.gold }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mining-tab {
  padding: 0.5rem;
}

/* Info Section - Compact */
.mining-info-section {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 2px solid #3a1c0e;
  border-radius: 10px;
  background: linear-gradient(135deg, #1a1a22 80%, #2d1a1a 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.mining-portrait {
  flex-shrink: 0;
}

.mining-portrait img {
  width: 140px;
  height: 140px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #4a3c2e;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
}

.mining-info-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #e0d4c8;
}

.mining-greeting {
  font-size: 1.3rem;
  font-weight: bold;
  color: #d4af37;
  margin-bottom: 0.5rem;
  font-style: italic;
}

.mining-description {
  font-size: 0.95rem;
  line-height: 1.4;
  color: #c9b8a0;
}

/* Activity Section */
.activity-section {
  text-align: center;
  padding: 1.5rem;
  border: 2px solid #3a1c0e;
  border-radius: 10px;
  background: linear-gradient(135deg, #1a1a22 80%, #2d1a1a 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.duration-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.duration-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.duration-label {
  font-size: 1.1rem;
  font-weight: bold;
  color: #d4af37;
  white-space: nowrap;
}

.form-select {
  background-color: #2b2b2b;
  color: white;
  border: 2px solid #4a3c2e;
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
  min-width: 150px;
}

.form-select:focus {
  border-color: #d4af37;
  box-shadow: 0 0 0 0.2rem rgba(212, 175, 55, 0.25);
}

.form-select option {
  background-color: #2b2b2b;
  color: white;
}

.btn-mine {
  padding: 0.6rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 2px solid #5a4020;
  background: linear-gradient(135deg, #7a5c30 0%, #5a4020 100%);
}

.btn-mine:hover:not(:disabled) {
  background: linear-gradient(135deg, #8a6c40 0%, #6a5030 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(122, 92, 48, 0.5);
}

.btn-mine:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.timer-display {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  border: 2px solid #4a3c2e;
  color: #d4af37;
  font-size: 1.2rem;
}

.timer-value {
  margin-left: 0.5rem;
  font-weight: bold;
  color: #fff;
}

/* floating backend alert in top-right */
.backend-alert-wrapper {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1080;
  display: flex;
  align-items: flex-start;
}

.backend-alert {
  min-width: 280px;
  max-width: 380px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  border-radius: 0.375rem;
}

@media (max-width: 576px) {
  .backend-alert-wrapper {
    right: auto;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 2rem);
    justify-content: center;
  }
  .backend-alert {
    width: 100%;
    max-width: none;
  }
}

/* Result card styling - compact */
.result-card {
  max-width: 450px;
  margin: 1rem auto 0;
}

.result-card .card {
  border: 2px solid #3a1c0e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.result-card .card-header {
  background-color: #2b2b2b;
  border-bottom: 1px solid #444;
  user-select: none;
  padding: 0.5rem 1rem;
}

.result-card .card-header h5 {
  font-size: 1rem;
}

.result-card .card-header:hover {
  background-color: #333;
}

.minimize-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.minimize-btn:hover {
  background-color: #495057;
  border-color: #6c757d;
}

.result-card .card-body {
  background-color: #1a1a1a;
  padding: 1rem;
}

.reward-info p {
  font-size: 1rem;
}

/* Item display styling - compact */
.item-display {
  display: flex;
  justify-content: center;
  align-items: center;
}

.item-image-wrapper {
  position: relative;
  text-align: center;
  cursor: pointer;
  padding: 0.5rem;
  width: 120px;
  height: 120px;
  margin: 0 auto;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 0.5rem;
  border: 2px solid #444;
  transition: all 0.3s ease;
}

.item-image-wrapper:hover .item-image {
  border-color: #6c757d;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

/* Tooltip styling */
.item-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.95);
  color: #fff;
  padding: 1rem;
  border-radius: 6px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  margin-bottom: 0.5rem;
  border: 1px solid #555;
  z-index: 10;
  min-width: 200px;
  max-width: 300px;
  white-space: normal;
}

.item-image-wrapper:hover .item-tooltip {
  opacity: 1;
}

.tooltip-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 0.5rem;
  text-align: center;
}

.tooltip-description {
  font-size: 0.9rem;
  color: #ddd;
  text-align: center;
  line-height: 1.4;
}

.gold-amount {
  text-align: center;
  font-size: 1.1rem;
}

.gold-amount .text-warning {
  font-weight: bold;
  font-size: 1.3rem;
}
</style>
