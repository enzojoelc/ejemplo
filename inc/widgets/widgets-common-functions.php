<?php

/**
 * Returns posts.
 *
 * @since CoverNews 1.0.0
 */
if (!function_exists('covernews_get_posts')) :
  function covernews_get_posts($number_of_posts, $category = '0')
  {

    $ins_args = array(
      'post_type' => 'post',
      'posts_per_page' => absint($number_of_posts),
      'post_status' => 'publish',
      'orderby' => 'date',
      'order' => 'DESC',
      'ignore_sticky_posts' => 1
    );


    if (absint($category) > 0) {
      $ins_args['cat'] = absint($category);
    }

    $all_posts = new WP_Query($ins_args);
    return $all_posts;
  }

endif;


/**
 * Returns all categories.
 *
 * @since CoverNews 1.0.0
 */
if (!function_exists('covernews_get_terms')) :    function covernews_get_terms($category_id = 0, $taxonomy = 'category', $default = '')
  {
    $taxonomy = !empty($taxonomy) ? $taxonomy : 'category';

    if ($category_id > 0) {
      $term = get_term_by('id', absint($category_id), $taxonomy);
      if ($term)
        return esc_html($term->name);
    } else {
      $terms = get_terms(array(
        'taxonomy' => $taxonomy,
        'orderby' => 'name',
        'order' => 'ASC',
        'hide_empty' => true,
      ));


      if (isset($terms) && !empty($terms)) {
        foreach ($terms as $term) {
          if ($default != 'first') {
            $array['0'] = __('Select Category', 'covernews');
          }
          $array[$term->term_id] = esc_html($term->name);
        }

        return $array;
      }
    }
  }
endif;

/**
 * Returns all categories.
 *
 * @since CoverNews 1.0.0
 */
if (!function_exists('covernews_get_terms_link')) :    function covernews_get_terms_link($category_id = 0)
  {

    if (absint($category_id) > 0) {
      return get_term_link(absint($category_id), 'category');
    } else {
      return get_post_type_archive_link('post');
    }
  }
endif;


/**
 * Returns word count of the sentences.
 *
 * @since CoverNews 1.0.0
 */
if (!function_exists('covernews_get_excerpt')) :
  function covernews_get_excerpt($length = 25, $covernews_content = null, $post_id = 1)
  {
    $archive_content_view = covernews_get_option('archive_content_view');

    if ($archive_content_view == 'archive-content-none') {
      return;
    }

    $covernews_excerpt = '';
    $covernews_read_more = '';
    $widget_excerpt = covernews_get_option('global_widget_excerpt_setting');
    $covernews_global_read_more_texts = covernews_get_option('global_read_more_texts');

    if (!empty($covernews_global_read_more_texts)) {
      $post_title = get_the_title($post_id);

      $covernews_read_more = sprintf(
        '<div class="aft-readmore-wrapper">
              <a href="%1$s" class="aft-readmore" aria-label="%2$s">%3$s<span class="screen-reader-text">%4$s</span></a>
          </div>',
        esc_url(get_permalink($post_id)),  // %1$s: Link to the post
        esc_attr(sprintf(__('Read more about %s', 'covernews'), $post_title)), // %2$s: Aria-label
        esc_html($covernews_global_read_more_texts), // %3$s: "Read More" text
        esc_html(sprintf(__('Read more about %s', 'covernews'), $post_title)) // %4$s: Screen-reader text, translation-ready.
      );

      $covernews_read_more; // Output without filters
    }

    if ($archive_content_view == 'archive-content-excerpt') {

      if ($widget_excerpt == 'default-excerpt') {
        $trimmed_content = get_the_excerpt($post_id);
      } else {
        $length = absint($length);
        $source_content = preg_replace('`\[[^\]]*\]`', '', $covernews_content);
        $trimmed_content = wp_trim_words($source_content, $length, '...');
      }

      if (isset($trimmed_content) && !empty($trimmed_content)) {
        $covernews_excerpt = $trimmed_content . $covernews_read_more;
      }
    } else {
      $covernews_excerpt = get_the_content();
    }

    return $covernews_excerpt;
  }
endif;

/**
 * Returns no image url.
 *
 * @since CoverNews 1.0.0
 */
if (!function_exists('covernews_no_image_url')) :
  function covernews_no_image_url()
  {
    $url = get_template_directory_uri() . '/assets/images/no-image.png';
    return $url;
  }

endif;

/**
 * Returns no image url.
 *
 * @since CoverNews 1.0.0
 */
if (!function_exists('covernews_post_format')) :
  function covernews_post_format($post_id)
  {
    $post_format = get_post_format($post_id);
    switch ($post_format) {
      case "image":
        echo "<div class='covernews-post-format'><i class='fas fa-camera'></i></div>";
        break;
      case "video":
        echo "<div class='covernews-post-format'><i class='fas fa-video'></i></div>";

        break;
      case "gallery":
        echo "<div class='covernews-post-format'><i class='fas fa-images'></i></div>";
        break;
      default:
        echo "";
    }
  }

endif;



/**
 * Outputs the tab posts
 *
 * @since 1.0.0
 *
 * @param array $args  Post Arguments.
 */
