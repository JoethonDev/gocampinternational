FROM php:8.4-apache

# Preserve the site's existing .htaccess routes and deny directory indexing.
RUN a2enmod rewrite headers \
    && printf '<Directory /var/www/html>\n  AllowOverride All\n  Options -Indexes\n  Require all granted\n</Directory>\n' > /etc/apache2/conf-available/gocamp.conf \
    && a2enconf gocamp

WORKDIR /var/www/html
COPY . /var/www/html/

# Allow PHP to write session-related/application files when needed.
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
CMD ["apache2-foreground"]
