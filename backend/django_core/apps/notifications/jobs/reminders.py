from datetime import date
from django.utils import timezone

from payments.models import PaymentStatus
from notifications.models import MessageLog, MessageTemplate
from notifications.services.sms_service import SMSService


MAX_RETRIES = 3


def process_daily_reminders():
    today = date.today()
    sms = SMSService()

    unpaid = PaymentStatus.objects.filter(is_paid=False)

    for payment in unpaid:
        days_left = (payment.due_date - today).days

        # Decide behavior
        if days_left == 2:
            message_type = "REMINDER"
        elif days_left <= 0:
            message_type = "ESCALATION"
        else:
            continue  # no behavior needed

        # Prevent duplicate sends (idempotency)
        already_sent = MessageLog.objects.filter(
            recipient=payment.phone_number,
            message_type=message_type,
            created_at__date=today,
            status="SENT"
        ).exists()

        if already_sent:
            continue

        template = MessageTemplate.objects.filter(
            template_type=message_type,
            is_active=True
        ).first()

        if not template:
            continue

        response = sms.send_sms(payment.phone_number, template.content)

        MessageLog.objects.create(
            recipient=payment.phone_number,
            message_type=message_type,
            content=template.content,
            status=response.get("status", "FAILED"),
            provider_response=str(response)
        )
