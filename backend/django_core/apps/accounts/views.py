from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer


@api_view(['POST'])
def register_user(request):
    data = request.data
    user = User.objects.create_user(
        email=data['email'],
        password=data['password'],
        full_name=data['full_name'],
        role=data['role']
    )
    serializer = UserSerializer(user)
    return Response(serializer.data)

@api_view(['GET'])
def api_root(request):
    return Response({
        "success": True,
        "message": "DevTechSociety API is running"
    })