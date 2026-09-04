// =============================================================================
// composables/useCart.ts
// Session-persisted cart state with multi-format item isolation & compare-at pricing.
// =============================================================================

import type { CartItem, BookFormatType, DeliveryMethodType } from '~/types';

export function useCart() {
  const items = useState<CartItem[]>('flemela_cart_items', () => []);
  const isDrawerOpen = useState<boolean>('flemela_cart_drawer_open', () => false);

  const totalItems = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0);
  });

  const subtotal = computed(() => {
    const total = items.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return Math.round(total * 100) / 100;
  });

  const hasDigitalItems = computed(() => {
    return items.value.some(
      (item) =>
        item.deliveryMethod === 'digital' || item.format === 'pdf' || item.format === 'epub'
    );
  });

  const hasPhysicalItems = computed(() => {
    return items.value.some(
      (item) => item.deliveryMethod !== 'digital' && item.format === 'hardcopy'
    );
  });

  function addItem(item: {
    productId: string;
    formatId: string;
    title: string;
    format: BookFormatType;
    price: number;
    compare_at_price?: number | null;
    quantity?: number;
    deliveryMethod?: DeliveryMethodType;
    coverUrl?: string | null;
    author?: string | null;
  }): void {
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const method: DeliveryMethodType =
      item.deliveryMethod || (item.format === 'hardcopy' ? 'delivery' : 'digital');

    const existingIndex = items.value.findIndex(
      (i) => i.productId === item.productId && i.formatId === item.formatId
    );

    if (existingIndex > -1) {
      items.value[existingIndex].quantity += qty;
    } else {
      items.value.push({
        productId: item.productId,
        formatId: item.formatId,
        title: item.title,
        format: item.format,
        price: item.price,
        compare_at_price: item.compare_at_price ?? null,
        quantity: qty,
        deliveryMethod: method,
        coverUrl: item.coverUrl ?? null,
        author: item.author ?? null,
      });
    }

    isDrawerOpen.value = true;
  }

  function updateQuantity(productId: string, formatId: string, quantity: number): void {
    const index = items.value.findIndex(
      (i) => i.productId === productId && i.formatId === formatId
    );
    if (index > -1) {
      if (quantity <= 0) {
        items.value.splice(index, 1);
      } else {
        items.value[index].quantity = quantity;
      }
    }
  }

  function removeItem(productId: string, formatId: string): void {
    items.value = items.value.filter(
      (i) => !(i.productId === productId && i.formatId === formatId)
    );
  }

  function clearCart(): void {
    items.value = [];
  }

  function openDrawer(): void {
    isDrawerOpen.value = true;
  }

  function closeDrawer(): void {
    isDrawerOpen.value = false;
  }

  return {
    items,
    isDrawerOpen,
    totalItems,
    subtotal,
    hasDigitalItems,
    hasPhysicalItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    openDrawer,
    closeDrawer,
  };
}