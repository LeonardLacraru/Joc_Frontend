import { ref, computed, onMounted, onUnmounted } from 'vue';
import { authFetch } from '../utils/authFetch';

// Global state shared across all instances
const bossStatus = ref(null);
const currentTime = ref(Date.now());
let statusInterval = null;
let timeInterval = null;
let instanceCount = 0;
let currentPollingInterval = 60000; // Start with slow polling (60 seconds)
const FAST_POLLING = 15000; // 15 seconds when boss is active
const SLOW_POLLING = 60000; // 60 seconds when boss is inactive
let consecutiveInactiveChecks = 0; // Counter for consecutive inactive checks
const MAX_INACTIVE_CHECKS = 3; // Stop polling after 3 consecutive inactive checks

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
      const response = await authFetch(`${API_BASE_URL}/world_boss/event_status/`);

      if (response && response.ok) {
        const data = await response.json();

        // Check if backend says no world boss active
        if (data.message === "No wb active" || data.status === "inactive") {
          bossStatus.value = null;
          consecutiveInactiveChecks++;

          // Stop polling after MAX_INACTIVE_CHECKS consecutive inactive checks
          if (consecutiveInactiveChecks >= MAX_INACTIVE_CHECKS) {
            stopPolling();
            return;
          }

          // Switch to slow polling when boss is inactive
          adjustPollingInterval(false);
          return;
        }

        // Check if status is active and we have valid timestamps
        if (data.status === "active" && data.start_time && data.end_time) {
          // Backend sends Unix timestamp in seconds, convert to milliseconds
          const endTime = data.end_time * 1000;
          const now = Date.now();

          if (now >= endTime) {
            bossStatus.value = null;
            consecutiveInactiveChecks++;

            if (consecutiveInactiveChecks >= MAX_INACTIVE_CHECKS) {
              stopPolling();
              return;
            }

            // Switch to slow polling
            adjustPollingInterval(false);
          } else {
            // Reset counter when boss is active
            consecutiveInactiveChecks = 0;
            // Update boss status
            bossStatus.value = data;
            // Switch to fast polling when boss is active
            adjustPollingInterval(true);
          }
        } else {
          // No active boss
          bossStatus.value = null;
          consecutiveInactiveChecks++;

          if (consecutiveInactiveChecks >= MAX_INACTIVE_CHECKS) {
            stopPolling();
            return;
          }

          // Switch to slow polling
          adjustPollingInterval(false);
        }
      } else {
        // Response not OK - no active boss
        bossStatus.value = null;
        consecutiveInactiveChecks++;

        if (consecutiveInactiveChecks >= MAX_INACTIVE_CHECKS) {
          stopPolling();
          return;
        }

        // Switch to slow polling
        adjustPollingInterval(false);
      }
    } catch (err) {
      // Silently handle error when no boss is active
      if (!bossStatus.value) {
        bossStatus.value = null;
        consecutiveInactiveChecks++;

        if (consecutiveInactiveChecks >= MAX_INACTIVE_CHECKS) {
          stopPolling();
          return;
        }

        adjustPollingInterval(false);
      } else {
        console.error('Failed to fetch world boss status:', err);
        bossStatus.value = null;
        consecutiveInactiveChecks++;

        if (consecutiveInactiveChecks >= MAX_INACTIVE_CHECKS) {
          stopPolling();
          return;
        }

        adjustPollingInterval(false);
      }
    }
  }

  function startTimer() {
    // Update current time every 100ms for smooth countdown
    timeInterval = setInterval(() => {
      currentTime.value = Date.now();

      // Check if timer expired
      if (timeRemaining.value <= 0 && bossStatus.value) {
        bossStatus.value = null;
        // Switch to slow polling when timer expires
        adjustPollingInterval(false);
      }
    }, 100);
  }

  function adjustPollingInterval(isBossActive) {
    const newInterval = isBossActive ? FAST_POLLING : SLOW_POLLING;

    // Only restart polling if interval changed
    if (newInterval !== currentPollingInterval) {
      currentPollingInterval = newInterval;

      // Restart polling with new interval
      if (statusInterval) {
        clearInterval(statusInterval);
        statusInterval = setInterval(fetchBossStatus, currentPollingInterval);
      }
    }
  }

  function startPolling() {
    // Start polling if not already running
    if (!statusInterval) {
      // Start with current polling interval
      statusInterval = setInterval(fetchBossStatus, currentPollingInterval);
    }
  }

  function stopPolling() {
    if (statusInterval) {
      clearInterval(statusInterval);
      statusInterval = null;
    }
  }

  function resumePolling() {
    // Reset the consecutive inactive checks counter
    consecutiveInactiveChecks = 0;

    // Fetch immediately
    fetchBossStatus();

    // Start polling if not already running
    if (!statusInterval) {
      startPolling();
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

    // Start timer and polling if not already running
    if (!timeInterval) {
      // Fetch initial status
      fetchBossStatus();
      // Start the countdown timer (this updates every 100ms)
      startTimer();
      // Start polling to detect new events
      startPolling();
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
    resumePolling,
  };
}
