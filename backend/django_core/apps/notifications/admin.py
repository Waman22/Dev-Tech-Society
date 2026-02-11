from django.contrib import admin
from .models import NotificationLog

@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = (
        "message_type",
        "channel",
        "recipient",
        "status",
        "created_at",
    )
    list_filter = ("channel", "status", "message_type")
    search_fields = ("recipient",)
