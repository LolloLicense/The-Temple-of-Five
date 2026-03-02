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

export type RoomId = "wood" | "fire" | "earth" | "metal" | "water" | "final";

// Rooom STATUS

export type RoomStatus = "pending" | "completed" | "failed";

// Artifact outcome true | false | not earned yet

export type ArtifactKind = "true" | "false" | null;

//ROOMS

export type RoomResult = {
  status: RoomStatus;
  artifact: ArtifactKind;
  mistakes: number;
  score: number;
  roomTimeSec: number;
};

// One object that holds the whole run
export type GameState = Record<RoomId, RoomResult>;

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

const DEFAULT_GAME_STATE: GameState = {
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
//------------------- PROGRESSBAR ---------------------------
//-----------------------------------------------------------
// Read current run state safe fallback if nothing is saved yet
export function getRoomResults(): GameState {
  const raw = localStorage.getItem(LS_KEY.roomResults);
  if (!raw) return DEFAULT_GAME_STATE;

  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return DEFAULT_GAME_STATE;
  }
}

// Update ONE room
export function setRoomResult(roomId: RoomId, result: RoomResult): void {
  const state = getRoomResults();
  const next: GameState = { ...state, [roomId]: result };
  localStorage.setItem(LS_KEY.roomResults, JSON.stringify(next));
}

// Reset whole run (ex: on logout or "new game")
export function resetRoomResults(): void {
  localStorage.setItem(LS_KEY.roomResults, JSON.stringify(DEFAULT_GAME_STATE));
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
