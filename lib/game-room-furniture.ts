import layout from './game-room-furniture-v002.json'
import { X0, FLOOR_BASE_Y } from './interior-layout'
import type { AABB } from './collision'

export const GAME_ROOM_COLLIDERS: AABB[] = layout.colliders.map(piece => {
  const c=Math.abs(Math.cos(piece.yaw)),s=Math.abs(Math.sin(piece.yaw))
  const halfX=(c*piece.width+s*piece.depth)/2,halfZ=(s*piece.width+c*piece.depth)/2
  return {label:`game-room-${piece.id}`,minX:X0+piece.x-halfX,maxX:X0+piece.x+halfX,minZ:piece.z-halfZ,maxZ:piece.z+halfZ}
})

export const GAME_ROOM_ANCHORS = layout.anchors.map(anchor => ({
  ...anchor,
  position: {x:X0+anchor.x,y:FLOOR_BASE_Y.basement+anchor.y,z:anchor.z},
}))

let mounted=0
const combined=new WeakMap<AABB[],AABB[]>()
export function registerGameRoomFurniture(){mounted+=1;return()=>{mounted-=1}}
export function withGameRoomFurniture(walls:AABB[]){
  if(!mounted)return walls
  let result=combined.get(walls)
  if(!result){result=[...walls,...GAME_ROOM_COLLIDERS];combined.set(walls,result)}
  return result
}
