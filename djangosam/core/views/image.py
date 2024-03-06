import logging

from django.core.files.storage import default_storage
from django.http import HttpRequest
from ninja import File, Form, Schema
from ninja.files import UploadedFile
from ninja.pagination import RouterPaginated

from djangosam.core.models import Image
from djangosam.core.tasks import generate_image_embedding

logger = logging.getLogger(__name__)


router = RouterPaginated()


@router.get('/')
def get_images(request: HttpRequest):
    images = list(Image.objects.values())

    for image in images:
        image['presignedImage'] = default_storage.url(image['image'])
        if image.get('image_embedding', False):
            image['presignedImageEmbedding'] = default_storage.url(image['image_embedding'])

    # Return the serialized data
    return images


class ImageUploadSchema(Schema):
    name: str


@router.post('/')
def create_image(
    request: HttpRequest,
    image: File[UploadedFile],
    payload: Form[ImageUploadSchema],
):
    image_model = Image(
        name=payload.name,
        image=image,
        owner=request.user,
    )
    image_model.save()
    generate_image_embedding.delay(image_model.pk)
    return {'message': 'image uploaded sucesffully', 'id': image_model.pk}


@router.delete('/{id}')
def delete_image(
    request,
    id: int,
):
    try:
        image = Image.objects.get(pk=id)

        if image.owner == request.user:
            # Delete the annotation
            image.delete()
            return {'message': 'Image deleted successfully'}
        else:
            return {'error': 'Permission denied. You do not own this Image'}

    except Image.DoesNotExist:
        return {'error': 'Image not found'}
