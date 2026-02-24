from django.contrib import admin
from django.urls import path
from django.urls import path, include
from .views import api_root   
from .views import protected_view

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path('', api_root),
    path('protected/', protected_view),
    # add other app routes here, e.g.
    # path("api/members/", include("apps.members.urls")),
]

