from enum import Enum

class ErrorMessages(Enum):
    ROOM_NOT_FOUND = "error.room_not_found"
    PLAYER_NOT_FOUND = "error.player_not_found"
    MAX_PLAYERS_REACHED = "error.max_players_reached"
    MODE_NOT_SUPPORTED = "error.mode_not_supported"
    PLAYER_NOT_IN_ROOM = "error.player_not_in_room"
