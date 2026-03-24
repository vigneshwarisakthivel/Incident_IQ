from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import User, KnowledgeBase, Incident, Notification

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

def notify_user_created(new_user, admin_user):

    # 1) Notify the new user
    notification = Notification.objects.create(
        user=new_user,
        triggered_by=admin_user,
        event_type="USER_CREATED",
        title="Account Created",
        message="Your account has been created by admin"
    )

    # SEND REAL-TIME
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_notifications_{notification.user.id}",
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
        },
    )

    # 2) Notify the admin who created the user
    notification = Notification.objects.create(
        user=admin_user,
        triggered_by=admin_user,
        event_type="USER_CREATED",
        title="User Created",
        message=f"You created a new user: {new_user.name}"
    )

    # SEND REAL-TIME AGAIN
    async_to_sync(channel_layer.group_send)(
        f"user_notifications_{notification.user.id}",
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
        },
    )

# ---- Knowledge Article Approved ----
@receiver(post_save, sender=KnowledgeBase)
def knowledge_approval_notification(sender, instance, **kwargs):
    if instance.status == "Published":
        creator = instance.created_by
        if creator.role == "admin":
       
            notification = Notification.objects.create(
                user=creator,
                message=f"Article '{instance.title}' has been approved",
                event_type="KNOWLEDGE_APPROVED"
            )

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_notifications_{notification.user.id}",
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
                },
            )
        else:
            # Notify all admins that a non-admin article has been approved
            admins = User.objects.filter(role="admin")
            for admin in admins:

                notification = Notification.objects.create(
                    user=creator,
                    message=f"Article '{instance.title}' has been approved",
                    event_type="KNOWLEDGE_APPROVED"
                )

                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f"user_notifications_{notification.user.id}",
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
                    },
                )
    elif instance.status == "Draft":  # Treat as rejected
        creator = instance.created_by
        notification = Notification.objects.create(
            user=creator,
            message=f"Article '{instance.title}' has been rejected",
            event_type="KNOWLEDGE_REJECTED"
        )

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_notifications_{notification.user.id}",
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
            },
        )