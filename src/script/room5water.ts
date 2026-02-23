import * as dataJSON from "../data.json";
import { playBgm } from "../audio";

// ── TYPES ──────────────────────────────────────────────────────────────────

type PipeType = "NS" | "EW" | "NE" | "NW" | "SE" | "SW";
type CellType = PipeType | "SRC" | "SNK";
type Direction = "N" | "E" | "S" | "W";
type Connections = Record<Direction, boolean>;
type Grid = CellType[][];

interface PipeDef {
  c: [boolean, boolean, boolean, boolean]; // N, E, S, W
  label: string;
}

interface FlowResult {
  flowPath: Set<string>;
  sinkReached: boolean;
}

interface RoomResult {
  room: string;
  artifact: string;
  artifactCorrect: boolean;
  score: number;
  time: number;
  completed: boolean;
}

// ── CONSTANTS ──────────────────────────────────────────────────────────────

const PIPE_DEFS: Record<PipeType, PipeDef> = {
  NS: { c: [true,  false, true,  false], label: "Straight vertical pipe"            },
  EW: { c: [false, true,  false, true ], label: "Straight horizontal pipe"          },
  NE: { c: [true,  true,  false, false], label: "Elbow connecting top and right"    },
  NW: { c: [true,  false, false, true ], label: "Elbow connecting top and left"     },
  SE: { c: [false, true,  true,  false], label: "Elbow connecting bottom and right" },
  SW: { c: [false, false, true,  true ], label: "Elbow connecting bottom and left"  },
};

const ROTATE_MAP: Record<PipeType, PipeType> = {
  NS: "EW", EW: "NS",
  NE: "SE", SE: "SW", SW: "NW", NW: "NE",
};

const DIRS: Record<Direction, [number, number]> = {
  N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1],
};

const OPPOSITE: Record<Direction, Direction> = {
  N: "S", S: "N", E: "W", W: "E",
};

const DIR_DELTA: Record<Direction, [number, number]> = {
  N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1],
};

const FIXED_CELLS        = new Set<string>(["0,0", "4,4"]);
const MAX_SCORE          = 1000;
const SCORE_PER_SECOND   = 3;
const ARTIFACT_THRESHOLD = 110; // seconds (1 min 50 s) — under this = correct artifact

// ── MODULE STATE ───────────────────────────────────────────────────────────

let currentGrid: Grid             = [];
let focusedCell: [number, number] = [0, 0];
let timerInterval: ReturnType<typeof setInterval> | null = null;
let secondsElapsed  = 0;
let solved          = false;
let SOURCE_EXIT_DIR: Direction = "E";
let SINK_ENTRY_DIR:  Direction = "W";

// ── HTML INJECTION ─────────────────────────────────────────────────────────
// Builds and injects the room layout into <section id="room5Water">

