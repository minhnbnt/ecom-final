/**
 * Curated Unsplash image pools per product category.
 * Each category has 6-10 unique images so products look distinct.
 * Uses product.id % pool.length for deterministic selection (same product → same image).
 */

const IMAGE_POOLS: Record<string, string[]> = {
  'Laptop': [
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80',
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80',
    'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=600&q=80',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&q=80',
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80',
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&q=80',
  ],
  'Điện thoại': [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&q=80',
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80',
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80',
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&q=80',
  ],
  'Tai nghe': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80',
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80',
    'https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=600&q=80',
    'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=80',
  ],
  'Đồng hồ': [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&q=80',
    'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=600&q=80',
    'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80',
    'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80',
    'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=600&q=80',
  ],
  'Sách': [
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&q=80',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&q=80',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=80',
  ],
  'Điều hòa': [
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80',
    'https://images.unsplash.com/photo-1626816740498-1fe2fccc5f11?w=600&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
  ],
  'Tủ lạnh': [
    'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80',
    'https://images.unsplash.com/photo-1620456259900-1fcfa07ec1a6?w=600&q=80',
    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&q=80',
    'https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?w=600&q=80',
  ],
  'Áo': [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80',
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80',
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80',
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80',
  ],
  'Giày': [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80',
    'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80',
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80',
    'https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=600&q=80',
  ],
  'Balo & Túi': [
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',
    'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&q=80',
    'https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?w=600&q=80',
    'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&q=80',
    'https://images.unsplash.com/photo-1473188588951-666fce8e7c68?w=600&q=80',
  ],
};

const FALLBACK_POOL = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
];

/**
 * Returns a deterministic Unsplash image URL for a product.
 * Same product ID always returns the same image.
 *
 * @param productId  - used for deterministic selection (id % pool.length)
 * @param category   - category name to pick the right pool
 * @param imageUrl   - existing image_url from API (used if it's a valid http URL)
 */
export function getProductImage(
  productId: number,
  category: string,
  imageUrl?: string | null,
): string {
  // Use the real image if it's an absolute URL
  if (imageUrl?.startsWith('http')) return imageUrl;

  const pool = IMAGE_POOLS[category] ?? FALLBACK_POOL;
  return pool[productId % pool.length];
}

/** Returns all images in a category pool (for gallery / multi-thumbnail use). */
export function getCategoryImages(category: string): string[] {
  return IMAGE_POOLS[category] ?? FALLBACK_POOL;
}
