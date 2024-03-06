<script lang="ts">
import { defineComponent, PropType, ref, Ref } from 'vue';
import { ImageMimeTypes } from '../constants';
import useRequest from '../use/useRequest';
import { uploadImageFile } from '../api/api';

export default defineComponent({
  components: {
  },
  props: {
  },
  emits: ['done', 'cancel'],
  setup(props, { emit }) {
    const fileInputEl: Ref<HTMLInputElement | null> = ref(null);
    const fileModel: Ref<File | undefined> = ref();
    const successfulUpload = ref(false);
    const errorText = ref('');
    const progressState = ref('');
    const uploadProgress = ref(0);
    const name = ref('');
    const validForm = ref(false);
    const readFile = async (e: Event) => {
      const target = (e.target as HTMLInputElement);
      if (target?.files?.length) {
        const file = target.files.item(0);
        if (!file) {
          return;
        }
        name.value = file.name.replace(/\.[^/.]+$/, "");
        if (!ImageMimeTypes.includes(file.type)) {
          errorText.value = `Selected file is not one of the following types: ${ImageMimeTypes.join(' ')}`;
          return;
        }
        fileModel.value = file;
      }
    };
    function selectFile() {
      if (fileInputEl.value !== null) {
        fileInputEl.value.click();
      }
    }


    const { request: submit, loading: submitLoading } = useRequest(async () => {
      const file = fileModel.value;
      if (!file) {
        throw new Error('Unreachable');
      }
      await uploadImageFile(file, name.value);
      emit('done');
    });

    const handleSubmit = async () => {
        submit();
    };




    return {
      errorText,
      fileModel,
      fileInputEl,
      submitLoading,
      successfulUpload,
      progressState,
      uploadProgress,
      name,
      validForm,
      selectFile,
      readFile,
      handleSubmit,
    };
  },
});
</script>

<template>
  <div
    style="height: 100%"
    class="d-flex pa-1"
  >
    <v-alert
      v-if="successfulUpload"
      v-model="successfulUpload"
      type="success"
      dismissible
    >
      Data successfully uploaded
    </v-alert>
    <input
      ref="fileInputEl"
      class="d-none"
      type="file"
      accept="image/*"
      @change="readFile"
    >
    <v-card
      width="100%"
      style="max-height:90vh; overflow-y: scroll;"
    >
      <v-container>
        <v-card-title>
          Upload Image
        </v-card-title>
        <v-card-text>
          <v-form v-model="validForm">
            <v-row
              v-if="errorText === '' && progressState === '' && fileModel !== undefined"
              class="mx-2"
            >
              Upload {{ fileModel.name }} ?
            </v-row>
            <v-row
              v-else-if="fileModel === undefined"
              class="mx-2 my-2"
            >
              <v-btn
                block
                color="primary"
                @click="selectFile"
              >
                <v-icon class="pr-2">
                  mdi-image
                </v-icon>
                Choose Image
              </v-btn>
            </v-row>
            <v-row
              v-else-if="progressState !== ''"
              class="mx-2"
            >
              <v-progress-linear
                v-model="uploadProgress"
                color="secondary"
                height="25"
                class="ma-auto text-xs-center"
              >
                <strong>{{ progressState }} : {{ Math.ceil(uploadProgress) }}%</strong>
              </v-progress-linear>
            </v-row>
            <v-row
              v-else
              class="mx-2"
            >
              <v-alert type="error">
                {{ errorText }}
              </v-alert>
            </v-row>
            <v-row>
              <v-text-field
                v-model="name"
                label="name"
                :rules="[ v => !!v || 'Requires a name']"
              />
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            @click="$emit('cancel', true)"
          >
            Cancel
          </v-btn>
          <v-btn
            :disabled=" (!fileModel) || errorText !== '' || submitLoading || !validForm"
            color="primary"
            @click="handleSubmit"
          >
            <span v-if="!submitLoading">
              Submit
            </span>
            <v-icon v-else>
              mdi-loading mdi-spin
            </v-icon>
          </v-btn>
        </v-card-actions>
      </v-container>
    </v-card>
  </div>
</template>
