let totalSeconds = 0;
let roomSeconds = 0;

let totalMinutes = 0;
let roomMinutes = 0;

let totalTimerInterval: any;
let roomTimerInterval: any;

export function startTimer(id: number): void {
  if (id === 0) {
    totalTimerInterval = setInterval(function () {
      timerTick(0);
    }, 1000); // om funktionen slutar funka testa setInterval(() => timerTick(0), 1000);
  } else {
    roomTimerInterval = setInterval(function () {
      timerTick(id);
    }, 1000); // om funktionen slutar funka testa setInterval(() => timerTick(id), 1000);
  }
}

export function stopTimer(id: number): void {
  if (id === 0) {
    clearInterval(totalTimerInterval);
  } else {
    clearInterval(roomTimerInterval);
  }
}

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
        totalSecondsSpan.innerHTML = ("0" + totalSeconds) as unknown as string;
      } else {
        totalSecondsSpan.innerHTML = totalSeconds as unknown as string;
      }
    }
    if (totalSeconds > 59) {
      totalMinutes++;
      totalSeconds = 0;
      if (totalSecondsSpan) {
        totalSecondsSpan.innerHTML = ("0" + totalSeconds) as unknown as string;
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
    roomSeconds++;
    if (roomSecondsSpan) {
      if (roomSeconds < 10) {
        roomSecondsSpan.innerHTML = ("0" + roomSeconds) as unknown as string;
      } else {
        roomSecondsSpan.innerHTML = roomSeconds as unknown as string;
      }
    }
    if (roomSeconds > 59) {
      roomMinutes++;
      roomSeconds = 0;
      if (roomSecondsSpan) {
        roomSecondsSpan.innerHTML = ("0" + roomSeconds) as unknown as string;
      }
      if (roomMinutesSpan) {
        if (totalMinutes > 9) {
          roomMinutesSpan.innerHTML = roomMinutes as unknown as string;
        } else {
          roomMinutesSpan.innerHTML = ("0" + roomMinutes) as unknown as string;
        }
      }
    } // IF minute END
  } // outer else END
} // timerTick END

