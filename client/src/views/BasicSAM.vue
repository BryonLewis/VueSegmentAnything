<script lang="ts">
import { defineComponent, ref, Ref, onMounted, watch } from 'vue';
import SAMEditor from '../components/SAMEditor.vue';
import { getImage } from '../api/api';
import { useRouter } from 'vue-router';

export default defineComponent({
    components: {
        SAMEditor
    },
    props: {
        imageId: {
            type: String,
            required: true,
        },
    },
  setup(props) {
    const embeddingURL = ref('');
    const imageURL = ref('');
    const width = ref(-1);
    const height = ref(-1);
    const router = useRouter();

    const getData = async () => {
        const req = await getImage(props.imageId);
        if (req.data.presignedImageEmbedding) {
            embeddingURL.value = req.data.presignedImageEmbedding;
            imageURL.value = req.data.presignedImage;
        }
    }

    onMounted(() =>{
        const div = document.getElementById('sam-container')
        if (div) {
            width.value = div.clientWidth*0.80;
            height.value = window.innerHeight*0.80 - 70;
        }
        getData();
    })

    const cancel = () => {
        router.push('/images');
    }


    return {
        embeddingURL,
        imageURL,
        width,
        height,
        cancel,
     };
  },
});
</script>

<template>
    <v-container id="sam-container">
    <SAMEditor
    v-if="embeddingURL && imageURL"
    :embeddingURL="embeddingURL"
    :imageUrl="imageURL"
    :width="width"
    :height="height"
    @cancel="cancel()"
    />
    </v-container>
</template>

<style scoped>
</style>