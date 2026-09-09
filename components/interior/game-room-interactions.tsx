"use client"

import { useEffect } from "react"
import { GAME_ROOM_ANCHORS } from "@/lib/game-room-furniture"
import { registerInteractable, unregisterInteractable } from "@/lib/use-interaction"
import { playSound } from "@/lib/audio"

/** Stable attachment points for later cabinet games; current interactions are intentionally inert. */
export function GameRoomInteractions(){
  useEffect(()=>{
    for(const anchor of GAME_ROOM_ANCHORS) registerInteractable({
      id:`game-room-${anchor.id}`,
      floor:'basement',
      label:`${anchor.label} · COMING SOON`,
      position:anchor.position,
      radius:anchor.radius,
      requireLook:true,
      onInteract:()=>playSound('interact'),
    })
    return()=>{for(const anchor of GAME_ROOM_ANCHORS)unregisterInteractable(`game-room-${anchor.id}`)}
  },[])
  return null
}
