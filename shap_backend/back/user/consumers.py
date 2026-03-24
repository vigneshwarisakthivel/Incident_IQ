import json
from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        query_string = self.scope["query_string"].decode()
        token = parse_qs(query_string).get("token")

        if not token:
            await self.close()
            return

        try:
            access_token = AccessToken(token[0])
            user = await User.objects.aget(id=access_token["user_id"])
            self.scope["user"] = user
        except:
            await self.close()
            return

        self.group_name = f"user_notifications_{self.scope['user'].id}"
        print("USER CONNECTED TO GROUP:", self.group_name)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_notification(self, event):
        print("MESSAGE REACHED CONSUMER:", event)
        await self.send(text_data=json.dumps(event["data"]))