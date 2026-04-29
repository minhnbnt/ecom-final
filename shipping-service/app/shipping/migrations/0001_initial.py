from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Shipment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('order_id', models.PositiveBigIntegerField(unique=True)),
                ('address', models.TextField()),
                ('status', models.CharField(choices=[('processing', 'Processing'), ('shipping', 'Shipping'), ('delivered', 'Delivered'), ('cancelled', 'Cancelled')], default='processing', max_length=20)),
                ('tracking_number', models.CharField(blank=True, default='', max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'shipments'},
        ),
    ]
