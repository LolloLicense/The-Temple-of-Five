/**
 * Water Room (room5water.ts)
 *
 * This file implements the logic for the Water Chamber puzzle in the game.
 *
 * - The player must rotate pipes on a dynamic grid (default 5x5, configurable via GRID_SIZE) to connect the water source (top-left) to the vessel (bottom-right).
 * - The grid, path generation, and flow-checking logic are all dynamic and use constants for flexibility.
 * - Accessibility is considered with ARIA labels and keyboard navigation.
 * - Results are saved using setRoomResult for consistency with other rooms.
 * - The code is structured for maintainability and future scalability (e.g., changing grid size).
 *
 * Key features:
 *   - Dynamic grid and path generation
 *   - Keyboard and mouse controls
 *   - Accessibility via ARIA labels
 *   - Flexible result saving and transitions
 *   - Well-commented and modular code
 */
import * as dataJSON from "../../data.json";
import { playBgm } from "../../audio/index.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
import { showGameHeader, hideGameHeader } from "../../script/helper/gameHeader.ts";
// ── EXIT TO WELCOME ──────────────────────────────────────────────────────
function exitToWelcome(): void {
  if (!waterSection) return;
  const welcomeSection = document.querySelector<HTMLElement>("#welcomePage");
  if (!welcomeSection) return;
  hideGameHeader();
  const fromPage = getCurrentPage();
  if (!fromPage) return;
  transitSections(fromPage, welcomeSection, TRANSITION_MS);
}
import { resetSingleRoomResult } from "../../script/helper/storage.ts";
import { setRoomResult } from "../../script/helper/storage.ts";
import { showMsg } from "../../script/helper/showMsg.ts";
import {
  startTimer as startSharedTimer,
  stopTimer as stopSharedTimer,
  TimeIsUp,
} from "../../script/helper/utils.ts";
import {
  transitSections,
  getCurrentPage,
  showSection,
} from "../../script/helper/transitions.ts";
import { updateProgressBar } from "../../script/helper/progressbar.ts";
// FIX 1: Added missing imports
import { room6finalFunc } from "../final/room6validate.ts";
// FIX 2: Uncommented room 6 import

// ── TYPES ──────────────────────────────────────────────────────────────────
// Prefix T = type, I = interface for clearer and more readable code

type TPipeType = "NS" | "EW" | "NE" | "NW" | "SE" | "SW";
type TCellType = TPipeType | "SRC" | "SNK";
// SRC = the source (💧, top-left corner) — fixed, cannot be rotated by the player
// SNK = the vessel/sink (⚱️, bottom-right corner) — fixed, cannot be rotated
type TDirection = "N" | "E" | "S" | "W";
type TConnections = Record<TDirection, boolean>;
type TGrid = TCellType[][];

interface IPipeDef {
  c: [boolean, boolean, boolean, boolean]; // N, E, S, W — indicates which directions the pipe connects to
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
  NW: { c: [true, false, false, true], label: "Elbow connecting top and left" },
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

// Movement vectors per direction: [rowDelta, columnDelta]
// Used in pathfinding and flow checks to find neighbouring cells
const DIR_DELTA: Record<TDirection, [number, number]> = {
  N: [-1, 0],
  S: [1, 0],
  E: [0, 1],
  W: [0, -1],
};

// Opposite direction — used to verify that the neighbouring cell connects back
// Example: if cell A points North toward cell B, cell B must point South back toward A
const OPPOSITE: Record<TDirection, TDirection> = {
  N: "S",
  S: "N",
  E: "W",
  W: "E",
};

// Grid size and target index for flexibility
const GRID_SIZE = 5;
const TARGET_INDEX = GRID_SIZE - 1;
const FIXED_CELLS = new Set<string>([`0,0`, `${TARGET_INDEX},${TARGET_INDEX}`]);
const MAX_SCORE = 1000;
const SCORE_PER_SECOND = 3;
const ARTIFACT_THRESHOLD = 110; // seconds (1 min 50 s) — below this threshold gives the correct artifact
const TRANSITION_MS = 1200; // FIX 3: Shared transition constant

// ── MODULE STATE ───────────────────────────────────────────────────────────

let currentGrid: TGrid = [];
let focusedCell: [number, number] = [0, 0];
let timerInterval: ReturnType<typeof setInterval> | null = null;
let secondsElapsed = 0;
let solved = false;
let SOURCE_EXIT_DIR: TDirection = "E";
let SINK_ENTRY_DIR: TDirection = "W";
let listenersBound = false; // FIX 4: Prevent duplicate listeners on re-entry
let timeUpIntervalId: number | null = null; // FIX 5: Time-up watcher id
let isTransitioning = false;
let waterSection: HTMLElement | null = null;

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
    let r = 0,
      c = 0,
      stuck = false;

