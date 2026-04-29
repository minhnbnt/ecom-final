from django.urls import path
from .views import CreateShipmentView, ShipmentStatusView, UpdateShipmentView

urlpatterns = [
    path('create/', CreateShipmentView.as_view(), name='shipping-create'),
    path('status/', ShipmentStatusView.as_view(), name='shipping-status'),
    path('<int:pk>/update/', UpdateShipmentView.as_view(), name='shipping-update'),
]
