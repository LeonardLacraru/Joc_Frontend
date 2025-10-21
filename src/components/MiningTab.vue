<script setup>
import { ref, reactive, onMounted } from "vue";
import { authFetch } from "@/utils/authFetch";
import { useBackendMessage } from "../utils/useBackendMessage.js";

const { backendMessage, backendMessageType, showBackendMessage } = useBackendMessage();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const API_BASE_WS =
  import.meta.env.VITE_API_BASE_URL_WSS || "wss://ourgame.onrender.com/ws";

/*
  Module scoped manager so state and websockets survive component unmount/remount
*/
const wsManager = {
  ws: null,
  timer: { active: false, minutes: 0, seconds: 0 },
};

// load persisted timer if any
try {
  const saved = JSON.parse(localStorage.getItem("mining_timer"));
  if (saved && typeof saved === "object") {
    wsManager.timer = { ...wsManager.timer, ...saved };
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

// reactive wrapper around manager timer so template updates
const timer = reactive(wsManager.timer);

// helper to get token
const getAuthToken = () => {
  return (
    localStorage.getItem("access") || localStorage.getItem("token") || null
  );
};

const setTimerState = (minutes, seconds) => {
  timer.minutes = Number(minutes) || 0;
  timer.seconds = Number(seconds) || 0;
  timer.active = timer.minutes > 0 || timer.seconds > 0;
  wsManager.timer = { ...timer };
  saveTimer();
};

const clearTimerState = () => {
  timer.minutes = 0;
  timer.seconds = 0;
  timer.active = false;
  wsManager.timer = { ...timer };
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

        // if finished, handle completion (to be implemented)
        if ((Number(mins) || 0) === 0 && (Number(secs) || 0) === 0) {
          showBackendMessage("Mining task completed!", "success");
          // TODO: Fetch mining result when backend is ready

          // clean up websocket and timer
          try { closeWebsocket(); } catch (e) {}
          try { clearTimerState(); } catch (e) {}
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
      `${API_BASE_URL}/town/lifeskill/start_mining_task/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: selectedDuration.value }),
      }
    );
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
  if (timer.active) openTimerWebsocket(token);
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
      <div class="duration-selector">
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

      <!-- timer display -->
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

    <!-- TODO: Add mining result display similar to gathering when backend is ready -->
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
</style>
