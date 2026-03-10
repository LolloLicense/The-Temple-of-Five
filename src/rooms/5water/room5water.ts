/**
 * Water Room (room5water.ts)
 *
 * This file implements the logic for the Water Chamber puzzle in the game.
 *
 * - The player must rotate pipes on a dynamic grid (default 5x5, configurable via GRID_SIZE)
 *   to connect the water source (top-left) to the vessel (bottom-right).
 * - The grid, path generation, and flow-checking logic are all dynamic and use constants
 *   for flexibility.
 * - Accessibility is considered with ARIA labels and keyboard navigation.
 * - Results are saved using setRoomResult for consistency with other rooms.
 * - The code is structured for maintainability and future scalability.
 *
 * Key features:
 * - Dynamic grid and path generation
 * - Keyboard and mouse controls
 * - Accessibility via ARIA labels
 * - Flexible result saving and transitions
 * - Cleanup so old room logic does not keep running after room leave
 */

import { playBgm, stopAll } from "../../audio/index.ts";
import * as dataJSON from "../../data.json";
import { showGameHeader } from "../../script/helper/gameHeader.ts";
import { updateProgressBar } from "../../script/helper/progressbar.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
import { showMsg } from "../../script/helper/showMsg.ts";
import {
  resetSingleRoomResult,
  setRoomResult,
} from "../../script/helper/storage.ts";
import {
  getCurrentPage,
  goToSection,
} from "../../script/helper/transitions.ts";
import {
  startTimer as startSharedTimer,
  stopTimer as stopSharedTimer,
  TimeIsUp,
} from "../../script/helper/utils.ts";
import { room6finalFunc } from "../final/room6validate.ts";

// ── TYPES ──────────────────────────────────────────────────────────────────

type TPipeType = "NS" | "EW" | "NE" | "NW" | "SE" | "SW";
type TCellType = TPipeType | "SRC" | "SNK";
type TDirection = "N" | "E" | "S" | "W";
type TConnections = Record<TDirection, boolean>;
type TGrid = TCellType[][];

interface IPipeDef {
  c: [boolean, boolean, boolean, boolean]; // N, E, S, W
  label: string;
}

interface IFlowResult {
  flowPath: Set<string>;
  sinkReached: boolean;
}

// ── CONSTANTS ──────────────────────────────────────────────────────────────

const PIPE_DEFS: Record<TPipeType, IPipeDef> = {
  NS: { c: [true, false, true, false], label: "Straight vertical pipe" },
  EW: { c: [false, true, false, true], label: "Straight horizontal pipe" },
  NE: {
    c: [true, true, false, false],
    label: "Elbow connecting top and right",
  },
  NW: {
    c: [true, false, false, true],
    label: "Elbow connecting top and left",
  },
  SE: {
    c: [false, true, true, false],
    label: "Elbow connecting bottom and right",
  },
  SW: {
    c: [false, false, true, true],
    label: "Elbow connecting bottom and left",
  },
};

const ROTATE_MAP: Record<TPipeType, TPipeType> = {
  NS: "EW",
  EW: "NS",
  NE: "SE",
  SE: "SW",
  SW: "NW",
  NW: "NE",
};

const DIR_DELTA: Record<TDirection, [number, number]> = {
  N: [-1, 0],
  S: [1, 0],
  E: [0, 1],
  W: [0, -1],
};

const OPPOSITE: Record<TDirection, TDirection> = {
  N: "S",
  S: "N",
  E: "W",
  W: "E",
};

const GRID_SIZE = 5;
const TARGET_INDEX = GRID_SIZE - 1;
const FIXED_CELLS = new Set<string>([`0,0`, `${TARGET_INDEX},${TARGET_INDEX}`]);
const MAX_SCORE = 1000;
const SCORE_PER_SECOND = 3;
const TRANSITION_MS = 1200;

// ── MODULE STATE ───────────────────────────────────────────────────────────

let currentGrid: TGrid = [];
let focusedCell: [number, number] = [0, 0];
let timerInterval: ReturnType<typeof setInterval> | null = null;
let secondsElapsed = 0;
let solved = false;
let SOURCE_EXIT_DIR: TDirection = "E";
let SINK_ENTRY_DIR: TDirection = "W";
let listenersBound = false;
let isTransitioning = false;
let waterSection: HTMLElement | null = null;

