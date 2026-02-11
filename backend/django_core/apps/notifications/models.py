from django.db import models


class MessageTemplate(models.Model):
    """
    Stores reusable SMS / Email templates
    """
    TEMPLATE_TYPES = [
        ("REMINDER", "Reminder"),
        ("ESCALATION", "Escalation"),
        ("CONFIRMATION", "Confirmation"),
    ]

    name = models.CharField(max_length=100)
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES)
    content = models.TextField()
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.template_type})"


class MessageLog(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("SENT", "Sent"),
        ("FAILED", "Failed"),
    ]

    recipient = models.CharField(max_length=20)
    message_type = models.CharField(max_length=20)
    content = models.TextField()

    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    provider_response = models.TextField(null=True, blank=True)

    retry_count = models.PositiveSmallIntegerField(default=0)
    last_attempt_at = models.DateTimeField(auto_now=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
      constraints = [
        models.UniqueConstraint(
            fields=["recipient", "message_type", "created_at"],
            name="one_message_type_per_day"
        )
    ]


    def __str__(self):
        return f"{self.recipient} - {self.message_type} - {self.status}"