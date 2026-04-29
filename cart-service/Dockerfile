# syntax=docker/dockerfile:1.7
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Create and use venv
RUN python -m venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# Copy requirements first for layer cache
COPY requirements.txt .

# Cache pip deps
RUN --mount=type=cache,id=pip,target=/root/.cache/pip \
    pip install -r requirements.txt

COPY . .

EXPOSE 8000

# Run migrations then start server
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py runserver 0.0.0.0:8000"]
