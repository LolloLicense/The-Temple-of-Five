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
  isLoggedIn: "tempelIsLoggedIn",
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

// Read current run state safe fallback if nothing is saved yet
export function getRoomResults(): TGameState {
  const raw = localStorage.getItem(LS_KEY.roomResults);
  if (!raw) return DEFAULT_GAME_STATE;

  try {
    return JSON.parse(raw) as TGameState;
  } catch {
    return DEFAULT_GAME_STATE;
  }
}

// Update ONE room
export function setRoomResult(roomId: TRoomId, result: TRoomResult): void {
  const state = getRoomResults();
  const next: TGameState = { ...state, [roomId]: result };
  localStorage.setItem(LS_KEY.roomResults, JSON.stringify(next));
  // ✅ one signal for all UI that depends on room results
  window.dispatchEvent(new Event("roomResults:changed"));
  console.log("Full gameState:", getRoomResults());
}

// Reset whole run  for -new gameBtn
export function resetRoomResults(): void {
  localStorage.setItem(LS_KEY.roomResults, JSON.stringify(DEFAULT_GAME_STATE));
}

export function resetSingleRoomResult(roomId: TRoomId): void {
  const state = getRoomResults();

  const next: TGameState = {
    ...state,
    [roomId]: { ...DEFAULT_GAME_STATE[roomId] },
  };

  localStorage.setItem(LS_KEY.roomResults, JSON.stringify(next));
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
