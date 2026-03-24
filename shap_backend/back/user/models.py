from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta

class User(AbstractUser):

    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("engineer", "Engineer"),
        ("support", "Support"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
    ]

    name = models.CharField(max_length=150)

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="Admin")
    department = models.CharField(max_length=100, blank=True, null=True)
    profile_image = models.ImageField(
        upload_to="profile_images/", 
        blank=True, 
        null=True
    )
    created_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_users'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Active")

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.name
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_otps")
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)  # OTP valid for 10 mins
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email} - {self.otp}"
    
class Incident(models.Model):

    STATUS_CHOICES = [
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
        ("closed", "Closed"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    category = models.CharField(max_length=50, blank=True, null=True)
    reported_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reported_incidents"
    )
    resolution_note = models.TextField(null=True, blank=True)
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_incidents"
    )
    closed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    attachment = models.FileField(upload_to="incident_attachments/", null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

class IncidentAttachment(models.Model):
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(upload_to="incident_attachments/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file_name = models.CharField(max_length=255, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.file_name:
            self.file_name = self.file.name
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Attachment for {self.incident.id}: {self.file_name}"
    
    class Meta:
        ordering = ['-uploaded_at']
        
class IncidentUpdate(models.Model):

    incident = models.ForeignKey(
        "Incident",
        on_delete=models.CASCADE,
        related_name="updates"
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )

    message = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.incident.title} - {self.message}"

class KnowledgeBase(models.Model):

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("pending", "Pending Approval"),
    ]

    CATEGORY_CHOICES = [
        ("setup", "Setup"),
        ("troubleshooting", "Troubleshooting"),
        ("faq", "FAQ"),
        ("network", "Network"),
        ("security", "Security"),
        ("performance", "Performance"),
        ("configuration", "Configuration"),
    ]

    title = models.CharField(max_length=255)

    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES,blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")

    incident_pattern = models.TextField()

    resolution_steps = models.TextField(blank=True)

    tags = models.JSONField(default=list, blank=True)

    auto_resolve = models.BooleanField(default=False)

    script_path = models.CharField(max_length=255, blank=True)

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
       
class IncidentEmbedding(models.Model):

    incident = models.OneToOneField(
        Incident,
        on_delete=models.CASCADE,
        related_name="embedding"
    )

    embedding_vector = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Embedding for Incident {self.incident.id}"

class Notification(models.Model):

    # 🔹 Event Types (Covers ALL your use cases)
    EVENT_TYPES = [

        # -------- USER MANAGEMENT (ADMIN) --------
        ("USER_CREATED", "User Created"),
        ("USER_DELETED", "User Deleted"),
        ("USER_ACTIVATED", "User Activated"),
        ("USER_DEACTIVATED", "User Deactivated"),

        # -------- INCIDENT WORKFLOW --------
        ("INCIDENT_CREATED", "Incident Created"),
        ("INCIDENT_ASSIGNED", "Incident Assigned"),
        ("INCIDENT_RESOLVED", "Incident Resolved"),
        ("INCIDENT_SENT_FOR_VERIFICATION", "Incident Sent For Verification"),
        ("INCIDENT_REOPENED", "Incident Reopened"),
        ("INCIDENT_CLOSED", "Incident Closed"),

        # -------- KNOWLEDGE BASE WORKFLOW --------
        ("ARTICLE_CREATED", "Article Created"),
        ("ARTICLE_SUBMITTED_FOR_APPROVAL", "Article Submitted For Approval"),
        ("ARTICLE_APPROVED", "Article Approved"),
        ("ARTICLE_REJECTED", "Article Rejected"),
        ("ARTICLE_PUBLISHED", "Article Published"),

        # -------- SYSTEM --------
        ("SLA_WARNING", "SLA Warning"),
    ]

    # 🔹 Who receives notification
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    # 🔹 Who triggered the action
    triggered_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triggered_notifications"
    )

    # 🔹 Related objects (flexible linking)
    incident = models.ForeignKey(
        "Incident",
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    article = models.ForeignKey(
        "KnowledgeBase",
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    # 🔹 Core content
    title = models.CharField(max_length=255)
    message = models.TextField()

    event_type = models.CharField(
        max_length=50,
        choices=EVENT_TYPES
    )

    # 🔹 Status
    is_read = models.BooleanField(default=False)

    # 🔹 Optional priority (for future scaling)
    PRIORITY_CHOICES = [
        ("LOW", "Low"),
        ("MEDIUM", "Medium"),
        ("HIGH", "High"),
    ]

    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default="MEDIUM"
    )

    # 🔹 Extra metadata (future-proofing)
    extra_data = models.JSONField(
        null=True,
        blank=True,
        help_text="Store additional context like IDs, names, etc."
    )

    # 🔹 Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["event_type"]),
        ]

    def __str__(self):
        return f"{self.title} → {self.user}"
      
class SLATracking(models.Model):

    SLA_STATUS = [
        ("safe", "Safe"),
        ("warning", "Warning"),
        ("breached", "Breached"),
    ]

    incident = models.OneToOneField(
        Incident,
        on_delete=models.CASCADE,
        related_name="sla"
    )

    sla_start = models.DateTimeField()

    sla_deadline = models.DateTimeField()

    sla_status = models.CharField(max_length=20, choices=SLA_STATUS, default="SAFE")

    last_checked = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"SLA for Incident {self.incident.id}"
    
class IncidentActivity(models.Model):

    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="activities"
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )

    action = models.CharField(max_length=100)
    message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} - {self.incident.id}"