import logging
import os

from celery import shared_task
import cv2
from django.core.files.base import ContentFile
from django.db import transaction
import numpy as np
from segment_anything import SamPredictor, sam_model_registry

from djangosam.core.models import Image as ImageModel

logger = logging.getLogger(__name__)


@shared_task
def image_compute_checksum(image_id: int):
    image = ImageModel.objects.get(pk=image_id)
    image.compute_checksum()
    image.save()


@shared_task
def generate_image_embedding(id: int):
    site_image = ImageModel.objects.get(pk=id)
    if site_image:
        with transaction.atomic():
            try:
                logger.warning('Loading checkpoint Model')
                checkpoint = '/data/SAM/sam_vit_h_4b8939.pth'
                model_type = 'vit_h'
                sam = sam_model_registry[model_type](checkpoint=checkpoint)
                sam.to(device='cpu')
                predictor = SamPredictor(sam)

                image_file = site_image.image.open(mode='rb')
                local_file_path = '/tmp/image.png'
                with open(local_file_path, 'wb') as local_file:
                    local_file.write(image_file.read())

                logger.warning('Reading local image file')

                image = cv2.imread(local_file_path)
                logger.warning('Setting the predictor for the file')
                predictor.set_image(image)
                logger.warning('Creating the embedding')
                image_embedding = predictor.get_image_embedding().cpu().numpy()
                logger.warning('Saving the npy')

                # Assuming you want to save the numpy array to the image_embedding
                np.save('sampleImage.npy', image_embedding)

                with open('sampleImage.npy', 'rb') as f:
                    embedding_data = f.read()

                    # Step 2: Set the image data to image_embedding file
                    site_image.image_embedding.save(
                        os.path.basename('sampleImage.npy'), ContentFile(embedding_data)
                    )

                    # Step 3: Save the SiteImage instance
                    site_image.save()

                # Step 4: Clean up local files
                os.remove(local_file_path)
                os.remove('sampleImage.npy')

            except Exception as e:
                # Handle exceptions (e.g., logging, showing error messages)
                print(f'Error processing image {site_image.id}: {e}')