// ── CLEANUP-RELATED STATE ──────────────────────────────────────────────────

let timeUpIntervalId: number | null = null;
let failTimeoutId: number | null = null;
let solveTimeoutId: number | null = null;
let focusTimeoutId: number | null = null;

// ── PIPE SVG ───────────────────────────────────────────────────────────────

function pipeSVG(type: TPipeType): string {
  const c = 22;
  const open = `<svg class="pipe-svg" viewBox="0 0 44 44" aria-hidden="true" focusable="false">`;
  const paths: Record<TPipeType, string> = {
    NS: `<line x1="${c}" y1="0"  x2="${c}" y2="44"/>`,
    EW: `<line x1="0"   y1="${c}" x2="44" y2="${c}"/>`,
    NE: `<path d="M${c} 0 L${c} ${c} L44 ${c}"/>`,
    NW: `<path d="M${c} 0 L${c} ${c} L0  ${c}"/>`,
    SE: `<path d="M${c} 44 L${c} ${c} L44 ${c}"/>`,
    SW: `<path d="M${c} 44 L${c} ${c} L0  ${c}"/>`,
  };
  return `${open}${paths[type]}</svg>`;
}

// ── CLEANUP HELPERS ────────────────────────────────────────────────────────

function stopInternalTimer(): void {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function stopTimeUpWatcher(): void {
  if (timeUpIntervalId !== null) {
    window.clearInterval(timeUpIntervalId);
    timeUpIntervalId = null;
  }
}

function stopFailTimeout(): void {
  if (failTimeoutId !== null) {
    window.clearTimeout(failTimeoutId);
    failTimeoutId = null;
  }
}

function stopSolveTimeout(): void {
  if (solveTimeoutId !== null) {
    window.clearTimeout(solveTimeoutId);
    solveTimeoutId = null;
  }
}

function stopFocusTimeout(): void {
  if (focusTimeoutId !== null) {
    window.clearTimeout(focusTimeoutId);
    focusTimeoutId = null;
  }
}

/**
 * Cleanup Water room async logic so old watchers / timers / delayed callbacks
 * do not continue after leaving the room.
 */
function cleanupWaterRoom(): void {
  stopInternalTimer();
  stopSharedTimer(5);
  stopTimeUpWatcher();
  stopFailTimeout();
  stopSolveTimeout();
  stopFocusTimeout();
}

// ── PUZZLE GENERATION ──────────────────────────────────────────────────────

function pipeForDirs(a: TDirection, b: TDirection): TPipeType {
  const key = [a, b].sort().join("");
  const map: Record<string, TPipeType> = {
    NS: "NS",
    EW: "EW",
    EN: "NE",
    NE: "NE",
    NW: "NW",
    WN: "NW",
    ES: "SE",
    SE: "SE",
    SW: "SW",
    WS: "SW",
  };
  return map[key] ?? "EW";
}

function randomPath(): [number, number][] {
  const MAX_TRIES = 300;

  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const visited = new Set<string>(["0,0"]);
    const path: [number, number][] = [[0, 0]];
    let r = 0;
    let c = 0;
    let stuck = false;

    while (!(r === TARGET_INDEX && c === TARGET_INDEX)) {
      const moves: [TDirection, number, number][] = [];

      for (const [dir, [dr, dc]] of Object.entries(DIR_DELTA) as [
        TDirection,
        [number, number],
      ][]) {
        const nr = r + dr;
        const nc = c + dc;

        if (nr < 0 || nr > TARGET_INDEX || nc < 0 || nc > TARGET_INDEX)
          continue;
        if (visited.has(`${nr},${nc}`)) continue;

        // Prefer moving toward the goal, but still allow variation
        const weight = (nr >= r ? 2 : 1) + (nc >= c ? 2 : 1);
        for (let w = 0; w < weight; w++) moves.push([dir, nr, nc]);
      }

      if (moves.length === 0) {
        stuck = true;
        break;
      }

      const [, nr, nc] = moves[Math.floor(Math.random() * moves.length)];
      visited.add(`${nr},${nc}`);
      path.push([nr, nc]);
      r = nr;
      c = nc;

      if (path.length > GRID_SIZE * GRID_SIZE) {
        stuck = true;
        break;
      }
    }

    if (!stuck && r === TARGET_INDEX && c === TARGET_INDEX) return path;
  }

  // Fallback: simple L-shape path
  const path: [number, number][] = [];
  for (let col = 0; col <= TARGET_INDEX; col++) path.push([0, col]);
  for (let row = 1; row <= TARGET_INDEX; row++) path.push([row, TARGET_INDEX]);
  return path;
}

