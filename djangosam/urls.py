from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions, routers

from djangosam.core.rest import ImageViewSet

from .api import api

router = routers.SimpleRouter()


# Some more specific Api Requests
# OpenAPI generation
schema_view = get_schema_view(
    openapi.Info(title='djangosam', default_version='v1', description=''),
    public=True,
    permission_classes=(permissions.AllowAny,),
)
router.register(r'images', ImageViewSet)

urlpatterns = [
    path('accounts/', include('allauth.urls')),
    path('oauth/', include('oauth2_provider.urls')),
    path('admin/', admin.site.urls),
    path('api/v1/s3-upload/', include('s3_file_field.urls')),
    path('api/v1/', include(router.urls)),
    path('api/docs/redoc/', schema_view.with_ui('redoc'), name='docs-redoc'),
    path('api/docs/swagger/', schema_view.with_ui('swagger'), name='docs-swagger'),
    path('api/v1/', api.urls),
]

if settings.DEBUG:
    import debug_toolbar

    urlpatterns = [path('__debug__/', include(debug_toolbar.urls))] + urlpatterns
