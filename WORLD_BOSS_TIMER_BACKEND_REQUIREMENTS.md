# World Boss Timer - Backend Requirements

## Overview
The frontend now displays a global 3-minute countdown timer in the sidebar when a world boss is active. The timer uses your existing backend endpoint.

## Existing API Endpoint

### GET `/world_boss/create_event/`

**Description**: Returns the current world boss event timestamps

**Expected Response Format** (when boss is active):
```json
{
  "start_time": "2025-12-02T10:30:00Z",
  "end_time": "2025-12-02T10:33:00Z"
}
```

**Response Fields**:
- `start_time` (ISO 8601 datetime string): When the boss was spawned
- `end_time` (ISO 8601 datetime string): When the boss event will expire

**When no boss is active**:
```json
{
  "start_time": null,
  "end_time": null
}
```
OR return an error/empty response

## How It Works

The frontend:
1. **Calls GET** `/world_boss/create_event/` to fetch timestamps
2. **Calculates** if boss is active by comparing `end_time` with current time
3. **Displays timer** if `end_time > current_time`
4. **Auto-hides** when `current_time >= end_time`

**No changes needed to your backend!** ✅

The frontend automatically:
- Determines if the boss is active (by checking if `end_time` is in the future)
- Calculates remaining time
- Hides the timer when expired

## Frontend Behavior

1. **Initial Load**: Fetches boss status when app loads
2. **Polling**: Checks boss status every 15 seconds to stay in sync
3. **Timer Update**: Updates countdown display every 100ms for smooth animation
4. **Auto-hide**: Timer automatically disappears when expired
5. **Visual**: Shows animated golden timer with sword icon in sidebar

## Notes

- The frontend handles all the countdown logic
- Backend only needs to provide the timestamps
- Timer automatically syncs if multiple tabs are open
- No WebSocket connection needed - simple polling is sufficient
- The 3-minute duration is flexible and can be changed in the backend
