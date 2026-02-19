# API Contract

## 1. Create Member

POST /api/members

Request Body:
{
  "name": "John Doe",
  "phone": "+27721234567",
  "groupId": "uuid"
}

Response:
{
  "id": "uuid",
  "name": "John Doe",
  "phone": "+27721234567",
  "status": "ACTIVE",
  "createdAt": "timestamp"
}

2. ## 2. Mark Payment as Paid

POST /api/payments/mark-paid

Request Body:
{
  "memberId": "uuid",
  "month": "2026-02"
}

Response:
{
  "success": true,
  "message": "Payment recorded successfully"
}
