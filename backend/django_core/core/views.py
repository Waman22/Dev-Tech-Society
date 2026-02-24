from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


# 🔓 PUBLIC ROUTE (NO JWT)
@api_view(['GET'])
def api_root(request):
    return Response({
        "success": True,
        "message": "DevTechSociety API is running 🚀"
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def protected_view(request):
    return Response({
        "success": True,
        "user": str(request.user),
        "message": "You accessed a protected route!"
    })

