from django.db import migrations


def seed_data(apps, schema_editor):
    Category = apps.get_model('products', 'Category')
    Product = apps.get_model('products', 'Product')
    Book = apps.get_model('products', 'Book')
    Electronics = apps.get_model('products', 'Electronics')
    Fashion = apps.get_model('products', 'Fashion')

    IMG = '/images/products'

    # ── 10 Categories ─────────────────────────────────────────
    cats = {}
    for name, desc in [
        ('Sách', 'Giáo trình, tiểu thuyết, sách chuyên ngành'),
        ('Laptop', 'Máy tính xách tay các hãng'),
        ('Điện thoại', 'Smartphone và phụ kiện'),
        ('Tủ lạnh', 'Tủ lạnh gia đình'),
        ('Điều hòa', 'Máy lạnh, điều hòa không khí'),
        ('Tai nghe', 'Tai nghe không dây và có dây'),
        ('Đồng hồ', 'Đồng hồ thông minh và cổ điển'),
        ('Áo', 'Áo thun, áo sơ mi, áo khoác'),
        ('Giày', 'Giày thể thao, giày da'),
        ('Balo & Túi', 'Balo laptop, túi xách thời trang'),
    ]:
        cats[name] = Category.objects.create(name=name, description=desc)

    # ── Helper ────────────────────────────────────────────────
    def p(name, desc, price, stock, img, cat):
        return Product.objects.create(
            name=name, description=desc,
            price=price, stock=stock,
            image_url=f'{IMG}/{img}',
            category=cats[cat],
        )

    # ── Sách (Books) ──────────────────────────────────────────
    b1 = p('Clean Code', 'Cuốn sách kinh điển về nghệ thuật viết code sạch của Robert C. Martin. Phải đọc cho mọi lập trình viên.', 450000, 50, 'book.png', 'Sách')
    Book.objects.create(product=b1, author='Robert C. Martin', publisher='Prentice Hall', isbn='978-0132350884', pages=464)

    b2 = p('Design Patterns', 'Gang of Four — 23 mẫu thiết kế hướng đối tượng kinh điển.', 520000, 30, 'book.png', 'Sách')
    Book.objects.create(product=b2, author='Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', publisher='Addison-Wesley', isbn='978-0201633610', pages=395)

    b3 = p('Nhập môn Machine Learning', 'Giáo trình ML bằng tiếng Việt, từ cơ bản đến nâng cao với Python và TensorFlow.', 380000, 40, 'book.png', 'Sách')
    Book.objects.create(product=b3, author='Vũ Hữu Tiệp', publisher='NXB Khoa học Kỹ thuật', isbn='978-604-913-001', pages=520)

    b4 = p('Atomic Habits', 'Thay đổi tí hon, hiệu quả bất ngờ — xây dựng thói quen tốt, loại bỏ thói quen xấu.', 195000, 100, 'book.png', 'Sách')
    Book.objects.create(product=b4, author='James Clear', publisher='Avery', isbn='978-0735211292', pages=320)

    # ── Laptop ────────────────────────────────────────────────
    l1 = p('MacBook Pro 16" M4 Pro', 'Chip M4 Pro 14-core, 24GB RAM, 512GB SSD, Liquid Retina XDR.', 62990000, 15, 'laptop.png', 'Laptop')
    Electronics.objects.create(product=l1, brand='Apple', warranty_months=12, specifications={'chip': 'M4 Pro 14-core', 'ram': '24GB', 'ssd': '512GB', 'display': '16.2" Liquid Retina XDR'})

    l2 = p('Dell XPS 15 9530', 'Intel Core i7-13700H, 16GB DDR5, 512GB SSD, NVIDIA RTX 4060.', 42990000, 20, 'laptop.png', 'Laptop')
    Electronics.objects.create(product=l2, brand='Dell', warranty_months=24, specifications={'cpu': 'i7-13700H', 'ram': '16GB DDR5', 'gpu': 'RTX 4060', 'display': '15.6" OLED 3.5K'})

    l3 = p('ThinkPad X1 Carbon Gen 11', 'Intel Core i5-1345U, 16GB, 256GB SSD, 14" 2.8K OLED, 1.12kg.', 35990000, 10, 'laptop.png', 'Laptop')
    Electronics.objects.create(product=l3, brand='Lenovo', warranty_months=36, specifications={'cpu': 'i5-1345U', 'ram': '16GB', 'ssd': '256GB', 'weight': '1.12kg'})

    # ── Điện thoại ────────────────────────────────────────────
    ph1 = p('iPhone 16 Pro Max 256GB', 'Chip A18 Pro, camera 48MP, titanium design, USB-C.', 34990000, 25, 'phone.png', 'Điện thoại')
    Electronics.objects.create(product=ph1, brand='Apple', warranty_months=12, specifications={'chip': 'A18 Pro', 'camera': '48MP + 12MP + 12MP', 'battery': '4685mAh', 'display': '6.9" Super Retina XDR'})

    ph2 = p('Samsung Galaxy S25 Ultra', 'Snapdragon 8 Elite, 12GB RAM, camera 200MP, S-Pen.', 31990000, 30, 'phone.png', 'Điện thoại')
    Electronics.objects.create(product=ph2, brand='Samsung', warranty_months=12, specifications={'chip': 'Snapdragon 8 Elite', 'ram': '12GB', 'camera': '200MP + 50MP + 10MP + 12MP'})

    ph3 = p('Xiaomi 15 Pro', 'Snapdragon 8 Elite, Leica camera 50MP, sạc nhanh 120W.', 18990000, 40, 'phone.png', 'Điện thoại')
    Electronics.objects.create(product=ph3, brand='Xiaomi', warranty_months=18, specifications={'chip': 'Snapdragon 8 Elite', 'camera': 'Leica 50MP', 'charging': '120W'})

    # ── Tủ lạnh ───────────────────────────────────────────────
    f1 = p('Samsung French Door RF28T5001SR', 'Tủ lạnh French Door 28 cu ft, ngăn đông dưới, Twin Cooling Plus.', 28990000, 8, 'fridge.png', 'Tủ lạnh')
    Electronics.objects.create(product=f1, brand='Samsung', warranty_months=24, specifications={'capacity': '28 cu ft', 'type': 'French Door', 'cooling': 'Twin Cooling Plus'})

    f2 = p('LG InstaView Door-in-Door', 'Tủ lạnh side-by-side 635L, cửa kính gõ sáng, inverter tiết kiệm điện.', 32990000, 5, 'fridge.png', 'Tủ lạnh')
    Electronics.objects.create(product=f2, brand='LG', warranty_months=24, specifications={'capacity': '635L', 'type': 'Side-by-Side', 'feature': 'InstaView Door-in-Door'})

    f3 = p('Panasonic NR-BX471WGKV', 'Tủ lạnh 2 cửa 420L, Econavi, Ag Clean, ngăn đông mềm -3°C.', 15990000, 12, 'fridge.png', 'Tủ lạnh')
    Electronics.objects.create(product=f3, brand='Panasonic', warranty_months=24, specifications={'capacity': '420L', 'type': '2 cửa', 'feature': 'Econavi, Ag Clean'})

    # ── Điều hòa ──────────────────────────────────────────────
    ac1 = p('Daikin Inverter FTKZ35XVMV', 'Điều hòa 1 chiều inverter 1.5HP, tiết kiệm điện, lọc bụi PM2.5.', 14990000, 20, 'aircon.png', 'Điều hòa')
    Electronics.objects.create(product=ac1, brand='Daikin', warranty_months=12, specifications={'capacity': '1.5HP', 'type': 'Inverter 1 chiều', 'filter': 'PM2.5'})

    ac2 = p('Panasonic CU/CS-XU12ZKH-8', 'Điều hòa 2 chiều inverter 1.5HP, nanoe™ X, Econavi.', 16990000, 15, 'aircon.png', 'Điều hòa')
    Electronics.objects.create(product=ac2, brand='Panasonic', warranty_months=24, specifications={'capacity': '1.5HP', 'type': 'Inverter 2 chiều', 'feature': 'nanoe™ X'})

    ac3 = p('LG Dualcool V13WIN', 'Điều hòa inverter 1.5HP, làm lạnh nhanh, vận hành êm ái.', 11990000, 25, 'aircon.png', 'Điều hòa')
    Electronics.objects.create(product=ac3, brand='LG', warranty_months=24, specifications={'capacity': '1.5HP', 'type': 'Inverter 1 chiều'})

    # ── Tai nghe ──────────────────────────────────────────────
    h1 = p('Sony WH-1000XM5', 'Tai nghe chụp tai chống ồn ANC, bluetooth 5.3, pin 30h.', 7990000, 35, 'headphones.png', 'Tai nghe')
    Electronics.objects.create(product=h1, brand='Sony', warranty_months=12, specifications={'type': 'Over-ear', 'anc': True, 'battery': '30h', 'bluetooth': '5.3'})

    h2 = p('AirPods Pro 2 USB-C', 'Tai nghe true wireless, ANC, Adaptive Audio, MagSafe.', 5990000, 50, 'headphones.png', 'Tai nghe')
    Electronics.objects.create(product=h2, brand='Apple', warranty_months=12, specifications={'type': 'True Wireless', 'anc': True, 'feature': 'Adaptive Audio'})

    h3 = p('JBL Tune 770NC', 'Tai nghe chụp tai bluetooth, ANC, pin 44h, giá tốt.', 2490000, 60, 'headphones.png', 'Tai nghe')
    Electronics.objects.create(product=h3, brand='JBL', warranty_months=12, specifications={'type': 'Over-ear', 'anc': True, 'battery': '44h'})

    # ── Đồng hồ ──────────────────────────────────────────────
    w1 = p('Apple Watch Ultra 2', 'Vỏ titanium 49mm, GPS + Cellular, chống nước 100m, pin 36h.', 21990000, 10, 'watch.png', 'Đồng hồ')
    Electronics.objects.create(product=w1, brand='Apple', warranty_months=12, specifications={'case': '49mm Titanium', 'gps': True, 'water_resistance': '100m'})

    w2 = p('Samsung Galaxy Watch 7', 'Wear OS, BioActive Sensor, Super AMOLED, IP68.', 8990000, 20, 'watch.png', 'Đồng hồ')
    Electronics.objects.create(product=w2, brand='Samsung', warranty_months=12, specifications={'os': 'Wear OS', 'display': 'Super AMOLED', 'sensor': 'BioActive'})

    w3 = p('Garmin Venu 3', 'GPS, AMOLED, theo dõi giấc ngủ, pin 14 ngày, Body Battery.', 12990000, 15, 'watch.png', 'Đồng hồ')
    Electronics.objects.create(product=w3, brand='Garmin', warranty_months=12, specifications={'display': 'AMOLED', 'battery': '14 ngày', 'feature': 'Body Battery, Sleep Coach'})

    # ── Áo ────────────────────────────────────────────────────
    a1 = p('Áo Thun Uniqlo DRY-EX', 'Áo thun cổ tròn chất liệu DRY-EX, thoáng khí, nhanh khô.', 390000, 100, 'shirt.png', 'Áo')
    Fashion.objects.create(product=a1, size='L', color='Navy', material='Polyester DRY-EX')

    a2 = p('Áo Polo Ralph Lauren Classic', 'Áo polo cotton pima mềm mại, logo ngựa thêu, cổ bẻ.', 2490000, 30, 'shirt.png', 'Áo')
    Fashion.objects.create(product=a2, size='M', color='White', material='Cotton Pima')

    a3 = p('Áo Khoác Adidas Tiro 24', 'Áo khoác thể thao AEROREADY, khóa kéo full, có túi bên.', 1590000, 40, 'shirt.png', 'Áo')
    Fashion.objects.create(product=a3, size='XL', color='Black/White', material='Polyester recycled')

    # ── Giày ──────────────────────────────────────────────────
    g1 = p('Nike Air Max 270', 'Giày thể thao Air Max đệm khí lớn nhất, phong cách streetwear.', 3690000, 35, 'sneakers.png', 'Giày')
    Fashion.objects.create(product=g1, size='42', color='White/Purple', material='Mesh + Synthetic')

    g2 = p('Adidas Ultraboost Light', 'Giày chạy bộ Boost nhẹ nhất từ trước đến nay, đế Continental™.', 4290000, 25, 'sneakers.png', 'Giày')
    Fashion.objects.create(product=g2, size='43', color='Core Black', material='Primeknit+')

    g3 = p('New Balance 574 Core', 'Giày sneaker cổ điển ENCAP® midsole, phong cách retro.', 2390000, 45, 'sneakers.png', 'Giày')
    Fashion.objects.create(product=g3, size='41', color='Grey/Navy', material='Suede + Mesh')

    # ── Balo & Túi ────────────────────────────────────────────
    bg1 = p('Balo Laptop Tomtoc 15.6"', 'Balo chống sốc ngăn laptop 15.6", chống nước, USB charging port.', 1290000, 50, 'backpack.png', 'Balo & Túi')
    Fashion.objects.create(product=bg1, size='15.6"', color='Dark Gray', material='Polyester 600D')

    bg2 = p('Peak Design Everyday Backpack 20L', 'Balo nhiếp ảnh cao cấp, FlexFold dividers, chống nước.', 7490000, 10, 'backpack.png', 'Balo & Túi')
    Fashion.objects.create(product=bg2, size='20L', color='Black', material='Recycled 400D nylon')

    bg3 = p('Balo Xiaomi City 2', 'Balo đô thị gọn nhẹ 17L, chống nước IPX4, ngăn laptop 15.6".', 690000, 80, 'backpack.png', 'Balo & Túi')
    Fashion.objects.create(product=bg3, size='17L', color='Dark Gray', material='Polyester')


def reverse(apps, schema_editor):
    apps.get_model('products', 'Product').objects.all().delete()
    apps.get_model('products', 'Category').objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_data, reverse),
    ]
