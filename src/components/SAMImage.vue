<script lang="ts">
import { defineComponent, ref, Ref, watch } from "vue";
import { InferenceSession, Tensor } from "onnxruntime-web";

import { handleImageScale } from "./helpers/scaleHelper";
import useState from "../use/useState";
import {
  modelScaleProps,
} from "./helpers/Interfaces";
import { arrayToImageData, imageDataToImage, onnxMaskToImage } from "./helpers/maskUtils";
import { modelData } from "./helpers/onnxModelAPI";

/* @ts-ignore */
import npyjs from "npyjs";
import * as ort from 'onnxruntime-web';
import Stage from "./Stage.vue";
import { convertImageToPoly } from "./helpers/maskToPolygon";

const IMAGE_PATH = "/sampleImage.png";
const IMAGE_EMBEDDING = "/sampleImage.npy";
const MODEL_DIR = "/sam_onnx_quantized_example.onnx";

export default defineComponent({
  name: "SAMImage",
  components: { Stage },
  props: {},
  setup() {
    const model: Ref<InferenceSession | null> = ref(null);
    const tensor: Ref<Tensor | null> = ref(null);
    const modelScale: Ref<modelScaleProps | null> = ref(null);
    const { hovered, image, maskImg, clicks, selectedMasks, polygons } = useState();
    const smoothing = ref(3);

    const initModel = async () => {
      try {
        if (MODEL_DIR === undefined) return;
        const URL: string = MODEL_DIR;
        const loadedModel = await InferenceSession.create(URL);
        model.value = loadedModel;
      } catch (e) {
        console.log(e);
      }
    };
    initModel();
    const loadImage = async (url: URL) => {
      try {
        const img = new Image();
        img.src = url.href;
        img.onload = () => {
          const { height, width, samScale } = handleImageScale(img);
          modelScale.value = {
            height: height, // original image height
            width: width, // original image width
            samScale: samScale, // scaling factor for image which has been resized to longest side 1024
          };
          img.width = width;
          img.height = height;
          image.value = img;
        };
      } catch (error) {
        console.log(error);
      }
    };

    // Load the image
    const url = new URL(IMAGE_PATH, location.origin);
    loadImage(url);

    const loadNpyTensor = async (tensorFile: string, dType: string) => {
      let npLoader = new npyjs();
      const npArray = await npLoader.load(tensorFile);
      const tensor = new ort.Tensor(dType, npArray.data, npArray.shape);
      return tensor;
    };
    // Load the Segment Anything pre-computed embedding
    Promise.resolve(loadNpyTensor(IMAGE_EMBEDDING, "float32")).then(
      (embedding) => (tensor.value = embedding)
    );

    const runONNX = async () => {
      try {
        if (
          model.value === null ||
          hovered.value === null ||
          tensor.value === null ||
          modelScale.value === null
        ) {
          return;
        } else {
          // Preapre the model input in the correct format for SAM.
          // The modelData function is from onnxModelAPI.tsx.
          const feeds = modelData({
            hovered: hovered.value,
            tensor: tensor.value,
            modelScale: modelScale.value,
          });
          if (feeds === undefined) return;
          // Run the SAM ONNX model with the feeds returned from modelData()
          const results = await model.value.run(feeds);
          const output = results[model.value.outputNames[0]];
          // The predicted mask returned from the ONNX model is an array which is
          // rendered as an HTML image using onnxMaskToImage() from maskUtils.tsx.
          maskImg.value = onnxMaskToImage(
            output.data,
            output.dims[2],
            output.dims[3]
          );
        }
      } catch (e) {
        console.log(e);
      }
    };
    watch(clicks, async () => {
        try {
        if (
          model.value === null ||
          clicks.value === null ||
          tensor.value === null ||
          modelScale.value === null
        ) {
          return;
        } else {
          // Preapre the model input in the correct format for SAM.
          // The modelData function is from onnxModelAPI.tsx.
          const feeds = modelData({
            hovered: clicks.value,
            tensor: tensor.value,
            modelScale: modelScale.value,
          });
          if (feeds === undefined) return;
          // Run the SAM ONNX model with the feeds returned from modelData()
          const results = await model.value.run(feeds);
          const output = results[model.value.outputNames[0]];
          // The predicted mask returned from the ONNX model is an array which is
          // rendered as an HTML image using onnxMaskToImage() from maskUtils.tsx.
          const newImage = imageDataToImage(arrayToImageData(
            output.data,
            output.dims[2],
            output.dims[3],
            [0, 188, 0, 255] // [r,g,b,a]
          ));
          newImage.width = output.dims[2];
          newImage.height = output.dims[3];
          selectedMasks.value.push(newImage);
          
        }
      } catch (e) {
        console.log(e);
      }
      // Check the geoJSON conversion
      console.log()
      console.log(`${selectedMasks.value[0].width} ${selectedMasks.value[0].height}`);
      selectedMasks.value[0].onload = () => {
        const result = convertImageToPoly(selectedMasks.value[0], smoothing.value);
        if (result !== null) {
          console.log('setting polygon');
          polygons.value = [result];
        }
      }

    })
    watch(hovered, () => {
        runONNX();
    });

    const updateSmoothing = (e: Event) => {
      const num = parseInt((e.target as HTMLInputElement).value);
      console.log(num);
      smoothing.value = num;
      if (selectedMasks.value.length){
        const result = convertImageToPoly(selectedMasks.value[0], smoothing.value);
        if (result !== null) {
          console.log('setting polygon');
          polygons.value = [result];
        }
      }
    }
    return {
      smoothing,
      updateSmoothing
    };
  },
});
</script>

<template>
  <div>
    <div>
  <input type="range" id="smoothness" name="smoothness" min="0" max="30" :value="smoothing" @change="updateSmoothing($event)" />
  <label for="smoothness">Smoothness ({{ smoothing }})</label>
</div>
    <Stage /></div>
</template>

<style lang="scss" scoped>
</style>
