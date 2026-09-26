<template>
  <div class="hp_dots" :class="[variant, { low: hp <= max * 0.3 }]">
    <i v-for="i in Math.max(0, hp)" :key="i" class="on"></i>
  </div>
</template>

<script setup>
// ライフの小四角 (tale hpDotsHtml)。今ある点数ぶんだけ描く。variant: "" (4px 角、1 行 40 個) / ticks (3x12、戦闘パネル) / enemy_ticks
defineProps({
  hp: { type: Number, required: true },
  max: { type: Number, required: true },
  variant: { type: String, default: "" },
});
</script>

<style lang="scss" scoped>
.hp_dots {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  width: 238px;
  min-height: 4px;
  i {
    display: block;
    width: 4px;
    height: 4px;
    border-radius: 1px;
    background: var(--color-accent2);
    box-shadow: 0 0 3px rgba(138, 255, 159, 0.6);
  }
  &.low i {
    background: var(--color-negative1);
    box-shadow: 0 0 3px rgba(255, 138, 164, 0.6);
  }
  &.ticks,
  &.enemy_ticks {
    width: 200px;
    min-height: 12px;
    margin-top: 6px;
    i {
      width: 3px;
      height: 12px;
    }
  }
  &.enemy_ticks i {
    background: var(--color-negative1);
    box-shadow: 0 0 3px rgba(255, 138, 164, 0.6);
  }
}
</style>
