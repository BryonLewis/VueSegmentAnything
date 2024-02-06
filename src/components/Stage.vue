<script lang="ts">
import { defineComponent } from "vue";
import Tool from "./Tool.vue";
/* @ts-ignore */
import npyjs from "npyjs";


export default defineComponent({
  name: "Stage",
  components: { Tool, },
  props: {},
  setup() { 
  const flexCenterClasses = "custom-flex-center";

    return {
        flexCenterClasses,
    };
  },
});
</script>

<template>
    <div :class="`${flexCenterClasses} full-size`">
      <div :class="`${flexCenterClasses} custom-size`">
        <Tool />
      </div>
    </div>
</template>

<style lang="scss" scoped>
.custom-flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.full-size {
    width: 100%;
    height: 100%;
}
.custom-size {
  position: relative;
  width: 90%;
  height: 90%;
}

</style>
