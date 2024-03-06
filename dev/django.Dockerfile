# Stage 1: Base image for installing system libraries
FROM python:3.10-slim AS base

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system libraries for Python packages
# hadolint ignore=DL3008
RUN set -ex \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        gcc \
        libc6-dev \
        libgdal32 \
        libpq-dev \
        libsndfile1-dev \
        wget \
        # opencv dependencies
        ffmpeg \
        libsm6 \
        libxext6 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Copy setup.py for dependency installation
FROM base AS dependencies

COPY ./setup.py /opt/django-project/setup.py
WORKDIR /opt/django-project

# Stage 3: Download large file and cache it
FROM dependencies AS download

RUN set -ex \
    && mkdir -p /data/SAM \
    && wget --progress=dot:gig -P /data/SAM https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth

# Stage 4: Install Python dependencies
FROM download AS install

RUN set -ex \
    && pip install --no-cache-dir -e .[dev]

# Final stage: Use the installed dependencies
FROM install AS final