function buildSolutionGrid(path: [number, number][]): TGrid {
  const grid: TGrid = Array.from(
    { length: GRID_SIZE },
    () => Array(GRID_SIZE).fill(null) as TCellType[],
  );

  grid[0][0] = "SRC";
  grid[TARGET_INDEX][TARGET_INDEX] = "SNK";

  for (let i = 1; i < path.length - 1; i++) {
    const [r, c] = path[i];
    const [pr, pc] = path[i - 1];
    const [nr, nc] = path[i + 1];

    const fromDir: TDirection =
      pr === r - 1 ? "N" : pr === r + 1 ? "S" : pc === c - 1 ? "W" : "E";

    const toDir: TDirection =
      nr === r - 1 ? "N" : nr === r + 1 ? "S" : nc === c - 1 ? "W" : "E";

    grid[r][c] = pipeForDirs(fromDir, toDir);
  }

  const pipeTypes: TPipeType[] = ["NS", "EW", "NE", "NW", "SE", "SW"];

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === null) {
        grid[row][col] =
          pipeTypes[Math.floor(Math.random() * pipeTypes.length)];
      }
    }
  }

  return grid;
}

function scrambleGrid(grid: TGrid, fixedCells: Set<string>): TGrid {
  const g: TGrid = grid.map((row) => [...row]);

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (fixedCells.has(`${r},${c}`)) continue;
      if (g[r][c] === "SRC" || g[r][c] === "SNK") continue;

      let t = g[r][c] as TPipeType;
      const rotations = Math.floor(Math.random() * 4);

      for (let i = 0; i < rotations; i++) {
        t = ROTATE_MAP[t];
      }

      g[r][c] = t;
    }
  }

  return g;
}

function initGrid(): void {
  const path = randomPath();

  const [r1, c1] = path[1];
  SOURCE_EXIT_DIR = r1 > 0 ? "S" : c1 > 0 ? "E" : r1 < 0 ? "N" : "W";

  const [pr, pc] = path[path.length - 2];
  SINK_ENTRY_DIR =
    pr < TARGET_INDEX
      ? "N"
      : pc < TARGET_INDEX
        ? "W"
        : pr > TARGET_INDEX
          ? "S"
          : "E";

  currentGrid = scrambleGrid(buildSolutionGrid(path), FIXED_CELLS);
}

// ── FLOW CHECK ─────────────────────────────────────────────────────────────

function getConnections(type: TCellType): TConnections {
  if (type === "SRC") {
    return {
      N: SOURCE_EXIT_DIR === "N",
      E: SOURCE_EXIT_DIR === "E",
      S: SOURCE_EXIT_DIR === "S",
      W: SOURCE_EXIT_DIR === "W",
    };
  }

  if (type === "SNK") {
    return {
      N: SINK_ENTRY_DIR === "N",
      E: SINK_ENTRY_DIR === "E",
      S: SINK_ENTRY_DIR === "S",
      W: SINK_ENTRY_DIR === "W",
    };
  }

  const def = PIPE_DEFS[type as TPipeType];
  if (!def) return { N: false, E: false, S: false, W: false };

  const [n, e, s, w] = def.c;
  return { N: n, E: e, S: s, W: w };
}

function checkFlow(grid: TGrid): IFlowResult {
  const visited = new Set<string>();
  const flowPath = new Set<string>();
  const queue: [number, number][] = [[0, 0]];
  visited.add("0,0");

  while (queue.length) {
    const [r, c] = queue.shift()!;
    flowPath.add(`${r},${c}`);

    const conns = getConnections(grid[r][c]);

    for (const dir of ["N", "E", "S", "W"] as TDirection[]) {
      if (!conns[dir]) continue;

      const [dr, dc] = DIR_DELTA[dir];
      const nr = r + dr;
      const nc = c + dc;

      if (nr < 0 || nr > TARGET_INDEX || nc < 0 || nc > TARGET_INDEX) continue;

      const nkey = `${nr},${nc}`;
      if (visited.has(nkey)) continue;
      if (!getConnections(grid[nr][nc])[OPPOSITE[dir]]) continue;

      visited.add(nkey);
      queue.push([nr, nc]);
    }
  }

  const targetKey = `${TARGET_INDEX},${TARGET_INDEX}`;
  return { flowPath, sinkReached: flowPath.has(targetKey) };
}

