# VueSegmentAnything
This is a Vue + Vite conversion of the [Segment Anything Demo](https://github.com/facebookresearch/segment-anything/tree/main/demo)

It is meant to be a proof of concept for an eventual tool that can take Segment Anything and convert selected masks into geoJSON.Polygons for use in other software.

This has taken the base model and generated a quantized ONNX model base on the [Demo instructions](https://github.com/facebookresearch/segment-anything/tree/main/demo#export-the-onnx-model)
I've taken a sample image and already did the image embedding by using the [Example in the Demo](https://github.com/facebookresearch/segment-anything/tree/main/demo#export-the-image-embedding)

# Background
- To get Vite to work I needed to add in the static copy to copy over some WASM files to the static root.
- This version allows you click on a mask to select it and then it coverts it to a geoJSON Polygon.  This is done by utilizing OpenCV.js to convert the bitmask into a polygon with a smoothing factor
- The techstark/openCV is a nicer version than the default openCV.js becuse it includes typescript support by default.
- The smoothing factor can be used to reduce the number of points in the geoJSON polygon.

# useSAM
I decided to create a function using the composition API and refs/watchers to properly manage hovering/clicking and adjusting the smoothness of generated polygon.
The basics are that you call `initModel(model?:string)` with a base model location.  There is a default in `useSAM` that can be used.
Then you call `loadImage(imageURL: string, embeddingURL:string)` to load the image and the embedding.
Both of the above functions are async.
There is a `handleMouse(e: MouseEven, 'hover' | 'click')` function to handle hovering over the image and a `mouseOut` function as well.
Then you have a state object which includes the `image, maskImg, selectedMasks, polygons, smoothing`.  As the mouse is hovered the `maskImg` will change and as items are clicked `selectedMasks` will change.  `polygons` will be modified when selecting mask or when changing the `smoothing` variable
The main `SAMImage.vue` component has a simplified example showing how to utilize `useSAM`


# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support For `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.
