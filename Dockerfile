FROM php:8.3-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libpq-dev \
    gnupg

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql pdo_pgsql pgsql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Set working directory
WORKDIR /var/www

# Copy application files
COPY . /var/www

# Set write permissions on cache/storage
RUN mkdir -p /var/www/bootstrap/cache /var/www/storage/framework/views \
    && chmod -R 777 /var/www/bootstrap/cache /var/www/storage

# Install Composer dependencies
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Install NPM dependencies & build assets
RUN npm install && npm run build

# Expose port 8000
EXPOSE 8000

# Run migrations, seed tables, and run php artisan serve on boot
CMD php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=8000
