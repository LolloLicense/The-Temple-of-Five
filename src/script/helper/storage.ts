//-----------------------------------------------------------
//----------------------- INTERFACE -------------------------
//-----------------------------------------------------------

// The data we save for user
export interface IUserData {
  userName: string;
  // lastPlayedAt?: string;
  //
}

//-----------------------------------------------------------
//-------------------------LocalStorage KEY------------------
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
//-------------------------ROOMS-----------------------------
//-----------------------------------------------------------
// roomID
export type RoomId = "wood" | "fire" | "earth" | "metal" | "water" | "final";

// Minimal status per room for progress + artifacts
export type RoomStatus = "pending" | "completed" | "failed";
export type ArtifactKind = "true" | "false" | null;

export type RoomResult = {
  status: RoomStatus;
  artifact: ArtifactKind;
};

// One object that holds the whole run
export type GameState = Record<RoomId, RoomResult>;

//mapping from json
// const ROOM_JSON_KEY: Record<RoomId, keyof typeof import("../data.json")> = {
//     wood: "room1wood",
//     fire: "room2fire",
//     earth: "room3earth",
//     metal: "room4metal",
//     water: "room5water",
//     final: "room6validate",
// }as const;

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

//-----------------------------------------------------------
//------------------- PROGRESSBAR ---------------------------
//-----------------------------------------------------------

const DEFAULT_GAME_STATE: GameState = {
  wood: { status: "pending", artifact: null },
  fire: { status: "pending", artifact: null },
  earth: { status: "pending", artifact: null },
  metal: { status: "pending", artifact: null },
  water: { status: "pending", artifact: null },
  final: { status: "pending", artifact: null },
};

// Read current run state (safe fallback if nothing is saved yet)
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
