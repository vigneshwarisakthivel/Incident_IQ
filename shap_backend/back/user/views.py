from .models import *
from .serializers import *
from .utils import *
from .signals import *
from django.core.mail import send_mail
from rest_framework.decorators import permission_classes,api_view
from rest_framework.response import Response
from datetime import datetime, timedelta
from .permissions import IsAdminUserCustom
from rest_framework import status
from django.db.models import Q
from rest_framework.parsers import MultiPartParser, FormParser
from difflib import SequenceMatcher
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from django.utils import timezone
import random
from rest_framework import generics, permissions
from django.shortcuts import get_object_or_404
from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.core.mail import EmailMessage
from django.core.mail import EmailMultiAlternatives, BadHeaderError
User = get_user_model()  # ✅ Always use this with a custom user model

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):

    email = request.data.get("email")
    password = request.data.get("password")

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"error": "Invalid email or password"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.check_password(password):
        return Response(
            {"error": "Invalid email or password"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    refresh = RefreshToken.for_user(user)

    return Response({
        "message": "Login successful",
        "token": str(refresh.access_token),
        "user": {
            "id": user.id,
            "name": user.username,
            "email": user.email,
            "role": user.role
        }
    })

class ForgotPasswordView(APIView):
    def post(self, request):
        serializer = ForgotPasswordEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)  # ✅ Using custom user model
        except User.DoesNotExist:
            return Response(
                {"detail": "User with this email does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Generate OTP
        otp_code = "{:06d}".format(random.randint(0, 999999))
        PasswordResetOTP.objects.create(user=user, otp=otp_code)

        # Prepare email content
        subject = "Reset Your Password – Action Required"
        from_email = settings.EMAIL_HOST_USER
        to = [email]

        # Plain text fallback
        text_content = f"""
Hello {user.name},

We received a request to reset the password for your account.

Your One-Time Password (OTP) is: {otp_code}

This OTP is valid for 10 minutes. Please do not share this code with anyone.

If you did not request a password reset, you can safely ignore this email.

Thank you,
The Support Team
"""

        # HTML content
        html_content = f"""
<html>
  <body style="font-family:Arial,sans-serif; line-height:1.6; color:#333;">
    <p>Hello {user.name},</p>
    <p>We received a request to reset the password for your account.</p>
    <p style="font-size:20px; font-weight:bold; color:#1a1a1a;">
      Your OTP: {otp_code}
    </p>
    <p>This OTP is valid for <strong>10 minutes</strong>. Please do not share it with anyone.</p>
    <p>If you did not request a password reset, you can safely ignore this email.</p>
    <br>
    <p>Thank you,<br>The Support Team</p>
  </body>
</html>
"""

        # Send email
        try:
            msg = EmailMultiAlternatives(subject, text_content, from_email, to)
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
        except BadHeaderError as e:
            print("Bad header error:", e)
            return Response({"detail": "Invalid header found."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print("Email sending failed:", e)
            return Response({"detail": "Failed to send email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            {"detail": "OTP sent to your email"},
            status=status.HTTP_200_OK
        )

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user_status(request, pk):

    try:
        user = User.objects.get(id=pk)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    status_value = request.data.get("status")

    if status_value is None:
        return Response({"error": "Status required"}, status=400)

    # Handle boolean values
    if isinstance(status_value, bool):
        status_value = "ACTIVE" if status_value else "INACTIVE"

    # Handle string values
    if isinstance(status_value, str):
        status_value = status_value.upper()

    if status_value not in ["ACTIVE", "INACTIVE"]:
        return Response({"error": "Invalid status"}, status=400)

    user.status = status_value
    user.save()
    event = "USER_ACTIVATED" if user.status == "ACTIVE" else "USER_DEACTIVATED"

    create_notification(
        user=user,
        event_type=event,
        message=f"Your account has been {user.status.lower()} by admin",
        triggered_by=request.user
    )

    return Response({
        "message": "Status updated successfully",
        "status": user.status
    })

class VerifyOTPView(APIView):
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            otp_obj = PasswordResetOTP.objects.get(user=user, otp=otp, is_verified=False)
        except PasswordResetOTP.DoesNotExist:
            return Response({"detail": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

        if otp_obj.expires_at < timezone.now():
            return Response({"detail": "OTP expired"}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj.is_verified = True
        otp_obj.save()

        return Response({"detail": "OTP verified successfully"}, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_incidents(request):
    user = request.user
    now = timezone.now()

    if user.role == "admin":
        # Get all users (supports + engineers) created by this admin
        team_users = User.objects.filter(created_by=user)
        # Include incidents:
        # - reported by team users
        # - assigned to team users
        # - optionally, reported by admin themselves
        incidents = Incident.objects.filter(
            Q(reported_by__in=team_users) | Q(assigned_to__in=team_users) | Q(reported_by=user)
        )

    elif user.role == "support":
        # Support sees incidents they reported
        incidents = Incident.objects.filter(reported_by=user)

    elif user.role == "engineer":
        # Engineer sees incidents assigned to them
        incidents = Incident.objects.filter(assigned_to=user)

    else:
        incidents = Incident.objects.none()

    incidents = incidents.order_by("-created_at")

    # Compute stats
    total = incidents.count()
    critical = incidents.filter(priority="critical").count()
    overdue = sum(
        1 for i in incidents
        if isinstance(i.created_at, datetime) and 
           (now - i.created_at) > timedelta(hours=24) and
           i.status not in ["resolved", "closed"]
    )

    serializer = IncidentSerializer(incidents, many=True)
    return Response({
        "stats": {
            "total": total,
            "critical": critical,
            "overdue": overdue
        },
        "incidents": serializer.data
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_incident_detail(request, incident_id):

    try:
        incident = Incident.objects.get(id=incident_id)

        serializer = IncidentSerializer(incident)

        return Response(serializer.data)

    except Incident.DoesNotExist:
        return Response(
            {"error": "Incident not found"},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def assign_engineer(request, incident_id):

    engineer_id = request.data.get("engineer_id")

    try:
        incident = Incident.objects.get(id=incident_id)
        engineer = User.objects.get(id=engineer_id)

    except Incident.DoesNotExist:
        return Response({"error": "Incident not found"}, status=404)

    except User.DoesNotExist:
        return Response({"error": "Engineer not found"}, status=404)
    
    IncidentUpdate.objects.create(
    incident=incident,
    user=request.user,
    message=f"Engineer {engineer.username} assigned"
)
    incident.assigned_to = engineer
    incident.status = "in_progress"
    incident.save()
    # 🔔 Notify engineer
    create_notification(
        user=engineer,
        event_type="INCIDENT_ASSIGNED",
        message=f"You have been assigned Incident #{incident.id}",
        incident=incident,
        triggered_by=request.user
    )
    return Response({
        "message": "Engineer assigned successfully"
    })

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def resolve_incident(request, incident_id):
    resolution_note = request.data.get("resolution_note")
    category = request.data.get("category")

    try:
        incident = Incident.objects.get(id=incident_id)
    except Incident.DoesNotExist:
        return Response({"error": "Incident not found"}, status=404)

    # Save the resolution note, status, and category
    incident.status = "resolved"
    incident.resolution_note = resolution_note
    incident.category = category  # <--- Save category here
    incident.resolved_at = timezone.now()
    incident.save()

    # Create update log
    IncidentUpdate.objects.create(
        incident=incident,
        user=request.user,
        message=f"Incident resolved: {resolution_note}"
    )

    # Notify support
    create_notification(
        user=incident.reported_by,
        event_type="INCIDENT_SENT_FOR_VERIFICATION",
        message=f"Incident #{incident.id} resolved and sent for verification",
        incident=incident,
        triggered_by=request.user
    )

    return Response({
        "message": "Incident resolved successfully",
        "resolution_note": resolution_note,
        "category": category
    })

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def close_incident(request, incident_id):
    """
    Close an incident and optionally create a KnowledgeBase article.
    - Logs the closure in IncidentUpdate
    - Updates incident status and closed_at
    - Notifies the assigned engineer
    - Creates a KnowledgeBase article with category synced from Incident
    - Notifies relevant admin
    """

    # 🔹 Get the incident
    try:
        incident = Incident.objects.get(id=incident_id)
    except Incident.DoesNotExist:
        return Response({"error": "Incident not found"}, status=404)

    # 🔹 Log the update
    IncidentUpdate.objects.create(
        incident=incident,
        user=request.user,
        message="Incident closed"
    )

    # 🔹 Update incident status
    incident.status = "closed"
    incident.closed_at = timezone.now()
    incident.save()

    # 🔹 Notify assigned engineer
    if incident.assigned_to:
        create_notification(
            user=incident.assigned_to,
            event_type="INCIDENT_CLOSED",
            message=f"Incident #{incident.id} has been closed",
            incident=incident,
            triggered_by=request.user
        )

    # 🔹 Prevent duplicate articles (same description and same user)
    existing_article = KnowledgeBase.objects.filter(
        incident_pattern=incident.description,
        created_by=request.user
    ).first()

    if not existing_article:
        # 🔹 Create KnowledgeBase article and sync category
        article = KnowledgeBase.objects.create(
            title=incident.title or f"Incident #{incident.id}",
            incident_pattern=incident.description or "No description",
            resolution_steps=incident.resolution_note or "No resolution provided",
            category=incident.category,  # 🔥 Sync category here
            status="pending",            # Article awaits admin approval
            created_by=request.user
        )

        # 🔹 Notify admin about new article
        notify_admin(
            request.user,
            "ARTICLE_SUBMITTED_FOR_APPROVAL",
            f"{request.user.name} closed incident #{incident.id} and submitted article for approval",
            article=article
        )

    return Response({
        "message": "Incident closed and article submitted for approval"
    })

class ResetPasswordView(APIView):
    """
    API view to reset user password after OTP verification.
    Sends a professional email notification to the user.
    """

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']

        # 🔹 Get user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # 🔹 Verify OTP
        try:
            otp_obj = PasswordResetOTP.objects.get(user=user, otp=otp, is_verified=True)
        except PasswordResetOTP.DoesNotExist:
            return Response({"detail": "OTP not verified"}, status=status.HTTP_400_BAD_REQUEST)

        # 🔹 Reset password
        user.set_password(new_password)
        user.save()

        # 🔹 Delete OTP after use
        otp_obj.delete()

        # 🔹 Send professional email notification
        subject = "Password Reset Successful"
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <p>Dear {user.name},</p>

            <p>Your account password has been <strong>successfully reset</strong>.</p>

            <p>If you performed this action, you can safely ignore this email.</p>

            <p>If you did <strong>not</strong> reset your password, please contact the support team immediately so that we can secure your account.</p>

            <p style="margin-top:20px;">For security purposes, we recommend:</p>
            <ul>
                <li>Do not share your password with anyone</li>
                <li>Use a strong and unique password</li>
                <li>Change your password periodically</li>
            </ul>

            <p style="margin-top:20px;">Regards,<br><strong>Support Team</strong></p>
        </body>
        </html>
        """

        try:
            send_mail(
                subject=subject,
                message="Your password has been reset successfully.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            # Optional: log email sending error
            print(f"Failed to send password reset email: {e}")

        return Response({"detail": "Password reset successfully"}, status=status.HTTP_200_OK)
    
@api_view(['POST'])
@permission_classes([AllowAny])
def register_admin(request):
    serializer = UserSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.save()

        # Email setup
        login_url = "http://localhost:3000/login"  # replace with your actual login page
        subject = "Your Admin Account Has Been Created"

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
            <p>Dear {user.name},</p>

            <p>Your admin account has been successfully created.</p>

            <p>You can login to your account using the link below:</p>

            <div style="margin: 20px 0;">
                <a href="{login_url}" style="
                    display: inline-block;
                    background-color: #2563eb;
                    color: white;
                    text-decoration: none;
                    padding: 12px 24px;
                    border-radius: 5px;
                    font-weight: bold;
                    font-size: 14px;
                ">Login to Your Admin Account</a>
            </div>

            <p>Thank you,<br><strong>Support Team</strong></p>
        </body>
        </html>
        """

        try:
            email = EmailMessage(
                subject=subject,
                body=html_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            email.content_subtype = "html"  # send as HTML
            email.send(fail_silently=False)
        except Exception as e:
            print(f"Error sending email: {e}")

        return Response({
            'id': user.id,
            'role': user.role,
            'message': 'Admin created successfully, email notification sent'
        }, status=201)

    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user_by_admin(request):
    # Only admins can create users
    if not request.user.is_authenticated or request.user.role != 'admin':
        return Response({'error': 'Only admins can create users'}, status=403)

    serializer = UserSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.save()
        # 🔔 Notify new user
        notify_user_created(user, request.user)


        # Professional email setup for the new user
        login_url = "http://localhost:3000/login"  # replace with real login URL
        original_password = request.data.get('password')

        subject_user = "Your Account Has Been Created"
        html_content_user = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
            <p>Dear {user.name},</p>
            <p>Your account has been successfully created by the admin.</p>
            <p><strong>Login Details:</strong></p>
            <ul>
                <li><strong>Email:</strong> {user.email}</li>
                <li><strong>Password:</strong> {original_password}</li>
                <li><strong>Role:</strong> {user.role.capitalize()}</li>
            </ul>
            <p>Please click the button below to login and change your password immediately for security purposes:</p>
            <div style="margin: 20px 0;">
                <a href="{login_url}" style="
                    display: inline-block;
                    background-color: #2563eb;
                    color: white;
                    text-decoration: none;
                    padding: 12px 24px;
                    border-radius: 5px;
                    font-weight: bold;
                    font-size: 14px;
                ">Login to Your Account</a>
            </div>
            <p>Thank you,<br><strong>Support Team</strong></p>
        </body>
        </html>
        """

        try:
            # Send email to the new user
            email_user = EmailMessage(
                subject=subject_user,
                body=html_content_user,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            email_user.content_subtype = "html"
            email_user.send(fail_silently=False)

            # Send email notification to the admin
            subject_admin = f"New User Created: {user.name}"
            html_content_admin = f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
                <p>Dear Admin,</p>
                <p>A new user has been created in the system.</p>
                <p><strong>User Details:</strong></p>
                <ul>
                    <li><strong>Name:</strong> {user.name}</li>
                    <li><strong>Email:</strong> {user.email}</li>
                    <li><strong>Role:</strong> {user.role.capitalize()}</li>
                </ul>
                <p>Thank you,<br><strong>System Notification</strong></p>
            </body>
            </html>
            """
            email_admin = EmailMessage(
                subject=subject_admin,
                body=html_content_admin,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[request.user.email],  # send to the admin who created the user
            )
            email_admin.content_subtype = "html"
            email_admin.send(fail_silently=False)

        except Exception as e:
            print(f"Error sending email: {e}")

        # Return response
        return Response({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'message': f'User created successfully with role {user.role}, emails sent to user and admin'
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_users(request):
    user = request.user

    if user.role == "admin":
        # Admin sees only the users they created (their team)
        users = User.objects.filter(created_by=user).order_by("-created_at")
    else:
        # Support and Engineer do not see users
        users = User.objects.none()

    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request, pk):
    try:
        user = User.objects.get(id=pk)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    serializer = UserSerializer(user)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_engineers(request):
    user = request.user

    # Determine which admin to filter engineers by
    if user.role.lower() == "admin":
        admin_user = user
    elif user.role.lower() == "support" and user.created_by:
        admin_user = user.created_by
    else:
        return Response([])  # other roles see nothing

    engineers = User.objects.filter(
        role__iexact="engineer",
        status__iexact="active",
        created_by=admin_user
    )

    data = [{"id": u.id, "name": u.name} for u in engineers]
    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_incidents(request):

    incidents = Incident.objects.filter(
        reported_by=request.user
    ).order_by("-created_at")

    serializer = IncidentSerializer(incidents, many=True)

    return Response({
        "incidents": serializer.data
    })

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def reopen_incident(request, incident_id):

    try:
        incident = Incident.objects.get(id=incident_id)

    except Incident.DoesNotExist:
        return Response({"error": "Incident not found"}, status=404)

    if incident.status != "resolved":
        return Response({"error": "Only resolved incidents can be reopened"}, status=400)

    # ✅ Reset incident state properly
    incident.status = "in_progress"
    incident.resolved_by = None
    incident.resolution_note = None
    incident.resolved_at = None   # remove if you don't have this field
    incident.save()

    # 🔔 Notify engineer
    if incident.assigned_to:
        create_notification(
            user=incident.assigned_to,
            event_type="INCIDENT_REOPENED",
            message=f"Incident #{incident.id} has been reopened",
            incident=incident,
            triggered_by=request.user
        )

    IncidentUpdate.objects.create(
        incident=incident,
        user=request.user,
        message="Incident reopened by support for further investigation"
    )

    return Response({"message": "Incident reopened"})
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_incident(request):
    serializer = IncidentCreateSerializer(
        data=request.data,
        context={"request": request}
    )
    
    if serializer.is_valid():
        # Save the incident
        incident = serializer.save(
            reported_by=request.user,
            status="open"
        )
        
        # Handle single file upload (if any)
        if 'attachment' in request.FILES:
            incident.attachment = request.FILES['attachment']
            incident.save()
        
        # Handle multiple file uploads
        files = request.FILES.getlist('attachments')
        print(f"Received {len(files)} files")  # Debug log
        
        attachment_urls = []
        for file in files:
            attachment = IncidentAttachment.objects.create(
                incident=incident,
                file=file,
                file_name=file.name
            )
            # Build full URL for response
            attachment_url = request.build_absolute_uri(attachment.file.url)
            attachment_urls.append({
                'id': attachment.id,
                'file': attachment_url,
                'file_name': attachment.file_name,
                'uploaded_at': attachment.uploaded_at
            })
            print(f"Saved file: {file.name}")
        
        # Create incident update
        IncidentUpdate.objects.create(
            incident=incident,
            user=request.user,
            message="Incident created"
        )
        
        # Prepare response
        response_data = {
            "message": "Incident created successfully",
            "incident_id": incident.id,
            "attachments": attachment_urls
        }
        # 🔔 Notify support (self)
        create_notification(
            user=request.user,
            event_type="INCIDENT_CREATED",
            message=f"Incident #{incident.id} created",
            incident=incident,
            triggered_by=request.user
        )
        # Include single attachment URL if present
        if incident.attachment:
            response_data["attachment_url"] = request.build_absolute_uri(incident.attachment.url)
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    print("Serializer errors:", serializer.errors)  # Debug log
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_user(request, pk):
    try:
        user = User.objects.get(id=pk)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    serializer = UserSerializer(user, data=request.data, partial=True)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request, pk):
    try:
        user = User.objects.get(id=pk)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    # Store user details before deleting
    user_name = user.name
    user_email = user.email

    # 🔔 Notify admin
    create_notification(
        user=request.user,  # admin performing delete
        event_type="USER_DELETED",
        message=f"You deleted user {user_name} ({user_email})",
        triggered_by=request.user
    )

    # Delete user
    user.delete()

    return Response({"message": "User deleted successfully"}, status=204)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_knowledge_base(request):
    user = request.user

    if user.role.lower() == "admin":
        # 1️⃣ Draft articles created by this admin
        draft_articles = KnowledgeBase.objects.filter(
            created_by=user,
            status__iexact="draft"
        )

        # 2️⃣ Pending articles created by users this admin created
        pending_articles = KnowledgeBase.objects.filter(
            created_by__created_by=user,
            status__iexact="pending"
        )

        # 3️⃣ All published articles
        published_articles = KnowledgeBase.objects.filter(
            status__iexact="published"
        )

        # Combine all querysets
        articles = (draft_articles | pending_articles | published_articles).order_by("-created_at")

    else:
        # Non-admin users: only their own articles or published ones
        articles = KnowledgeBase.objects.filter(
            models.Q(created_by=user) |
            models.Q(status__iexact="published")
        ).order_by("-created_at").distinct()

    serializer = KnowledgeBaseSerializer(articles, many=True)
    return Response(serializer.data)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_knowledge_base(request):

    serializer = KnowledgeBaseSerializer(data=request.data)
    
    if serializer.is_valid():
        status_value = request.data.get('status', 'Draft')

        # ✅ Save and capture the object
        article = serializer.save(
            created_by=request.user,
            status=status_value
        )

        # 🔔 Notification
        notify_admin(
            request.user,
            "ARTICLE_CREATED",
            f"{request.user.name} created article '{article.title}'",
            article=article
        )

        return Response(serializer.data, status=201)
    
    return Response(serializer.errors, status=400)

class StartIncidentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        incident = get_object_or_404(Incident, id=pk, assigned_to=request.user)

        incident.status = "in_progress"
        incident.save()

        create_notification(
        user=request.user,
        event_type="INCIDENT_ASSIGNED",
        message=f"You started working on Incident #{incident.id}",
        incident=incident,
        triggered_by=request.user
    )
        return Response({"message": "Incident started"})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_related_incidents(request):
    pattern = request.GET.get("pattern", "").lower()

    # ✅ Only consider published articles
    incidents = KnowledgeBase.objects.filter(status__iexact="published")

    results = []

    for incident in incidents:
        score = SequenceMatcher(
            None,
            pattern,
            incident.incident_pattern.lower()
        ).ratio()

        match_percentage = int(score * 100)

        if match_percentage > 40:
            results.append({
                "id": incident.id,
                "title": incident.title,
                "incident_pattern": incident.incident_pattern,
                "match_percentage": match_percentage
            })

    # Sort by highest match percentage first
    results = sorted(results, key=lambda x: x["match_percentage"], reverse=True)

    # Return top 5 results
    return Response(results[:5])
class MyAssignedIncidentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        incidents = Incident.objects.filter(assigned_to=request.user)

        serializer = IncidentSerializer(incidents, many=True)
        return Response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_knowledge_article(request, id):

    article = get_object_or_404(KnowledgeBase, id=id)

    serializer = KnowledgeBaseSerializer(article)

    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_for_approval(request, pk):

    try:
        article = KnowledgeBase.objects.get(id=pk, created_by=request.user)
    except KnowledgeBase.DoesNotExist:
        return Response({"error": "Article not found"}, status=404)

    article.status = "pending"
    article.save()
    # 🔔 Notify admin(s)
    notify_admin(
        request.user,
        "ARTICLE_SUBMITTED_FOR_APPROVAL",
        f"{request.user.name} submitted article for approval",
        article=article
    )

    return Response({"message": "Submitted for approval"})

@api_view(["POST"])
@permission_classes([IsAdminUserCustom])
def approve_article(request, pk):

    try:
        article = KnowledgeBase.objects.get(id=pk)
    except KnowledgeBase.DoesNotExist:
        return Response({"error": "Article not found"}, status=404)

    article.status = "Published"
    article.save()
    # 🔔 Notify article creator
    create_notification(
        user=article.created_by,
        event_type="ARTICLE_APPROVED",
        message="Your article has been approved and published",
        article=article,
        triggered_by=request.user
    )

    return Response({"message": "Article published"})

@api_view(["POST"])
@permission_classes([IsAdminUserCustom])
def reject_article(request, pk):

    try:
        article = KnowledgeBase.objects.get(id=pk)
    except KnowledgeBase.DoesNotExist:
        return Response({"error": "Article not found"}, status=404)

    article.status = "Draft"
    article.save()
    create_notification(
    user=article.created_by,
    event_type="ARTICLE_REJECTED",
    message="Your article has been rejected",
    article=article,
    triggered_by=request.user
)

    return Response({"message": "Article rejected and moved to draft"})

class UserNotificationsView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return notifications for the currently logged-in user
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class MarkNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({"success": True, "message": "Notification marked as read"})
        except Notification.DoesNotExist:
            return Response({"success": False, "message": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)

class UserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # ✅ must include this

    def put(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    """
    For JWT, logout is client-side, but endpoint can respond for consistency.
    """
    def post(self, request):
        # No server-side action needed for JWT unless using blacklisting
        return Response({"detail": "Logged out successfully"}, status=status.HTTP_200_OK)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_knowledge_base(request, pk):

    try:
        article = KnowledgeBase.objects.get(id=pk)
    except KnowledgeBase.DoesNotExist:
        return Response({"error": "Article not found"}, status=404)

    user = request.user


    # ✅ Store old status
    old_status = article.status

    serializer = KnowledgeBaseSerializer(article, data=request.data, partial=True)

    if serializer.is_valid():
        updated_article = serializer.save()

        new_status = updated_article.status

        print("OLD:", old_status, "NEW:", new_status)  # DEBUG

        # ✅ FIXED CONDITION (lowercase)
        if old_status != "published" and new_status == "published":
            notify_admin(
                user,
                "ARTICLE_PUBLISHED",
                f"{user.name} published article '{updated_article.title}'",
                article=updated_article
            )

        return Response(serializer.data)

    return Response(serializer.errors, status=400)


@api_view(["DELETE"])
@permission_classes([IsAdminUserCustom])
def delete_knowledge_base(request, pk):

    try:
        article = KnowledgeBase.objects.get(id=pk)
    except KnowledgeBase.DoesNotExist:
        return Response({"error": "Article not found"}, status=404)

    article_title = article.title  # store before delete

    # ✅ Notify BEFORE delete (without FK)
    notify_admin(
        request.user,
        "ARTICLE_DELETED",
        f"{request.user.name} deleted article '{article_title}'"
    )

    article.delete()

    return Response({"message": "Article deleted successfully"})

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_incident(request, incident_id):
    try:
        incident = Incident.objects.get(id=incident_id)
        # Optional: allow deletion only if reported_by is the user
        if incident.reported_by != request.user:
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        incident.delete()
        return Response({"detail": "Incident deleted successfully"}, status=status.HTTP_200_OK)
    except Incident.DoesNotExist:
        return Response({"detail": "Incident not found"}, status=status.HTTP_404_NOT_FOUND)


class NotificationDeleteView(APIView):
    """
    View to delete a specific notification
    """
    def delete(self, request, notification_id):
        try:
            # Get the notification or return 404
            notification = get_object_or_404(Notification, id=notification_id)
            
            # Check if the notification belongs to the current user
            if notification.user != request.user:
                return Response(
                    {"error": "You don't have permission to delete this notification"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Delete the notification
            notification.delete()
            
            return Response(
                {"message": "Notification deleted successfully"},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )