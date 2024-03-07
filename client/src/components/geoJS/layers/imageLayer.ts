/* eslint-disable class-methods-use-this */

interface ImageLayerData {
    ul: { x: number, y: number },
    lr: { x: number, y: number },
    image: HTMLImageElement | string,
}

export default class ImageLayer {
  formattedData: ImageLayerData[];


  hoverOn: boolean; //to turn over annnotations on
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  featureLayer: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseLayer: any;

  selectedIndex: number[]; // sparse array

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geoViewerRef: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: (name: string, data: any) => void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geoViewerRef: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: (name: string, data: any) => void,
  ) {
    this.geoViewerRef = geoViewerRef;
    this.formattedData = [];
    this.hoverOn = false;
    this.selectedIndex = [];
    this.event = event;
    //Only initialize once, prevents recreating Layer each edit
    this.baseLayer = this.geoViewerRef.createLayer("feature", {
      features: ["quad"],
      autoshareRenderer: false,
    });
    this.featureLayer = this.baseLayer.createFeature("quad");
    this.baseLayer.opacity(50 / 100.0);

  }



  destroy() {
    if (this.featureLayer) {
      this.geoViewerRef.deleteLayer(this.featureLayer);
    }
  }

  formatData(
    images: HTMLImageElement[],
    dimensions: {width: number, height: number}
  ) {
    const arr: ImageLayerData[] = [];
    images.forEach((image) => {
      arr.push({
        ul: {x: 0, y: 0},
        lr: {x: dimensions.width, y: dimensions.height},
        image: image,
      })
    })
    this.formattedData = arr;
    this.redraw();
  }

  redraw() {
    // add some styles
    this.featureLayer
      .data(this.formattedData)
      .draw();

  }

  disable() {
    this.featureLayer.data([]).draw();
  }

}
