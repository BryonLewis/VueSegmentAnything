import { ref, Ref } from "vue";
import { modelInputProps } from "../components/helpers/Interfaces";

const hovered: Ref<modelInputProps[]> =ref([]);
const clicks: Ref<modelInputProps[]> =ref([]);
const image: Ref<HTMLImageElement | null> = ref(null);
const maskImg: Ref<HTMLImageElement | null> = ref(null);
const selectedMasks: Ref<HTMLImageElement[]> = ref([]);
const polygons: Ref<GeoJSON.Polygon[]> = ref([]);

export default function useState() {
    return {
    hovered,
    clicks,
    image,
    maskImg,
    selectedMasks,
    polygons,
  };
};
