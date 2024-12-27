import json
import redis
from channels.generic.websocket import AsyncWebsocketConsumer
from . import redis_data as data
import shortuuid

class WebsiteConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.lobby_group_name = 'lobby_group'
        self.room_group_name = None

        # Join the lobby group
        await self.channel_layer.group_add(
            self.lobby_group_name,
            self.channel_name
        )
        self.joined_group = ["lobby"]  # indicate which groups the consumer is in

        # Accept the WebSocket connection
        await self.accept()

    async def disconnect(self, close_code):
        if self.room_group_name is not None:
            room_id = self.room_group_name
            player_id = self.player_id
            current_room = await data.get_one_room_data(room_id)
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            if len(current_room["avatars"]) != 1:
                if current_room["room_owner"] == player_id:
                    new_room_owner = await data.update_room_owner(room_id, player_id)
                    event_leave_room = {"type": "broadcast.leave.room", "delete_room": False, "room_id": room_id, "player_id": player_id, "new_room_owner": new_room_owner}
                else:
                    await data.delete_one_player_from_room(room_id,player_id)
                    event_leave_room = {"type": "broadcast.leave.room", "delete_room": False, "room_id": room_id, "player_id": player_id, "room_owner": current_room["room_owner"]}
                match(await data.is_all_prepared(room_id)):
                    case data.RedisError.PLAYERALLPREPARED:
                        event_leave_room.update({"all_prepared": True})
                    case data.RedisError.NONE:
                        event_leave_room.update({"all_prepared": False})
                await self.channel_layer.group_send(self.room_group_name, event_leave_room)
            else:
                await data.delete_one_room(room_id)
                event_leave_room = {"type": "broadcast.leave.room", "delete_room": True, "room_id": room_id, "player_id": player_id}
            await self.channel_layer.group_send(self.lobby_group_name, event_leave_room)
        # Leave the current group(s)
        for group in self.joined_group:
            await self.channel_layer.group_discard(
                group,
                self.channel_name
            )

    # Receive message from WebSocket
    async def receive(self, text_data):
        received_json = json.loads(text_data)
        event = {}
        match received_json:
            case {"type": "init", "player_id": player_id}:
                self.player_id = player_id  # save who the player is
                if player_id:
                    room_list = await data.get_full_room_data()
                    await self.send(text_data=json.dumps({"type": "ack_init", "rooms": room_list}))
            case {"type": "join_room",  "room_id": room_id, "player_id": player_id}:
                self.room_group_name = room_id
                # Remove this consumer from lobby group
                await self.channel_layer.group_discard(
                    self.lobby_group_name,
                    self.channel_name)
                match (await data.add_player_to_room(room_id=room_id, player_id=player_id)):
                    case data.RedisError.NONE:
                        avatar = await data.get_one_player(player_id=player_id)
                        event_join_room = {"type": "broadcast.join.room", "room_id": room_id, "avatar": avatar}
                        await self.channel_layer.group_send(self.lobby_group_name, event_join_room)
                        # Add this consumer to a group identified by 'room_id'
                        await self.channel_layer.group_add(
                            self.room_group_name,
                            self.channel_name
                        )
                        self.joined_group = ["room"]
                        await self.channel_layer.group_send(self.room_group_name, event_join_room)
                        joined_room = await data.get_one_room_data(room_id=room_id)
                        if joined_room is not None:
                            await self.send(text_data=json.dumps({"type": "ack_join_room", "single_room_data": joined_room}))
                        else:
                            await self.send(text_data=json.dumps({"type": "error", "message": "Cannot find the room to join!"}))
                    case data.RedisError.NOPLAYERFOUND:
                        await self.send(text_data=json.dumps({"type": "error", "message": "player id not found", "redirect_hash": "main"}))
                    case data.RedisError.NOROOMFOUND:
                        await self.send(text_data=json.dumps({"type": "error", "message": "room id not found", "redirect_hash": "main"}))
                    case data.RedisError.MAXROOMPLAYERSREACHED:
                        await self.send(text_data=json.dumps({"type": "error", "message": "max number of players reached. Cannot join room", "redirect_hash": "main"}))
            case {"type": "add_room","owner_id": owner_id}:
                room_id = shortuuid.ShortUUID().random(length=15)
                self.room_group_name = room_id
                await self.channel_layer.group_discard(
                    self.lobby_group_name,
                    self.channel_name)
                added_room = await data.add_new_room(room_id, owner_id)
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name)
                self.joined_group = ["room"]
                await self.send(text_data=json.dumps({"type": "ack_add_room", "room_id": room_id}))
            case {"type": "leave_room","room_id": room_id,"player_id": player_id}:
                current_room = await data.get_one_room_data(room_id)
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
                self.room_group_name = None
                if len(current_room["avatars"]) != 1:
                    if current_room["room_owner"] == player_id:
                        new_room_owner = await data.update_room_owner(room_id, player_id)
                        event_leave_room = {"type": "broadcast.leave.room", "delete_room": False, "room_id": room_id, "player_id": player_id, "new_room_owner": new_room_owner}
                    else:
                        await data.delete_one_player_from_room(room_id,player_id)
                        event_leave_room = {"type": "broadcast.leave.room", "delete_room": False, "room_id": room_id, "player_id": player_id, "room_owner": current_room["room_owner"]}
                    match(await data.is_all_prepared(room_id)):
                        case data.RedisError.PLAYERALLPREPARED:
                            event_leave_room.update({"all_prepared": True})
                        case data.RedisError.NONE:
                            event_leave_room.update({"all_prepared": False})
                        case data.RedisError.NOROOMFOUND:
                            await self.send(text_data=json.dumps({"type": "error", "message": "room id not found", "redirect_hash": "main"}))
                    await self.channel_layer.group_send(self.room_group_name, event_leave_room)
                else:
                    await data.delete_one_room(room_id)
                    event_leave_room = {"type": "broadcast.leave.room", "delete_room": True, "room_id": room_id, "player_id": player_id}
                await self.channel_layer.group_send(self.lobby_group_name, event_leave_room)
                await self.channel_layer.group_add(self.lobby_group_name, self.channel_name)
                self.join_group = ["lobby"]
                await self.send(text_data=json.dumps({"type": "ack_leave_room"}))
            case {"type": "max_player","room_id": room_id, "max_player_num": max_player_num}:
                match (await data.update_max_player_num_in_one_room(room_id, max_player_num)):
                    case data.RedisError.NONE:
                        event_update_max_num =  {"type": "broadcast.update.maxplayernum", "room_id": room_id, "max_player_num": max_player_num}
                        await self.channel_layer.group_send(self.room_group_name, event_update_max_num)
                        await self.channel_layer.group_send(self.lobby_group_name, event_update_max_num)
                    case data.RedisError.NOROOMFOUND:
                        await self.send(text_data=json.dumps({"type": "error", "message": "room id not found", "redirect_hash": "main"}))
                    case data.RedisError.MAXROOMPLAYERSREACHED:
                        await self.send(text_data=json.dumps({"type": "error", "message": "max number of players reached. Cannot join room"}))
            case {"type": "update_mode", "room_id": room_id, "mode": mode}:
                match(await data.update_game_mode_in_one_room(room_id, mode)):
                    case data.RedisError.NONE:
                        event_update_mode = {"type":"broadcast.update.mode", "room_id":room_id, "mode": mode}
                        await self.channel_layer.group_send(self.room_group_name, event_update_mode)
                    case data.RedisError.NOROOMFOUND:
                        await self.send(text_data=json.dumps({"type": "error", "message": "room id not found", "redirect_hash": "main"}))
                    case data.RedisError.MODENOTSUPPORTED:
                        await self.send(text_data=json.dumps({"type": "error", "message": "mode not supported"}))
            case {"type": "prepare_game", "room_id": room_id, "player_id": player_id}:
                match(await data.update_prepared_one_player_in_one_room(room_id, player_id)):
                    case data.RedisError.NONE:
                        event_update_mode = {"type": "broadcast.update.preparegame", "room_id": room_id, "player_id": player_id, "all_prepared": False}
                        await self.channel_layer.group_send(self.room_group_name, event_update_mode)
                    case data.RedisError.PLAYERALLPREPARED:
                        event_update_mode = {"type": "broadcast.update.preparegame", "room_id": room_id, "player_id": player_id, "all_prepared": True}
                        await self.channel_layer.group_send(self.room_group_name, event_update_mode)
                    case data.RedisError.NOROOMFOUND:
                        await self.send(text_data=json.dumps({"type": "error", "message": "room id not found", "redirect_hash": "main"}))
                    case data.RedisError.NOPLAYERFOUND:
                        await self.send(text_data=json.dumps({"type": "error", "message": "player id not found", "redirect_hash": "main"}))
            case {"type": "start_game", "room_id": room_id}:
                self.first_layer_player_id, self.match_id = await data.generate_matches(room_id, self.player_id)
                first_layer_player  = []
                for id in self.first_layer_player_id:
                    if id == "ai":
                        first_layer_player.append({"player_id": "ai"})
                    else:
                        first_layer_player.append(await data.get_one_player(id))
                event_start_game = {"type":"broadcast.start.game", "players": first_layer_player}
                await self.channel_layer.group_send(self.room_group_name, event_start_game)
            case {"type": "start_game_countdown"}:
                await self.channel_layer.group_add(self.room_group_name + "_" + self.match_id, self.channel_name)
                await self.channel_layer.group_discard(self.room_group_name, event_start_game)
                self.joined_group = ["match"]
                match = await data.get_one_match(self.room_group_name, self.match_id)
                player_one = await data.get_one_player(match["players"][0]) if match["players"][0] != "ai" else {"player_id": "ai"}
                player_two = await data.get_one_player(match["players"][1]) if match["players"][1] != "ai" else {"player_id": "ai"}
                event_start_game_countdown = {"type": "broadcast.startgame.countdown", "match": match, "opponents": [player_one, player_two]}
                await self.channel_layer.group_send(self.room_group_name + "_" + self.match_id, event_start_game_countdown)
            case {"type": "create_matches", "room_id": room_id}:
                await self.create_matches(room_id)
            case {"type": "join_match", "room_id": room_id, "player_id": player_id}:
                await self.join_match(room_id, player_id) # TODO
            case {"type": "player_match_ready"}:
                await self.start_match(self)
            case {"type": "bounce_ball", "ball": ball}:
                await self.bounce_ball(self, ball)
            case {"type": "paddle_move", "position": position}:
                await self.paddle_move(self, position)
            case {"type": "scored_point"}:
                await self.score_point(self)
            case {"type": "ai_score_player"}:
                await self.ai_score_point(self, self.player_id)
            case {"type": "ai_score_ai"}:
                await self.ai_score_point(self, "ai")

    async def create_matches(self, room_id):
        room_data = await data.get_one_room_data(room_id)
        players = room_data['avatars']
        player_ids = list(players.keys())
        matches = []
        for i in range(0, len(player_ids), 2):
            if i + 1 < len(player_ids):
                match_id = shortuuid.ShortUUID().random(length=15)
                match_group_name = f'match_{match_id}'
                matches.append({
                    'match_id': match_id,
                    'ready': 0,
                    'players': [player_ids[i], player_ids[i + 1]],
                    'ball': {
                        'position': {'x': 50, 'y': 50},
                        'velocity': {'vx': 5, 'vy': 5},
                        'size': 15
                    },
                    'winner': None
                })

        await data.update_full_matches(self.room_group_name, matches)
        # Notify players in the room about the match creation
        event_matches = {"type": "broadcast.matches.created"}
        await self.channel_layer.group_send(self.room_group_name, event=event_matches)

    async def broadcast_matches_created(self, event):
        text_data = json.dumps({"type": "b_matches_created"})
        await self.send(text_data=text_data)

    async def start_match(self):
        room = await data.get_one_room_data(self.room_group_name)
        game_match = room['matches'][self.match_id]
        game_match['ready'] += 1
        player = await data.get_one_player(self.player_id)
        player['score'] = 0
        if (game_match['ready'] == 2):
            event = {"type": "broadcast.start.match", 'ball': game_match['ball']}
            await self.channel_layer.group_send(self.room_group_name + "_" + self.match_id, event)
        await data.update_room(room)
        await data.update_player(player)

    async def broadcast_start_match(self, event):
        ball = event["ball"]
        text_data = json.dumps({"type": "b_start_match", "ball": ball})
        await self.send(text_data=text_data)

    async def bounce_ball(self, ball):
        room = await data.get_one_room_data(self.room_group_name)
        match_data = room['matches'][self.match_id]
        ball_data = match_data['ball']
        ball_data = ball
        await data.update_room(room)
        event = {"type": "broadcast.bounce.ball", 'ball': game_match['ball']}
        await self.channel_layer.group_send(self.room_group_name + "_" + self.match_id, event)

    async def broadcast_bounce_ball(self, event):
        ball = event["ball"]
        text_data = json.dumps({"type": "b_bounce_ball", "ball": ball})
        await self.send(text_data=text_data)

    async def paddle_move(self, position):
        room = await data.get_one_room_data(self.room_group_name)
        match_data = room['matches'][self.match_id]
        player_data = await data.get_one_player(self.player_id)
        player_side = 0
        if match_data['players'][1] == self.player_id:
            player_side = 1
        player_data['position'] = position
        await data.update_player(player_data)
        event = {"type": "broadcast.paddle.bounce", "position": position, "player_side": player_side}
        await self.channel_layer.group_send(self.room_group_name + "_" + self.match_id, event)

    async def broadcast_paddle_bounce(self, event):
        position = event["position"]
        player_side = event["player_side"]
        text_data = json.dumps({"type": "b_paddle_bounce", "position": position, "paddle": player_side})
        await self.send(text_data=text_data)

    async def score_point(self):
        room = await data.get_one_room_data(self.room_group_name)
        match_data = room['matches'][self.match_id]
        player_data = await data.get_one_player(self.player_id)
        # player_data does not have score field
        player_data['score'] += 1
        if (player_data['score'] == 11):
            match_data['winner'] = self.player_id
            event = {"type": "broadcast.match.win", "winner": player_data};
            await self.channel_layer.group_send(self.room_group_name + "_" + self.match_id, event)
            await data.update_room(room)
        await data.update_player(player_data)
        player_side = 0
        if match_data['players'][1] == self.player_id:
            player_side = 1
        event = {"type": "broadcast.scored.point", "player_side": player_side}
        await self.channel_layer.group_send(self.room_group_name + "_" + self.match_id, event)

    async def broadcast_match_win(self, event):
        player_data = event["player_data"]
        text_data = json.dumps({"type": "b_match_win", "winner": player_data})
        await self.send(text_data=text_data)

    async def broadcast_scored_point(self, event):
        player_side = event["player_side"]
        text_data = json.dumps({"type": "b_scored_point", 'player': player_side})
        await self.send(text_data=text_data)

    async def ai_score_point(self, id):
        room = await data.get_one_room_data(self.room_group_name)
        match_data = room["matches"][self.match_id]
        player = room['ai']
        if id != "ai":
            player = await data.get_one_player(self.player_id)
            player['score'] += 1
            await data.update_player(player)
            event = {"type": "broadcast.match.win", "winner": player};
        else:
            player['score'] += 1
            event = {"type": "broadcast.match.win", "winner": "ai"};
        if player['score'] == 11:
            match_data['winner'] = id
            await self.channel_layer.group_send(self.room_group_name + "_" + self.match_id, event)
        await data.update_room(room)

