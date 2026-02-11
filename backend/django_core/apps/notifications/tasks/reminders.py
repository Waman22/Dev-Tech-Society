from notifications.models import MessageLog, MessageTemplate
from notifications.services.sms_service import SMSService


def send_payment_reminder(phone_number: str):
    template = MessageTemplate.objects.filter(
        template_type="REMINDER",
        is_active=True
    ).first()

    if not template:
        return

    sms = SMSService()
    response = sms.send_sms(phone_number, template.content)

    MessageLog.objects.create(
        recipient=phone_number,
        message_type="REMINDER",
        content=template.content,
        status=response.get("status"),
        provider_response=str(response)
    )
