import uuid

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Shipment
from .serializers import ShipmentSerializer, CreateShipmentSerializer


class CreateShipmentView(APIView):
    """POST /api/shipping/create/ — Create shipment for an order."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = CreateShipmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        shipment, created = Shipment.objects.update_or_create(
            order_id=serializer.validated_data['order_id'],
            defaults={
                'address': serializer.validated_data['address'],
                'status': Shipment.Status.PROCESSING,
                'tracking_number': f"SHIP-{uuid.uuid4().hex[:10].upper()}",
            },
        )

        return Response(
            ShipmentSerializer(shipment).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ShipmentStatusView(APIView):
    """GET /api/shipping/status/?order_id=<id> — Check shipment status."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        order_id = request.query_params.get('order_id')
        if not order_id:
            return Response(
                {'error': 'order_id is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            shipment = Shipment.objects.get(order_id=order_id)
            return Response(ShipmentSerializer(shipment).data)
        except Shipment.DoesNotExist:
            return Response(
                {'error': 'Shipment not found'},
                status=status.HTTP_404_NOT_FOUND,
            )


class UpdateShipmentView(APIView):
    """PUT /api/shipping/<id>/update/ — Update shipment status (staff/admin)."""
    permission_classes = (permissions.IsAuthenticated,)

    def put(self, request, pk):
        try:
            shipment = Shipment.objects.get(pk=pk)
        except Shipment.DoesNotExist:
            return Response(
                {'error': 'Shipment not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get('status')
        if new_status not in dict(Shipment.Status.choices):
            return Response(
                {'error': f'Invalid status. Choose from: {list(dict(Shipment.Status.choices).keys())}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        shipment.status = new_status
        shipment.save()
        return Response(ShipmentSerializer(shipment).data)
