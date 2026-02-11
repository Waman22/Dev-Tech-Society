class SMSService:
    def send_sms(self, phone_number: str, message: str) -> dict:
        """
        Abstract SMS sender.
        Replace internals without touching business logic.
        """
        # MOCK implementation for now
        print(f"Sending SMS to {phone_number}: {message}")

        return {
            "status": "SENT",
            "provider_id": "mock-123"
        }