// ── RENDER ─────────────────────────────────────────────────────────────────

function buildCellAriaLabel(
  type: TCellType,
  r: number,
  c: number,
  isFixed: boolean,
  inFlow: boolean,
): string {
  if (type === "SRC") return "Water source, row 1 column 1, fixed";

  if (type === "SNK") {
    return `Sacred vessel, row ${GRID_SIZE} column ${GRID_SIZE}${inFlow ? ", water flowing in — vessel filled!" : ", awaiting water"}`;
  }

  const def = PIPE_DEFS[type as TPipeType];

  return `${def?.label ?? type}, row ${r + 1} col ${c + 1}${isFixed ? ", fixed" : ", rotatable"}${inFlow ? ", water flowing" : ""}`;
}

function renderGrid(): void {
  const gridEl = document.getElementById("w-pipe-grid");
  if (!gridEl) return;

  if (!gridEl.hasAttribute("role")) {
    gridEl.setAttribute("role", "region");
    gridEl.setAttribute("aria-label", "Pipe puzzle grid");
  }

  gridEl.innerHTML = "";

  const { flowPath } = checkFlow(currentGrid);

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const type = currentGrid[r][c];
      const key = `${r},${c}`;
      const isFixed = FIXED_CELLS.has(key) || type === "SRC" || type === "SNK";
      const inFlow = flowPath.has(key);
      const isSource = type === "SRC";
      const isSink = type === "SNK";
      const isFocused = focusedCell[0] === r && focusedCell[1] === c;

      const cell = document.createElement("div");
      cell.className = [
        "pipe-cell",
        isFixed ? "fixed" : "",
        inFlow && !isSource && !isSink ? "active-flow" : "",
        isSource ? "source" : "",
        isSink ? (inFlow ? "sink filled" : "sink") : "",
      ]
        .filter(Boolean)
        .join(" ");

      cell.setAttribute("role", "gridcell");
      cell.setAttribute("data-row", String(r));
      cell.setAttribute("data-col", String(c));
      cell.setAttribute("tabindex", isFocused ? "0" : "-1");
      cell.setAttribute(
        "aria-label",
        buildCellAriaLabel(type, r, c, isFixed, inFlow),
      );

      if (!isFixed) {
        cell.setAttribute("aria-description", "Press Enter or Space to rotate");
      }

      if (isSource) {
        cell.innerHTML = `<span aria-hidden="true" style="font-size:1.6rem;">💧</span>`;
      } else if (isSink) {
        cell.innerHTML = `<span aria-hidden="true" style="font-size:1.6rem;">${inFlow ? "🏺" : "⚱️"}</span>`;
      } else {
        cell.innerHTML = pipeSVG(type as TPipeType);
      }

      cell.addEventListener("click", () => {
        // Ignore clicks if Water is no longer active
        if (getCurrentPage() !== waterSection) return;
        if (solved) return;

        focusedCell = [r, c];

        if (!isFixed) {
          rotatePipe(r, c);
        }

        renderGrid();
        focusCellEl(r, c);
      });

      gridEl.appendChild(cell);
    }
  }
}

function rotatePipe(r: number, c: number): void {
  const type = currentGrid[r][c];
  if (type === "SRC" || type === "SNK") return;

  const rotated = ROTATE_MAP[type as TPipeType];
  currentGrid[r][c] = rotated;
  announce(`Rotated to ${PIPE_DEFS[rotated]?.label}`);
}

function focusCellEl(r: number, c: number): void {
  (
    document.querySelector(
      `[data-row="${r}"][data-col="${c}"]`,
    ) as HTMLElement | null
  )?.focus();
}

// ── TIMER ──────────────────────────────────────────────────────────────────

function startInternalTimer(): void {
  timerInterval = setInterval(() => {
    secondsElapsed++;
    checkWarning();
  }, 1000);
}

