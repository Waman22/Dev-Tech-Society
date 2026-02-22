from rest_framework.response import Response
from rest_framework.decorators import api_view

@api_view(['GET'])
def api_root(request):
    return Response({
        "success": True,
        "message": "DevTechSociety API is running 🚀"
    })