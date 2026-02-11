from django.core.management.base import BaseCommand

from notifications.jobs import run_job_safely
from notifications.jobs.reminders import process_daily_reminders
from notifications.jobs.retries import retry_failed_messages


class Command(BaseCommand):
    help = "Runs daily notification system jobs"

    def handle(self, *args, **kwargs):
        run_job_safely("daily_reminders", process_daily_reminders)
        run_job_safely("retry_failed_messages", retry_failed_messages)

