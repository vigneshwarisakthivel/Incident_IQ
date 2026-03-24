from .models import Notification
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

def create_notification(
    user,
    event_type,
    message,
    incident=None,
    article=None,
    triggered_by=None
):

    # 1️⃣ Save notification in DB
    notification = Notification.objects.create(
        user=user,
        event_type=event_type,
        message=message,
        incident=incident,
        article=article,
        triggered_by=triggered_by
    )

    # 2️⃣ Send real-time notification to WebSocket
    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        f"user_notifications_{user.id}",   # ← IMPORTANT CHANGE
        {
            "type": "send_notification",
            "data": {
                "type": "new_notification",
                "notification": {
                    "id": notification.id,
                    "message": notification.message,
                    "created_at": str(notification.created_at),
                    "is_read": False,
                },
            },
        }
    )
    print("NOTIFICATION SAVED:", notification.id)
    print("SENDING TO GROUP:", f"user_notifications_{user.id}")
    return notification

def get_admin_user(user):
    """
    If the user is admin → return self
    Otherwise → return created_by (admin)
    """
    if user.role.lower() == "admin":
        return user

    return user.created_by


def notify_admin(
    triggered_user,
    event_type,
    message,
    incident=None,
    article=None
):
    admin = get_admin_user(triggered_user)

    if not admin:
        return None

    return create_notification(
        user=admin,
        event_type=event_type,
        message=message,
        incident=incident,
        article=article,
        triggered_by=triggered_user
    )