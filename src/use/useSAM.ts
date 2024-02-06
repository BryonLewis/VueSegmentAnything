import { Ref, ref, watch } from "vue";
import { arrayToImageData, imageDataToImage, onnxMaskToImage } from "./helpers/maskUtils";
import { modelData } from "./helpers/onnxModelAPI";
import npyjs from "npyjs";
import * as ort from 'onnxruntime-web';

import { InferenceSession, Tensor } from "onnxruntime-web";
import { modelInputProps, modelScaleProps } from "./helpers/Interfaces";
import { handleImageScale } from "./helpers/scaleHelper";
import { convertImageToPoly, drawGeoJSONPolygon } from "./helpers/maskToPolygon";
import { defer, throttle } from "lodash";

const IMAGE_PATH = "/sampleImage.png";
const IMAGE_EMBEDDING = "/sampleImage.npy";
const MODEL_DIR = "/sam_onnx_quantized_example.onnx";

const getHover = (x: number, y: number): modelInputProps => {
    const hoverType = 1;
    return { x, y, hoverType };
  };


// Interactive State for Components
const hovered: Ref<modelInputProps[]> =ref([]);
const clicks: Ref<modelInputProps[]> =ref([]);
const image: Ref<HTMLImageElement | null> = ref(null);
const maskImg: Ref<HTMLImageElement | null> = ref(null);
const selectedMasks: Ref<HTMLImageElement[]> = ref([]);
const polygons: Ref<GeoJSON.Polygon[]> = ref([]);
const smoothing = ref(3);

// Internal State for SAM
const model: Ref<InferenceSession | null> = ref(null);
const tensor: Ref<Tensor | null> = ref(null);
const modelScale: Ref<modelScaleProps | null> = ref(null);


export default function useSAM() {

        const initModel = async (modelDIR? : string) => {
            const modelLocation = modelDIR || MODEL_DIR
            try {
              if (modelLocation === undefined) return;
              const URL: string = modelLocation;
              const loadedModel = await InferenceSession.create(URL);
              model.value = loadedModel;
            } catch (e) {
              console.log(e);
            }
          };
          const loadImage = async (url: URL, imageEmbedding: string) => {
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
            const embedding = await loadNpyTensor(imageEmbedding, "float32");
            tensor.value = embedding;           
          };
      
          const loadNpyTensor = async (tensorFile: string, dType: string) => {
            const npLoader = new npyjs();
            const npArray = await npLoader.load(tensorFile);
            const tensor = new ort.Tensor(dType, npArray.data, npArray.shape);
            return tensor;
          };

          const processHovered = async () => {
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

          const processPolygons = () => {
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
            const ctx = canvas.getContext('2d');
            if (ctx && polygons.value.length) {
                ctx.clearRect(0,0, canvas.width, canvas.height);
                drawGeoJSONPolygon(ctx, polygons.value[0]);
      }
          }

          const processClicks = async () => {
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
              selectedMasks.value[0].onload = () => {
                const result = convertImageToPoly(selectedMasks.value[0], smoothing.value);
                if (result !== null) {
                  polygons.value = [result];
                }
              }
          }
          const updateSmoothing = (num: number) => {
            smoothing.value = num;
            if (selectedMasks.value.length){
              const result = convertImageToPoly(selectedMasks.value[0], smoothing.value);
              if (result !== null) {
                polygons.value = [result];
              }
            }
          }
      
          const handleMouse = throttle((e: MouseEvent, type: 'hover' | 'click') => {
            const target = e.target;
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
          const mouseOut = () => defer(() => (maskImg.value = null));


          // Watchers for changes
          watch(hovered, () => processHovered());
          watch(clicks, () => processClicks());
          watch(smoothing, () => updateSmoothing(smoothing.value));
          watch(polygons, () => processPolygons());

    return {
        // Functions
        initModel,
        loadImage,
        processHovered,
        processClicks,
        handleMouse,
        mouseOut,
        state: {
            image,
            maskImg,
            hovered,
            clicks,
            polygons,
            selectedMasks,
            smoothing,
        }


    }
}