    while (!(r === TARGET_INDEX && c === TARGET_INDEX)) {
      const moves: [TDirection, number, number][] = [];
      for (const [dir, [dr, dc]] of Object.entries(DIR_DELTA) as [
        TDirection,
        [number, number],
      ][]) {
        const nr = r + dr,
          nc = c + dc;
        if (nr < 0 || nr > TARGET_INDEX || nc < 0 || nc > TARGET_INDEX)
          continue;
        if (visited.has(`${nr},${nc}`)) continue;
        // Weights moves to the right (E) and downward (S) since the goal is (TARGET_INDEX,TARGET_INDEX).
        // nr >= r means moving south or staying in the same row → heavier weight.
        // nc >= c means moving east or staying in the same column → heavier weight.
        // The result is that the algorithm prefers to move toward the goal,
        // but can still go the "wrong" way for variation in the puzzle.
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
  // Fallback: L-shape if no valid path was found
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
      for (let i = 0; i < rotations; i++) t = ROTATE_MAP[t];
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
  if (type === "SRC")
    return {
      N: SOURCE_EXIT_DIR === "N",
      E: SOURCE_EXIT_DIR === "E",
      S: SOURCE_EXIT_DIR === "S",
      W: SOURCE_EXIT_DIR === "W",
    };
  if (type === "SNK")
    return {
      N: SINK_ENTRY_DIR === "N",
      E: SINK_ENTRY_DIR === "E",
      S: SINK_ENTRY_DIR === "S",
      W: SINK_ENTRY_DIR === "W",
    };
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
      const nr = r + dr,
        nc = c + dc;
      if (nr < 0 || nr > TARGET_INDEX || nc < 0 || nc > TARGET_INDEX) continue;
      const nkey = `${nr},${nc}`;
      if (visited.has(nkey)) continue;
      if (!getConnections(grid[nr][nc])[OPPOSITE[dir]]) continue;
      visited.add(nkey);
      queue.push([nr, nc]);
    }
  }
  const TARGET_KEY = `${TARGET_INDEX},${TARGET_INDEX}`;
  return { flowPath, sinkReached: flowPath.has(TARGET_KEY) };
}

// ── RENDER ─────────────────────────────────────────────────────────────────
// Rebuilds the entire grid DOM from scratch on every state change.
// Checks which cells are in the flow and sets CSS classes + ARIA labels.

function buildCellAriaLabel(
  type: TCellType,
  r: number,
  c: number,
  isFixed: boolean,
  inFlow: boolean,
): string {
  if (type === "SRC") return "Water source, row 1 column 1, fixed";
  if (type === "SNK") {
    const rowNum = GRID_SIZE;
    const colNum = GRID_SIZE;
    return `Sacred vessel, row ${rowNum} column ${colNum}${inFlow ? ", water flowing in — vessel filled!" : ", awaiting water"}`;
  }
  const def = PIPE_DEFS[type as TPipeType];
  return `${def?.label ?? type}, row ${r + 1} col ${c + 1}${isFixed ? ", fixed" : ", rotatable"}${inFlow ? ", water flowing" : ""}`;
}

