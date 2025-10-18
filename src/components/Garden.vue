<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { authFetch } from "@/utils/authFetch";
import { useBackendMessage } from "../utils/useBackendMessage.js";

//prettier-ignore
const { backendMessage, backendMessageType, showBackendMessage } = useBackendMessage();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const API_BASE_WS =
  import.meta.env.VITE_API_BASE_URL_WSS || "wss://ourgame.onrender.com/ws";

/*
  Module scoped manager so state and websockets survive component unmount/remount
  (keeps timers separate per activity).
*/
const wsManager = {
  ws: {
    gathering: null,
    mining: null,
  },
  timers: {
    gathering: { active: false, minutes: 0, seconds: 0 },
    mining: { active: false, minutes: 0, seconds: 0 },
  },
};

// load persisted timers if any
try {
  const saved = JSON.parse(localStorage.getItem("lifeskill_timers"));
  if (saved && typeof saved === "object") {
    wsManager.timers = {
      gathering: { ...wsManager.timers.gathering, ...(saved.gathering || {}) },
      mining: { ...wsManager.timers.mining, ...(saved.mining || {}) },
    };
  }
} catch (e) {
  /* ignore parse errors */
}

const saveTimers = () => {
  try {
    localStorage.setItem("lifeskill_timers", JSON.stringify(wsManager.timers));
  } catch (e) {}
};

const activeTab = ref("gathering");
const selectedDuration = ref(10);

const durations = [
  { value: 10, label: "10 minutes" },
  { value: 20, label: "20 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "60 minutes" },
  { value: 240, label: "4 hours" },
  { value: 480, label: "8 hours" },
];

// reactive wrapper around manager timers so template updates
const timers = reactive(wsManager.timers);

// current timer object for selected tab
const currentTimer = computed(() => timers[activeTab.value]);

// helper to get token
const getAuthToken = () => {
  return (
    localStorage.getItem("access") || localStorage.getItem("token") || null
  );
};

const setTimerState = (activity, minutes, seconds) => {
  timers[activity].minutes = Number(minutes) || 0;
  timers[activity].seconds = Number(seconds) || 0;
  timers[activity].active =
    timers[activity].minutes > 0 || timers[activity].seconds > 0;
  // persist
  wsManager.timers[activity] = { ...timers[activity] };
  saveTimers();
};

const clearTimerState = (activity) => {
  timers[activity].minutes = 0;
  timers[activity].seconds = 0;
  timers[activity].active = false;
  wsManager.timers[activity] = { ...timers[activity] };
  saveTimers();
};

const closeActivityWebsocket = (activity) => {
  try {
    const w = wsManager.ws[activity];
    if (w) {
      w.close();
      wsManager.ws[activity] = null;
    }
  } catch (e) {}
};

// open websocket for a specific activity and route inbound messages to that activity
const openTimerWebsocket = (activity, token) => {
  if (!token) return;
  // if already open for this activity, reuse
  if (wsManager.ws[activity]) return;

  const base = (API_BASE_WS || "").replace(/\/+$/, "");
  const wsUrl = `${base}/timer/?token=${encodeURIComponent(
    token
  )}&activity=${activity}`;

  try {
    const w = new WebSocket(wsUrl);
    wsManager.ws[activity] = w;

    w.onopen = () => {
      // no-op
    };
    w.onmessage = (ev) => {
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
        setTimerState(activity, mins, secs);

        // if finished, close this ws after short delay and clear state
        if ((Number(mins) || 0) === 0 && (Number(secs) || 0) === 0) {
          setTimeout(() => {
            closeActivityWebsocket(activity);
            clearTimerState(activity);
          }, 250);
        }
      } catch (err) {
        console.error("ws message parse error", err);
      }
    };
    w.onclose = () => {
      // keep last known timer in state (persisted). do not clear here.
      wsManager.ws[activity] = null;
    };
    w.onerror = (e) => {
      console.error("timer websocket error:", e);
    };
  } catch (err) {
    console.error("WebSocket constructor error:", err);
  }
};

