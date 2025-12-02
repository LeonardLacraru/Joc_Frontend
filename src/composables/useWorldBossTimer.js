import { ref, computed, onMounted, onUnmounted } from 'vue';
import { authFetch } from '../utils/authFetch';

// Global state shared across all instances
const bossStatus = ref(null);
const currentTime = ref(Date.now());
let statusInterval = null;
let timeInterval = null;
let instanceCount = 0;

export function useWorldBossTimer() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const timeRemaining = computed(() => {
    if (!bossStatus.value?.end_time) return 0;

    // Backend sends Unix timestamp in seconds
    // Convert to milliseconds by multiplying by 1000
    const endTime = bossStatus.value.end_time * 1000;
    const remaining = Math.max(0, endTime - currentTime.value);

    return remaining;
  });

  const isActive = computed(() => {
    return bossStatus.value && timeRemaining.value > 0;
  });

  const formattedTime = computed(() => {
    const totalSeconds = Math.floor(timeRemaining.value / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  async function fetchBossStatus() {
    try {
      const response = await authFetch(`${API_BASE_URL}/world_boss/create_event/`);

      if (response && response.ok) {
        const data = await response.json();

        // Check if backend says no active event
        if (data.message === "No active event") {
          bossStatus.value = null;
          stopPolling();
          return;
        }

        // Only set status if we have valid timestamps
        if (data.start_time && data.end_time) {
          // Check if expired
          // Backend sends Unix timestamp in seconds, convert to milliseconds
          const endTime = data.end_time * 1000;
          const now = Date.now();

          if (now >= endTime) {
            bossStatus.value = null;
            stopPolling();
          } else {
            // Only update status, don't call startPolling here
            // Polling should already be running, or will be started externally
            const wasNull = bossStatus.value === null;
            bossStatus.value = data;

            // Only start polling if this is the first time we got an active boss
            if (wasNull) {
              startPolling();
            }
          }
        } else {
          // No active boss
          bossStatus.value = null;
          stopPolling();
        }
      } else {
        // Response not OK - no active boss
        bossStatus.value = null;
        stopPolling();
      }
    } catch (err) {
      console.error('Failed to fetch world boss status:', err);
      bossStatus.value = null;
      stopPolling();
    }
  }

  function startTimer() {
    // Update current time every 100ms for smooth countdown
    timeInterval = setInterval(() => {
      currentTime.value = Date.now();

      // Check if timer expired
      if (timeRemaining.value <= 0 && bossStatus.value) {
        bossStatus.value = null;
        // Stop polling when boss expires
        stopPolling();
      }
    }, 100);
  }

  function startPolling() {
    // Only poll if not already polling AND boss is actually active
    if (!statusInterval && bossStatus.value) {
      // Fetch boss status every 15 seconds to stay in sync
      statusInterval = setInterval(fetchBossStatus, 15000);
    }
  }

  function stopPolling() {
    if (statusInterval) {
      clearInterval(statusInterval);
      statusInterval = null;
    }
  }

  function stopTimer() {
    if (timeInterval) {
      clearInterval(timeInterval);
      timeInterval = null;
    }
    stopPolling();
  }

  onMounted(() => {
    instanceCount++;

    // Start timer if not already running
    if (!timeInterval) {
      // Fetch initial status, but don't start polling yet
      // Polling will only start if boss is active
      fetchBossStatus();
      // Start the countdown timer (this updates every 100ms)
      startTimer();
    }
  });

  onUnmounted(() => {
    instanceCount--;

    // Only stop timer when all instances are unmounted
    if (instanceCount === 0) {
      stopTimer();
    }
  });

  return {
    isActive,
    timeRemaining,
    formattedTime,
    fetchBossStatus,
  };
}
