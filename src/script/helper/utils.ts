import * as dataJSON from "../../data.json";
import {
  setRoomResult,
  getRoomResults,
  type TGameState,
} from "../../script/helper/storage.ts";

//let localStorage: Array = [];

let totalMinutes = 0;
let totalSeconds = 0;

let roomMinutes = 0;
let roomSeconds = 0;

let roomTimeLimitMinutes = 0;
let roomTimeLimitSeconds = 0;

let totalTimerInterval: number;
let roomTimerInterval: number;

export let TimeIsUp = false;

export function startTimer(id: number): void {
  if (id === 0) {
    totalTimerInterval = setInterval(() => {
      timerTick(0);
    }, 1000);
  } else {
    clearInterval(roomTimerInterval);
    // reset the stored time limit seconds so old rooms can't leak into new rooms
    roomTimeLimitSeconds = 0;
    // reset room "time up" flag every time a room starts
    TimeIsUp = false;
    setTimeLimits(id);
    roomTimerInterval = setInterval(() => {
      timerTick(id);
    }, 1000);
  }
}

export function stopTimer(id: number): void {
  if (id === 0) {
    clearInterval(totalTimerInterval);
  } else {
    clearInterval(roomTimerInterval);
    setRoomTime(id);
    TimeIsUp = true;
  }
}

function setRoomTime(id: number): void {
  const roomMinutesSpan: HTMLElement | null =
    document.querySelector("#roomMinutesSpan");
  const roomSecondsSpan: HTMLElement | null =
    document.querySelector("#roomSecondsSpan");

  const results: TGameState = getRoomResults();

  if (roomMinutesSpan && roomSecondsSpan) {
    const roomMinutes = parseInt(roomMinutesSpan.innerHTML);
    const roomSeconds = parseInt(roomSecondsSpan.innerHTML);
    const totalRoomSeconds = roomSeconds + roomMinutes * 60;

    switch (id) {
      case 1:
        setRoomResult("wood", {
          status: results.wood.status,
          artifact: results.wood.artifact,
          mistakes: results.wood.mistakes,
          score: results.wood.score,
          roomTimeSec: totalRoomSeconds,
        });
        break;
      case 2:
        setRoomResult("fire", {
          status: results.fire.status,
          artifact: results.fire.artifact,
          mistakes: results.fire.mistakes,
          score: results.fire.score,
          roomTimeSec: totalRoomSeconds,
        });
        break;
      case 3:
        setRoomResult("earth", {
          status: results.earth.status,
          artifact: results.earth.artifact,
          mistakes: results.earth.mistakes,
          score: results.earth.score,
          roomTimeSec: totalRoomSeconds,
        });
        break;
      case 4:
        setRoomResult("metal", {
          status: results.metal.status,
          artifact: results.metal.artifact,
          mistakes: results.metal.mistakes,
          score: results.metal.score,
          roomTimeSec: totalRoomSeconds,
        });
        break;
      case 5:
        setRoomResult("water", {
          status: results.water.status,
          artifact: results.water.artifact,
          mistakes: results.water.mistakes,
          score: results.water.score,
          roomTimeSec: totalRoomSeconds,
        });
        break;
    } // SWITCH END
  } // IF roomMinutesSpan && roomSecondsSpan END
} // setRoomTime END

function timerTick(id: number): void {
  const totalMinutesSpan: HTMLElement | null =
    document.querySelector("#totalMinutesSpan");
  const totalSecondsSpan: HTMLElement | null =
    document.querySelector("#totalSecondsSpan");
  const roomMinutesSpan: HTMLElement | null =
    document.querySelector("#roomMinutesSpan");
  const roomSecondsSpan: HTMLElement | null =
    document.querySelector("#roomSecondsSpan");

  if (id === 0) {
    totalSeconds++;
    if (totalSecondsSpan) {
      if (totalSeconds < 10) {
        totalSecondsSpan.innerHTML = `0${totalSeconds}` as unknown as string;
      } else {
        totalSecondsSpan.innerHTML = totalSeconds as unknown as string;
      }
    }
    if (totalSeconds > 59) {
      totalMinutes++;
      totalSeconds = 0;
      if (totalSecondsSpan) {
        totalSecondsSpan.innerHTML = `0${totalSeconds}` as unknown as string;
      }
      if (totalMinutesSpan) {
        if (totalMinutes > 9) {
          totalMinutesSpan.innerHTML = totalMinutes as unknown as string;
        } else {
          totalMinutesSpan.innerHTML = ("0" +
            totalMinutes) as unknown as string;
        }
      }
    }
  } else {
    // If this is a room timer
    roomSeconds--;
    if (roomSecondsSpan) {
      if (roomSeconds < 10) {
        roomSecondsSpan.innerHTML = `0${roomSeconds}` as unknown as string;
      } else {
        roomSecondsSpan.innerHTML = roomSeconds as unknown as string;
      }
    }
    if (roomSeconds < 1) {
      roomSeconds = 59;
      roomMinutes--;
      if (roomSecondsSpan) {
        roomSecondsSpan.innerHTML = roomSeconds as unknown as string;
        if (roomMinutes < 0) {
          roomSecondsSpan.innerHTML = `00`;
        }
      }
      if (roomMinutesSpan) {
        if (roomMinutes > 9) {
          roomMinutesSpan.innerHTML = roomMinutes as unknown as string;
        } else {
          roomMinutesSpan.innerHTML = `0${roomMinutes}` as unknown as string;
        }
        if (roomMinutes < 0) {
          roomMinutesSpan.innerHTML = `00`;
          stopTimer(id);
        }
      }
    } // IF minute END
  } // outer else END
} // timerTick END