function renderGrid(): void {
  const gridEl = document.getElementById("w-pipe-grid");
  if (!gridEl) return;
  // Add ARIA role for region if not present
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
      if (!isFixed)
        cell.setAttribute("aria-description", "Press Enter or Space to rotate");

      if (isSource) {
        cell.innerHTML = `<span aria-hidden="true" style="font-size:1.6rem;">💧</span>`;
      } else if (isSink) {
        cell.innerHTML = `<span aria-hidden="true" style="font-size:1.6rem;">${inFlow ? "🏺" : "⚱️"}</span>`;
      } else {
        cell.innerHTML = pipeSVG(type as TPipeType);
      }

      cell.addEventListener("click", () => {
        if (solved) return;
        focusedCell = [r, c];
        if (!isFixed) rotatePipe(r, c);
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
// The header countdown display is handled by the shared timer in utils.ts.
// This internal timer only tracks secondsElapsed for scoring and the 60 s warning.

function startTimer(): void {
  timerInterval = setInterval(() => {
    secondsElapsed++;
    checkWarning();
  }, 1000);
}

function stopTimer(): void {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
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
// FIX 5: Polls the shared TimeIsUp flag; navigates to room 6 on timeout

function stopTimeUpWatcher(): void {
  if (timeUpIntervalId !== null) {
    window.clearInterval(timeUpIntervalId);
    timeUpIntervalId = null;
  }
}

function ifRoomFailed(): void {
  if (isTransitioning) return;
  isTransitioning = true;

  stopTimeUpWatcher();

  stopSharedTimer(5);

  setRoomResult("water", {
    status: "failed",
    artifact: "false",
    mistakes: 0,
    score: 0,
    roomTimeSec: secondsElapsed,
  });
  stopTimer();
  updateProgressBar();
  announce("Time is up. The vessel remains empty.");
  showMsg("Time's up — the final chamber awaits", 2400);

  window.setTimeout(() => {
    goToNextRoom("#finalRoom", room6finalFunc);
  }, 1200);
}

// ── NAVIGATION ─────────────────────────────────────────────────────────────
// FIX 2 + FIX 3: Standard exit pattern — fade out → call next room func
function goToNextRoom(nextSelector: string, nextRoomFunc: () => void): void {
  if (!waterSection) return;

  const nextSection = document.querySelector<HTMLElement>(nextSelector);
  if (!nextSection) return;

  // Set BG before transit so it starts loading before the section becomes visible
  nextSection.style.backgroundImage = `url("${dataJSON.room6validate.backgroundImg}")`;

  transitSections(waterSection, nextSection, TRANSITION_MS);

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
  setTimeout(() => {
    el.textContent = msg;
  }, 50);
}

// ── SOLVE ──────────────────────────────────────────────────────────────────

function solvePuzzle(): void {
  if (solved || isTransitioning) return;
  solved = true;
  isTransitioning = true;

  stopTimeUpWatcher();
  stopTimer();
  stopSharedTimer(5);

  const score = calcScore();
  const artifact: "true" | "false" =
    secondsElapsed <= ARTIFACT_THRESHOLD ? "true" : "false";

  setRoomResult("water", {
    status: "completed",
    artifact,
    mistakes: 0,
    score,
    roomTimeSec: secondsElapsed,
  });

  updateProgressBar();

  showMsg("Well done — the final chamber awaits", 2400);

  window.setTimeout(() => {
    goToNextRoom("#finalRoom", room6finalFunc);
  }, 1200);
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

function setupKeyboard(): void {
  document
    .getElementById("w-pipe-grid")
    ?.addEventListener("keydown", (e: KeyboardEvent) => {
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
        // Clamps focus within the grid bounds (0–TARGET_INDEX) so that arrow keys
        // cannot move the cursor outside the grid
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
        // SRC (source) and SNK (sink) are fixed — they should never be rotatable
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
    });
}

// ── BUBBLES ────────────────────────────────────────────────────────────────

function spawnBubbles(section: HTMLElement): void {
  for (let i = 0; i < 12; i++) {
    const b = document.createElement("div");
    b.className = "bubble";
    const size = 6 + Math.random() * 16;
    b.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}vw; bottom:-20px;
      animation-duration:${6 + Math.random() * 10}s;
      animation-delay:${Math.random() * 8}s;
    `;
    section.appendChild(b);
  }
}

// ── START CHAMBER ──────────────────────────────────────────────────────────

function startChamber(): void {
  const puzzle = document.getElementById("w-puzzle");
  if (puzzle) puzzle.classList.add("active");

  initGrid();
  renderGrid();
  startTimer(); // internal: tracks secondsElapsed for score + warning
  startSharedTimer(5); // shared: drives the header countdown display

  // FIX 5: Start time-up watcher — clears old one first to prevent duplicates
  stopTimeUpWatcher();
  timeUpIntervalId = window.setInterval(() => {
    if (!TimeIsUp) return;
    if (!solved) ifRoomFailed();
  }, 200);

  setTimeout(() => {
    outer: for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (r === 0 && c === 0) continue;
        if (r === 4 && c === 4) continue;
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
  const { sinkReached } = checkFlow(currentGrid);
  renderGrid();

  if (sinkReached) {
    solvePuzzle();
  } else {
    setStatus(
      "The water cannot find its way to the vessel yet. Keep adjusting the pipes.",
      "error",
    );
    announce("Flow incomplete. The vessel is not yet filled.");
  }
}

// ── EXPORTED ROOM FUNCTION ─────────────────────────────────────────────────

export function room5waterFunc(): void {
  resetSingleRoomResult("water");
  // Hide welcome page / menu
  document.querySelector<HTMLElement>("#welcomePage")?.classList.add("hidden");

  const section = document.querySelector<HTMLElement>("#room5Water");
  if (!section) return;
  waterSection = section;
  section.style.backgroundImage = `url("${dataJSON.room5water.backgroundImg}")`;
  showGameHeader();
  renderRoomDesc(section, dataJSON.room5water.desc);

  // FIX 1: Standard entry pattern — fade from current page or show directly
  const fromPage =
    getCurrentPage() ??
    document.querySelector<HTMLElement>("main > section.page.isVisible");
  if (fromPage && fromPage !== section) {
    transitSections(fromPage, section, TRANSITION_MS);
  } else {
    showSection(section);
  }

  // Reset state (safe to call multiple times if room is replayed)
  solved = false;
  isTransitioning = false;
  secondsElapsed = 0;
  focusedCell = [0, 0];
  stopTimer();
  stopSharedTimer(5);
  stopTimeUpWatcher(); // FIX 5: Clean up any leftover watcher from previous visit

  spawnBubbles(section);

  // Start background music immediately when entering the room
  playBgm("bgm_water");

  // FIX 4: Bind listeners only once — prevents duplicates on re-entry
  if (!listenersBound) {
    document
      .getElementById("w-check-btn")
      ?.addEventListener("click", handleCheck);
    document
      .getElementById("w-reset-btn")
      ?.addEventListener("click", resetPuzzle);
    // Example: exit button for leaving the room
    document
      .getElementById("w-exit-btn")
      ?.addEventListener("click", exitToWelcome);
    setupKeyboard();
    listenersBound = true;
  }

  // Start immediately — no intro screen
  startChamber();
}
