# serializers.py
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
from .models import *
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import User

User = get_user_model() 

class UserSerializer(serializers.ModelSerializer):
    profile_image = serializers.ImageField(
    use_url=True,
    required=False,
    allow_null=True
)
    class Meta:
        model = User
        fields = "__all__"
        extra_kwargs = {
            'password': {'write_only': True},
  
            'username': {'read_only': True},
        }

    def validate(self, data):
        if User.objects.filter(email=data.get('email')).exists():
            raise serializers.ValidationError({"email": "User with this email already exists"})
        return data

    def create(self, validated_data):
        request = self.context.get('request')

        # Determine role
        if request and hasattr(request.user, 'role') and request.user.role == 'admin':
            # Admin creating support or engineer
            role = validated_data.get('role', 'support')
            if role not in ['support', 'engineer']:
                role = 'support'
            validated_data['role'] = role.lower()
            
            # Assign created_by to the admin
            validated_data['created_by'] = request.user
        else:
            # Self-registration (Register page) → must be admin
            validated_data['role'] = 'admin'
            validated_data['created_by'] = None  # Or leave null

        # Create unique username
        if 'name' in validated_data:
            username = validated_data['name'].lower().replace(' ', '_')
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1
            validated_data['username'] = username

        # Hash password
        validated_data['password'] = make_password(validated_data['password'])

        return User.objects.create(**validated_data)
    
class ForgotPasswordEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()

class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField(min_length=8)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        return data
    
class IncidentUpdateSerializer(serializers.ModelSerializer):

    user = UserSerializer(read_only=True)

    class Meta:
        model = IncidentUpdate
        fields = "__all__"
    
class IncidentAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = IncidentAttachment
        fields = ['id', 'file', 'file_url', 'file_name', 'uploaded_at']
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url

class IncidentSerializer(serializers.ModelSerializer):
    updates = IncidentUpdateSerializer(many=True, read_only=True)
    assignedEngineer = UserSerializer(source="assigned_to", read_only=True)
    reportedBy = UserSerializer(source="reported_by", read_only=True)
    attachments = serializers.SerializerMethodField()  # or use nested serializer

    class Meta:
        model = Incident
        fields = "__all__"
    
    def get_attachments(self, obj):
        # Using the dedicated serializer
        serializer = IncidentAttachmentSerializer(
            obj.attachments.all(), 
            many=True, 
            context=self.context
        )
        return serializer.data

class KnowledgeBaseSerializer(serializers.ModelSerializer):
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = KnowledgeBase
        fields = "__all__"

    def get_status_label(self, obj):
        return obj.get_status_display()
             
class IncidentEmbeddingSerializer(serializers.ModelSerializer):

    class Meta:
        model = IncidentEmbedding
        fields = "__all__"

class NotificationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Notification
        fields = "__all__"

class SLATrackingSerializer(serializers.ModelSerializer):

    class Meta:
        model = SLATracking
        fields = "__all__"

class IncidentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incident
        fields = "__all__"
        read_only_fields = ["reported_by"]  # <-- must be inside Meta

class IncidentDetailSerializer(serializers.ModelSerializer):
    attachments = IncidentAttachmentSerializer(many=True, read_only=True)
    reported_by_name = serializers.CharField(source='reported_by.username', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    attachment_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Incident
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'reported_by', 'reported_by_name', 'assigned_to', 'assigned_to_name',
            'resolution_note', 'closed_at', 'created_at', 'updated_at',
            'resolved_at', 'attachment', 'attachment_url', 'attachments'
        ]
    
    def get_attachment_url(self, obj):
        if obj.attachment:
            return self.context['request'].build_absolute_uri(obj.attachment.url)
        return None