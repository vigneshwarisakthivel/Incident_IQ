from .models import Notification
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

import threading
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

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


class EmailThread(threading.Thread):
    def __init__(self, subject, text_content, html_content, to_email):
        self.subject = subject
        self.text_content = text_content
        self.html_content = html_content
        self.to_email = to_email
        threading.Thread.__init__(self)

    def run(self):
        msg = EmailMultiAlternatives(
            subject=self.subject,
            body=self.text_content,
            from_email=None,
            to=[self.to_email]
        )
        msg.attach_alternative(self.html_content, "text/html")
        msg.send()


def send_email_async(subject, text_content, html_content, to_email):
    thread = EmailThread(subject, text_content, html_content, to_email)
    thread.daemon = False
    thread.start()
    thread = EmailThread(subject, text_content, html_content, to_email)

    thread.daemon = False   # important → prevents killing before finishing
    thread.start()

    thread.join(30)   # wait maximum 3 seconds only