function injectHTML(section: HTMLElement): void {
  section.innerHTML = `
    <div class="w-chamber">

      <!-- Room heading -->
      <div class="w-heading">
        <h1 class="w-title">Chamber of Water</h1>
        <p class="w-subtitle">Liú Shuǐ — The Way of Flowing Water</p>
      </div>

      <!-- Puzzle panel (shown immediately) -->
      <div id="w-puzzle" class="w-puzzle active">
        <div class="w-panel">
          <p class="w-instruction">
            Rotate the pipes to connect
            <strong>SOURCE 💧 (top-left)</strong> to the
            <strong>VESSEL ⚱️ (bottom-right)</strong>.
          </p>

          <!-- Pipe grid -->
          <div class="w-grid-wrapper">
            <div
              class="pipe-grid"
              id="w-pipe-grid"
              role="grid"
              aria-label="5 by 5 pipe grid. Navigate with arrow keys. Press Enter or Space to rotate a pipe."
            >
              <!-- Cells injected by renderGrid() -->
            </div>
          </div>

          <!-- Keyboard hint -->
          <p class="w-kbd-hint" aria-hidden="true">
            <kbd class="w-kbd">↑ ↓ ← →</kbd> navigate &nbsp;·&nbsp;
            <kbd class="w-kbd">Enter</kbd> / <kbd class="w-kbd">Space</kbd> rotate &nbsp;·&nbsp;
            <kbd class="w-kbd">R</kbd> reset
          </p>

          <!-- Status -->
          <p id="w-status" class="w-status" role="status" aria-live="polite"></p>

          <!-- Controls -->
          <div class="w-controls">
            <button class="w-btn w-btn--ghost" id="w-reset-btn">↺ Reset Pipes</button>
            <button class="w-btn w-btn--gold"  id="w-check-btn">Check Flow</button>
          </div>
        </div>

        <!-- Time warning (shown at 75 s) -->
        <div
          class="w-time-warning"
          id="w-time-warning"
          role="alert"
          aria-live="assertive"
        >
          ⚠ The temple senses hesitation. The water grows restless — impurity may follow...
        </div>

        <!--
          BUG FIX: Both artifact panels are now visually identical.
          The true artifact (水 or 亂) is silently saved to localStorage.
          The player will not know which one they received until the final altar (room 6).
        -->

        <!-- Artifact panel: correct (shown when solved within time limit) -->
        <div
          class="w-artifact"
          id="w-artifact-correct"
          aria-live="polite"
          aria-labelledby="w-artifact-correct-name"
        >
          <span class="w-artifact-glyph" aria-hidden="true">水</span>
          <p class="w-artifact-name" id="w-artifact-correct-name">An Ancient Artifact</p>
          <p class="w-artifact-desc">
            The vessel hums with hidden power. Its true nature is veiled,
            awaiting the final altar.
          </p>
          <div class="w-artifact-actions">
            <button class="w-btn w-btn--gold" id="w-complete-correct-btn">
              Continue →
            </button>
          </div>
        </div>


        <!-- Artifact panel: wrong (shown when solved too slowly) -->
        <!-- Intentionally identical in appearance to the correct panel — mystery preserved -->
        <div
          class="w-artifact"
          id="w-artifact-wrong"
          aria-live="polite"
          aria-labelledby="w-artifact-wrong-name"
        >
          <span class="w-artifact-glyph" aria-hidden="true">亂</span>
          <p class="w-artifact-name" id="w-artifact-wrong-name">An Ancient Artifact</p>
          <p class="w-artifact-desc">
            The vessel hums with hidden power. Its true nature is veiled,
            awaiting the final altar.
          </p>
          <div class="w-artifact-actions">
            <button class="w-btn w-btn--gold" id="w-complete-wrong-btn">
              Continue →
            </button>
          </div>
        </div>

      </div><!-- /w-puzzle -->

      <!-- Bottom lore bar -->
      <div class="w-lore-bar">
        <span class="w-lore-symbol w-lore-symbol--left" aria-hidden="true">亂</span>
        <p class="w-lore-text">
          The sacred pipes of the Water Chamber lie broken and tangled. Only when the
          flow runs pure and unbroken from source to vessel will the ancient symbol reveal
          itself. Rotate the pipe segments. Restore the flow. Let the water find its way. The
          temple rewards those who move with purpose.
        </p>
        <span class="w-lore-symbol w-lore-symbol--right" aria-hidden="true">水</span>
      </div>

    </div><!-- /w-chamber -->

    <!-- Screen-reader live region -->
    <div
      id="w-aria-live"
      aria-live="polite"
      aria-atomic="true"
      role="status"
      style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);"
    ></div>
  `;
}

// ── PIPE SVG ───────────────────────────────────────────────────────────────

function pipeSVG(type: PipeType): string {
  const c    = 22;
  const open = `<svg class="pipe-svg" viewBox="0 0 44 44" aria-hidden="true" focusable="false">`;
  const paths: Record<PipeType, string> = {
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

function pipeForDirs(a: Direction, b: Direction): PipeType {
  const key = [a, b].sort().join("");
  const map: Record<string, PipeType> = {
    NS: "NS", EW: "EW",
    EN: "NE", NE: "NE",
    NW: "NW", WN: "NW",
    ES: "SE", SE: "SE",
    SW: "SW", WS: "SW",
  };
  return map[key] ?? "EW";
}

function randomPath(): [number, number][] {
  const MAX_TRIES = 200;
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const visited = new Set<string>(["0,0"]);
    const path: [number, number][] = [[0, 0]];
    let r = 0, c = 0, stuck = false;

    while (!(r === 4 && c === 4)) {
      const moves: [Direction, number, number][] = [];
      for (const [dir, [dr, dc]] of Object.entries(DIRS) as [Direction, [number, number]][]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr > 4 || nc < 0 || nc > 4) continue;
        if (visited.has(`${nr},${nc}`)) continue;
        const weight = (nr >= r ? 2 : 1) + (nc >= c ? 2 : 1);
        for (let w = 0; w < weight; w++) moves.push([dir, nr, nc]);
      }
      if (moves.length === 0) { stuck = true; break; }
      const [, nr, nc] = moves[Math.floor(Math.random() * moves.length)];
      visited.add(`${nr},${nc}`);
      path.push([nr, nc]);
      r = nr; c = nc;
      if (path.length > 22) { stuck = true; break; }
    }
    if (!stuck && r === 4 && c === 4) return path;
  }
  // Fallback: L-shape
  const path: [number, number][] = [];
  for (let col = 0; col <= 4; col++) path.push([0, col]);
  for (let row = 1; row <= 4; row++) path.push([row, 4]);
  return path;
}

