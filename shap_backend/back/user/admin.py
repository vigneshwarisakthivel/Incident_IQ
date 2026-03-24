from django.contrib import admin
from .models import *

admin.site.register(User)
admin.site.register(Incident)
admin.site.register(IncidentUpdate)
admin.site.register(KnowledgeBase)
admin.site.register(IncidentEmbedding)
admin.site.register(Notification)
admin.site.register(SLATracking)