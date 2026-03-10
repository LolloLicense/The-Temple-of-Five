import { calculateFinalScoreFromStorage } from "./calculateFinalScore";

/**
 * Debug helper
 * Logs full score breakdown for each room.
 */
export function debugScoreBreakdown(): void {
  const result = calculateFinalScoreFromStorage();

  console.log("========== SCORE BREAKDOWN ==========");

  for (const room of result.perRoom) {
    console.log(`ROOM: ${room.roomId}`);
    console.log("status:", room.status);
    console.log("time:", room.roomTimeSec);
    console.log("mistakes:", room.mistakes);
    console.log("base:", room.baseScore);
    console.log("time penalty:", room.timePenalty);
    console.log("mistake penalty:", room.mistakePenalty);
    console.log("speed bonus:", room.speedBonus);
    console.log("room score:", room.roomScore);
    console.log("------------------------------");
  }

  console.log("TOTAL RUN TIME:", result.totalRunTimeSec);
  console.log("TOTAL RUN BONUS:", result.totalRunBonus);
  console.log("FINAL SCORE:", result.totalScore);

  console.log("=====================================");
}
