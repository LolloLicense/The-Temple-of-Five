//-----------------------------------------------------------
//----------------------- INTERFACE / TYPES -----------------
//-----------------------------------------------------------

// ROOM ID used in the game
export type TRoomId = "wood" | "fire" | "earth" | "metal" | "water" | "final";

// Rooom STATUS
export type TRoomStatus = "pending" | "completed" | "failed";

// Artifact outcome true | false | not earned yet
export type TArtifactKind = "true" | "false" | null;

//ROOMS
export type TRoomResult = {
  status: TRoomStatus;
  artifact: TArtifactKind;
  mistakes?: number;
  score?: number;
  roomTimeSec?: number;
};

// One object that holds the whole run
export type TGameState = Record<TRoomId, TRoomResult>;

//-----------------------------------------------------------
//---------------LocalStorage KEY------------------
//-----------------------------------------------------------

export const LS_KEY = {
  userName: "tempelUserName",
  //for already login users so skip loginpage when re-entering
  isLoggedIn: "tempelIsLoggedIn", //// TODO -REMOVE WHEN flow should work as normal
  roomResults: "tempelRoomResults",
  totalTime: "tempelTotalTime",
  roomTime: "tempelRoomTime",
  highscores: "tempelHighscores",
  finalScore: "tempelFinalScore",
  // for replay mode
  replayMode: "tempelReplayMode",
  replayRoom: "tempelReplayRoom",
  hasActiveRun: "tempelHasActiveRun",
  resumeRoom: "tempelResumeRoom",
  runStarted: "tempelRunStarted",
} as const;

// variable for all rooms except final
const ELEMENT_ROOM_IDS: Exclude<TRoomId, "final">[] = [
  "wood",
  "fire",
  "earth",
  "metal",
  "water",
];
//-----------------------------------------------------------
//------------------- DEFAULT GAME STATE---------------------
//-----------------------------------------------------------

// create default state for one room
function createDefaultRoomResult(): TRoomResult {
  return {
    status: "pending",
    artifact: null,
    mistakes: 0,
    roomTimeSec: 0,
    score: 0,
  };
}

// Default state for the full run
// All rooms get their own default room result
const DEFAULT_GAME_STATE: TGameState = {
  wood: createDefaultRoomResult(),
  fire: createDefaultRoomResult(),
  earth: createDefaultRoomResult(),
  metal: createDefaultRoomResult(),
  water: createDefaultRoomResult(),
  final: createDefaultRoomResult(),
};

//-----------------------------------------------------------
//----------------------- USER HELPER -----------------------
//-----------------------------------------------------------

/**
 * Returns the active user id based on the saved userName.
 * Falls back to "guest" if no valid userName exists.
 */
function getActiveUserId(): string {
  // localStorage.getItem can be string || null
  const raw = localStorage.getItem(LS_KEY.userName);

  // Om det inte finns något sparat alls -> fallback
  if (raw === null) return "guest";

  // trim tar bort whitespace runtomkring (ex: "  Lollo  " -> "Lollo")
  const name = raw.trim();

  // Explicit check: om längden är 0 är det “tomt”
  if (name.length === 0) return "guest";

  // Annars är det ett giltigt user-id
  return name;
}

/**
 * Makes a localStorage-key - unique for the user
 *
 */
export function scopedKey(baseKey: string): string {
  return `${baseKey}::${getActiveUserId()}`;
}

//-----------------------------------------------------------
//----------------------- ROOM RESULT HELP ------------------
//-----------------------------------------------------------
// reurns new copy of default state
function freshDefaultGameState(): TGameState {
  return structuredClone(DEFAULT_GAME_STATE);
}

// Saves the full roomResults state for the active user
// and dispatches an event so the UI can update
function saveRoomResults(state: TGameState): void {
  localStorage.setItem(scopedKey(LS_KEY.roomResults), JSON.stringify(state));
  window.dispatchEvent(new Event("roomResults:changed"));
}

//-----------------------------------------------------------
//----------------------- RESULTS ---------------------------
//-----------------------------------------------------------

/**
 * Read current run state
 * Nu läser vi från en user-specifik key,
 */
export function getRoomResults(): TGameState {
  //  "tempelRoomResults:Lollo"
  const raw = localStorage.getItem(scopedKey(LS_KEY.roomResults));

  // if nothing is saved yet - return DEFAULT_GAME_STATE
  if (!raw) return freshDefaultGameState();

  try {
    //  TGameState ????
    return JSON.parse(raw) as TGameState;
  } catch {
    // fall back till default
    return freshDefaultGameState();
  }
}

/**
 * repeat ONE room in run state.
 * Saved on a user-specifik key.
 */
export function setRoomResult(roomId: TRoomId, result: TRoomResult): void {
  // active userns run state
  const state = getRoomResults();

  // create new updt room
  const next: TGameState = { ...state, [roomId]: result };

  saveRoomResults(next);
}

/**
 * Reset whole run  for -new gameBtn
 */
export function resetRoomResults(): void {
  saveRoomResults(freshDefaultGameState());
}

/**
 * Resets specific room for active user
 */
export function resetSingleRoomResult(roomId: TRoomId): void {
  const state = getRoomResults();

  const next: TGameState = {
    ...state,
    [roomId]: createDefaultRoomResult(),
  };

  saveRoomResults(next);
}

//-----------------------------------------------------------
//-------------------------Userdata--------------------------
//-----------------------------------------------------------

