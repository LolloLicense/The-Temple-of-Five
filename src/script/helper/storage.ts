


//-----------------------------------------------------------
//-------------------------LocalStorage KEY------------------
//-----------------------------------------------------------

const LS_KEY = {
    userName: "tempelUserName",
    //for already login users so skip loginpage when re-entering
    isLoggedIn : "tempelIsLoggedIn",
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
export function saveUserName(name:string): void {
    localStorage.setItem(LS_KEY.userName, name);
}

// Getting the username
export function getUserName(): string | null {
    return localStorage.getItem(LS_KEY.userName)
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
//----------------------- INTERFACE -------------------------
//-----------------------------------------------------------

// The data we save for user
export interface UserData {
    userName: string;
    // lastPlayedAt?: string;
    // 
}


//-----------------------------------------------------------
//------------------- PROGRESSBAR ---------------------------
//-----------------------------------------------------------