if (!function_exists('covernews_render_posts')) :
  function covernews_render_posts($type, $show_excerpt, $excerpt_length, $number_of_posts, $category = '0')
  {

    $args = array();

    switch ($type) {
      case 'popular':
        $args = array(
          'post_type' => 'post',
          'post_status' => 'publish',
          'posts_per_page' => absint($number_of_posts),
          'orderby' => 'comment_count',
          'ignore_sticky_posts' => true
        );
        break;

      case 'recent':
        $args = array(
          'post_type' => 'post',
          'post_status' => 'publish',
          'posts_per_page' => absint($number_of_posts),
          'orderby' => 'date',
          'ignore_sticky_posts' => true
        );
        break;

      case 'categorised':
        $args = array(
          'post_type' => 'post',
          'post_status' => 'publish',
          'posts_per_page' => absint($number_of_posts),
          'orderby' => 'date',
          'ignore_sticky_posts' => true
        );
        $category = isset($category) ? $category : '0';
        if (absint($category) > 0) {
          $args['cat'] = absint($category);
        }
        break;


      default:
        break;
    }

    if (!empty($args) && is_array($args)) {
      $all_posts = new WP_Query($args);
      if ($all_posts->have_posts()) :
        echo '<ul class="article-item article-list-item article-tabbed-list article-item-left">';
        while ($all_posts->have_posts()) :
          $all_posts->the_post();

?>
          <li class="full-item clearfix">
            <div class="base-border">
              <div class="row-sm align-items-center">
                <?php
                $url = '';
                $col_class = 'col-sm-12';
                if (has_post_thumbnail()) {
                  $thumb = wp_get_attachment_image_src(get_post_thumbnail_id(get_the_ID()));
                  if (isset($thumb['0'])) {
                    $url = $thumb['0'];
                    $col_class = 'col-sm-8';
                  }
                }
                global $post;


                $thumbnail_size = 'thumbnail';
                $covernews_post_id = $post->ID;
                ?>

                <div class="col-sm-4 col-image">

                  <div class="tab-article-image">
                    <a href="<?php the_permalink(); ?>" class="post-thumb" aria-label="<?php echo esc_attr(get_the_title($covernews_post_id)); ?>">
                      <?php covernews_the_post_thumbnail($thumbnail_size, $covernews_post_id); ?>
                    </a>
                  </div>
                  <?php echo covernews_post_format($post->ID); ?>

                </div>

                <div class="full-item-details col-details col-sm-8">
                  <div class="prime-row">
                    <div class="full-item-metadata primary-font">
                      <div class="figure-categories figure-categories-bg">

                        <?php covernews_post_categories('/'); ?>
                      </div>
                    </div>
                    <div class="full-item-content">
                      <h3 class="article-title article-title-1">
                        <a href="<?php the_permalink(); ?>">
                          <?php the_title(); ?>
                        </a>
                      </h3>
                      <div class="grid-item-metadata">
                        <?php echo ''; ?>
                        <?php covernews_post_item_meta(); ?>

                      </div>
                      <?php if ($show_excerpt != 'false') : ?>
                        <div class="full-item-discription">
                          <div class="post-description">
                            <?php if (absint($excerpt_length) > 0) : ?>
                              <?php
                              $excerpt = covernews_get_excerpt($excerpt_length, get_the_content());
                              echo wp_kses_post(wpautop($excerpt));
                              ?>
                            <?php
                            endif; ?>
                          </div>
                        </div>
                      <?php
                      endif; ?>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
    <?php
        endwhile;
        wp_reset_postdata();
        echo '</ul>';
      endif;
    }
  }
endif;


if (!function_exists('covernews_render_section_title')) :
  function covernews_render_section_title($section_title, $color_class = '')
  { ?>
    <h2 class="widget-title header-after1">
      <span class="header-after <?php echo esc_attr($color_class); ?>">
        <?php //echo esc_html($section_title);  
        ?>
        <?php echo apply_filters('the_title', $section_title); ?>
      </span>
    </h2>
<?php
  }
endif;

function covernews_render_tabbed_container($tabs, $tab_id = 'default-tab', $show_excerpt = false, $excerpt_length = 0, $number_of_posts = 5, $is_recent_active = true) {
  ?>
  <div class="tabbed-container">
      <div class="tabbed-head">
          <ul class="nav nav-tabs af-tabs tab-warpper" role="tablist">
              <?php foreach ($tabs as $tab_key => $tab_data): 
                  $is_active = $is_recent_active && $tab_key === 'recent';
              ?>
                  <li class="tab tab-<?php echo esc_attr($tab_key); ?>" role="presentation">
                      <a href="#<?php echo esc_attr($tab_id . '-' . $tab_key); ?>"
                          aria-label="<?php echo esc_attr($tab_key); ?>"
                          role="tab"
                          id="<?php echo esc_attr($tab_id . '-' . $tab_key . '-tab'); ?>"
                          aria-controls="<?php echo esc_attr($tab_id . '-' . $tab_key); ?>"
                          aria-selected="<?php echo $is_active ? 'true' : 'false'; ?>"
                          data-toggle="tab"
                          class="font-family-1 widget-title <?php echo $is_active ? 'active' : ''; ?>">
                          <?php echo esc_html($tab_data['title']); ?>
                      </a>
                  </li>
              <?php endforeach; ?>
          </ul>
      </div>
      <div class="tab-content">
          <?php foreach ($tabs as $tab_key => $tab_data): 
              $is_active = $is_recent_active && $tab_key === 'recent';
          ?>
              <div id="<?php echo esc_attr($tab_id . '-' . $tab_key); ?>"
                  role="tabpanel"
                  aria-labelledby="<?php echo esc_attr($tab_id . '-' . $tab_key . '-tab'); ?>"
                  aria-hidden="<?php echo $is_active ? 'false' : 'true'; ?>"
                  class="tab-pane <?php echo $is_active ? 'active' : ''; ?>">
                  <?php
                  covernews_render_posts(
                      $tab_key,
                      $show_excerpt,
                      $excerpt_length,
                      $number_of_posts,
                      isset($tab_data['category']) ? $tab_data['category'] : null
                  );
                  ?>
              </div>
          <?php endforeach; ?>
      </div>
  </div>
  <?php
}