// Saving username
export function saveUserName(name: string): void {
  localStorage.setItem(LS_KEY.userName, name);
}

// Getting the username
export function getUserName(): string | null {
  return localStorage.getItem(LS_KEY.userName);
}

//Clear username when logging out
export function clearUserName(): void {
  localStorage.removeItem(LS_KEY.userName);
}

//-----------------------------------------------------------
//----------------------- LOGIN STATE -----------------------
//-----------------------------------------------------------

/* If user has logged in before and has NOT logged out visit site again
NO need to log in again*/
export function setLoggedIn(value: boolean): void {
  localStorage.setItem(LS_KEY.isLoggedIn, value ? "true" : "false");
}

// state for logged in user
export function isLoggedIn(): boolean {
  return localStorage.getItem(LS_KEY.isLoggedIn) === "true";
}

// We save username when loggout
export function logoutUser(): void {
  setLoggedIn(false);
  // keep username for convenience
}

//-----------------------------------------------------------
//----------------------- ACTIVE RUN / RESUME ---------------
//-----------------------------------------------------------

/**
 * Save whether the current user has an active run.
 */
export function setHasActiveRun(value: boolean): void {
  localStorage.setItem(
    scopedKey(LS_KEY.hasActiveRun),
    value ? "true" : "false",
  );
}

/**
 * Check if the current user has an active run.
 */
export function hasActiveRun(): boolean {
  return localStorage.getItem(scopedKey(LS_KEY.hasActiveRun)) === "true";
}

/**
 * Save which room should be resumed next.
 * This should point to the room the player should restart from,
 * not resume in the middle of.
 */
export function setResumeRoom(roomId: TRoomId): void {
  localStorage.setItem(scopedKey(LS_KEY.resumeRoom), roomId);
}

/**
 * Get the saved resume room for the current user.
 */
export function getResumeRoom(): TRoomId | null {
  const raw = localStorage.getItem(scopedKey(LS_KEY.resumeRoom));
  if (!raw) return null;
  return raw as TRoomId;
}

/**
 * Clear saved resume room for the current user.
 */
export function clearResumeRoom(): void {
  localStorage.removeItem(scopedKey(LS_KEY.resumeRoom));
}

/**
 * Marks that a run has been started for the current user.
 * Can be useful if you want to distinguish a brand new player from a paused run.
 */
export function setRunStarted(value: boolean): void {
  localStorage.setItem(scopedKey(LS_KEY.runStarted), value ? "true" : "false");
}

/**
 * Check if the user has ever started the current run.
 */
export function hasRunStarted(): boolean {
  return localStorage.getItem(scopedKey(LS_KEY.runStarted)) === "true";
}

//-----------------------------------------------------------
//----------------------- RESETS ----------------------------
//-----------------------------------------------------------

// Reset RUN without clearing highscores
/**
 * Reset current run for active user,
 * but keep saved highscores.
 */
export function resetRunKeepHighscores(): void {
  // Reset all room results to default state
  saveRoomResults(freshDefaultGameState());

  // Clear saved timers for the active run
  localStorage.removeItem(scopedKey(LS_KEY.totalTime));
  localStorage.removeItem(scopedKey(LS_KEY.roomTime));

  // Clear replay state
  localStorage.removeItem(scopedKey(LS_KEY.replayMode));
  localStorage.removeItem(scopedKey(LS_KEY.replayRoom));

  // Clear temporary run score
  localStorage.removeItem(scopedKey(LS_KEY.finalScore));

  // Clear resume / active-run state
  localStorage.removeItem(scopedKey(LS_KEY.resumeRoom));
  setHasActiveRun(false);
  localStorage.removeItem(scopedKey(LS_KEY.runStarted));
}

//-----------------------------------------------------------
//----------------------- REPLAY ----------------------------
//-----------------------------------------------------------

/**
 *Turns on replay mode and saves which room the player need to replay
 * When player clicks a failed room to replay in game over-section
 * */

export function setReplayMode(roomId: TRoomId): void {
  // tells game that we are now in replay-mode
  localStorage.setItem(scopedKey(LS_KEY.replayMode), "true");
  // saves witch room needs to be re-played by roomId
  localStorage.setItem(scopedKey(LS_KEY.replayRoom), roomId);
}

/**
 * check if replay-mode is active for current user
 * true : is active false: NOT
 */
export function isReplayMode(): boolean {
  return localStorage.getItem(scopedKey(LS_KEY.replayMode)) === "true";
}

/**
 * Returns what room is marked for replay by TRoomId
 */
export function getReplayRoom(): TRoomId | null {
  // reading re-playable room from storage key
  const raw = localStorage.getItem(scopedKey(LS_KEY.replayRoom));
  // if nothing is saved - no rooms needs replay
  if (!raw) return null;
  // if there is rooms to replay: return the saved roomId
  return raw as TRoomId;
}

/**
 * Clear mode for the active user
 * will be called when the replayed rooms are completed
 *
 */
export function clearReplayMode(): void {
  // removes active replay-mode
  localStorage.removeItem(scopedKey(LS_KEY.replayMode));
  // Removes the saved replay roomId
  localStorage.removeItem(scopedKey(LS_KEY.replayRoom));
}

/**
 * Checks if all five element rooms have earned a true artifact.
 * Used in the game over room to decide if the validation / final button should be unlocked.
 */

export function areAllElementsTrue(): boolean {
  const state = getRoomResults();

  return ELEMENT_ROOM_IDS.every((roomId) => state[roomId].artifact === "true");
}
