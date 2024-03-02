import axios from 'axios';

export interface PaginatedResponse<E> {
    count: number,
    next: string,
    previous:string,
    results: E[];
}

export interface VueSamImage {
    id: number,
    url: string,
    npy?: string,
}

  
async function getImages(getPublic=false) {
    return axiosInstance.get<Recording[]>(`/images/}`);
}



export {
 getImages,
};