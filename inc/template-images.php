<?php

/**
 * Custom template images for this theme
 *
 * Handles post thumbnails with optimized alt text for SEO and accessibility.
 *
 * @package CoverNews
 */

if (!function_exists('covernews_post_thumbnail')) :
    /**
     * Displays an optional post thumbnail.
     * For single views, the image is wrapped in a div, while in index views it is wrapped in an anchor.
     */
    function covernews_post_thumbnail()
    {
        if (post_password_required() || is_attachment() || !has_post_thumbnail()) {
            return;
        }

        global $post;

        if (is_singular()) :
            $theme_class = covernews_get_option('global_image_alignment');
            $post_image_alignment = get_post_meta($post->ID, 'covernews-meta-image-options', true);
            $post_class = !empty($post_image_alignment) ? $post_image_alignment : $theme_class;

            if ($post_class != 'no-image') :
?>
                <div class="post-thumbnail <?php echo esc_attr($post_class); ?>">
                    <?php echo covernews_the_post_thumbnail('covernews-featured', $post->ID); ?>
                </div>
            <?php endif; ?>

        <?php else :
            $archive_layout = covernews_get_option('archive_layout');
            $archive_image = ($archive_layout == 'archive-layout-list') ? 'medium' : (($archive_layout == 'archive-layout-full') ? 'covernews-medium' : 'post-thumbnail');
            $archive_class = ($archive_layout == 'archive-layout-list') ? covernews_get_option('archive_image_alignment') : '';

        ?>
            <div class="post-thumbnail <?php echo esc_attr($archive_class); ?>">
                <a href="<?php the_permalink(); ?>" aria-hidden="true">
                    <?php echo covernews_the_post_thumbnail($archive_image, $post->ID); ?>
                </a>
            </div>
            <?php endif;
    }
endif;

if (!function_exists('covernews_the_post_thumbnail')) :
    /**
     * Fetches post thumbnail or first image from post content.
     *
     * @param string $thumbnail_size The thumbnail size.
     * @param int    $post_id The post ID.
     * @param bool   $return Whether to return the image HTML or echo it.
     * @return string|void Image HTML if $return is true.
     */
    function covernews_the_post_thumbnail($thumbnail_size, $post_id, $return = false)
    {

        $fetch_content_image = covernews_get_option('global_fetch_content_image_setting');
        if ($fetch_content_image == 'enable') {
            if (has_post_thumbnail($post_id)) {
                if ($return) {
                    return get_the_post_thumbnail($post_id, $thumbnail_size);
                } else {
                    the_post_thumbnail($thumbnail_size);
                }
            } else {
                // Fallback to first image in content if no thumbnail is set
                // $post_content = get_post_field('post_content', $post_id);
                // $output = preg_match_all('/<img.+src=[\'"]([^\'"]+)[\'"].*>/i', $post_content, $matches);

                $post_content = substr(get_post_field('post_content', $post_id), 0, 3000);
                $output = preg_match_all('/<img.+src=[\'"]([^\'"]+)[\'"].*>/i', $post_content, $matches);
        

                if (isset($matches[1][0])) {

                    $img_id = covernews_find_post_id_from_path($matches[1][0]);
                    $img_url = wp_get_attachment_image_src($img_id, $thumbnail_size);

                    if (isset($img_url[0])) {
                        if ($return) {
                            return wp_get_attachment_image($img_id, $thumbnail_size);
                        } else {
                            echo wp_kses_post(wp_get_attachment_image($img_id, $thumbnail_size));
                        }
                    } else {
                        // Check if external image URL is valid and display it
                        if (@getimagesize($matches[1][0])) {
                            if ($return) {
                                ob_start();
            ?>
                                <img src="<?php echo esc_url($matches[1][0]); ?>" alt="<?php echo esc_attr(basename($matches[1][0])); ?>" />
                            <?php
                                $img_html = ob_get_contents();
                                ob_end_clean();
                                return $img_html;
                            } else {
                            ?>
                                <img src="<?php echo esc_url($matches[1][0]); ?>" alt="<?php echo esc_attr(basename($matches[1][0])); ?>" />
<?php
                            }
                        }
                    }
                }
            }
        } else {
            if ($return) {
                return get_the_post_thumbnail($post_id, $thumbnail_size);
            } else {
                the_post_thumbnail($thumbnail_size);
            }
        }
    }
