<script lang="ts">
import { defineComponent, nextTick, onMounted, onUnmounted, PropType, Ref, ref, watch } from "vue";
import EditAnnotationLayer from "./layers/editAnnotationLayer";
import ImageLayer from "./layers/imageLayer";
import useSAM from "../../use/useSAM";
export default defineComponent({
  name: "LayerManager",
  props: {
    geoViewerRef: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Object as PropType<any>,
      required: true,
    },
  },
  emits: ["selected", "update:annotation", "create:annotation", "set-cursor"],
  setup(props, { emit }) {

    const { state } = useSAM();
    

    const editing = ref(false);
    let editAnnotationLayer: EditAnnotationLayer;
    let imageLayer: ImageLayer;
    const displayError = ref(false);
    const errorMsg = ref("");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    const event = (type: string, data: any) => {
      // Will handle clicking, selecting and editing here
      if (type === "update:mode") {
      }
      if (type === "update:cursor") {
        emit("set-cursor", data.cursor);
      }
      if (type === "annotation-cleared") {
        console.log(type);
        console.log(data);
      }
      if (type === "annotation-clicked") {
      }
      if (type === "annotation-right-clicked") {
        console.log(type);
        console.log(data);
      }
      if (type === "update:geojson") {
        console.log(type);
        console.log(data);
      }
    };

    const triggerUpdate = () => {
      // Check for selected and editing annotations;
      if (state.polygons.value.length > 0) {
        setTimeout(() => {
          editAnnotationLayer.changeData(state.polygons.value[0]);
        }, 0);
        imageLayer.disable();
        state.enabled.value = false;
        return;
      } else {
        editAnnotationLayer.disable();
        state.enabled.value = true;
      }
      let combinedMasks = []
      if (state.maskImg.value) {
        combinedMasks.push(state.maskImg.value);
      }
      if (state.selectedMasks.value.length) {
        combinedMasks = combinedMasks.concat(state.selectedMasks.value);
      }
      if (state.image.value) {
        imageLayer.formatData(combinedMasks, {width: state.image.value?.naturalWidth, height: state.image.value?.naturalHeight});
      }
    };
    onUnmounted(() => {
      if (editAnnotationLayer) {
        editAnnotationLayer.destroy();
      }
    });
    const initLayers = () => {
        editAnnotationLayer = new EditAnnotationLayer(props.geoViewerRef, event);
        imageLayer = new ImageLayer(props.geoViewerRef, event);
        state.enabled.value = true;
        state.drawPolygons.value = false;
      triggerUpdate();
    };
    onMounted(() => initLayers());

    watch(() => state.maskImg.value, () => {
      triggerUpdate();
    })
    watch(() => state.selectedMasks.value.length, () => {
      triggerUpdate();
    })

    watch(() => state.polygons.value, () => {
      triggerUpdate();
    });

    return {
      displayError,
      errorMsg,
    };
  },
});
</script>

<template>
  <v-dialog
    v-model="displayError"
    width="500"
  >
    <v-card>
      <v-card-title>Error</v-card-title>
      <v-card-text>{{ errorMsg }}</v-card-text>
      <v-card-actions>
        <v-row>
          <v-spacer />
          <v-btn
            variant="outlined"
            @click="displayError = false"
          >
            Dismiss
          </v-btn>
          <v-spacer />
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>./layers/imageLayer