// Start activity helpers
const startActivity = async (activity, endpoint) => {
  if (!selectedDuration.value) {
    showBackendMessage("Please select a duration", "error");
    return;
  }
  try {
    const response = await authFetch(
      `${API_BASE_URL}/town/lifeskill/${endpoint}/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: selectedDuration.value }),
      }
    );
    const body = await response.json().catch(() => null);
    if (response.ok) {
      showBackendMessage(`${activity} task started successfully`, "success");
      const token = getAuthToken();
      openTimerWebsocket(activity, token);
    } else {
      showBackendMessage(
        (body && (body.message || body.detail)) ||
          `Failed to start ${activity} task`,
        "error"
      );
    }
  } catch (error) {
    console.error("Error starting task:", error);
    showBackendMessage(`Failed to start ${activity} task`, "error");
  }
};

const startGatheringActivity = () =>
  startActivity("gathering", "start_gathering_task");
const startMiningActivity = () => startActivity("mining", "start_mining_task");

// try to reopen websockets for any active timers on mount (resume)
onMounted(() => {
  const token = getAuthToken();
  if (!token) return;
  if (timers.gathering.active) openTimerWebsocket("gathering", token);
  if (timers.mining.active) openTimerWebsocket("mining", token);
});
</script>

<template>
  <div class="screen-80">
    <nav
      class="navbar navbar-expand-lg bg-body-tertiary navbar bg-dark border-bottom border-body custom-navbar"
      data-bs-theme="dark"
    >
      <div class="container-fluid">
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav">
            <li class="nav-item">
              <button
                class="btn mx-2"
                :class="activeTab === 'gathering' ? 'btn-primary' : 'btn-dark'"
                @click="activeTab = 'gathering'"
              >
                Gathering
              </button>
            </li>
            <li class="nav-item">
              <button
                class="btn mx-2"
                :class="activeTab === 'mining' ? 'btn-primary' : 'btn-dark'"
                @click="activeTab = 'mining'"
              >
                Mining
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- backend message alert -->
    <!-- floating backend message (top-right, same alert format) -->
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

    <div class="content-area p-4">
      <div v-if="activeTab === 'gathering'" class="tab-content">
        <h3 class="text-light mb-4">Gathering</h3>
        <div class="duration-selector">
          <div class="select-container mb-4">
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
            class="btn btn-success"
            @click="startGatheringActivity"
            :disabled="!selectedDuration"
          >
            Start Gathering
          </button>

          <!-- timer display (gathering specific) -->
          <div v-if="timers.gathering.active" class="mt-3 text-light">
            <strong>Time remaining:</strong>
            <span>
              <template v-if="timers.gathering.minutes >= 60">
                {{ Math.floor(timers.gathering.minutes / 60) }}h
                {{ timers.gathering.minutes % 60 }}m:
                {{ String(timers.gathering.seconds).padStart(2, "0") }}s
              </template>
              <template v-else>
                {{ timers.gathering.minutes }}m:{{
                  String(timers.gathering.seconds).padStart(2, "0")
                }}s
              </template>
            </span>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'mining'" class="tab-content">
        <h3 class="text-light mb-4">Mining</h3>
        <div class="duration-selector">
          <div class="select-container mb-4">
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
            class="btn btn-success"
            @click="startMiningActivity"
            :disabled="!selectedDuration"
          >
            Start Mining
          </button>

          <!-- timer display (mining specific) -->
          <div v-if="timers.mining.active" class="mt-3 text-light">
            <strong>Time remaining:</strong>
            <span>
              <template v-if="timers.mining.minutes >= 60">
                {{ Math.floor(timers.mining.minutes / 60) }}h
                {{ timers.mining.minutes % 60 }}m:
                {{ String(timers.mining.seconds).padStart(2, "0") }}s
              </template>
              <template v-else>
                {{ timers.mining.minutes }}m:{{
                  String(timers.mining.seconds).padStart(2, "0")
                }}s
              </template>
            </span>
          </div>
        </div>
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
  overflow-y: auto;
}

.content-area {
  flex-grow: 1;
}

.duration-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.select-container {
  width: 200px;
  margin: 0 auto;
}

.form-select {
  background-color: #2b2b2b;
  color: white;
  border: 1px solid #444;
}

.form-select:focus {
  border-color: #666;
  box-shadow: 0 0 0 0.2rem rgba(130, 138, 145, 0.25);
}

.form-select option {
  background-color: #2b2b2b;
  color: white;
}

.tab-content {
  text-align: center;
}

/* new: floating backend alert in top-right, matches bootstrap alert style used elsewhere */
.backend-alert-wrapper {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1080;
  display: flex;
  align-items: flex-start;
}

/* keep bootstrap alert look, add a subtle card style to match other components */
.backend-alert {
  min-width: 280px;
  max-width: 380px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  border-radius: 0.375rem;
}

/* on very small screens move alert to center */
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
