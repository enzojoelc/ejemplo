<?php

/**
 * List block part for displaying page content in page.php
 *
 * @package CoverNews
 */


global $post;
$covernews_post_id = get_the_ID();
$thumbnail_size = 'medium';
$excerpt_length = 20;

$covernews_post_thumbnail = covernews_the_post_thumbnail($thumbnail_size, $covernews_post_id, true);
$covernews_no_thumbnail_class = "has-post-image";
if (!isset($covernews_post_thumbnail) && empty($covernews_post_thumbnail)) {
  $covernews_no_thumbnail_class = "no-post-image";
}

?>

<div class="align-items-center <?php echo esc_attr($covernews_no_thumbnail_class); ?>">
  <div class="spotlight-post">
    <figure class="categorised-article inside-img">
      <div class="categorised-article-wrapper">
        <div class="data-bg-hover data-bg-categorised read-bg-img">
          <a href="<?php the_permalink(); ?>"
            aria-label="<?php echo esc_attr(get_the_title($covernews_post_id)); ?>">
            <?php if (!empty($covernews_post_thumbnail)) {
              echo ($covernews_post_thumbnail);
            }  ?>
          </a>
        </div>
        <?php echo covernews_post_format($covernews_post_id); ?>
        <div class="figure-categories figure-categories-bg">
          <?php covernews_post_categories(); ?>
        </div>
      </div>

    </figure>
    <figcaption>

      <h3 class="article-title article-title-1">
        <a href="<?php the_permalink(); ?>">
          <?php the_title(); ?>
        </a>
      </h3>
      <div class="grid-item-metadata">
        <?php covernews_post_item_meta(); ?>
      </div>
      <?php
      $archive_content_view = covernews_get_option('archive_content_view');
      if ($archive_content_view != 'archive-content-none') :
      ?>
        <div class="full-item-discription">
          <div class="post-description">
            <?php


            $excerpt = covernews_get_excerpt($excerpt_length, get_the_content(), $covernews_post_id);
            if (!empty($excerpt)) {
              echo wp_kses_post(wpautop($excerpt));
            }
            ?>

          </div>
        </div>
      <?php endif; ?>
    </figcaption>
  </div>
  <?php
  wp_link_pages(array(
    'before' => '<div class="page-links">' . esc_html__('Pages:', 'covernews'),
    'after' => '</div>',
  ));
  ?>
</div>