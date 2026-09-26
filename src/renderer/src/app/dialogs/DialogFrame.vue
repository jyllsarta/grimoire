<template>
  <div class="overlay" :class="[tone, { light }]" :style="{ zIndex }" @click.self="onBackdrop">
    <div
      v-hover-se
      class="dialog panel_glass pop_in"
      :class="[dialogClass, { orn_frame: ornFrame }]"
      :style="{ width: width ? `${width}px` : undefined }"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
// ダイアログの共通枠 (tale の .overlay + .dialog.panel_glass.pop_in)。背景クリックで閉じるかは props
defineProps({
  width: { type: Number, default: 0 },
  dialogClass: { type: String, default: "" },
  tone: { type: String, default: "" }, // "" / deep (z 240)
  light: { type: Boolean, default: false },
  ornFrame: { type: Boolean, default: false },
  zIndex: { type: Number, default: 200 },
  closeOnBackdrop: { type: Boolean, default: false },
});
const emit = defineEmits(["backdrop"]);
function onBackdrop() {
  emit("backdrop");
}
</script>

<style lang="scss" scoped>
.overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 12, 10, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  &.light {
    background: rgba(15, 12, 10, 0.5);
  }
}
.dialog {
  position: relative;
  max-width: 1200px;
  max-height: 690px;
  &::before {
    content: "";
    position: absolute;
    inset: 7px;
    border: 1px solid var(--color-main3);
    opacity: 0.4;
    border-radius: calc(var(--radius-panel) - 5px);
    pointer-events: none;
  }
}
</style>
