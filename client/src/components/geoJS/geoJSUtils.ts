import { ref, Ref } from "vue";
import geo from "geojs";

const useGeoJS = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geoViewer: Ref<any> = ref();
  const container: Ref<HTMLElement | undefined> = ref();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let quadFeature: any;

  const thumbnail = ref(false);

  let originalBounds = {
    left: 0,
    top: 0,
    bottom: 1,
    right: 1,
  };

  const getGeoViewer = () => {
    return geoViewer;
  };

  const initializeViewer = (
    sourceContainer: HTMLElement,
    width: number,
    height: number,
    thumbanilVal = false
  ) => {
    thumbnail.value = thumbanilVal;
    container.value = sourceContainer;
    const params = geo.util.pixelCoordinateParams(container.value, width, height);
    if (!container.value) {
      return;
    }
    geoViewer.value = geo.map(params.map);
    resetMapDimensions(width, height);
    const interactorOpts = geoViewer.value.interactor().options();
    interactorOpts.keyboard.focusHighlight = false;
    interactorOpts.keyboard.actions = {};
    interactorOpts.click.cancelOnMove = 5;
    interactorOpts.actions = [
      interactorOpts.actions[0],
      // The action below is needed to have GeoJS use the proper handler
      // with cancelOnMove for right clicks
      {
        action: geo.geo_action.select,
        input: { right: true },
        name: "button edit",
        owner: "geo.MapInteractor",
      },
      // The action below adds middle mouse button click to panning
      // It allows for panning while in the process of polygon editing or creation
      {
        action: geo.geo_action.pan,
        input: "middle",
        modifiers: { shift: false, ctrl: false },
        owner: "geo.mapInteractor",
        name: "button pan",
      },
      interactorOpts.actions[2],
      interactorOpts.actions[6],
      interactorOpts.actions[7],
      interactorOpts.actions[8],
      interactorOpts.actions[9],
    ];
    // Set > 2pi to disable rotation
    interactorOpts.zoomrotateMinimumRotation = 7;
    interactorOpts.zoomAnimation = {
      enabled: false,
    };
    interactorOpts.momentum = {
      enabled: false,
    };
    interactorOpts.wheelScaleY = 0.2;
    if (thumbnail.value) {
      interactorOpts.actions = [
        {
          action: "overview_pan",
          input: "left",
          modifiers: { shift: false, ctrl: false },
          name: "button pan",
        },
      ];
    }
    geoViewer.value.interactor().options(interactorOpts);
    geoViewer.value.bounds({
      left: 0,
      top: 0,
      bottom: height,
      right: width,
    });

    const quadFeatureLayer = geoViewer.value.createLayer("feature", {
      features: ["quad"],
      autoshareRenderer: false,
      renderer: "canvas",
    });
    quadFeature = quadFeatureLayer.createFeature("quad");
  };

  const drawImage = (image: HTMLImageElement, width = image.width, height = image.height, resetCam=true) => {
    if (quadFeature) {
      quadFeature
        .data([
          {
            ul: { x: 0, y: 0 },
            lr: { x: width, y: height },
            image: image,
          },
        ])
        .draw();
    }
    if (resetCam) {
    resetMapDimensions(width, height, 0.3, resetCam);
    } else {
      const params = geo.util.pixelCoordinateParams(container.value, width, height, width, height);
      const margin  = 0.3;
      const { right, bottom } = params.map.maxBounds;
      originalBounds = params.map.maxBounds;
      geoViewer.value.maxBounds({
        left: 0 - right * margin,
        top: 0 - bottom * margin,
        right: right * (1 + margin),
        bottom: bottom * (1 + margin),
      });
  
    }
    
  };
  const resetZoom = () => {
    const bounds = !thumbnail.value
      ? {
          left: 0, // Making sure the legend is on the screen
          top: 0,
          right: originalBounds.right,
          bottom: originalBounds.bottom,
        }
      : originalBounds;
    const zoomAndCenter = geoViewer.value.zoomAndCenterFromBounds(bounds, 0);
    geoViewer.value.zoom(zoomAndCenter.zoom);
    geoViewer.value.center(zoomAndCenter.center);
  };

  const resetMapDimensions = (width: number, height: number, margin = 0.3, resetCam = true) => {
    // Want the height to be the main view and whe width to be  relative to the width of the geo.amp
    geoViewer.value.bounds({
      left: 0,
      top: 0,
      bottom: height,
      right: width,
    });
    const params = geo.util.pixelCoordinateParams(container.value, width, height, width, height);
    const { right, bottom } = params.map.maxBounds;
    originalBounds = params.map.maxBounds;
    geoViewer.value.maxBounds({
      left: 0 - right * margin,
      top: 0 - bottom * margin,
      right: right * (1 + margin),
      bottom: bottom * (1 + margin),
    });
    geoViewer.value.zoomRange({
      // do not set a min limit so that bounds clamping determines min
      min: -Infinity,
      // 4x zoom max
      max: 4,
    });
    geoViewer.value.clampBoundsX(true);
    geoViewer.value.clampBoundsY(true);
    geoViewer.value.clampZoom(true);
    if (resetCam) {
      resetZoom();
    }
  };

  return {
    getGeoViewer,
    initializeViewer,
    drawImage,
    resetMapDimensions,
    resetZoom,
  };
};




function findPolygonCenter(polygon: GeoJSON.Polygon): number[] {
  const coordinates = polygon.coordinates[0]; // Extract the exterior ring coordinates

  // Calculate the average of longitude and latitude separately
  const avgLng = coordinates.reduce((sum, point) => sum + point[0], 0) / coordinates.length;
  const avgLat = coordinates.reduce((sum, point) => sum + point[1], 0) / coordinates.length;

  return [avgLng, avgLat];
}



/**
 * This will take the current geoJSON Coordinates for a rectangle and reorder it
 * to keep the vertices index the same with respect to how geoJS uses it
 * Example: UL, LL, LR, UR, UL
 */
function reOrdergeoJSON(coords: GeoJSON.Position[]) {
  let x1 = Infinity;
  let x2 = -Infinity;
  let y1 = Infinity;
  let y2 = -Infinity;
  coords.forEach((coord) => {
    x1 = Math.min(x1, coord[0]);
    x2 = Math.max(x2, coord[0]);
    y1 = Math.min(y1, coord[1]);
    y2 = Math.max(y2, coord[1]);
  });
  return [
    [x1, y2],
    [x1, y1],
    [x2, y1],
    [x2, y2],
    [x1, y2],
  ];
}

export {
  reOrdergeoJSON,
  useGeoJS,
};
