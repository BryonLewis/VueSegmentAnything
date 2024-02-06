<script lang="ts">
import { defineComponent, watch } from "vue";
import useState from "../use/useState";
/* @ts-ignore */
import npyjs from "npyjs";
import { defer } from "lodash";
import { changeImageColor } from "./helpers/maskUtils";
import { throttle } from "lodash";
import { modelInputProps } from "./helpers/Interfaces";
import { drawGeoJSONPolygon } from "./helpers/maskToPolygon";

export default defineComponent({
  name: "Tool",
  components: {},
  props: {},
  setup() {
    const { image, hovered, clicks, maskImg, selectedMasks, polygons } = useState();

    const getHover = (x: number, y: number): modelInputProps => {
      const hoverType = 1;
      return { x, y, hoverType };
    };

    const handleMouse = throttle((e: MouseEvent, type: 'hover' | 'click') => {
      let target = e.target;
      if (target === null) {
        return;
      }
      const el = target as HTMLImageElement;

      const rect = el.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;
      const imageScale = image.value ? image.value.width / el.offsetWidth : 1;
      x *= imageScale;
      y *= imageScale;
      const newHover = getHover(x, y);
      if (type === 'hover' && newHover && hovered.value) {
        hovered.value = [newHover];
      }
      if (type === 'click' && newHover && hovered.value) {
        clicks.value = [newHover];
      }
    }, 50);

    const imageClasses = "";
    const maskImageClasses = `mask custom-styles`;
    const mouseOut = () => defer(() => (maskImg.value = null));

    const addMask = (img: HTMLImageElement) => {
      console.log("clicking on mask");
      const colorImg = changeImageColor(img);
      selectedMasks.value.push(colorImg);
    };

    watch(polygons, () => {
      const canvas = document.getElementById('geoJSONCanvas') as HTMLCanvasElement; 
      let width = 0;
      let height = 0;
      const masks = document.getElementsByClassName('selected-mask');
      for (let i = 0; i < masks.length; i += 1) {
        width = Math.max(masks[i].clientWidth, width)
        height = Math.max(masks[i].clientHeight, height)
      }
      canvas.width = selectedMasks.value[0].width;
      canvas.height = selectedMasks.value[0].height;
      canvas.style.height = `${height}px`;
      canvas.style.width = `${width}px`;
      console.log(canvas.width)
      console.log(canvas.height);
      console.log(canvas.style.width);
      console.log(canvas.style.height);
      const ctx = canvas.getContext('2d');
      if (ctx && polygons.value.length) {
        ctx.clearRect(0,0, canvas.width, canvas.height);
        drawGeoJSONPolygon(ctx, polygons.value[0]);
      }

    })
    return {
      imageClasses,
      maskImageClasses,
      maskImg,
      image,
      mouseOut,
      selectedMasks,
      addMask,
      handleMouse,
    };
  },
});
</script>

<template>
  <img
    v-if="image"
    :src="image.src"
    @mousemove="handleMouse($event, 'hover')"
    @mouseout="mouseOut"
    @click="handleMouse($event, 'click')"
    :class="`full-width ${imageClasses}`"
  />
  <img
    v-if="maskImg"
    :src="maskImg.src"
    :class="`full-width ${maskImageClasses}`"
  />
  <img
    v-for="(image, index) in selectedMasks"
    :key="`image_${index}`"
    :src="image.src"
    :class="`full-width selected-mask`"
  />
  <canvas id="geoJSONCanvas" class="selected-mask" />
</template>

<style lang="scss" scoped>
.full-width {
  width: 100%;
}

.full-height {
  height: 100%;
}
.mask {
  z-index: 1000;
  // border: 1px solid red;
}

.selected-mask {
  position: absolute;
  top: 0;
  left: 0;
  opacity: .6;
  pointer-events: none;

}
.custom-styles {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0.4;
  pointer-events: none;
}
</style>
