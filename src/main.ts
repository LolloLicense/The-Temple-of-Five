import "./sass/style.scss";
// Audio
import { initAudio, initSoundToggle } from "./audio";
// Welcome page
import { welcomePageFunc } from "./rooms/welcome/welcomePage.ts";
import { aboutTabs, initAboutDialog } from "./script/helper/aboutDialog.ts";
// backpack artifacts
import { initBackpackToggle } from "./script/helper/artifacts";
// Pogo-sticks cheat DEV
import { initDevCheats } from "./script/helper/devCheats.ts";
// Exit dialog
import { initExitDialog } from "./script/helper/exitDialog";
// LOGIN
import { initLoginFlow } from "./script/helper/loginFlow";
//resetBTNs
import { initResetButtons } from "./script/helper/reset";

//-----------------------------------------------------------
//-------------------------INITS-----------------------------
//-----------------------------------------------------------
welcomePageFunc();
initBackpackToggle();
initLoginFlow();
initExitDialog();
aboutTabs();
initAboutDialog();
initSoundToggle();
initAudio();
initResetButtons();
initDevCheats();
