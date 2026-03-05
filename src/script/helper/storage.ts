//-----------------------------------------------------------
//----------------------- INTERFACE / TYPES -----------------
//-----------------------------------------------------------

// The data we save for user
export interface IUserData {
  userName: string;
  // lastPlayedAt?: string;
  //
}

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

const LS_KEY = {
  userName: "tempelUserName",
  //for already login users so skip loginpage when re-entering
  isLoggedIn: "tempelIsLoggedIn", //// TODO -REMOVE WHEN flow should work as normal
  roomResults: "tempelRoomResults",
  totalTime: "tempelTotalTime",
  roomTime: "tempelRoomTime",
  highscores: "tempelHighscores",
  artifacts: "artifacts",
} as const;

//-----------------------------------------------------------
//------------------- DEAFAUL GAME STATE---------------------
//-----------------------------------------------------------

const DEFAULT_GAME_STATE: TGameState = {
  wood: {
    status: "pending",
    artifact: null,
    mistakes: 0,
    roomTimeSec: 0,
    score: 0,
  },
  fire: {
    status: "pending",
    artifact: null,
    mistakes: 0,
    roomTimeSec: 0,
    score: 0,
  },
  earth: {
    status: "pending",
    artifact: null,
    mistakes: 0,
    roomTimeSec: 0,
    score: 0,
  },
  metal: {
    status: "pending",
    artifact: null,
    mistakes: 0,
    roomTimeSec: 0,
    score: 0,
  },
  water: {
    status: "pending",
    artifact: null,
    mistakes: 0,
    roomTimeSec: 0,
    score: 0,
  },
  final: {
    status: "pending",
    artifact: null,
    mistakes: 0,
    roomTimeSec: 0,
    score: 0,
  },
};

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
  if (!raw) return DEFAULT_GAME_STATE;

  try {
    //  TGameState ????
    return JSON.parse(raw) as TGameState;
  } catch {
    // fall back till default
    return DEFAULT_GAME_STATE;
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

  // Save to "tempelRoomResults:Lollo"
  localStorage.setItem(scopedKey(LS_KEY.roomResults), JSON.stringify(next));

  // Sends event so UI udts
  window.dispatchEvent(new Event("roomResults:changed"));
}

/**
 * Reset whole run  for -new gameBtn
 */
export function resetRoomResults(): void {
  localStorage.setItem(
    scopedKey(LS_KEY.roomResults), // user-specific key
    JSON.stringify(freshDefaultGameState()),
  );

  window.dispatchEvent(new Event("roomResults:changed"));
}

/**
 * Resets specific room for active user
 */
export function resetSingleRoomResult(roomId: TRoomId): void {
  const state = getRoomResults();

  const next: TGameState = {
    ...state,
    [roomId]: { ...DEFAULT_GAME_STATE[roomId] },
  };

  // Saves to same user
  localStorage.setItem(scopedKey(LS_KEY.roomResults), JSON.stringify(next));

  window.dispatchEvent(new Event("roomResults:changed"));
}

//-----------------------------------------------------------
//-------------------------Userdata--------------------------
//-----------------------------------------------------------

// Saving username
export function saveUserName(name: string): void {
  localStorage.setItem(LS_KEY.userName, name);
}

/**
 * Find what user is active by userName-id
 * of username is new user NewUserName
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
function scopedKey(baseKey: string): string {
  return `${baseKey}::${getActiveUserId()}`;
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

/* If user has logged in before and has NOT logged out visit site againg
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

function freshDefaultGameState(): TGameState {
  // structuredClone finns i moderna browsers. Annars kan vi göra JSON-klon.
  return structuredClone(DEFAULT_GAME_STATE);
}

//-----------------------------------------------------------
//----------------------- RESETS ----------------------------
//-----------------------------------------------------------

// Reset RUN without clearing highscores
export function resetRunKeepHighscores(): void {
  // Reset run state för AKTIV user
  localStorage.setItem(
    scopedKey(LS_KEY.roomResults),
    JSON.stringify(freshDefaultGameState()),
  );

  // Reset timers för AKTIV user (om du vill spara dem per user)
  localStorage.removeItem(scopedKey(LS_KEY.totalTime));
  localStorage.removeItem(scopedKey(LS_KEY.roomTime));

  // OBS: LS_KEY.artifacts använder du inte längre som “källa”,
  // eftersom artifacts redan ligger i roomResults -> state[roomId].artifact.
  // Men om du ändå har kvar den av legacy-skäl:
  localStorage.removeItem(scopedKey(LS_KEY.artifacts));

  window.dispatchEvent(new Event("roomResults:changed"));
}
