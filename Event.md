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
{"type": "ack_join_room", "room_data": room_list} #same as the previous, broadcast room_list to lobby group.
```
## when the room owner click ADD ROOM button
```python
{"type": "join_room", "room_id": room_id,  "owner_id": owner_id} #to indicate who creates which room
# updata room_data
{"type": "ack_join_room", "room_data": room_list} #same as the previous, broadcast room_list to lobby group.
```
# Room Page
## when the room owner click ADD ROOM button
```python
{"type": "add_room", "room_id": room_id, "owner_id": owner_id} #to indicate who creates which room
# add group {room_id}
# updata room_data, default max_player equals to 2.
{"type": "ack_add_room", "single_room_data": [room if room['room_id'] == {room_id} for room in room_data]} #send to the owner consumer.
```

## when the player join the room
```python
{"type": "join_room", "room_id": room_id, "player_id": player_id} #to indicate who creates which room
# updata room_data
{"type": "ack_join_room", "single_room_data": [room if room['room_id'] == {room_id} for room in room_data]} #same as the previous, broadcast room_list to room group.
```

## when room player click Prepare
```python
{"type": "tournament_prepare", "room_id": room_id, "player_id": player_id}
self.prepared_count +=1
room = room if room['room_id'] == {room_id} for room in room_data
if (prepared_count == len(room["avatars"]))
    self.send()
```
# Game Page

