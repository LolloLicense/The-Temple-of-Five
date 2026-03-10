/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------- CALCULATE FINAL SCORE -------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

/*
 * PURPOSE
 * - Calculate the player's final score when the game run is finished.
 * - Read saved room data from LocalStorage through getRoomResults().
 * - Return a full score breakdown
 *
 * SCORE MODEL
 * - Each completed room starts with a fixed base score.
 * - Time spent in the room reduces score.
 * - Mistakes reduce score.
 * - A flat speed bonus is added if the room is completed within its room-specific threshold.
 * - A total run bonus is added if the full run is completed quickly enough.
 *
 * IMPORTANT
 * - "final" exists in storage, but it is NOT a scorable room in this file.
 * - Score can never go below 0, neither per room nor in total.
 *
 * PSEUDOCODE
 * 1. Read full game state from LocalStorage
 * 2. For each scorable room:
 *    - If not completed => room score is 0
 *    - Else:
 *      - start from base score
 *      - subtract time penalty
 *      - subtract mistake penalty
 *      - add room speed bonus if threshold is met
 *      - clamp to minimum 0
 * 3. Sum all room values
 * 4. Get total run time
 *    - TEMP: sum completed room times
 *    - TODO: replace with getUserTotalTime() when available
 * 5. Calculate total run bonus
 * 6. Add total run bonus to total room score
 * 7. Clamp final total score to minimum 0
 * 8. Return full score result
 */

import { getRoomResults } from "../../script/helper/storage";
import { getStoredTotalTimeSec } from "./getStoredTotalTimeSec";

/*
 * TYPE: Stored room ids
 * This matches the full room structure saved in LocalStorage.
 */
export type TStoredRoomId =
  | "wood"
  | "fire"
  | "earth"
  | "metal"
  | "water"
  | "final";

/*
 * TYPE: Scorable room ids
 * These are the actual rooms that contribute to the final score.
 * The "final" room is intentionally excluded from score calculation.
 */
export type TScorableRoomId = "wood" | "fire" | "earth" | "metal" | "water";

/*
 * TYPE: Single room result from storage
 * This matches the room result shape already used in the project.
 */
export type TRoomResult = {
  status: "pending" | "completed" | "failed";
  artifact: "true" | "false" | null;
  mistakes?: number;
  score?: number;
  roomTimeSec?: number;
};

/*
 * TYPE: Full saved game state from LocalStorage
 */
export type TGameState = Record<TStoredRoomId, TRoomResult>;

/*
 * TYPE: Detailed room score breakdown
 * - debugging
 * - result screen rendering
 * - balancing score rules later
 */
export type TRoomScoreBreakdown = {
  roomId: TScorableRoomId;
  status: "pending" | "completed" | "failed";
  roomTimeSec: number;
  mistakes: number;
  baseScore: number;
  timePenalty: number;
  mistakePenalty: number;
  speedBonus: number;
  roomScore: number;
};

/*
 * TYPE: Final returned score result
 */
export type TFinalScoreResult = {
  totalScore: number;
  totalRunTimeSec: number;
  totalRunBonus: number;
  totalBaseScore: number;
  totalTimePenalty: number;
  totalMistakePenalty: number;
  totalRoomSpeedBonus: number;
  perRoom: TRoomScoreBreakdown[];
};

/*
 * SCORE BALANCE CONSTANTS
 * Keep all balancing values here.
 * This makes the system easy to tweak later without changing the calculation logic.
 */

/** Fixed base score granted for each completed room. */
const BASE_SCORE_PER_ROOM = 1500;

/** Penalty subtracted for every second spent inside a room. */
const TIME_PENALTY_PER_SECOND = 1;

/** Penalty subtracted for every registered mistake. */
const MISTAKE_PENALTY_PER_MISTAKE = 15;

/** Flat speed bonus granted when a room is completed within its threshold. */
const ROOM_SPEED_BONUS = 300;

/** Minimum allowed score for a room. */
const MIN_ROOM_SCORE = 0;

/** Minimum allowed final total score. */
const MIN_TOTAL_SCORE = 0;

/*
 * ROOM SPEED THRESHOLDS
 * Same bonus amount for every room, but different time thresholds depending on room difficulty.
 * If roomTimeSec is less than or equal to the threshold, the room gets the speed bonus.
 */
const ROOM_SPEED_THRESHOLDS: Record<TScorableRoomId, number> = {
  water: 30,
  wood: 180,
  fire: 180,
  earth: 600,
  metal: 120,
};

/*
 * TOTAL RUN BONUS RULES
 * First matching rule wins.
 * Rules must be ordered from fastest requirement to slowest requirement.
 */
const TOTAL_RUN_BONUS_RULES = [
  { maxTimeSec: 1140, bonus: 900 }, // under 19 minutes
  { maxTimeSec: 1320, bonus: 600 }, // under 22 minutes
  { maxTimeSec: 1500, bonus: 300 }, // under 25 minutes
] as const;

