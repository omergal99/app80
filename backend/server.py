from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
# from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional
import uuid
from datetime import datetime, timezone
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# # MongoDB connection
# mongo_url = os.environ['MONGO_URL']
# client = AsyncIOMotorClient(mongo_url)
# db = client[os.environ['DB_NAME']]

app = FastAPI()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = os.getenv("CORS_ORIGINS", "").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Room names configuration
ROOM_NAMES = {
    1: "חדר הסודות",
    2: "חדר חדרי החדרים",
    3: "חדר ילדים",
    4: "חדר אחרון ודי",
}

def get_room_name(room_id: int) -> str:
    """Get room name with fallback to default if not found"""
    return ROOM_NAMES.get(room_id, f"חדר {room_id}")

# Game State Management
class Player(BaseModel):
    nickname: str
    is_admin: bool = False
    number: Optional[int] = None
    connected: bool = True

class GameRound(BaseModel):
    round_number: int
    players_data: Dict[str, int]  # nickname -> number
    total_sum: float
    average: float
    target_number: float
    winner: str
    timestamp: str

class RoomState(BaseModel):
    room_id: int
    players: Dict[str, Player] = {}  # nickname -> Player
    game_status: str = "waiting"  # waiting, choosing, results
    current_round: int = 0
    game_history: List[GameRound] = []
    multiplier: float = 0.8  # Configurable multiplier (0.1 to 1.9)

# In-memory storage for 4 rooms
rooms: Dict[int, RoomState] = {
    1: RoomState(room_id=1),
    2: RoomState(room_id=2),
    3: RoomState(room_id=3),
    4: RoomState(room_id=4)
}

# Separate WebSocket connections storage
room_connections: Dict[int, Dict[str, WebSocket]] = {
    1: {},
    2: {},
    3: {},
    4: {}
}

class ConnectionManager:
    def __init__(self):
        pass
    
    async def connect(self, websocket: WebSocket, room_id: int, nickname: str):
        await websocket.accept()
        room = rooms[room_id]
        
        # Check if game already started
        if room.game_status != "waiting" and nickname not in room.players:
            await websocket.send_json({
                "type": "error",
                "message": "המשחק כבר התחיל, לא ניתן להצטרף עכשיו"
            })
            await websocket.close()
            return False
        
        # Add player or reconnect existing
        is_new_player = nickname not in room.players
        
        if is_new_player:
            # New player - check if room needs an admin
            connected_players = [p for p in room.players.values() if p.connected]
            has_admin = any(p.is_admin for p in connected_players)
            is_admin = len(connected_players) == 0 or not has_admin
            room.players[nickname] = Player(nickname=nickname, is_admin=is_admin)
        else:
            # Reconnecting player - keep their previous admin status
            room.players[nickname].connected = True
        
        # Ensure only ONE admin exists among ALL players (not just connected)
        admin_count = sum(1 for p in room.players.values() if p.is_admin)
        if admin_count > 1:
            # Keep admin status only for the first admin, remove from others
            found_admin = False
            for p in room.players.values():
                if p.is_admin:
                    if found_admin:
                        p.is_admin = False
                    else:
                        found_admin = True
        
        room_connections[room_id][nickname] = websocket
        return True
    
    def disconnect(self, room_id: int, nickname: str):
        room = rooms[room_id]
        if nickname in room_connections[room_id]:
            del room_connections[room_id][nickname]
        if nickname in room.players:
            was_admin = room.players[nickname].is_admin
            room.players[nickname].connected = False
            
            # If admin disconnected, promote next connected player (only if no other admin)
            if was_admin:
                admin_exists = any(p.is_admin and p.connected for p in room.players.values())
                if not admin_exists:
                    for player in room.players.values():
                        if player.connected:
                            player.is_admin = True
                            break
            
        # Clean up room if no connected players
        if not any(p.connected for p in room.players.values()):
            rooms[room_id] = RoomState(room_id=room_id)
            room_connections[room_id] = {}
    
    async def broadcast(self, room_id: int, message: dict):
        disconnected = []
        
        for nickname, websocket in room_connections[room_id].items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to {nickname}: {e}")
                disconnected.append(nickname)
        
        # Clean up disconnected
        for nickname in disconnected:
            self.disconnect(room_id, nickname)

manager = ConnectionManager()

@api_router.get("/rooms")
async def get_rooms():
    """Get status of all rooms"""
    rooms_status = []
    for room_id, room in rooms.items():
        connected_players = [p.nickname for p in room.players.values() if p.connected]
        rooms_status.append({
            "room_id": room_id,
            "room_name": get_room_name(room_id),
            "player_count": len(connected_players),
            "game_status": room.game_status,
            "players": connected_players
        })
    return rooms_status