function checkWarning(): void {
  if (secondsElapsed === 60) {
    document.getElementById("w-time-warning")?.classList.add("visible");
    announce(
      "Warning: the temple grows impatient. Solve quickly or the artifact may be impure.",
    );
  }
}

// ── TIME-UP WATCHER ────────────────────────────────────────────────────────

function ifRoomFailed(): void {
  if (isTransitioning) return;

  isTransitioning = true;

  cleanupWaterRoom();

  setRoomResult("water", {
    status: "failed",
    artifact: "false",
    mistakes: 0,
    score: 0,
    roomTimeSec: secondsElapsed,
  });

  updateProgressBar();
  announce("Time is up. The vessel remains empty.");
  showMsg("Time's up — the final chamber awaits", 2400);
  stopAll();

  failTimeoutId = window.setTimeout(() => {
    // Ignore if Water is no longer the current room
    if (getCurrentPage() !== waterSection) return;

    goToNextRoom("#finalRoom", room6finalFunc);
  }, TRANSITION_MS);
}

// ── NAVIGATION ─────────────────────────────────────────────────────────────

function goToNextRoom(nextSelector: string, nextRoomFunc: () => void): void {
  if (!waterSection) return;

  const nextSection = document.querySelector<HTMLElement>(nextSelector);
  if (!nextSection) return;

  // Clean up Water-specific async logic before leaving
  cleanupWaterRoom();

  // Water handles the transition first
  goToSection(nextSection, TRANSITION_MS);

  // Start the next room only after the transition is complete
  window.setTimeout(() => {
    nextRoomFunc();
  }, TRANSITION_MS);
}

// ── SCORE ──────────────────────────────────────────────────────────────────

function calcScore(): number {
  return Math.max(0, MAX_SCORE - secondsElapsed * SCORE_PER_SECOND);
}

// ── HELPERS ────────────────────────────────────────────────────────────────

function setStatus(msg: string, type = ""): void {
  const el = document.getElementById("w-status");
  if (!el) return;

  el.textContent = msg;
  el.className = ["w-status", type ? `${type}-msg` : ""]
    .filter(Boolean)
    .join(" ");

  el.setAttribute("aria-live", "polite");
  el.setAttribute("aria-atomic", "true");
}

function announce(msg: string): void {
  const el = document.getElementById("w-aria-live");
  if (!el) return;

  el.setAttribute("aria-live", "assertive");
  el.setAttribute("aria-atomic", "true");
  el.textContent = "";

  // Short delayed write so screen readers re-announce
  window.setTimeout(() => {
    el.textContent = msg;
  }, 50);
}

// ── SOLVE ──────────────────────────────────────────────────────────────────

function solvePuzzle(): void {
  if (solved || isTransitioning) return;

  solved = true;
  isTransitioning = true;

  cleanupWaterRoom();

  const score = calcScore();

  setRoomResult("water", {
    status: "completed",
    artifact: "true",
    mistakes: 0,
    score,
    roomTimeSec: secondsElapsed,
  });

  updateProgressBar();
  showMsg("Well done — the final chamber awaits", 2400);
  stopAll(); // Stop music

  solveTimeoutId = window.setTimeout(() => {
    // Ignore if Water is no longer the current room
    if (getCurrentPage() !== waterSection) return;

    goToNextRoom("#finalRoom", room6finalFunc);
  }, TRANSITION_MS);
}

// ── RESET ──────────────────────────────────────────────────────────────────

function resetPuzzle(): void {
  solved = false;
  initGrid();
  renderGrid();
  setStatus("Pipes reset. The water waits for a new path.");
  announce("Puzzle reset. All pipes scrambled again.");
  focusedCell = [0, 0];
  focusCellEl(0, 0);
}

// ── KEYBOARD ───────────────────────────────────────────────────────────────

function handleGridKeyDown(e: KeyboardEvent): void {
  // Ignore keyboard if Water is no longer active
  if (getCurrentPage() !== waterSection) return;

  const [r, c] = focusedCell;

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();

    const delta: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };

    const [dr, dc] = delta[e.key];

    focusedCell = [
      Math.max(0, Math.min(TARGET_INDEX, r + dr)),
      Math.max(0, Math.min(TARGET_INDEX, c + dc)),
    ];

    renderGrid();
    focusCellEl(focusedCell[0], focusedCell[1]);
    return;
  }

  if ((e.key === "Enter" || e.key === " ") && !solved) {
    e.preventDefault();

    const type = currentGrid[r][c];
    if (type !== "SRC" && type !== "SNK" && !FIXED_CELLS.has(`${r},${c}`)) {
      rotatePipe(r, c);
      renderGrid();
      focusCellEl(r, c);
    }

    return;
  }

  if (e.key === "r" || e.key === "R") {
    e.preventDefault();
    resetPuzzle();
  }
}

