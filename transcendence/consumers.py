import json
import redis
from channels.generic.websocket import AsyncWebsocketConsumer
from . import redis_data as data
import shortuuid
from .error_messages import ErrorMessages
from .redis_data import RedisError

class WebsiteConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.lobby_group_name = 'lobby_group'
        self.room_group_name = None
        self.match_id = None
        self.first_layer_player_id = None
        self.player_id = None

        # Join the lobby group
        await self.channel_layer.group_add(
            self.lobby_group_name,
            self.channel_name
        )
        self.joined_group = ["lobby"]  # indicate which groups the consumer is in

        # Accept the WebSocket connection
        await self.accept()

    async def disconnect(self, close_code):
        if not self.first_layer_player_id:
            # game not started
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
        else:
            # game already started
            event_leave_match = {"type": "broadcast.leave.match", "player_id": self.player_id}
            match_group_name = self.room_group_name + "_" + str(self.match_id)
            await self.channel_layer.group_send(match_group_name, event_leave_match)

            # when left, the opponent gonna be winner
            # set self as disconnected in avatars
            match(await data.set_player_disconnect(self.room_group_name, self.player_id, True)):
                case data.RedisError.NOROOMFOUND:
                    pass
                case data.RedisError.NOPLAYERFOUND:
                    pass
                case data.RedisError.NONE:
                    print("Set myself to be disconnected succeed.")

                    # get the opponent
                    opponent_id = await data.get_opponent(self.room_group_name, self.match_id, self.player_id)

                    # check if opponent is ai or not exist or normal player
                    if opponent_id:
                        # when opponent is normal player, do nothing
                        if opponent_id == "ai": # when opponent is ai
                            await data.set_match_winner(self.room_group_name, self.match_id, opponent_id)
                            winner_id_list = await data.get_winners_list(self.room_group_name, self.first_layer_player_id)
                            is_last_game = await data.is_last_game(self.match_id, self.room_group_name)
                            match = await data.get_one_match(self.room_group_name, self.match_id);
                            await data.reset_ai_score(self.room_group_name)
                            if not is_last_game:
                                next_match_id = (len(self.first_layer_player_id) // 2) + (self.match_id // 2)
                                await data.set_player_in_next_match(self.room_group_name, next_match_id, opponent_id)
                                event = {"type": "broadcast.match.win", "room_id": self.room_group_name, "winners": winner_id_list, "match_players": match["players"]}
                            else:
                                event = {"type": "broadcast.match.win", "room_id": self.room_group_name, "winners": winner_id_list, "match_players": match["players"]}
                            await self.channel_layer.group_send(self.room_group_name, event)
                    else:
                        # opponent is empty
                        pass

                    # Check if need to delete the room
                    if (await data.is_last_one_in_room(self.room_group_name, self.player_id)):
                        event = {"type": "broadcast.leave.room", "room_id": self.room_group_name, "player_id": self.player_id, "delete_room": True, "redirect_hash": "main"}
                        await data.delete_one_room(self.room_group_name)
                    else:
                        event = {"type": "broadcast.leave.room", "room_id": self.room_group_name, "player_id": self.player_id, "delete_room": False, "all_prepared": True, "redirect_hash": "main"}
                    await self.channel_layer.group_send(self.room_group_name, event)


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
                self.player_id = player_id

                match (await data.add_player_to_room(room_id=room_id, player_id=player_id)):
                    case data.RedisError.NONE:
                        # Remove this consumer from lobby group
                        await self.channel_layer.group_discard(
                            self.lobby_group_name,
                            self.channel_name)
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
                            await self.send(text_data=json.dumps({"type": "error", "message_key": ErrorMessages.ROOM_NOT_FOUND.value}))
                    case data.RedisError.NOPLAYERFOUND:
                        await self.send(text_data=json.dumps({"type": "error", "message_key": ErrorMessages.PLAYER_NOT_FOUND.value, "redirect_hash": "main"}))
                    case data.RedisError.NOROOMFOUND:
                        await self.send(text_data=json.dumps({"type": "error", "message_key": ErrorMessages.ROOM_NOT_FOUND.value, "redirect_hash": "main"}))
                    case data.RedisError.MAXROOMPLAYERSREACHED:
                        await self.send(text_data=json.dumps({"type": "error", "message_key": ErrorMessages.MAX_PLAYERS_REACHED.value, "redirect_hash": "main"}))
                    # check if len(room[matches]) != 0 # which means the tournament is already started
                    case data.RedisError.GAMEALREADYSTARTED:
                        await self.send(text_data=json.dumps({"type": "error", "message_key": ErrorMessages.GAME_ALREADY_STARTED.value, "redirect_hash": "main"}))
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
                await self.leave_room(room_id, player_id)
            case {"type": "max_player","room_id": room_id, "max_player_num": max_player_num}:
                match (await data.update_max_player_num_in_one_room(room_id, max_player_num)):
                    case data.RedisError.NONE:
                        event_update_max_num =  {"type": "broadcast.update.maxplayernum", "room_id": room_id, "max_player_num": max_player_num}
                        await self.channel_layer.group_send(self.room_group_name, event_update_max_num)
                        await self.channel_layer.group_send(self.lobby_group_name, event_update_max_num)
                    case data.RedisError.NOROOMFOUND:
                        await self.send(text_data=json.dumps({"type": "error", "message_key": ErrorMessages.ROOM_NOT_FOUND.value, "redirect_hash": "main"}))
                    case data.RedisError.MAXROOMPLAYERSREACHED:
                        await self.send(text_data=json.dumps({"type": "error", "message_key": ErrorMessages.MAX_PLAYERS_REACHED.value}))
            case {"type": "update_mode", "room_id": room_id, "mode": mode}:
                match(await data.update_game_mode_in_one_room(room_id, mode)):
                    case data.RedisError.NONE:
                        event_update_mode = {"type":"broadcast.update.mode", "room_id":room_id, "mode": mode}
                        await self.channel_layer.group_send(self.room_group_name, event_update_mode)
                    case data.RedisError.NOROOMFOUND:
                        await self.send(text_data=json.dumps({"type": "error", "message_key": ErrorMessages.ROOM_NOT_FOUND.value, "redirect_hash": "main"}))
                    case data.RedisError.MODENOTSUPPORTED:
                        await self.send(text_data=json.dumps({"type": "error", "message_key": ErrorMessages.MODE_NOT_SUPPORTED.value}))
            case {"type": "prepare_game", "room_id": room_id, "player_id": player_id}:
                match(await data.update_prepared_one_player_in_one_room(room_id, player_id)):
                    case data.RedisError.NONE:
                        event_update_mode = {"type": "broadcast.update.preparegame", "room_id": room_id, "player_id": player_id, "all_prepared": False}
                        await self.channel_layer.group_send(self.room_group_name, event_update_mode)
                    case data.RedisError.PLAYERALLPREPARED:
                        event_update_mode = {"type": "broadcast.update.preparegame", "room_id": room_id, "player_id": player_id, "all_prepared": True}
                        await self.channel_layer.group_send(self.room_group_name, event_update_mode)
                    case data.RedisError.NOROOMFOUND:
                        await self.send(text_data=json.dumps({"type": "error", "message_key": ErrorMessages.ROOM_NOT_FOUND.value, "redirect_hash": "main"}))
                    case data.RedisError.NOPLAYERFOUND:
                        await self.send(text_data=json.dumps({"type": "error", "message_key": ErrorMessages.PLAYER_NOT_FOUND.value, "redirect_hash": "main"}))
            case {"type": "start_game", "room_id": room_id}:
                first_layer_player_ids = await data.generate_matches(room_id, self.player_id)
                first_layer_player  = []
                for id in first_layer_player_ids:
                    if id == "ai":
                        first_layer_player.append({"player_id": "ai"})
                    else:
                        first_layer_player.append(await data.get_one_player(id))
                event_start_game = {"type":"broadcast.start.game", "player_ids": first_layer_player_ids, "players": first_layer_player}
                await self.channel_layer.group_send(self.room_group_name, event_start_game)
            case {"type": "join_match", "room_id": room_id, "player_id": player_id, "match_id": match_id}:
                await self.join_match(room_id,match_id, player_id)
            case {"type": "player_match_ready"}:
                await self.start_match()
            case {"type": "bounce_ball", "ball": ball}:
                await self.bounce_ball(ball)
            case {"type": "paddle_move", "position": position}:
                await self.paddle_move(position)
            case {"type": "key_press", "position": position, "key": key}:
                await self.key_press(position, key)
            case {"type": "key_unpress", "position": position, "key": key}:
                await self.key_unpress(position, key)
            case {"type": "scored_point"}:
                await self.score_point()
            case {"type": "ai_score_player"}:
                await self.ai_score_point(self.player_id)
            case {"type": "ai_score_ai"}:
                await self.ai_score_point("ai")
            case {"type": "player_avatar_change", "emoji": emoji, "bg_color": bg_color}:
                await data.update_avatar(self.player_id, emoji, bg_color)
                event = {"type": "broadcast.update.avatar", 'player_id': self.player_id, 'emoji': emoji, 'bg_color': bg_color}
                if self.room_group_name is not None:
                    await self.channel_layer.group_send(self.room_group_name, event)
                text_data = json.dumps({"type": "ack_avatar_change", "emoji": emoji, "bg_color": bg_color})
                await self.send(text_data=text_data)
            case {"type": "leave_match"}:
                await self.leave_match()
            case {"type": "you_win"}:
                await self.set_me_win()

    async def leave_room(self, room_id, player_id):
        current_room = await data.get_one_room_data(room_id)
        if current_room is None:
            await self.send(text_data=json.dumps({"type": "error", "message_key": ErrorMessages.ROOM_NOT_FOUND.value, "redirect_hash": "main"}))
            return
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
                case data.RedisError.NOROOMFOUND:
                    await self.send(text_data=json.dumps({"type": "error", "message_key": ErrorMessages.ROOM_NOT_FOUND.value, "redirect_hash": "main"}))
            await self.channel_layer.group_send(self.room_group_name, event_leave_room)
        else:
            await data.delete_one_room(room_id)
            event_leave_room = {"type": "broadcast.leave.room", "delete_room": True, "room_id": room_id, "player_id": player_id}
        await self.channel_layer.group_send(self.lobby_group_name, event_leave_room)
        await self.channel_layer.group_add(self.lobby_group_name, self.channel_name)
        self.room_group_name = None
        self.join_group = ["lobby"]
        self.room_group_name = None
        await self.send(text_data=json.dumps({"type": "ack_leave_room"}))

    async def join_match(self, room_id, match_id, player_id):
        if self.first_layer_player_id:
            await data.reset_player_score(player_id)
            self.match_id = match_id
            match_group_name = self.room_group_name + "_" + str(self.match_id)
            await self.channel_layer.group_add(match_group_name, self.channel_name)
            if "match" not in self.joined_group:
                self.joined_group += ["match"]
            # get winners list
            winner_id_list = await data.get_winners_list(self.room_group_name, self.first_layer_player_id)
            # broadcast to room group for the tournamnet tree
            event = {"type": "broadcast.join.match", "player_id": player_id, "winners": winner_id_list}
            await self.channel_layer.group_send(match_group_name, event)
        else:
            # rejoin, needs all neccesry information
            self.player_id = player_id

            room = await data.get_one_room_data(room_id)

            if not room:
                await self.send(text_data=json.dumps({"type": "error", "message_key": ErrorMessages.ROOM_NOT_FOUND.value, "redirect_hash": "main"}))
            elif not data.is_in_room(player_id, room):
                await self.send(text_data=json.dumps({"type": "error", "message_key": ErrorMessages.PLAYER_NOT_IN_ROOM.value, "redirect_hash": "main"}))
            else:
                correct_match_id = data.get_last_match_id(room, player_id)
                if correct_match_id == -1:
                    await self.send(text_data=json.dumps({"type": "error", "message_key": ErrorMessages.MATCH_NOT_FOUND.value, "redirect_hash": "main"}))
                else:
                    # set boolean disconnected to False
                    result = await data.set_player_disconnect(room_id, self.player_id, False)
                    assert(result == RedisError.NONE)

                    room = await data.get_one_room_data(room_id)
                    single_game_state = room["matches"][correct_match_id]
                    player_info_state = next((player for player in room["avatars"] if player['player_id'] == player_id), None)
                    # if rejoined consumer has ai opponent
                    if "ai" in single_game_state["players"]:
                        redirect_hash = f"room{room_id}-ai-game{correct_match_id}"
                        ai_score = room["ai"]
                    else:
                        redirect_hash = f"room{room_id}-game{correct_match_id}"
                        ai_score = ""
                    self.first_layer_player_id = data.get_first_layer_player(room)
                    # create first layer player for generating game tree
                    first_layer_player  = []
                    for id in self.first_layer_player_id:
                        if id == "ai":
                            first_layer_player.append({"player_id": "ai"})
                        else:
                            player = next((player for player in room["avatars"] if player['player_id'] == id), None)
                            first_layer_player.append(player)
                    # create list of player index for generating game tree
                    winner_list = [match["winner"] for match in room["matches"]]
                    winner_id_list = []
                    for w in winner_list:
                        if w != "":
                            winner_id_list.append(self.first_layer_player_id.index(w))
                        else:
                            winner_id_list.append(-1)
                    await self.send(text_data=json.dumps({"type": "ack_join_match", "players": first_layer_player, "winners": winner_id_list,"game_state": single_game_state, "player_info": player_info_state, "ai": ai_score, "redirect_hash": redirect_hash}))
                    # self.player_id = player_id
                    self.room_group_name = room_id
                    self.match_id = correct_match_id
                    await self.channel_layer.group_discard(self.lobby_group_name, self.channel_name)
                    match_group_name = self.room_group_name + "_" + str(self.match_id)
                    event = {"type": "broadcast.join.match", "player_id": self.player_id, "winners": winner_id_list}
                    await self.channel_layer.group_send(match_group_name, event)
                    await self.channel_layer.group_add(match_group_name, self.channel_name)
                    await self.channel_layer.group_add(self.room_group_name, self.channel_name)
                    self.joined_group = ["room", "match"]

    async def start_match(self):
        print(self.room_group_name)
        print(self.match_id)
        await data.set_player_ready_for_match(self.room_group_name, self.match_id, self.player_id)
        room = await data.get_one_room_data(self.room_group_name)
        opponent_id = await data.get_opponent(self.room_group_name, self.match_id, self.player_id)
        game_match = room['matches'][self.match_id]

        if opponent_id and opponent_id == "ai":
            event = {"type": "broadcast.start.ai.match", 'ball': game_match['ball']}
            await self.channel_layer.group_send(self.room_group_name + "_" + str(self.match_id), event)
            return

        # Check if opponent is disconnect
        # opponent_is_disconnected = False
        # if opponent_id:
        #     for player in room["avatars"]:
        #         if player["player_id"] == opponent_id:
        #             if player["disconnected"]:
        #                 opponent_is_disconnected = True
        #                 break
        # Check if opponent left
        opponent_is_left = False
        if opponent_id:
            if not any(player["player_id"] == opponent_id for player in room["avatars"]):
                opponent_is_left = True

        if opponent_is_left:
            await data.set_match_winner(self.room_group_name, self.match_id, self.player_id)
            winner_id_list = await data.get_winners_list(self.room_group_name, self.first_layer_player_id)
            is_last_game = await data.is_last_game(self.match_id, self.room_group_name)
            if not is_last_game:
                next_match_id = (len(self.first_layer_player_id) // 2) + (self.match_id // 2)
                await data.set_player_in_next_match(self.room_group_name, next_match_id, self.player_id)
            match = await data.get_one_match(self.room_group_name, self.match_id)
            event = {"type": "broadcast.match.win", "room_id": self.room_group_name, "winners": winner_id_list, "match_players": match["players"]}
            await self.channel_layer.group_send(self.room_group_name, event)
        elif (game_match['ready'] == 2):
            await data.set_match_ready_to_zero(self.room_group_name, self.match_id)
            player0 = await data.get_one_player(game_match["players"][0])
            player1 = await data.get_one_player(game_match["players"][1])
            event = {"type": "broadcast.start.match", 'ball': game_match['ball'], 'side0_player_id': game_match['players'][0],
                        'players': [player0, player1]}
            await self.channel_layer.group_send(self.room_group_name + "_" + str(self.match_id), event)

    async def broadcast_start_ai_match(self, event):
        ball = event["ball"]
        text_data = json.dumps({"type": "b_start_ai_match", "ball": ball})
        await self.send(text_data=text_data)

    async def broadcast_start_match(self, event):
        ball = event["ball"]
        players = event["players"]
        room = await data.get_one_room_data(self.room_group_name)
        mode = room["mode"]
        side = 1
        if event['side0_player_id'] == self.player_id:
            side = 0
        text_data = json.dumps({"type": "b_start_match", "ball": ball, "side": side, "players": players, "mode": mode})
        await self.send(text_data=text_data)

    async def bounce_ball(self, ball):
        # if self.match_id is None or self.room_group_name is None:
        #     return
        if (await data.is_match_end(self.room_group_name, self.match_id)):
            return
        await data.set_ball_bounce(self.room_group_name, self.match_id, ball)
        event = {"type": "broadcast.bounce.ball", 'ball': ball}
        await self.channel_layer.group_send(self.room_group_name + "_" + str(self.match_id), event)

    async def broadcast_bounce_ball(self, event):
        ball = event["ball"]
        text_data = json.dumps({"type": "b_bounce_ball", "ball": ball})
        await self.send(text_data=text_data)

    async def paddle_move(self, position):
        # if self.match_id is None or self.room_group_name is None:
        #     return
        if (await data.is_match_end(self.room_group_name, self.match_id)):
            return
        room = await data.get_one_room_data(self.room_group_name)
        match_data = room['matches'][self.match_id]
        player_data = await data.get_one_player(self.player_id)
        player_side = 0
        if match_data['players'][1] == self.player_id:
            player_side = 1
        player_data['position'] = position
        await data.update_player(player_data)
        event = {"type": "broadcast.paddle.move", "position": position, "player_side": player_side, "key": " "}
        await self.channel_layer.group_send(self.room_group_name + "_" + str(self.match_id), event)

    async def key_press(self, position, key):
        # if self.match_id is None or self.room_group_name is None:
        #     return
        if (await data.is_match_end(self.room_group_name, self.match_id)):
            return
        room = await data.get_one_room_data(self.room_group_name)
        match_data = room['matches'][self.match_id]
        player_data = await data.get_one_player(self.player_id)
        player_side = 0
        if match_data['players'][1] == self.player_id:
            player_side = 1
        player_data['position'] = position
        await data.update_player(player_data)
        event = {"type": "broadcast.paddle.move", "position": position, "player_side": player_side, "key": key}
        await self.channel_layer.group_send(self.room_group_name + "_" + str(self.match_id), event)

    async def key_unpress(self, position, key):
        # if self.match_id is None or self.room_group_name is None:
        #     return
        if (await data.is_match_end(self.room_group_name, self.match_id)):
            return
        room = await data.get_one_room_data(self.room_group_name)
        match_data = room['matches'][self.match_id]
        player_data = await data.get_one_player(self.player_id)
        player_side = 0
        if match_data['players'][1] == self.player_id:
            player_side = 1
        player_data['position'] = position
        await data.update_player(player_data)
        event = {"type": "broadcast.key.unpress", "position": position, "player_side": player_side, "key": key}
        await self.channel_layer.group_send(self.room_group_name + "_" + str(self.match_id), event)

    async def broadcast_paddle_move(self, event):
        position = event["position"]
        player_side = event["player_side"]
        key = event["key"]
        text_data = json.dumps({"type": "b_paddle_move", "position": position, "paddle": player_side, "key": key})
        await self.send(text_data=text_data)

    async def broadcast_key_unpress(self, event):
        position = event["position"]
        player_side = event["player_side"]
        key = event["key"]
        text_data = json.dumps({"type": "b_key_unpress", "position": position, "paddle": player_side, "key": key})
        await self.send(text_data=text_data)

    async def score_point(self):
        if self.match_id is None or self.room_group_name is None:
            return
        if (await data.is_match_end(self.room_group_name, self.match_id)):
            return
        player_data = await data.get_one_player(self.player_id)
        # player_data does not have score field
        player_data['score'] += 1
        await data.update_player(player_data)
        match_data = await data.get_one_match(self.room_group_name, self.match_id)
        if match_data is not None:
            player_side = 0
            if match_data['players'][1] == self.player_id:
                player_side = 1
            ball = await data.reset_ball(self.room_group_name, self.match_id)
            event = {"type": "broadcast.scored.point", "player_side": player_side, "ball": ball}
            await self.channel_layer.group_send(self.room_group_name + "_" + str(self.match_id), event)
            if (player_data['score'] == 11):
                await data.set_match_winner(self.room_group_name, self.match_id, self.player_id)
                winner_id_list = await data.get_winners_list(self.room_group_name, self.first_layer_player_id)
                is_last_game = await data.is_last_game(self.match_id, self.room_group_name)
                match = await data.get_one_match(self.room_group_name, self.match_id);
                event = {"type": "broadcast.match.win", "room_id": self.room_group_name, "winners": winner_id_list, "match_players": match["players"]}
                await self.channel_layer.group_send(self.room_group_name, event)
                # if is not the last match, set user to next game
                if not is_last_game:
                    next_match_id = (len(self.first_layer_player_id) // 2) + (self.match_id // 2)
                    await data.set_player_in_next_match(self.room_group_name, next_match_id, self.player_id)
                    # update self.match_id to new match_id
                    # self.match_id = next_match_id
                # else:
                #     await data.delete_one_room(self.room_group_name)

    async def leave_match(self):

        event_leave_match = {"type": "broadcast.leave.match", "player_id": self.player_id}
        match_group_name = self.room_group_name + "_" + str(self.match_id)
        await self.channel_layer.group_send(match_group_name, event_leave_match)

        opponent_id = await data.get_opponent(self.room_group_name, self.match_id, self.player_id)
        match_status = await data.check_match_status(self.room_group_name, self.match_id)

        # Check if opponent left
        # opponent_is_left = False
        # if opponent_id:
        #     if not any(player["player_id"] == opponent_id for player in room["avatars"]):
        #         opponent_is_left = True
        # check if opponent is ai or not exist or normal player
        if opponent_id:
            if opponent_id == "ai":  # when opponent is ai
                await data.reset_ai_score(self.room_group_name)
                if match_status != data.MatchStatus.FINISHED:
                    await data.set_match_winner(self.room_group_name, self.match_id, opponent_id)
                    winner_id_list = await data.get_winners_list(self.room_group_name, self.first_layer_player_id)
                    is_last_game = await data.is_last_game(self.match_id, self.room_group_name)
                    match = await data.get_one_match(self.room_group_name, self.match_id);
                    if not is_last_game:
                        next_match_id = (len(self.first_layer_player_id) // 2) + (self.match_id // 2)
                        await data.set_player_in_next_match(self.room_group_name, next_match_id, opponent_id)
                        event = {"type": "broadcast.match.win", "room_id": self.room_group_name, "winners": winner_id_list, "match_players": match["players"]}
                    else:
                        event = {"type": "broadcast.match.win", "room_id": self.room_group_name, "winners": winner_id_list, "match_players": match["players"]}
                    await self.channel_layer.group_send(self.room_group_name, event)
            else: # when opponent is normal player

                if match_status == data.MatchStatus.ONGOING:
                    await data.set_match_winner(self.room_group_name, self.match_id, opponent_id)
                    winner_id_list = await data.get_winners_list(self.room_group_name, self.first_layer_player_id)
                    match = await data.get_one_match(self.room_group_name, self.match_id)
                    is_last_game = await data.is_last_game(self.match_id, self.room_group_name)
                    if not is_last_game:
                        next_match_id = (len(self.first_layer_player_id) // 2) + (self.match_id // 2)
                        await data.set_player_in_next_match(self.room_group_name, next_match_id, opponent_id)
                        event = {"type": "broadcast.match.win", "room_id": self.room_group_name, "winners": winner_id_list, "match_players": match["players"]}
                    else:
                        event = {"type": "broadcast.match.win", "room_id": self.room_group_name, "winners": winner_id_list, "match_players": match["players"]}
                    await self.channel_layer.group_send(self.room_group_name, event)

                # Check if opponent left
                opponent_is_left = False
                room = await data.get_one_room_data(self.room_group_name)
                if not any(player["player_id"] == opponent_id for player in room["avatars"]):
                    opponent_is_left = True
                # Check if opponent is disconnect
                opponent_is_disconnected = False
                if opponent_id:
                    for player in room["avatars"]:
                        if player["player_id"] == opponent_id:
                            if player["disconnected"]:
                                opponent_is_disconnected = True
                                break

                # If both left during countdown: self.player_id is the latter one who left the match during countdown
                if match_status == data.MatchStatus.BEFORE_START and (opponent_is_left or opponent_is_disconnected):
                    await data.set_match_winner(self.room_group_name, self.match_id, self.player_id)
                    winner_id_list = await data.get_winners_list(self.room_group_name, self.first_layer_player_id)
                    is_last_game = await data.is_last_game(self.match_id, self.room_group_name)
                    if not is_last_game:
                        next_match_id = (len(self.first_layer_player_id) // 2) + (self.match_id // 2)
                        await data.set_player_in_next_match(self.room_group_name, next_match_id, self.player_id)
                    match = await data.get_one_match(self.room_group_name, self.match_id);
                    event = {"type": "broadcast.match.win", "room_id": self.room_group_name, "winners": winner_id_list, "match_players": match["players"]}
                    await self.channel_layer.group_send(self.room_group_name, event)
        else:
            # opponent is empty
            pass

        # Delete myself from the room["avatars"]
        await data.delete_one_player_from_room(self.room_group_name, self.player_id)
        # Check if need to delete the room
        if (await data.is_last_one_in_room(self.room_group_name, self.player_id)):
            event = {"type": "broadcast.leave.room", "room_id": self.room_group_name, "player_id": self.player_id, "delete_room": True, "redirect_hash": "main"}
            await data.delete_one_room(self.room_group_name)
        else:
            event = {"type": "broadcast.leave.room", "room_id": self.room_group_name, "player_id": self.player_id, "delete_room": False, "all_prepared": True, "redirect_hash": "main"}
        await self.channel_layer.group_send(self.room_group_name, event)


        await self.channel_layer.group_discard(self.room_group_name + "_" + str(self.match_id), self.channel_name)
        print("Leave match and Leave this room: " + self.room_group_name)
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        self.room_group_name = None
        self.match_id = None
        self.first_layer_player_id = None
        await self.channel_layer.group_add(self.lobby_group_name, self.channel_name)
        self.joined_group = ["lobby"]
        await self.send(text_data=json.dumps({"type": "ack_leave_room"}))

    async def set_me_win(self):
        match = await data.get_one_match(self.room_group_name, self.match_id)
        await data.set_match_winner(self.room_group_name, self.match_id, self.player_id)
        winner_id_list = await data.get_winners_list(self.room_group_name, self.first_layer_player_id)
        is_last_game = await data.is_last_game(self.match_id, self.room_group_name)
        if not is_last_game:
            next_match_id = (len(self.first_layer_player_id) // 2) + (self.match_id // 2)
            await data.set_player_in_next_match(self.room_group_name, next_match_id, self.player_id)
        event = {"type": "broadcast.match.win", "room_id": self.room_group_name, "winners": winner_id_list, "match_players": match["players"]}
        await self.channel_layer.group_send(self.room_group_name, event)


    async def broadcast_match_win(self, event):
        winner_list = event["winners"]
        room_id = event["room_id"]
        text_data = json.dumps({"type": "b_match_win", "winners": winner_list})
        # TODO: discard the only the consumers from this match
        match_players = event["match_players"]
        if self.player_id in match_players:
            await self.channel_layer.group_discard(room_id + "_" + str(self.match_id), self.channel_name)

        await self.send(text_data=text_data)

    async def broadcast_scored_point(self, event):
        player_side = event["player_side"]
        ball = event["ball"]
        text_data = json.dumps({"type": "b_scored_point", 'player': player_side, 'ball': ball})
        await self.send(text_data=text_data)

    async def ai_score_point(self, id):
        score = 0
        if id != "ai":
            player = await data.get_one_player(self.player_id)
            player['score'] += 1
            score = player['score']
            await data.update_player(player)
            # event = {"type": "broadcast.match.win", "room_id": self.room_group_name, "winner": player}
        else:
            room = await data.get_one_room_data(self.room_group_name) # TODO: room does not exists
            player = room['ai']
            score = player['score'] + 1
            await data.increase_ai_score(self.room_group_name)
            # event = {"type": "broadcast.match.win", "room_id": self.room_group_name, "winner": "ai"}
        if score == 11:
            await data.set_match_winner(self.room_group_name, self.match_id, id)
            winner_id_list = await data.get_winners_list(self.room_group_name, self.first_layer_player_id)
            is_last_game = await data.is_last_game(self.match_id, self.room_group_name)
            match = await data.get_one_match(self.room_group_name, self.match_id);
            event = {"type": "broadcast.match.win", "room_id": self.room_group_name, "winners": winner_id_list, "match_players": match["players"]}
            await self.channel_layer.group_send(self.room_group_name, event)
            await data.reset_ai_score(self.room_group_name)
            if not is_last_game:
            # if is not the last match, set user to next game when it is not ai
                next_match_id = (len(self.first_layer_player_id) // 2) + (self.match_id // 2)
                winner_id = "ai"
                if id != "ai":
                    winner_id = self.player_id
                    # update self.match_id to new match_id
                    # self.match_id = next_match_id

                await data.set_player_in_next_match(self.room_group_name, next_match_id, winner_id)

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
        player_ids = event["player_ids"]
        players = event["players"]
        self.first_layer_player_id = player_ids
        for i, player in enumerate(player_ids):
            if player == self.player_id:
                self.match_id = i // 2
                match_group_name = self.room_group_name + "_" + str(self.match_id)
                await self.channel_layer.group_add(match_group_name, self.channel_name)
                self.joined_group += ["match"]
                break
        text_data = json.dumps({"type": "b_start_game", "players": players})
        await self.send(text_data=text_data)

    async def broadcast_update_avatar(self, event):
        player_id = event["player_id"]
        emoji = event["emoji"]
        bg_color = event["bg_color"]
        text_data = json.dumps({"type": "b_avatar_change", "player_id": player_id, "emoji": emoji, "bg_color": bg_color})
        await self.send(text_data=text_data)

    async def broadcast_join_match(self, event):
        winners = event["winners"]
        player_id = event["player_id"]
        text_data = json.dumps({"type": "b_join_match", "player_id": player_id, "winners": winners})
        await self.send(text_data=text_data)

    async def broadcast_leave_match(self, event):
        left_opponent = event["player_id"]
        text_data = json.dumps({"type": "b_leave_match", "left_opponent": left_opponent})
        await self.send(text_data=text_data)