@app.websocket("/api/ws/{room_id}/{nickname}")
async def websocket_endpoint(websocket: WebSocket, room_id: int, nickname: str):
    if room_id not in rooms:
        await websocket.close()
        return
    
    connected = await manager.connect(websocket, room_id, nickname)
    if not connected:
        return
    
    try:
        # Send initial state
        await send_room_state(room_id)
        
        while True:
            data = await websocket.receive_json()
            await handle_message(room_id, nickname, data)
    
    except WebSocketDisconnect:
        manager.disconnect(room_id, nickname)
        await send_room_state(room_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(room_id, nickname)

async def handle_message(room_id: int, nickname: str, data: dict):
    room = rooms[room_id]
    action = data.get("action")
    
    if action == "start_game":
        connected_players = [p for p in room.players.values() if p.connected]
        if room.players[nickname].is_admin and len(connected_players) >= 1:
            room.game_status = "choosing"
            room.current_round += 1
            # Reset all numbers
            for player in room.players.values():
                player.number = None
            await send_room_state(room_id)
    
    elif action == "choose_number":
        if room.game_status == "choosing":
            number = data.get("number")
            if 0 <= number <= 100:
                room.players[nickname].number = number
                
                # Check if all players chose
                if all(p.number is not None for p in room.players.values() if p.connected):
                    await calculate_winner(room_id)
                else:
                    await send_room_state(room_id)
    
    elif action == "new_round":
        if room.players[nickname].is_admin:
            room.game_status = "choosing"
            room.current_round += 1
            for player in room.players.values():
                player.number = None
            await send_room_state(room_id)
    
    elif action == "stop_game":
        if room.players[nickname].is_admin:
            room.game_status = "waiting"
            for player in room.players.values():
                player.number = None
            
            # Ensure only one admin exists among connected players
            admin_count = sum(1 for p in room.players.values() if p.is_admin and p.connected)
            if admin_count > 1:
                # Remove admin from all but the first connected admin
                found_admin = False
                for player in room.players.values():
                    if player.connected and player.is_admin:
                        if found_admin:
                            player.is_admin = False
                        else:
                            found_admin = True
            
            await send_room_state(room_id)
    
    elif action == "clear_history":
        if room.players[nickname].is_admin:
            room.game_history = []
            await send_room_state(room_id)
    
    elif action == "set_multiplier":
        if room.players[nickname].is_admin and room.game_status == "waiting":
            multiplier = data.get("multiplier")
            if multiplier is not None and 0.1 <= multiplier <= 1.9:
                room.multiplier = multiplier
                await send_room_state(room_id)
    
    elif action == "remove_player":
        if room.players[nickname].is_admin and room.game_status == "choosing":
            target_nickname = data.get("target_nickname")
            if target_nickname in room.players and target_nickname != nickname:
                room.players[target_nickname].connected = False
                # Check if remaining players all chose
                remaining_players = [p for p in room.players.values() if p.connected]
                if remaining_players and all(p.number is not None for p in remaining_players):
                    await calculate_winner(room_id)
                else:
                    await send_room_state(room_id)
    
    elif action == "force_finish_round":
        if room.players[nickname].is_admin and room.game_status == "choosing":
            await calculate_winner(room_id)

async def calculate_winner(room_id: int):
    room = rooms[room_id]
    
    # Calculate average and target using room's multiplier
    numbers = [p.number for p in room.players.values() if p.connected and p.number is not None]
    total_sum = sum(numbers)
    average = total_sum / len(numbers) if numbers else 0
    target = average * room.multiplier
    
    # Find winner (closest to target)
    winner = None
    min_distance = float('inf')
    
    for player in room.players.values():
        if player.connected and player.number is not None:
            distance = abs(player.number - target)
            if distance < min_distance:
                min_distance = distance
                winner = player.nickname
    
    # Save to history
    players_data = {p.nickname: p.number for p in room.players.values() if p.connected}
    game_round = GameRound(
        round_number=room.current_round,
        players_data=players_data,
        total_sum=total_sum,
        average=round(average, 2),
        target_number=round(target, 2),
        winner=winner,
        timestamp=datetime.now(timezone.utc).isoformat()
    )
    room.game_history.append(game_round)
    room.game_status = "results"
    
    await send_room_state(room_id)

async def send_room_state(room_id: int):
    room = rooms[room_id]
    
    # Prepare state
    players_list = []
    for p in room.players.values():
        players_list.append({
            "nickname": p.nickname,
            "is_admin": p.is_admin,
            "has_chosen": p.number is not None,
            "number": p.number if room.game_status == "results" else None,
            "connected": p.connected
        })
    
    state = {
        "type": "room_state",
        "room_id": room_id,
        "players": players_list,
        "game_status": room.game_status,
        "current_round": room.current_round,
        "multiplier": room.multiplier,
        "game_history": [h.model_dump() for h in room.game_history]
    }
    
    await manager.broadcast(room_id, state)

# Include the router in the main app
app.include_router(api_router)

# @app.on_event("shutdown")
# async def shutdown_db_client():
#     client.close()