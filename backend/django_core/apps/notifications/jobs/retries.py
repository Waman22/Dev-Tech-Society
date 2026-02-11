from notifications.models import MessageLog
from notifications.services.sms_service import SMSService


def retry_failed_messages():
    sms = SMSService()

    failed = MessageLog.objects.filter(
        status="FAILED"
    )

    for msg in failed:
        retry_count = MessageLog.objects.filter(
            recipient=msg.recipient,
            message_type=msg.message_type
        ).count()

        if retry_count >= 3:
            continue  # stop retrying

        response = sms.send_sms(msg.recipient, msg.content)

        MessageLog.objects.create(
            recipient=msg.recipient,
            message_type=msg.message_type,
            content=msg.content,
            status=response.get("status", "FAILED"),
            provider_response=str(response)
        )