/*
 * SCORABLE ROOMS
 * Fixed order used when calculating the final score.
 */
const SCORABLE_ROOMS: TScorableRoomId[] = [
  "wood",
  "fire",
  "earth",
  "metal",
  "water",
];

/*
 * HELPER: getRoomSpeedBonus
 * Returns the flat speed bonus for a room if the room was completed within its threshold.
 * Otherwise returns 0.
 */
function getRoomSpeedBonus(
  roomId: TScorableRoomId,
  roomTimeSec: number,
): number {
  const threshold = ROOM_SPEED_THRESHOLDS[roomId];

  if (roomTimeSec <= threshold) {
    return ROOM_SPEED_BONUS;
  }

  return 0;
}

/*
 * HELPER: getTotalRunBonus
 * Returns bonus for the entire run based on the total run time in seconds.
 * First matching rule wins.
 */
function getTotalRunBonus(totalRunTimeSec: number): number {
  for (const rule of TOTAL_RUN_BONUS_RULES) {
    if (totalRunTimeSec <= rule.maxTimeSec) {
      return rule.bonus;
    }
  }

  return 0;
}

/*
 * HELPER: calculateRoomScore
 * Calculates score breakdown for a single room.
 *
 * RULES
 * - If room status is not "completed", the room contributes 0 score.
 * - Only completed rooms receive:
 *   - base score
 *   - time penalty
 *   - mistake penalty
 *   - possible speed bonus
 * - Final room score is clamped to minimum 0.
 */
function calculateRoomScore(
  roomId: TScorableRoomId,
  roomResult: TRoomResult,
): TRoomScoreBreakdown {
  const status = roomResult.status;
  const roomTimeSec = roomResult.roomTimeSec ?? 0;
  const mistakes = roomResult.mistakes ?? 0;

  /*
   * Non-completed rooms give no score.
   * Return a full breakdown object for consistency and easier debugging.
   */
  if (status !== "completed") {
    return {
      roomId,
      status,
      roomTimeSec,
      mistakes,
      baseScore: 0,
      timePenalty: 0,
      mistakePenalty: 0,
      speedBonus: 0,
      roomScore: 0,
    };
  }

  const baseScore = BASE_SCORE_PER_ROOM;
  const timePenalty = roomTimeSec * TIME_PENALTY_PER_SECOND;
  const mistakePenalty = mistakes * MISTAKE_PENALTY_PER_MISTAKE;
  const speedBonus = getRoomSpeedBonus(roomId, roomTimeSec);

  const rawRoomScore = baseScore - timePenalty - mistakePenalty + speedBonus;

  const roomScore = Math.max(MIN_ROOM_SCORE, rawRoomScore);

  return {
    roomId,
    status,
    roomTimeSec,
    mistakes,
    baseScore,
    timePenalty,
    mistakePenalty,
    speedBonus,
    roomScore,
  };
}

/*
 * MAIN: calculateFinalScore
 * Pure calculation function.
 *
 *
 * INPUT
 * - gameState: full saved room state
 * - totalRunTimeSec: total run time in seconds
 *
 * OUTPUT
 * - full score breakdown object
 */

export function calculateFinalScore(
  gameState: TGameState,
  totalRunTimeSec: number,
): TFinalScoreResult {
  const perRoom = SCORABLE_ROOMS.map((roomId) =>
    calculateRoomScore(roomId, gameState[roomId]),
  );

  const totalBaseScore = perRoom.reduce((sum, room) => sum + room.baseScore, 0);

  const totalTimePenalty = perRoom.reduce(
    (sum, room) => sum + room.timePenalty,
    0,
  );

  const totalMistakePenalty = perRoom.reduce(
    (sum, room) => sum + room.mistakePenalty,
    0,
  );

  const totalRoomSpeedBonus = perRoom.reduce(
    (sum, room) => sum + room.speedBonus,
    0,
  );

  const totalRoomScore = perRoom.reduce((sum, room) => sum + room.roomScore, 0);

  const totalRunBonus = getTotalRunBonus(totalRunTimeSec);

  const rawTotalScore = totalRoomScore + totalRunBonus;
  const totalScore = Math.max(MIN_TOTAL_SCORE, rawTotalScore);

  return {
    totalScore,
    totalRunTimeSec,
    totalRunBonus,
    totalBaseScore,
    totalTimePenalty,
    totalMistakePenalty,
    totalRoomSpeedBonus,
    perRoom,
  };
}

/* -------------------------------------------------------------------------------------------------
 * calculateFinalScoreFromStorage
 * Reads everything from LocalStorage-related helpers.
 *
 * - Reads room results from getRoomResults()
 * - Reads total run time from LocalStorage through getStoredTotalTimeSec()
 *
 * ----------------------------------------------------------------------------------------------- */
export function calculateFinalScoreFromStorage(): TFinalScoreResult {
  const gameState = getRoomResults() as TGameState;
  const totalRunTimeSec = getStoredTotalTimeSec();

  return calculateFinalScore(gameState, totalRunTimeSec);
}
