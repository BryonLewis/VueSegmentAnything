import axios from 'axios';

export interface PaginatedResponse<E> {
    count: number,
    next: string,
    previous:string,
    results: E[];
}

export interface VueSamImage {
    id: number;
    name: string;
    presignedImage: string;
    presignedImageEmbedding?: string;
}

export const axiosInstance = axios.create({
    baseURL: import.meta.env.VUE_APP_API_ROOT as string,
  });
  

  
async function getImages() {
    return axiosInstance.get<VueSamImage[]>(`/image/`);
}

async function getImage(imageId: string) {
    return axiosInstance.get<VueSamImage>(`/image/${imageId}/`);

}

async function uploadImageFile(file: File, name: string ) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('name', name);
    const imageParams = {
        name,
      };
      const payloadBlob = new Blob([JSON.stringify(imageParams)], { type: 'application/json' });
      formData.append('payload', payloadBlob);
  
  await axiosInstance.post('/image/',
    formData,
    { 
        headers: {
            'Content-Type': 'multipart/form-data',   
        }
     });
  }

  interface DeletionResponse {
    message?: string;
    error?: string;
}

  async function deleteImage(id: number) {
    return axiosInstance.delete<DeletionResponse>(`/image/${id}`);
}

export {
 getImages,
 getImage,
 uploadImageFile,
 deleteImage,
};