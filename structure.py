import os

BASE_DIR = "backend"

DJANGO_APPS = [
    "groups",
    "members",
    "contributions",
    "payments",
    "ledger",
    "reports",
    "notifications",
]

FASTAPI_NOTIFICATION_MODULES = [
    "sms.py",
    "whatsapp.py",
    "push.py",
    "templates.py",
]

def create_file(path, content=""):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def create_init_py(path):
    create_file(os.path.join(path, "__init__.py"))

def main():
    print("Setting up backend structure...")

    # Backend root
    os.makedirs(BASE_DIR, exist_ok=True)

    # ---------------- Django Core ----------------
    django_core = os.path.join(BASE_DIR, "django_core")
    os.makedirs(django_core, exist_ok=True)

    create_file(os.path.join(django_core, "manage.py"), "# Django manage.py\n")

    core_dir = os.path.join(django_core, "core")
    os.makedirs(core_dir, exist_ok=True)

    for file in ["settings.py", "urls.py", "asgi.py", "wsgi.py", "celery.py"]:
        create_file(os.path.join(core_dir, file))

    create_init_py(core_dir)

    apps_dir = os.path.join(django_core, "apps")
    os.makedirs(apps_dir, exist_ok=True)

    for app in DJANGO_APPS:
        app_path = os.path.join(apps_dir, app)
        os.makedirs(app_path, exist_ok=True)
        create_init_py(app_path)

        for file in ["admin.py", "apps.py", "models.py", "tests.py", "views.py"]:
            create_file(os.path.join(app_path, file))

    # ---------------- FastAPI Services ----------------
    fastapi_dir = os.path.join(BASE_DIR, "fastapi_services")
    os.makedirs(fastapi_dir, exist_ok=True)

    create_file(os.path.join(fastapi_dir, "main.py"))
    create_file(os.path.join(fastapi_dir, "config.py"))

    scheduler_dir = os.path.join(fastapi_dir, "scheduler")
    os.makedirs(scheduler_dir, exist_ok=True)
    create_init_py(scheduler_dir)
    create_file(os.path.join(scheduler_dir, "daily_jobs.py"))

    notifications_dir = os.path.join(fastapi_dir, "notifications")
    os.makedirs(notifications_dir, exist_ok=True)
    create_init_py(notifications_dir)

    for module in FASTAPI_NOTIFICATION_MODULES:
        create_file(os.path.join(notifications_dir, module))

    logging_dir = os.path.join(fastapi_dir, "logging")
    os.makedirs(logging_dir, exist_ok=True)
    create_init_py(logging_dir)
    create_file(os.path.join(logging_dir, "events.py"))

    # ---------------- Scripts & README ----------------
    scripts_dir = os.path.join(BASE_DIR, "scripts")
    os.makedirs(scripts_dir, exist_ok=True)
    create_init_py(scripts_dir)

    create_file(
        os.path.join(BASE_DIR, "README.md"),
        "# Backend Structure\n\nShared backend for Dev C & Dev D.\n"
    )

    print("Backend structure created successfully.")

if __name__ == "__main__":
    main()
