import * as dataJSON from "../../data.json";
import { getRoomResults, type TRoomId } from "./storage";

//-----------------------------------------------------------
//----------------------- CONFIG ----------------------------
//-----------------------------------------------------------

/**
 * rooms/room-artefact that fills the slots in backpack dropdown -
 * in same order always?
 * slotindex 0 - 4*/
const ROOMS: TRoomId[] = ["wood", "fire", "earth", "metal", "water"];

/**
 * Mapping json-rooms and connects with TRoomID from storage
 *
 */
const ROOM_JSON = {
  wood: dataJSON.room1wood,
  fire: dataJSON.room2fire,
  earth: dataJSON.room3earth,
  metal: dataJSON.room4metal,
  water: dataJSON.room5water,
} as const;

//-----------------------------------------------------------
//-------------------- ICONS & KIND OF ----------------------
//-----------------------------------------------------------

/**
 * Declare what icon should be picked up in backpack
 */
