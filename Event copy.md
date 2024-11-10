**The JSON message is processed in the recieve function of Class Consumer**
**`async def receive(self, text_data)`**
**should use async redis `aioredis`**

```python
#sample redis data
#List[dict]
room_data = [
    {
        "room_id": "example_room_1",
        "room_owner": "player_id_1",
        "room_setting": {
            ...
        }
        "avatars": [
            {"player_id": "example_player_id_1", "player_emoji": "233", "player_bg_color": "ff0000"},
            {"player_id": "example_player_id_2", "player_emoji": "234", "player_bg_color": "ffff00"},
            {"player_id": "example_player_id_3", "player_emoji": "235", "player_bg_color": "00ff00"}
        ],
        "max_player": 3
    },
    {
        "room_id": "example_room_2",
        "room_owner": "player_id_4",
        "room_setting": {
            ...
        }
        "avatars": [
            {"player_id": "example_player_id_4", "player_emoji": "236", "player_bg_color": "0000ff"},
            {"player_id": "example_player_id_5", "player_emoji": "237", "player_bg_color": "ff00ff"},
            {"player_id": "example_player_id_6", "player_emoji": "238", "player_bg_color": "00ffff"}
        ],
        "max_player": 5
    }
]
```

# Lobby Page
## when the user lands on the lobby page
```python
{"type": "init", "player_id": player_id} #get from frontend to indicate which client is related to this consumer
{"type": "ack_init", "rooms": room_list} #broadcast to frontend to list all the rooms which should be the following:
# room_list: List[dict]
room_data = [
    {
        "room_id": "example_room_1",
        "avatars": [
            {"player_id": "example_player_id_1", "player_emoji": "233", "player_bg_color": "ff0000"},
            {"player_id": "example_player_id_2", "player_emoji": "234", "player_bg_color": "ffff00"},
            {"player_id": "example_player_id_3", "player_emoji": "235", "player_bg_color": "00ff00"}
        ],
        "max_player": 3
    },
    {
        "room_id": "example_room_2",
        "avatars": [
            {"player_id": "example_player_id_4", "player_emoji": "236", "player_bg_color": "0000ff"},
            {"player_id": "example_player_id_5", "player_emoji": "237", "player_bg_color": "ff00ff"},
            {"player_id": "example_player_id_6", "player_emoji": "238", "player_bg_color": "00ffff"}
        ],
        "max_player": 5
    }
]

```

## when the user joins the room
```python
{"type": "join_room", "room_id": room_id, "player_id": player_id} #to indicate who joins which room
{"type": "b_join_room", "room_id": room_id, "avatar": avatar} #to indicate who joins which room, boardcast to lobby and room
{"type": "ack_join_room", "single_room_data": joined_room} #same as the previous, broadcast room_list to lobby group.
```
## when the room owner click ADD ROOM button
```python
{"type": "add_room", "owner_id": owner_id} #to indicate who creates which room
# updata room_data
{"type": "b_add_room", "room_id": room_id, "owner_avatar": owner_avater} #same as the previous, broadcast room_list to lobby group.
{"type": "ack_add_room", "single_room_data": added_room}
```
# Room Page
## when room player click Prepare
```python
{"type": "game_prepare", "room_id": room_id, "player_id": player_id}
# modify the prepared_count += 1 in redis room_data
# check if prepared_count equals to the number of players.
# if yes:
# send to room_ownder a b_game_prepare(braodcast to room_group)
{"type": "b_game_prepare", "ready_to_start": true}
```

## when room owner click Start Game
```python
{"type": "game_start", "room_id": room_id}
# game page kicks in...
# here is only the draft

# leave room group but add to game group
# broadcast to the game group
{"type": "b_game_start", "game_id": game_id}
```

## when room owner change the max numbers of player
```python
{"type": "change_max_player", "room_id": room_id, "max_player": 5}
# modify the max_player if msg["max_player"] <= 8
# check if msg["max_player"] >= len(avatar)
# broadcast to both lobby group and room group
{"type": "b_change_max_player", "room_id": room_id, "max_player": 5}
```

## when room owner change the game settings
```python
{"type": ""}
# Game Page
