from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('description', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'categories',
                'verbose_name_plural': 'Categories',
            },
        ),
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, default='')),
                ('price', models.DecimalField(decimal_places=2, max_digits=12)),
                ('stock', models.PositiveIntegerField(default=0)),
                ('image_url', models.URLField(blank=True, default='')),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='products', to='products.category')),
            ],
            options={
                'db_table': 'products',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Book',
            fields=[
                ('product', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='book', serialize=False, to='products.product')),
                ('author', models.CharField(max_length=255)),
                ('publisher', models.CharField(blank=True, default='', max_length=255)),
                ('isbn', models.CharField(blank=True, default='', max_length=20)),
                ('pages', models.PositiveIntegerField(blank=True, null=True)),
            ],
            options={
                'db_table': 'books',
            },
        ),
        migrations.CreateModel(
            name='Electronics',
            fields=[
                ('product', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='electronics', serialize=False, to='products.product')),
                ('brand', models.CharField(max_length=100)),
                ('warranty_months', models.PositiveIntegerField(default=12)),
                ('specifications', models.JSONField(blank=True, default=dict)),
            ],
            options={
                'db_table': 'electronics',
                'verbose_name_plural': 'Electronics',
            },
        ),
        migrations.CreateModel(
            name='Fashion',
            fields=[
                ('product', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='fashion', serialize=False, to='products.product')),
                ('size', models.CharField(max_length=10)),
                ('color', models.CharField(max_length=50)),
                ('material', models.CharField(blank=True, default='', max_length=100)),
            ],
            options={
                'db_table': 'fashion',
            },
        ),
    ]
