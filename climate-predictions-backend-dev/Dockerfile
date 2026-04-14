FROM python:3.10-slim

WORKDIR /app

# Install system dependencies including Cartopy requirements
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    libproj-dev \
    proj-data \
    proj-bin \
    libgeos-dev \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the script first and set permissions
COPY run_scripts.sh .
RUN chmod +x run_scripts.sh && \
    dos2unix run_scripts.sh

# Copy the rest of the application
COPY . .
COPY .env .env

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]