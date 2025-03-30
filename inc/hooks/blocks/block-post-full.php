<?php

/**
 * Full block part for displaying page content in page.php
 *
 * @package CoverNews
 */
?>
<?php
$thumbnail_size = 'large';
$excerpt_length = 20;
$covernews_post_id = get_the_ID();

$covernews_post_thumbnail = covernews_the_post_thumbnail($thumbnail_size, $covernews_post_id, true);
$covernews_no_thumbnail_class = "has-post-image";
if (!isset($covernews_post_thumbnail) && empty($covernews_post_thumbnail)) {
    $covernews_no_thumbnail_class = "no-post-image";
}

?>
<div class="entry-header-image-wrap <?php echo esc_attr($covernews_no_thumbnail_class); ?>">
    <header class="entry-header">
        <div class="post-thumbnail">
            <a href="<?php the_permalink(); ?>">
                <?php if (!empty($covernews_post_thumbnail)) {
                    echo ($covernews_post_thumbnail);
                }  ?>
            </a>

        </div>
        <div class="header-details-wrapper">
            <div class="entry-header-details">
                <?php if ('post' === get_post_type()) : ?>
                    <div class="figure-categories figure-categories-bg">
                        <?php echo covernews_post_format($covernews_post_id); ?>
                        <?php covernews_post_categories(); ?>
                    </div>
                <?php endif; ?>

                <?php the_title('<h2 class="entry-title"><a href="' . esc_url(get_permalink()) . '" rel="bookmark">', '</a>
                    </h2>'); ?>
                <?php if ('post' === get_post_type()) : ?>
                    <div class="post-item-metadata entry-meta">
                        <?php covernews_post_item_meta(); ?>
                    </div>
                <?php endif; ?>

                <?php
                $archive_content_view = covernews_get_option('archive_content_view');
                if ($archive_content_view != 'archive-content-none') :
                ?>

                    <div class="post-excerpt">
                        <?php
                        $excerpt = covernews_get_excerpt($excerpt_length, get_the_content(), $covernews_post_id);
                        if (!empty($excerpt)) {
                            echo wp_kses_post(wpautop($excerpt));
                        }
                        ?>
                    </div>
                <?php endif; ?>


            </div>
        </div>
    </header>
</div>