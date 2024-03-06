<script lang="ts">
import { defineComponent, ref, Ref, onMounted } from 'vue';
import { VueSamImage, deleteImage, getImages,  } from '../api/api';
import UploadImage from '../components/UploadImage.vue';

export default defineComponent({
    components: {
        UploadImage,
    },
  setup() {
    const itemsPerPage = ref(-1);
    const imageList: Ref<VueSamImage[]> = ref([]);
    let intervalRef: number | null = null;

    const uploadDialog = ref(false);
    const headers = ref([
        {
            title:'Delete',
            key:'edit',
        },

        {
            title:'Name',
            key:'name',
        },
        {
          title:'Image',
          key:'presignedImage'
        }
    ]);

    const fetchImages = async () => {
        const images = await getImages();
        imageList.value = images.data;
        console.log(imageList.value);
        // If we have a spectrogram being generated we need to refresh on an interval
    };
    onMounted(() => fetchImages());

    const uploadDone = () => {
        uploadDialog.value = false;
        fetchImages();
    };

    const delImage = async (id: number) => {
        await deleteImage(id);
        fetchImages();
    };

    return {
        itemsPerPage,
        headers,
        imageList,
        uploadDialog,
        uploadDone,
        delImage,
     };
  },
});
</script>

<template>
  <v-card>
    <v-card-title>
      <v-row class="py-2">
        <div>
          My Images
        </div>
        <v-spacer />
        <v-btn 
          color="primary"
          @click="uploadDialog=true"
        >
          Upload <v-icon> mdi-plus</v-icon>
        </v-btn>
      </v-row>
    </v-card-title>
    <v-card-text>
      <v-data-table
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="imageList"
        density="compact"
        class="elevation-1"
      >
        <template #item.edit="{ item }">
          <v-icon
            color="error"
            @click="delImage(item.id)"
          >
            mdi-delete
          </v-icon>
        </template>

        <template #item.name="{ item }">
          <router-link
            v-if="item.presignedImageEmbedding"
            :to="`/image/${item.id.toString()}/sam`"
          >
            {{ item.name }}
          </router-link>
          <div v-else>
            {{ item.name }} 
            <v-tooltip bottom>
              <template #activator="{ props: subProps }">
                <span v-bind="subProps">
                  <v-icon color="warning">mdi-alert</v-icon>
                  <v-icon>mdi-sync mdi-spin</v-icon>
                </span>
              </template>
              <span>Waiting for embedding to be computed</span>
            </v-tooltip>
          </div>
        </template>
        <template #item.presignedImage="{ item }">
          <img :src="item.presignedImage" width="200" crossorigin="anonymous" />
          </template>

        <template #bottom />
      </v-data-table>
    </v-card-text>
    <v-dialog
      v-model="uploadDialog"
      width="700"
    >
      <upload-image
        @done="uploadDone()"
        @cancel="uploadDialog = false;"
      />
    </v-dialog>
  </v-card>
</template>

<style scoped>
</style>