function setupKeyboard(): void {
  document
    .getElementById("w-pipe-grid")
    ?.addEventListener("keydown", handleGridKeyDown);
}

// ── BUBBLES ────────────────────────────────────────────────────────────────

function clearBubbles(section: HTMLElement): void {
  section.querySelectorAll(".bubble").forEach((bubble) => {
    bubble.remove();
  });
}

function spawnBubbles(section: HTMLElement): void {
  for (let i = 0; i < 12; i++) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const size = 6 + Math.random() * 16;
    bubble.style.cssText = `
      width:${size}px;
      height:${size}px;
      left:${Math.random() * 100}vw;
      bottom:-20px;
      animation-duration:${6 + Math.random() * 10}s;
      animation-delay:${Math.random() * 8}s;
    `;

    section.appendChild(bubble);
  }
}

// ── START CHAMBER ──────────────────────────────────────────────────────────

function startChamber(): void {
  const puzzle = document.getElementById("w-puzzle");
  if (puzzle) puzzle.classList.add("active");

  initGrid();
  renderGrid();

  // Start internal timer for scoring + warning
  startInternalTimer();

  // Start shared header timer
  startSharedTimer(5);

  // Start time-up watcher — clear old one first
  stopTimeUpWatcher();
  timeUpIntervalId = window.setInterval(() => {
    if (!TimeIsUp) return;
    if (getCurrentPage() !== waterSection) return;
    if (!solved) ifRoomFailed();
  }, 200);

  // Small delay before moving focus into the grid
  stopFocusTimeout();
  focusTimeoutId = window.setTimeout(() => {
    // Ignore if Water is no longer active
    if (getCurrentPage() !== waterSection) return;

    outer: for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (r === 0 && c === 0) continue;
        if (r === TARGET_INDEX && c === TARGET_INDEX) continue;

        focusedCell = [r, c];
        break outer;
      }
    }

    renderGrid();
    focusCellEl(focusedCell[0], focusedCell[1]);
  }, 100);

  announce(
    "Water Chamber started. Navigate with arrow keys. Press Enter or Space to rotate pipes.",
  );
}

// ── CHECK FLOW ─────────────────────────────────────────────────────────────

function handleCheck(): void {
  // Ignore if Water is no longer active
  if (getCurrentPage() !== waterSection) return;

  const { sinkReached } = checkFlow(currentGrid);
  renderGrid();

  if (sinkReached) {
    solvePuzzle();
    return;
  }

  setStatus(
    "The water cannot find its way to the vessel yet. Keep adjusting the pipes.",
    "error",
  );
  announce("Flow incomplete. The vessel is not yet filled.");
}

// ── EXPORTED ROOM FUNCTION ─────────────────────────────────────────────────

export function room5waterFunc(): void {
  resetSingleRoomResult("water");

  const section = document.querySelector<HTMLElement>("#room5Water");
  if (!section) return;

  waterSection = section;

  // Stop old Water-specific async logic before starting a fresh enter
  cleanupWaterRoom();

  section.style.backgroundImage = `url("${dataJSON.room5water.backgroundImg}")`;
  showGameHeader();
  renderRoomDesc(section, dataJSON.room5water.desc);

  // Reset room state on enter
  solved = false;
  isTransitioning = false;
  secondsElapsed = 0;
  focusedCell = [0, 0];

  // Remove old bubbles before spawning new ones
  clearBubbles(section);
  spawnBubbles(section);

  stopAll();

  // Start background music immediately when entering the room
  playBgm("bgm_water");

  // Bind listeners only once
  if (!listenersBound) {
    document
      .getElementById("w-check-btn")
      ?.addEventListener("click", handleCheck);

    document
      .getElementById("w-reset-btn")
      ?.addEventListener("click", resetPuzzle);

    setupKeyboard();
    listenersBound = true;
  }

  // Start immediately — no intro screen
  startChamber();
}
