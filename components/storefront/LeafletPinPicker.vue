<!-- components/storefront/LeafletPinPicker.vue -->
<script setup lang="ts">
// SSR-safe OpenStreetMap pin picker with custom SVG marker
interface Props {
  lat?: number | null;
  lng?: number | null;
  zoom?: number;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  lat: null,
  lng: null,
  zoom: 14,
  readonly: false,
});

const emit = defineEmits<{
  'update:location': [coords: { lat: number; lng: number }];
}>();

const mapContainer = ref<HTMLElement | null>(null);
let map: any = null;
let marker: any = null;

const DEFAULT_LAT = -1.286389; // Nairobi Center
const DEFAULT_LNG = 36.817223;

async function initMap(): Promise<void> {
  if (!process.client || !mapContainer.value) return;

  const L = (await import('leaflet')).default;
  await import('leaflet/dist/leaflet.css');

  const initialLat = props.lat ?? DEFAULT_LAT;
  const initialLng = props.lng ?? DEFAULT_LNG;

  map = L.map(mapContainer.value, {
    center: [initialLat, initialLng],
    zoom: props.zoom,
    scrollWheelZoom: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  const pinIcon = L.divIcon({
    className: 'custom-pin-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: grab;">
        <svg width="32" height="42" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 0C7.611 0 0 7.611 0 17C0 29.75 17 44 17 44C17 44 34 29.75 34 17C34 7.611 26.389 0 17 0Z" fill="#073B24"/>
          <circle cx="17" cy="17" r="6" fill="#D99B26"/>
        </svg>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  });

  if (props.lat !== null && props.lng !== null) {
    marker = L.marker([props.lat, props.lng], { icon: pinIcon, draggable: !props.readonly }).addTo(map);
  }

  if (!props.readonly) {
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      if (!marker) {
        marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          emit('update:location', { lat: pos.lat, lng: pos.lng });
        });
      } else {
        marker.setLatLng([lat, lng]);
      }
      emit('update:location', { lat, lng });
    });
  }

  setTimeout(() => {
    map?.invalidateSize();
  }, 300);
}

function setCenter(lat: number, lng: number, zoomLevel = 15): void {
  if (!map) return;
  map.setView([lat, lng], zoomLevel);
  if (marker) marker.setLatLng([lat, lng]);
}

watch(
  () => [props.lat, props.lng] as const,
  ([newLat, newLng]: readonly [number | null, number | null]) => {
    if (newLat && newLng && map) {
      setCenter(newLat, newLng);
    }
  }
);

onMounted(() => {
  initMap();
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

defineExpose({
  setCenter,
});
</script>

<template>
  <div class="relative w-full rounded-lg overflow-hidden border border-ink-border bg-brand-cream">
    <div ref="mapContainer" class="w-full h-64 z-1" />
    <div v-if="!readonly" class="absolute bottom-2 left-1/2 -translate-x-1/2 bg-ink/80 text-white text-[10px] font-semibold px-3 py-1 rounded-full pointer-events-none z-10">
      Tap or drag marker to set exact drop-off pin
    </div>
  </div>
</template>