function buildSolutionGrid(path: [number, number][]): Grid {
  const grid: Grid = Array.from({ length: 5 }, () => Array(5).fill(null) as CellType[]);
  grid[0][0] = "SRC";
  grid[4][4] = "SNK";

  for (let i = 1; i < path.length - 1; i++) {
    const [r, c]   = path[i];
    const [pr, pc] = path[i - 1];
    const [nr, nc] = path[i + 1];
    const fromDir: Direction = pr === r - 1 ? "N" : pr === r + 1 ? "S" : pc === c - 1 ? "W" : "E";
    const toDir:   Direction = nr === r - 1 ? "N" : nr === r + 1 ? "S" : nc === c - 1 ? "W" : "E";
    grid[r][c] = pipeForDirs(fromDir, toDir);
  }

  const pipeTypes: PipeType[] = ["NS", "EW", "NE", "NW", "SE", "SW"];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (grid[row][col] === null) {
        grid[row][col] = pipeTypes[Math.floor(Math.random() * pipeTypes.length)];
      }
    }
  }
  return grid;
}

function scrambleGrid(grid: Grid, fixedCells: Set<string>): Grid {
  const g: Grid = grid.map(row => [...row]);
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (fixedCells.has(`${r},${c}`)) continue;
      if (g[r][c] === "SRC" || g[r][c] === "SNK") continue;
      let t = g[r][c] as PipeType;
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
  SINK_ENTRY_DIR  = pr < 4 ? "N" : pc < 4 ? "W" : pr > 4 ? "S" : "E";

  currentGrid = scrambleGrid(buildSolutionGrid(path), FIXED_CELLS);
}

// ── FLOW CHECK ─────────────────────────────────────────────────────────────

function getConnections(type: CellType): Connections {
  if (type === "SRC") return { N: SOURCE_EXIT_DIR === "N", E: SOURCE_EXIT_DIR === "E", S: SOURCE_EXIT_DIR === "S", W: SOURCE_EXIT_DIR === "W" };
  if (type === "SNK") return { N: SINK_ENTRY_DIR  === "N", E: SINK_ENTRY_DIR  === "E", S: SINK_ENTRY_DIR  === "S", W: SINK_ENTRY_DIR  === "W" };
  const def = PIPE_DEFS[type as PipeType];
  if (!def) return { N: false, E: false, S: false, W: false };
  const [n, e, s, w] = def.c;
  return { N: n, E: e, S: s, W: w };
}

function checkFlow(grid: Grid): FlowResult {
  const visited  = new Set<string>();
  const flowPath = new Set<string>();
  const queue: [number, number][] = [[0, 0]];
  visited.add("0,0");

  while (queue.length) {
    const [r, c] = queue.shift()!;
    flowPath.add(`${r},${c}`);
    const conns = getConnections(grid[r][c]);
    for (const dir of ["N", "E", "S", "W"] as Direction[]) {
      if (!conns[dir]) continue;
      const [dr, dc] = DIR_DELTA[dir];
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr > 4 || nc < 0 || nc > 4) continue;
      const nkey = `${nr},${nc}`;
      if (visited.has(nkey)) continue;
      if (!getConnections(grid[nr][nc])[OPPOSITE[dir]]) continue;
      visited.add(nkey);
      queue.push([nr, nc]);
    }
  }
  return { flowPath, sinkReached: flowPath.has("4,4") };
}

// ── RENDER ─────────────────────────────────────────────────────────────────

