from django.urls import path, include
from .views import *
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter


urlpatterns = [
    path("login/", login_user, name="login_user"),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('users/<int:pk>/status/', update_user_status),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path("incidents/", get_incidents),
    path("incidents/<int:incident_id>/",get_incident_detail,name="get_incident_detail"),
    path("incidents/<int:incident_id>/assign/", assign_engineer),
    path("incidents/<int:incident_id>/resolve/", resolve_incident),
    path("incidents/<int:incident_id>/close/", close_incident),
    path("incidents/<int:incident_id>/delete/", delete_incident, name="delete-incident"),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path("admin/create/", register_admin, name="create_admin"),
    path("users/create/", create_user_by_admin, name="create_user"),
    path("users/", get_users, name="get_users"),
    path("users/<int:pk>/", get_user, name="get_user"),
    path("users/engineers/", get_engineers),
    path("incidents/my-incidents/", my_incidents),
    path("incidents/<int:incident_id>/reopen/", reopen_incident),
    path("incidents/create/", create_incident),
    path("users/update/<int:pk>/", update_user, name="update_user"),
    path("users/delete/<int:pk>/", delete_user, name="delete_user"),
    path("knowledgebase/", get_knowledge_base),
    path("knowledge-base/create/", create_knowledge_base),
    path("engineer/incidents/<int:pk>/start/", StartIncidentView.as_view()),
    path("knowledge-base/related-incidents/", get_related_incidents),
    path("engineer/incidents/", MyAssignedIncidentsView.as_view()),
    path("knowledge-base/<int:id>/", get_knowledge_article),
    path("knowledge/<int:pk>/submit/",submit_for_approval,name="submit_for_approval"),
    path("knowledge/<int:pk>/approve/",approve_article,name="approve_article"),
    path("knowledge/<int:pk>/reject/",reject_article,name="reject_article"),
    path('notifications/', UserNotificationsView.as_view(), name='user-notifications'),
    path('notifications/<int:pk>/read/', MarkNotificationReadView.as_view(), name='mark-notification-read'),
    path("profile/update/", UserProfileUpdateView.as_view()),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("knowledge-base/update/<int:pk>/", update_knowledge_base),
    path("knowledge-base/delete/<int:pk>/", delete_knowledge_base),
    path('notifications/<int:notification_id>/delete/', NotificationDeleteView.as_view()),

   
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)