endif;

if (!function_exists('covernews_find_post_id_from_path')) :
    /**
     * Find the post ID for a file PATH or URL
     *
     * @param string $path The file path or URL.
     * @return int The post ID.
     */
    function covernews_find_post_id_from_path($path)
    {
        // Strip size info from image URL if it exists (e.g., -300x300.jpg)
        if (preg_match('/(-\d{1,4}x\d{1,4})\.(jpg|jpeg|png|gif|webp)$/i', $path, $matches)) {
            $path = str_ireplace($matches[1], '', $path);
        }

        // Ensure path includes only the relevant portion of the file URL
        if (preg_match('/uploads\/(\d{1,4}\/)?(\d{1,2}\/)?(.+)$/i', $path, $matches)) {
            unset($matches[0]);
            $path = implode('', $matches);
        }

        // Get post ID from URL
        return attachment_url_to_postid($path);
    }
endif;

/**
 * Optimized alt text function for images to enhance SEO and accessibility.
 *
 * @param array $attributes Image attributes.
 * @param WP_Post $attachment Attachment object.
 * @param string $size Size of the image.
 * @return array Updated image attributes.
 */
function covernews_alt_text_optimized($attributes, $attachment, $size)
{
    // Check if alt text is missing
    if (empty($attributes['alt'])) {
        // Use the attachment title as alt text if available
        if (!empty($attachment->post_title)) {
            $attributes['alt'] = esc_attr($attachment->post_title);
        } else {
            // Fallback to post title if in a singular post context
            $post_id = get_post();
            if ($post_id) {
                $attributes['alt'] = esc_attr(get_the_title($post_id->ID));
            } else {
                // Fallback to image filename if no other options available
                $attributes['alt'] = esc_attr(covernews_get_image_alt_from_filename($attachment->guid));
            }
        }
    }

    // Set 'loading' attribute for better performance
    $image_loading = covernews_get_option('global_toggle_image_lazy_load_setting');
    if ($image_loading == 'enable') {
        $attributes['loading'] = 'lazy';
    }

    // Set 'decoding' attribute to enhance rendering speed
    $image_decoding = covernews_get_option('global_decoding_image_async_setting');
    if ($image_decoding == 'enable') {
        $attributes['decoding'] = 'async';
    }

    return $attributes;
}
add_filter('wp_get_attachment_image_attributes', 'covernews_alt_text_optimized', 10, 3);

/**
 * Extract alt text from an image filename as a fallback.
 *
 * @param string $image_url The URL of the image.
 * @return string The sanitized filename without extension.
 */
function covernews_get_image_alt_from_filename($image_url)
{
    // Get the filename from the image URL and sanitize it for alt text usage.
    return esc_attr(pathinfo($image_url, PATHINFO_FILENAME));
}

function covernews_add_img_attributes($allowedtags)
{
    if (isset($allowedtags['img'])) {
        // Add additional attributes that plugins or core updates may introduce
        $allowedtags['img']['decoding'] = true;
        $allowedtags['img']['srcset'] = true;
        $allowedtags['img']['sizes'] = true;
        $allowedtags['img']['loading'] = true;
        $allowedtags['img']['data-*'] = true; // Support data-* attributes
        $allowedtags['img']['aria-*'] = true; // Support aria-* attributes for accessibility
        $allowedtags['img']['role'] = true;
        $allowedtags['img']['longdesc'] = true;
        $allowedtags['img']['usemap'] = true;
        $allowedtags['img']['referrerpolicy'] = true;
        $allowedtags['img']['style'] = true; // In case some plugins add inline styles
        $allowedtags['img']['crossorigin'] = true;
    }
    return $allowedtags;
}
add_filter('wp_kses_allowed_html', 'covernews_add_img_attributes');