# functions for dealing with events
    async def broadcast_join_room(self, event):
        room_id = event["room_id"]
        avatar = event["avatar"]
        text_data = json.dumps({"type": "b_join_room", "room_id": room_id, "avatar": avatar})
        await self.send(text_data=text_data)

    async def broadcast_leave_room(self, event):
        room_id = event["room_id"]
        player_id = event["player_id"]
        if event["delete_room"] == True:
            text_data = json.dumps({"type": "b_remove_room", "room_id": room_id})
        else:
            msg = {"type":"b_leave_room", "room_id": room_id, "player_id": player_id, "all_prepared": event["all_prepared"]}
            if "new_room_owner" in event:
                new_room_owner = event["new_room_owner"]
                msg.update({"new_room_owner": new_room_owner})
            text_data = json.dumps(msg)
        await self.send(text_data=text_data)

    async def broadcast_update_maxplayernum(self, event):
        room_id = event["room_id"]
        max_player_num = event["max_player_num"]

        text_data = json.dumps({"type": "b_max_player", "room_id": room_id, "max_player_num": max_player_num})

        await self.send(text_data=text_data)

    async def broadcast_update_mode(self, event):
        room_id = event["room_id"]
        updated_mode = event["mode"]

        text_data = json.dumps({"type": "b_update_mode", "room_id": room_id, "mode": updated_mode})
        await self.send(text_data=text_data)

    async def broadcast_update_preparegame(self, event):
        room_id = event["room_id"]
        player_id = event["player_id"]
        all_prepared = event["all_prepared"]
        text_data = json.dumps({"type": "b_prepare_game", "room_id": room_id, "player_id": player_id, "all_prepared": all_prepared})
        await self.send(text_data=text_data)

    async def broadcast_start_game(self, event):
        players = event["players"]
        text_data = json.dumps({"type": "b_start_game", "players": players})
        await self.send(text_data=text_data)

    async def broadcast_startgame_countdown(self, event):
        match = event["match"]
        opponents = event["opponets"]

        text_data = json.dumps({"type": "b_startgame_countdown", "match": match, "avatars": opponents})
        await self.send(text_data=text_data)
