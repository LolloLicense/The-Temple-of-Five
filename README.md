# The Temple of Five

![The Temple of Five Startpage](/public/images/startpage.png)

Welcome to **The Temple of Five**, a digital escape room and atmospheric puzzle adventure game created by **The Pogo Stick Pioneers**. Journey through five elemental chambers—Wood, Fire, Earth, Metal, and Water—each housing a unique challenge. Solve the puzzles, collect the sacred artifacts, and unlock the temple's final secret.

## About the Game

The Temple of Five is a browser-based digital escape room built with modern web technologies. Each chamber features its own puzzle and gameplay mechanic designed to test the player's logic, observation, and reflexes.

Through sound, visuals, and interactive elements, the game creates an immersive temple atmosphere as players progress deeper into the trial.

### **Core Features**

- **Five Elemental Trials:** Distinct puzzles for Wood, Fire, Earth, Metal, and Water.
- **Immersive Atmosphere:** Dynamic audio, custom CSS animations, and thematic visual effects.
- **Real-time Scoring:** Progress tracking with a highscore system based on speed and accuracy.
- **Full Accessibility:** Designed for both mouse and keyboard navigation (ARIA-compliant).
- **Responsive Design:** Optimized for various screen sizes, from desktop to mobile.

## How to Play

1.  **Enter the Temple:** Begin your adventure in the first elemental chamber.
2.  **Solve to Advance:** Read the room's unique instructions, interact with the environment, and solve the puzzle to claim the artifact.
3.  **Master the Elements:** Progress through all five rooms, adapting to different mechanics in each.
4.  **The Final Challenge:** Complete the final trial to see your total score and escape the temple!
    ![Gameplay Demo](/public/images/welcomepage.gif)

## Technologies Used

![HTML badge](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white) ![Sass badge](https://img.shields.io/badge/Sass-CC6699?style=flat&logo=sass&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white) ![Markdown badge](https://img.shields.io/badge/Markdown-000000?style=flat&logo=markdown&logoColor=white) ![Vite badge](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) ![Biome](https://img.shields.io/badge/biome-%2360A5FA.svg?style=for-the-badge&logo=biome&logoColor=white)

---

## Screenshots & Validation

### Chrome Lighthouse

![Chrome Lighthouse](/dokumentation/screenshots/lighthouse.png)

### Firefox Rendering

![Firefox Rendering](/dokumentation/screenshots/firefox.png)

### W3C HTML validation results

![W3C HTML Validation](/dokumentation/screenshots/w3c.png)

### W3C CSS / SASS validation results

![W3C CSS/SASS Validation](/dokumentation/screenshots/cssw3c.png)

---

## Design & Planning

- **Logic & Flow:** [Miro Flowchart](https://miro.com/app/board/uXjVGD_af74=/?share_link_id=396365481063)
- **Visual Identity:** [Figma Mockup](https://www.figma.com/proto/OJgqdjOM1fksuh2Gh2rsAX/The-temple-of-five?node-id=4-55&p=f&t=QRSCgQpighrHxX8w-0&scaling=scale-down&content-scaling=fixed&page-id=0%3A1&device-frame=0)

---

## Team Reflections

### What We Learned

- **Planning and project structure are important.** We learned that building the core systems (game engine, global functions, and LocalStorage handling) earlier would have made development smoother.

- **Team collaboration was a key part of the project.** We gained valuable experience working with GitHub using branches, pull requests, and resolving merge conflicts.

- **State management improved throughout the project.** We structured the game state using LocalStorage with clear states such as _pending_, _completed_, and _failed_.

- **Accessibility and UI feedback improved the user experience.** Keyboard navigation, focus handling, ARIA labels, and small UI details like animations and progress indicators helped make the game feel more polished.

---

### Difficulties / Challenges

- **Connecting all rooms to a shared game state was challenging**, since rooms were developed before a stable core system existed.

- **Timers, intervals, and event listeners sometimes caused bugs**, especially when rooms were re-entered. We solved this by adding cleanup logic and initialization guards.

- **Merge conflicts happened frequently early in the project**, but we improved our workflow and resolved them through teamwork.

- **Replay and reset flows required careful state handling** to avoid edge-case bugs.

## Credits

### The Team: The Pogo Stick Pioneers

| Pioneer                  | Role / Profile                                                                                                                    |
| :----------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **Alexander Johansson**  | [![GitHub](https://img.shields.io/badge/GitHub-AlexJCodes-181717?style=flat&logo=github)](https://github.com/AlexJCodes)          |
| **Alexandra Henriksson** | [![GitHub](https://img.shields.io/badge/GitHub-AlexandraH-181717?style=flat&logo=github)](https://github.com/AlexandraHenriksson) |
| **Emil Lychnell**        | [![GitHub](https://img.shields.io/badge/GitHub-elychnell-181717?style=flat&logo=github)](https://github.com/elychnell)            |
| **Louise Sverkström**    | [![GitHub](https://img.shields.io/badge/GitHub-LolloLicense-181717?style=flat&logo=github)](https://github.com/LolloLicense)      |
| **Minai Karlsson**       | [![GitHub](https://img.shields.io/badge/GitHub-minza--42-181717?style=flat&logo=github)](https://github.com/minza-42)             |

### Visuals

- **Images:** Generated using ChatGPT's image generator.
- **Icons:** Icons provided by [Iconify](https://iconify.design/) and [Heroicons](https://heroicons.com/). Layout and design work created in [Figma](https://www.figma.com/proto/OJgqdjOM1fksuh2Gh2rsAX/The-temple-of-five?node-id=20-467&p=f&t=QRSCgQpighrHxX8w-0&scaling=min-zoom&content-scaling=fixed&page-id=20%3A467).

### Audio & Sound Effects (via Pixabay)

| Room      | Music                                                                                                             | Sound Effects                                                                                                                                                                                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wood**  | _Shadowed Whispers_ – [TrenoX8](https://pixabay.com/music/mystery-shadowed-whispers-321103/)                      | Click – [arunangshubanerjee](https://pixabay.com/sound-effects/film-special-effects-cassette-recorder-stop-button-mechanical-click-sound-359987/)                                                                                                                                                          |
| **Fire**  | _Ambient Burning Castle_ – [Sound Reality](https://pixabay.com/music/ambient-ambient-burning-castle-320841/)      | —                                                                                                                                                                                                                                                                                                          |
| **Earth** | _Abyssal Echoes_ – [TrenoX8](https://pixabay.com/music/mystery-abyssal-echoes-dark-cinematic-suspenseful-316857/) | Click – [arunangshubanerjee](https://pixabay.com/sound-effects/film-special-effects-cassette-recorder-stop-button-mechanical-click-sound-359987/) <br> Stone Slide – [u_i15wxund59](https://pixabay.com/sound-effects/film-special-effects-stone-slide-sound-effects-322794/)                              |
| **Metal** | _Veil of Darkness_ – [TrenoX8](https://pixabay.com/music/mystery-veil-of-darkness-321167/)                        | Click – [arunangshubanerjee](https://pixabay.com/sound-effects/film-special-effects-cassette-recorder-stop-button-mechanical-click-sound-359987/)                                                                                                                                                          |
| **Water** | _The Cave_ – [Andrea Good](https://pixabay.com/music/ambient-the-cave-220274/)                                    | —                                                                                                                                                                                                                                                                                                          |
| **Final** | _Cursed Forest_ – [TrenoX8](https://pixabay.com/music/mystery-cursed-forest-305207/)                              | _Submority Boom_ – [SUBMORITY](https://pixabay.com/users/submority-30821389/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=123876) ([Pixabay](https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=123876)) |

---
