from django.contrib import admin
from django.urls import path
from django.urls import path, include
from .views import api_root   

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    # add other app routes here, e.g.
    # path("api/members/", include("apps.members.urls")),
]

urlpatterns = [
    path('', api_root),  # HOME ROUTE
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
]