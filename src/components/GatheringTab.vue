<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { authFetch } from "@/utils/authFetch";
import { useBackendMessage } from "../utils/useBackendMessage.js";

const { backendMessage, backendMessageType, showBackendMessage } = useBackendMessage();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

/*
  Module scoped manager so state survives component unmount/remount
*/
const timerManager = {
  timer: { active: false, remainingTime: 0 },
  isProcessingCompletion: false,
  localTimerInterval: null,
  pollInterval: null,
};

// reactive wrapper around manager timer so template updates
const timer = ref({ active: false, minutes: 0, seconds: 0 });

const saveTimer = () => {
  try {
    localStorage.setItem("gathering_timer", JSON.stringify(timerManager.timer));
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
const gatheringItems = {
  'bloom': { displayName: 'Moonpetal Bloom', image: 'bloom.png' },
  'blossoms': { displayName: 'Nightshade Blossoms', image: 'blossoms.png' },
  'dew': { displayName: 'Dew of the Forgotten Grove', image: 'dew.png' },
  'fungus': { displayName: 'Ashcap Fungus', image: 'fungus.png' },
  'mushrooms': { displayName: 'Whispering Mushrooms', image: 'mushrooms.png' },
  'vines': { displayName: 'Bloodthorn Vines', image: 'vines.png' },
};

// Store task completion results (load from localStorage if available)
const loadGatheringResult = () => {
  try {
    const saved = localStorage.getItem("gathering_last_reward");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error loading gathering result:", e);
  }
  return null;
};

const gatheringResult = ref(loadGatheringResult());

// Track if the result card is minimized
const isResultMinimized = ref(false);

// Cancel confirmation modal state
const showCancelConfirm = ref(false);

// Get image path for gathering item
const getGatheringImage = (itemName) => {
  if (!itemName) return null;
  try {
    const itemData = gatheringItems[itemName.toLowerCase()];
    if (itemData && itemData.image) {
      return new URL(`../assets/gathering/${itemData.image}`, import.meta.url).href;
    }
  } catch (e) {
    console.error("Error loading image:", e);
  }
  return null;
};

// Get display name for gathering item
const getDisplayName = (itemName) => {
  if (!itemName) return '';
  const itemData = gatheringItems[itemName.toLowerCase()];
  return itemData ? itemData.displayName : itemName;
};

const startLocalTimer = (remainingSeconds) => {
  // Clear any existing timer
  if (timerManager.localTimerInterval) {
    clearInterval(timerManager.localTimerInterval);
    timerManager.localTimerInterval = null;
  }

  timerManager.timer.remainingTime = Math.max(0, remainingSeconds);
  timerManager.timer.active = remainingSeconds > 0;

  // Update display
  const updateDisplay = () => {
    const totalSeconds = Math.max(0, timerManager.timer.remainingTime);
    timer.value = {
      active: timerManager.timer.active,
      minutes: Math.floor(totalSeconds / 60),
      seconds: totalSeconds % 60
    };
  };

  updateDisplay();
  saveTimer();

  if (remainingSeconds > 0) {
    timerManager.localTimerInterval = setInterval(() => {
      timerManager.timer.remainingTime--;

      if (timerManager.timer.remainingTime <= 0) {
        timerManager.timer.remainingTime = 0;
        timerManager.timer.active = false;
        clearInterval(timerManager.localTimerInterval);
        timerManager.localTimerInterval = null;

        // Mark that we're processing completion so we can show a message
        timerManager.isProcessingCompletion = true;

        // Poll immediately to get rewards
        pollGatheringStatus();
      }

      updateDisplay();
      saveTimer();
    }, 1000);
  }
};

const clearTimerState = () => {
  if (timerManager.localTimerInterval) {
    clearInterval(timerManager.localTimerInterval);
    timerManager.localTimerInterval = null;
  }
  timer.value = { active: false, minutes: 0, seconds: 0 };
  timerManager.timer = { active: false, remainingTime: 0 };
  saveTimer();
};

const stopPolling = () => {
  if (timerManager.pollInterval) {
    clearInterval(timerManager.pollInterval);
    timerManager.pollInterval = null;
  }
};

// Poll gathering status - handles both active tasks and rewards
const pollGatheringStatus = async () => {
  try {
    const resp = await authFetch(
      `${API_BASE_URL}/town/gathering/get_gathering_task/`
    );
    if (!resp || !resp.ok) {
      return;
    }

    const data = await resp.json().catch(() => null);
    if (!data) {
      return;
    }

    // Handle active task
    if (data.status === "active") {
      const remainingSeconds = data.remaining_seconds ?? 0;

      // Only update timer if:
      // 1. Timer is not active (first time or after completion)
      // 2. The difference between server time and local time is > 3 seconds (drift correction)
      if (remainingSeconds > 0) {
        const currentRemaining = timerManager.timer.remainingTime;
        const timeDifference = Math.abs(remainingSeconds - currentRemaining);

        if (!timerManager.timer.active || timeDifference > 3) {
          startLocalTimer(remainingSeconds);
        }
      }
    }
    // Handle completed task with rewards
    else if (data.status === "no_active_task" && data.last_reward) {
      const reward = data.last_reward;
      const result = {
        item: reward.item ? String(reward.item) : "",
        description: reward.description ? String(reward.description) : "",
        gold: reward.gold != null ? Number(reward.gold) : 0,
        experience: reward.experience != null ? Number(reward.experience) : 0,
      };

      localStorage.setItem("gathering_last_reward", JSON.stringify(result));
      gatheringResult.value = result;
      isResultMinimized.value = false;

      // Stop polling when task is complete
      stopPolling();
      clearTimerState();

      // Only show message if we were previously processing completion
      if (timerManager.isProcessingCompletion) {
        showBackendMessage("Gathering task completed!", "success");
        timerManager.isProcessingCompletion = false;
      }
    }
    // No active task and no previous rewards
    else if (data.status === "no_active_task") {
      stopPolling();
      clearTimerState();
    }
  } catch (err) {
    console.error("Error polling gathering status:", err);
  }
};

// Start polling for gathering status
const startPolling = () => {
  // Stop any existing polling
  stopPolling();

  // Poll immediately
  pollGatheringStatus();

  // Then poll every 5 seconds
  timerManager.pollInterval = setInterval(() => {
    pollGatheringStatus();
  }, 5000);
};

// Start gathering activity
const startGatheringActivity = async () => {
  if (!selectedDuration.value) {
    showBackendMessage("Please select a duration", "error");
    return;
  }
  try {
    const response = await authFetch(
      `${API_BASE_URL}/town/gathering/start_gathering_task/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: selectedDuration.value }),
      }
    );
    const body = await response.json().catch(() => null);
    if (response.ok) {
      showBackendMessage("Gathering task started successfully", "success");

      // Mark that we're processing a new task
      timerManager.isProcessingCompletion = false;

      // Start polling to get task status
      startPolling();
    } else {
      showBackendMessage(
        (body && (body.message || body.detail)) || "Failed to start gathering task",
        "error"
      );
    }
  } catch (error) {
    console.error("Error starting task:", error);
    showBackendMessage("Failed to start gathering task", "error");
  }
};

// Cancel gathering task
const cancelGatheringTask = async () => {
  try {
    const response = await authFetch(
      `${API_BASE_URL}/town/gathering/cancel_gathering_task/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!response) {
      showCancelConfirm.value = false;
      return;
    }
    const body = await response.json().catch(() => null);
    if (response.ok) {
      showBackendMessage("Gathering task cancelled", "success");
      stopPolling();
      clearTimerState();
      showCancelConfirm.value = false;
    } else {
      showBackendMessage(
        (body && (body.message || body.detail)) || "Failed to cancel gathering task",
        "error"
      );
      showCancelConfirm.value = false;
    }
  } catch (error) {
    console.error("Error cancelling task:", error);
    showBackendMessage("Failed to cancel gathering task", "error");
    showCancelConfirm.value = false;
  }
};

// On component mount
onMounted(async () => {
  // Check for any active tasks or rewards
  await pollGatheringStatus();

  // If there's an active timer, start polling
  if (timer.value.active) {
    startPolling();
  }
});

// On component unmount - cleanup intervals
onUnmounted(() => {
  stopPolling();
});
</script>

<template>
  <div class="gathering-tab">
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
    <div class="gathering-info-section">
      <div class="gathering-portrait">
        <img src="@/assets/gathering.png" alt="Gathering" />
      </div>
      <div class="gathering-info-text">
        <div class="gathering-greeting">
          Gathering Grounds
        </div>
        <div class="gathering-description">
          Venture into the mystical forests and collect rare herbs, mushrooms, and other precious resources.
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
          class="btn btn-success btn-gather"
          @click="startGatheringActivity"
          :disabled="!selectedDuration"
        >
          Start Gathering
        </button>
      </div>

      <!-- timer display - only shown when active -->
      <div v-if="timer.active" class="timer-display">
        <div class="timer-row">
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
        <button
          class="btn btn-danger btn-cancel mt-3"
          @click="showCancelConfirm = true"
        >
          Cancel Task
        </button>
      </div>
    </div>

    <!-- Cancel Confirmation Modal -->
    <div v-if="showCancelConfirm" class="modal-overlay" @click="showCancelConfirm = false">
      <div class="modal-box" @click.stop>
        <h3>Cancel Gathering Task?</h3>
        <p class="warning-text">⚠️ If you cancel this task, no rewards will be given!</p>
        <p>Are you sure you want to cancel?</p>
        <div class="modal-buttons">
          <button class="btn-cancel-modal" @click="showCancelConfirm = false">No, Continue Task</button>
          <button class="btn-danger-modal" @click="cancelGatheringTask">Yes, Cancel Task</button>
        </div>
      </div>
    </div>

    <!-- Gathering result display -->
    <div v-if="gatheringResult" class="result-card mt-4">
      <div class="card bg-dark text-light">
        <div
          class="card-header d-flex justify-content-between align-items-center"
          @click="isResultMinimized = !isResultMinimized"
          style="cursor: pointer;"
        >
          <h5 class="mb-0">Last Gathering Reward</h5>
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
            <div v-if="gatheringResult.item" class="item-display mb-3">
              <div class="item-image-wrapper">
                <img
                  v-if="getGatheringImage(gatheringResult.item)"
                  :src="getGatheringImage(gatheringResult.item)"
                  :alt="getDisplayName(gatheringResult.item)"
                  class="item-image"
                />
                <!-- Tooltip on hover with name and description -->
                <div class="item-tooltip">
                  <div class="tooltip-title">{{ getDisplayName(gatheringResult.item) }}</div>
                  <div v-if="gatheringResult.description" class="tooltip-description">
                    {{ gatheringResult.description }}
                  </div>
                </div>
              </div>
            </div>

            <p v-if="gatheringResult.gold !== undefined" class="mb-2 gold-amount">
              <strong>Gold:</strong> <span class="text-warning">+{{ gatheringResult.gold }}</span>
            </p>
            <p v-if="gatheringResult.experience !== undefined" class="mb-0 exp-amount">
              <strong>Experience:</strong> <span class="text-success">+{{ gatheringResult.experience }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gathering-tab {
  padding: 0.5rem;
}

/* Info Section - Compact */
.gathering-info-section {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 2px solid #3a1c0e;
  border-radius: 10px;
  background: linear-gradient(135deg, #1a1a22 80%, #1a2d1a 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.gathering-portrait {
  flex-shrink: 0;
}

.gathering-portrait img {
  width: 140px;
  height: 140px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #4a3c2e;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
}

.gathering-info-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #e0d4c8;
}

.gathering-greeting {
  font-size: 1.3rem;
  font-weight: bold;
  color: #d4af37;
  margin-bottom: 0.5rem;
  font-style: italic;
}

.gathering-description {
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
  background: linear-gradient(135deg, #1a1a22 80%, #1a2d1a 100%);
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

.btn-gather {
  padding: 0.4rem 1.2rem;
  font-size: 0.95rem;
  font-weight: bold;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 2px solid #2d5016;
  background: linear-gradient(135deg, #3a6b1f 0%, #2d5016 100%);
  width: auto;
  max-width: fit-content;
}

.btn-gather:hover:not(:disabled) {
  background: linear-gradient(135deg, #4a7b2f 0%, #3d6026 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(58, 107, 31, 0.5);
}

.btn-gather:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.timer-display {
  margin-top: 1.5rem;
  padding: 0.75rem;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  border: 2px solid #4a3c2e;
  color: #d4af37;
  font-size: 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.timer-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.timer-value {
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

.exp-amount {
  text-align: center;
  font-size: 1.1rem;
}

.exp-amount .text-success {
  font-weight: bold;
  font-size: 1.3rem;
}

/* Cancel button */
.btn-cancel {
  padding: 0.4rem 1.2rem;
  font-size: 0.9rem;
  font-weight: bold;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 2px solid #a52222;
  background: linear-gradient(135deg, #d32f2f 0%, #a52222 100%);
  color: white;
  width: auto;
  max-width: fit-content;
  margin-top: 0;
}

.btn-cancel:hover {
  background: linear-gradient(135deg, #e33f3f 0%, #b53232 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.5);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.modal-box {
  background: linear-gradient(135deg, #1a1a22 80%, #2d1a1a 100%);
  border: 2px solid #7a3a3a;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}

.modal-box h3 {
  color: #d4af37;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 1.5rem;
}

.modal-box p {
  color: #e0cfa9;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 1.1rem;
}

.warning-text {
  color: #ff6b6b;
  font-weight: bold;
  font-size: 1rem;
}

.modal-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.btn-cancel-modal, .btn-danger-modal {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel-modal {
  background: #4a4a4a;
  color: #fff;
}

.btn-cancel-modal:hover {
  background: #5a5a5a;
  transform: translateY(-2px);
}

.btn-danger-modal {
  background: linear-gradient(135deg, #d32f2f 0%, #a52222 100%);
  color: #fff;
}

.btn-danger-modal:hover {
  background: linear-gradient(135deg, #e33f3f 0%, #b53232 100%);
  transform: translateY(-2px);
}
</style>
