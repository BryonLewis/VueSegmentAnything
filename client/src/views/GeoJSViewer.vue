<script lang="ts">
import { PropType, Ref, defineComponent, onMounted, ref, watch } from "vue";
import { useGeoJS } from "../components/geoJS/geoJSUtils";
import LayerManager from "../components/geoJS/LayerManager.vue";
import { GeoEvent } from "geojs";
import geo from "geojs";
import useSAM from "../use/useSAM";
import { getImage } from "../api/api";
import { throttle } from "lodash";

export default defineComponent({
    name: "GeoJSViewer",
    components: {
        LayerManager,
    },
    props: {
        imageId: {
            type: String,
            required: true,
        },
    },
    emits: [
        "update:annotation",
        "create:annotation",
        "geoViewerRef",
        "hoverData",
        "clear",
        "cancel",
        "updatePolygon",
    ],
    setup(props, { emit }) {
        const containerRef: Ref<HTMLElement | undefined> = ref();
        const { initModel, loadImage, state, handleMousePos, clearMasks, updateSmoothing, convertMasksToPoly, mouseOut, undo } = useSAM();
        const geoJS = useGeoJS();
        state.drawPolygons.value = false; // Turn off drawing of polygons;
        const initialized = ref(false);
        const cursor = ref("");
        const smoothing = ref(3);
        const imageCursorRef: Ref<HTMLElement | undefined> = ref();
        const setCursor = (newCursor: string) => {
            cursor.value = newCursor;
        };

        const cursorHandler = {
            handleMouseLeave() {
                if (imageCursorRef.value) {
                    imageCursorRef.value.style.display = "none";
                }
            },
            handleMouseEnter() {
                if (imageCursorRef.value) {
                    imageCursorRef.value.style.display = "block";
                }
            },
            handleMouseMove(evt: MouseEvent) {
                const offsetX = evt.clientX + 10;
                const offsetY = evt.clientY - 25;
                window.requestAnimationFrame(() => {
                    if (imageCursorRef.value) {
                        imageCursorRef.value.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                    }
                });
            },
        };

        const throttledhandleMouse = throttle(handleMousePos, 100);

        const mouseMoveEvent = (e: GeoEvent) => {
            if (!state.enabled.value) {
                return;
            }
            const { x, y } = e.geo;
            if (state.image.value) {
                if (x > 0 && x < state.image.value.naturalWidth && y > 0 && y < state.image.value.naturalHeight) {
                    throttledhandleMouse(x, y, 'hover');
                } else {
                    mouseOut();
                }
            }
        };
        const mouseClickEvent = (e: GeoEvent) => {
            if (!state.enabled.value) {
                return;
            }
            const { x, y } = e.geo;
            if (state.image.value) {
                if (x > 0 && x < state.image.value.naturalWidth && y > 0 && y < state.image.value.naturalHeight) {
                    throttledhandleMouse(x, y, 'click');
                }
            }
        };

        const loadData = async () => {
            const req = await getImage(props.imageId);
            if (req.data.presignedImageEmbedding) {
                await initModel();
                await loadImage(req.data.presignedImage, req.data.presignedImageEmbedding);
                if (state.image.value) {
                    const { naturalWidth, naturalHeight } = state.image.value;
                    if (containerRef.value) {
                        if (!geoJS.getGeoViewer().value) {
                            geoJS.initializeViewer(containerRef.value, naturalWidth, naturalHeight);
                            geoJS.getGeoViewer().value.geoOn(geo.event.mousemove, mouseMoveEvent);
                            geoJS.getGeoViewer().value.geoOn(geo.event.mouseclick, mouseClickEvent);
                        }
                    }
                    geoJS.drawImage(state.image.value, naturalWidth, naturalHeight);
                    initialized.value = true;
                    emit("geoViewerRef", geoJS.getGeoViewer());

                }
            }
        };

        onMounted(() => {
            state.enabled.value = true;
            state.drawPolygons.value = true;
            loadData();
        });
        const cancel = () => {
            clearMasks();
            emit('cancel');
        };
        const generatePolys = async () => {
            await convertMasksToPoly();
        };

        const clearPoly = () => {
            clearMasks();
            emit('clear');
        };

        const adjustSmoothing = async (e: number) => {
            smoothing.value = e;
            const polygon = await updateSmoothing(smoothing.value);
            if (polygon) {
                emit('updatePolygon', polygon);
            }

        };


        return {
            containerRef,
            geoViewerRef: geoJS.getGeoViewer(),
            initialized,
            cursor,
            setCursor,
            cursorHandler,
            imageCursorRef,
            cancel,
            selectedMasks: state.selectedMasks,
            generatePolys,
            undo,
            polygons: state.polygons,
            adjustSmoothing,
            smoothing,
            clearPoly,

        };
    },
});
</script>

<template>
  <v-row class="py-6">
    <v-btn
      size="small"
      color="error"
      class="mx-2"
      @click="cancel()"
    >
      Cancel
    </v-btn>
    <v-btn
      v-if="selectedMasks.length"
      size="small"
      class="mx-2"
      @click="undo()"
    >
      Undo
    </v-btn>
    <v-btn
      v-if="selectedMasks.length"
      size="small"
      class="mx-2"
      @click="clearPoly()"
    >
      Clear
    </v-btn>
    <v-btn
      v-if="selectedMasks.length"
      size="small"
      class="mx-2"
      :disabled="!selectedMasks.length"
      @click="generatePolys()"
    >
      generate
    </v-btn>
    <v-slider
      v-if="polygons.length"
      :model-value="smoothing"
      min="0"
      max="30"
      step="1"
      :label="`Smoothness: ${smoothing}`"
      color="primary"
      thumb-label
      density="compact"
      @end="adjustSmoothing($event)"
    />
  </v-row>
  <div class="video-annotator">
    <div
      id="geoJSViewer"
      ref="containerRef"
      class="playback-container"
      :style="{ cursor: cursor }"
      @mousemove="cursorHandler.handleMouseMove"
      @mouseleave="cursorHandler.handleMouseLeave"
      @mouseover="cursorHandler.handleMouseEnter"
    />
    <layer-manager
      v-if="initialized"
      :geo-viewer-ref="geoViewerRef"
      @set-cursor="setCursor($event)"
    />
    <div
      ref="imageCursorRef"
      class="imageCursor"
    >
      <v-icon color="white">
        {{ cursor }}
      </v-icon>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.video-annotator {
    position: relative;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 0;
    height: calc(100vh - 72px);

    display: flex;
    flex-direction: column;

    .geojs-map {
        margin: 2px;

        &.geojs-map:focus {
            outline: none;
        }
    }


    .playback-container {
        flex: 1;
    }

    .loadingSpinnerContainer {
        z-index: 20;
        margin: 0;
        position: absolute;
        top: 50%;
        left: 50%;
        -ms-transform: translate(-50%, -50%);
        transform: translate(-50%, -50%);
    }

    .geojs-map.annotation-input {
        cursor: inherit;
    }
}

.black-background {
    background-color: black;
}

.white-background {
    background-color: white;
}

.imageCursor {
    z-index: 9999; //So it will be above the annotator layers
    position: fixed;
    backface-visibility: hidden;
    top: 0;
    left: 0;
    pointer-events: none;
}
</style>../components/geoJS/geoJSUtils