function renderGrid(): void {
  const gridEl = document.getElementById("w-pipe-grid");
  if (!gridEl) return;
  gridEl.innerHTML = "";
  const { flowPath } = checkFlow(currentGrid);

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const type      = currentGrid[r][c];
      const key       = `${r},${c}`;
      const isFixed   = FIXED_CELLS.has(key) || type === "SRC" || type === "SNK";
      const inFlow    = flowPath.has(key);
      const isSource  = type === "SRC";
      const isSink    = type === "SNK";
      const isFocused = focusedCell[0] === r && focusedCell[1] === c;

      const cell = document.createElement("div");
      cell.className = [
        "pipe-cell",
        isFixed                        ? "fixed"       : "",
        inFlow && !isSource && !isSink ? "active-flow" : "",
        isSource                       ? "source"      : "",
        isSink ? (inFlow ? "sink filled" : "sink")     : "",
      ].filter(Boolean).join(" ");

      cell.setAttribute("role",     "gridcell");
      cell.setAttribute("data-row", String(r));
      cell.setAttribute("data-col", String(c));
      cell.setAttribute("tabindex", isFocused ? "0" : "-1");

      let label = "";
      if (isSource) {
        label = "Water source, row 1 column 1, fixed";
      } else if (isSink) {
        label = `Sacred vessel, row 5 column 5${inFlow ? ", water flowing in — vessel filled!" : ", awaiting water"}`;
      } else {
        const def = PIPE_DEFS[type as PipeType];
        label = `${def?.label ?? type}, row ${r + 1} col ${c + 1}${isFixed ? ", fixed" : ", rotatable"}${inFlow ? ", water flowing" : ""}`;
      }
      cell.setAttribute("aria-label", label);
      if (!isFixed) cell.setAttribute("aria-description", "Press Enter or Space to rotate");

      if (isSource) {
        cell.innerHTML = `<span aria-hidden="true" style="font-size:1.6rem;">💧</span>`;
      } else if (isSink) {
        cell.innerHTML = `<span aria-hidden="true" style="font-size:1.6rem;">${inFlow ? "🏺" : "⚱️"}</span>`;
      } else {
        cell.innerHTML = pipeSVG(type as PipeType);
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
  const rotated = ROTATE_MAP[type as PipeType];
  currentGrid[r][c] = rotated;
  announce(`Rotated to ${PIPE_DEFS[rotated]?.label}`);
}

function focusCellEl(r: number, c: number): void {
  (document.querySelector(`[data-row="${r}"][data-col="${c}"]`) as HTMLElement | null)?.focus();
}

// ── TIMER ──────────────────────────────────────────────────────────────────

function startTimer(): void {
  timerInterval = setInterval(() => {
    secondsElapsed++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer(): void {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay(): void {
  const m  = Math.floor(secondsElapsed / 60).toString().padStart(2, "0");
  const s  = (secondsElapsed % 60).toString().padStart(2, "0");

  // Update the shared header room timer from index.html
  const minSpan = document.getElementById("roomMinutesSpan");
  const secSpan = document.getElementById("roomSecondsSpan");
  if (minSpan) minSpan.textContent = m;
  if (secSpan) secSpan.textContent = s;

  if (secondsElapsed === 60) { // 1 minute
    document.getElementById("w-time-warning")?.classList.add("visible");
    announce("Warning: the temple grows impatient. Solve quickly or the artifact may be impure.");
  }
}

// ── SCORE ──────────────────────────────────────────────────────────────────

function calcScore(): number {
  return Math.max(0, MAX_SCORE - secondsElapsed * SCORE_PER_SECOND);
}

// ── HELPERS ────────────────────────────────────────────────────────────────

function updateProgress(pct: number): void {
  // Hooks into the shared progress bar in index.html header if needed
  // Individual room progress can be tracked here
}

function setStatus(msg: string, type = ""): void {
  const el = document.getElementById("w-status");
  if (!el) return;
  el.textContent = msg;
  el.className   = ["w-status", type ? `${type}-msg` : ""].filter(Boolean).join(" ");
}

function announce(msg: string): void {
  const el = document.getElementById("w-aria-live");
  if (!el) return;
  el.textContent = "";
  setTimeout(() => { el.textContent = msg; }, 50);
}

// ── SOLVE ──────────────────────────────────────────────────────────────────

function solvePuzzle(): void {
  if (solved) return;
  solved = true;
  stopTimer();

  const score             = calcScore();
  const isCorrectArtifact = secondsElapsed <= ARTIFACT_THRESHOLD;
  // The true artifact is saved silently — the player won't know which one
  // until they reach the final altar in room 6.
  const artifact          = isCorrectArtifact ? "水" : "亂";

  setStatus("The vessel fills with water. An ancient artifact is revealed...", "");

  // Hide both artifact panels first
  document.getElementById("w-artifact-correct")?.classList.remove("visible");
  document.getElementById("w-artifact-wrong")?.classList.remove("visible");

  // Show the appropriate panel — both look identical to the player
  if (isCorrectArtifact) {
    const box = document.getElementById("w-artifact-correct");
    box?.classList.add("visible");
    box?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else {
    const box = document.getElementById("w-artifact-wrong");
    box?.classList.add("visible");
    box?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  announce(`Puzzle solved. Score: ${score} points.`);
  document.getElementById("w-time-warning")?.classList.remove("visible");

  // Save result to localStorage for room 6 to read
  const result: RoomResult = {
    room: "water",
    artifact,
    artifactCorrect: isCorrectArtifact,
    score,
    time: secondsElapsed,
    completed: true,
  };

  try {
    localStorage.setItem("room_water", JSON.stringify(result));
  } catch {
    // storage unavailable
  }
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
  document.getElementById("w-pipe-grid")?.addEventListener("keydown", (e: KeyboardEvent) => {
    const [r, c] = focusedCell;

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      const delta: Record<string, [number, number]> = {
        ArrowUp:    [-1,  0],
        ArrowDown:  [ 1,  0],
        ArrowLeft:  [ 0, -1],
        ArrowRight: [ 0,  1],
      };
      const [dr, dc] = delta[e.key];
      focusedCell = [Math.max(0, Math.min(4, r + dr)), Math.max(0, Math.min(4, c + dc))];
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
  });
}

// ── BUBBLES ────────────────────────────────────────────────────────────────

function spawnBubbles(section: HTMLElement): void {
  for (let i = 0; i < 12; i++) {
    const b    = document.createElement("div");
    b.className = "bubble";
    const size  = 6 + Math.random() * 16;
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
  startTimer();


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

  announce("Water Chamber started. Navigate with arrow keys. Press Enter or Space to rotate pipes.");
}

// ── CHECK FLOW ─────────────────────────────────────────────────────────────

function handleCheck(): void {
  const { flowPath, sinkReached } = checkFlow(currentGrid);
  renderGrid();

  if (sinkReached) {
    solvePuzzle();
  } else {
    const pct = Math.round((flowPath.size / 15) * 80);
    setStatus("The water cannot find its way to the vessel yet. Keep adjusting the pipes.", "error");
    announce("Flow incomplete. The vessel is not yet filled.");
  }
}

// ── DISPATCH COMPLETE ──────────────────────────────────────────────────────
// Hooks into whatever the rest of the game uses to advance rooms.
// Update the completeRoom call to match your main.ts implementation.

function dispatchComplete(artifact: string): void {
  const score = calcScore();
  announce("An ancient artifact claimed. Proceeding.");

  // TODO: replace with your group's actual room-complete handler from main.ts
  // e.g. completeRoom("water", artifact, score, secondsElapsed);
  console.log("Room complete:", { artifact, score, time: secondsElapsed });
}

// ── EXPORTED ROOM FUNCTION ─────────────────────────────────────────────────

export function room5waterFunc(): void {
  // Hide welcome page / menu
  document.querySelector<HTMLElement>("#welcomePage")?.classList.add("hidden");

  // Show and set up the water section
  const section = document.querySelector<HTMLElement>("#room5Water");
  if (!section) return;

  section.style.backgroundImage = `url("${dataJSON.room5water.backgroundImg}")`;
  section.classList.remove("hidden");

  // Reset state (safe to call multiple times if room is replayed)
  solved         = false;
  secondsElapsed = 0;
  focusedCell    = [0, 0];
  stopTimer();


  // Inject HTML into the section
  injectHTML(section);
  spawnBubbles(section);

  // Start background music immediately when entering the room
  playBgm("bgm_water");

  // Wire up buttons
  document.getElementById("w-check-btn")?.addEventListener("click", handleCheck);
  document.getElementById("w-reset-btn")?.addEventListener("click", resetPuzzle);

  document.getElementById("w-complete-correct-btn")?.addEventListener("click", () => {
    dispatchComplete("水");
  });

  document.getElementById("w-complete-wrong-btn")?.addEventListener("click", () => {
    dispatchComplete("亂");
  });
  
  setupKeyboard();

  // Start immediately — no intro screen
  startChamber();
}