function setTimeLimits(id: number) {
  const roomMinutesSpan: HTMLElement | null =
    document.querySelector("#roomMinutesSpan");
  const roomSecondsSpan: HTMLElement | null =
    document.querySelector("#roomSecondsSpan");

  roomTimeLimitSeconds = 0; // reset seconds so old room seconds can't "stick"
  roomSeconds = 0; // reset current seconds before applying new limit
  // default seconds to 0 every time, so only rooms that set seconds override it
  roomTimeLimitSeconds = 0;
  switch (
    id // switch on room id (ex: 1 = wood)
  ) {
    case 1: // Wood
      roomTimeLimitMinutes = dataJSON.room1wood.timeLimitMinutes; //Get minutes from JSON
      if (dataJSON.room1wood.timeLimitSeconds > 0) {
        // include seconds IF JSON seconds are not 0
        roomTimeLimitSeconds = dataJSON.room1wood.timeLimitSeconds; // Set seconds from JSON
      }
      break;
    case 2: // Fire
      roomTimeLimitMinutes = dataJSON.room2fire.timeLimitMinutes; //Get minutes from JSON
      if (dataJSON.room2fire.timeLimitSeconds > 0) {
        // include seconds IF JSON seconds are not 0
        roomTimeLimitSeconds = dataJSON.room2fire.timeLimitSeconds; // Set seconds from JSON
      }
      break;
    case 3: // Earth
      roomTimeLimitMinutes = dataJSON.room3earth.timeLimitMinutes; //Get minutes from JSON
      if (dataJSON.room3earth.timeLimitSeconds > 0) {
        // include seconds IF JSON seconds are not 0
        roomTimeLimitSeconds = dataJSON.room3earth.timeLimitSeconds; // Set seconds from JSON
      }
      break;
    case 4: // Metal
      roomTimeLimitMinutes = dataJSON.room4metal.timeLimitMinutes; //Get minutes from JSON
      if (dataJSON.room4metal.timeLimitSeconds > 0) {
        // include seconds IF JSON seconds are not 0
        roomTimeLimitSeconds = dataJSON.room4metal.timeLimitSeconds; // Set seconds from JSON
      }
      break;
    case 5: // Water
      roomTimeLimitMinutes = dataJSON.room5water.timeLimitMinutes; //Get minutes from JSON
      if (dataJSON.room5water.timeLimitSeconds > 0) {
        // include seconds IF JSON seconds are not 0
        roomTimeLimitSeconds = dataJSON.room5water.timeLimitSeconds; // Set seconds from JSON
      }
      break;
    case 6: // Final
      roomTimeLimitMinutes = dataJSON.room6validate.timeLimitMinutes; //Get minutes from JSON
      if (dataJSON.room6validate.timeLimitSeconds > 0) {
        // include seconds IF JSON seconds are not 0
        roomTimeLimitSeconds = dataJSON.room6validate.timeLimitSeconds; // Set seconds from JSON
      }
      break;
  } // Switch END

  /* Setting and printing out the time limits for the room in header */

  roomSeconds = roomTimeLimitSeconds; //Set timer seconds to limit
  roomMinutes = roomTimeLimitMinutes; //Set timer minutes to limit

  /* Minutes */
  if (roomMinutesSpan) {
    if (roomMinutes < 10) {
      roomMinutesSpan.innerHTML = `0${roomMinutes}` as unknown as string;
    } else {
      roomMinutesSpan.innerHTML = roomMinutes as unknown as string;
    }
  }
  /* Seconds */
  if (roomSecondsSpan) {
    if (roomSeconds < 10) {
      roomSecondsSpan.innerHTML = `0${roomSeconds}` as unknown as string;
    } else {
      roomSecondsSpan.innerHTML = roomSeconds as unknown as string;
    }
  }
} // setTimeLimits END

export function getTotalTime(): { minutes: number; seconds: number } {
  return { minutes: totalMinutes, seconds: totalSeconds };
}

export function getRoomTimeLeft(): { minutes: number; seconds: number } {
  return { minutes: roomMinutes, seconds: roomSeconds };
}

/**
 * Clean path for audio files and prepend base URL from Vite config. Because the audio files are located in the public folder, which is served at the root of the project.
 */

export function withBaseUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${cleanPath}`;
}
