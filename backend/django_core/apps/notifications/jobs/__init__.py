from django.utils import timezone
from notifications.models import JobLock


def run_job_safely(job_name: str, job_function):
    lock, _ = JobLock.objects.get_or_create(job_name=job_name)

    if lock.is_running:
        print(f"[SKIPPED] {job_name} already running")
        return

    try:
        lock.is_running = True
        lock.save(update_fields=["is_running"])

        print(f"[START] {job_name}")
        job_function()

        lock.last_run = timezone.now()
        print(f"[DONE] {job_name}")

    except Exception as e:
        print(f"[ERROR] {job_name}: {e}")
        raise

    finally:
        lock.is_running = False
        lock.save(update_fields=["is_running", "last_run"])
