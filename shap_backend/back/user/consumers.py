import json
from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):

    async def connect(self):

        try:
            query_string = self.scope["query_string"].decode()
            token = parse_qs(query_string).get("token")

            if not token:
                await self.close()
                return

            access_token = AccessToken(token[0])

            # IMPORTANT: use sync_to_async instead of aget()
            user = await sync_to_async(User.objects.get)(
                id=access_token["user_id"]
            )

            self.scope["user"] = user

            self.group_name = f"user_notifications_{user.id}"

            print("USER CONNECTED:", user.id)
            print("GROUP:", self.group_name)

            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )

            await self.accept()

        except Exception as e:
            print("WEBSOCKET ERROR:", e)
            await self.close()

    async def disconnect(self, close_code):
        try:
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
        except:
            pass

    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event["data"]))