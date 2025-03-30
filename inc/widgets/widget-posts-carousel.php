<?php
if (!class_exists('CoverNews_Posts_Carousel')) :
  /**
   * Adds CoverNews_Posts_Carousel widget.
   */
  class CoverNews_Posts_Carousel extends AFthemes_Widget_Base
  {
    /**
     * Sets up a new widget instance.
     *
     * @since 1.0.0
     */
    function __construct()
    {
      $this->text_fields = array('covernews-posts-slider-title');
      $this->select_fields = array('covernews-select-category');

      $widget_ops = array(
        'classname' => 'covernews_posts_carousel_widget grid-layout',
        'description' => __('Displays posts carousel from selected category.', 'covernews'),
        'customize_selective_refresh' => false,
      );

      parent::__construct('covernews_posts_carousel', __('CoverNews Posts Carousel', 'covernews'), $widget_ops);
    }

    /**
     * Front-end display of widget.
     *
     * @see WP_Widget::widget()
     *
     * @param array $args Widget arguments.
     * @param array $instance Saved values from database.
     */

    public function widget($args, $instance)
    {
      $instance = parent::covernews_sanitize_data($instance, $instance);
      /** This filter is documented in wp-includes/default-widgets.php */
      $min = defined('SCRIPT_DEBUG') && SCRIPT_DEBUG ? '' : '.min';
      wp_enqueue_style('slick', get_template_directory_uri() . '/assets/slick/css/slick.css');
      wp_enqueue_script('slick', get_template_directory_uri() . '/assets/slick/js/slick' . $min . '.js', array('jquery'), '', true);

      $title = apply_filters('widget_title', $instance['covernews-posts-slider-title'], $instance, $this->id_base);

      $category = !empty($instance['covernews-select-category']) ? $instance['covernews-select-category'] : '0';
      $number_of_posts = 5;

      // open the widget container
      echo $args['before_widget'];
?>
      <?php if (!empty($title)): ?>
        <div class="em-title-subtitle-wrap">
          <?php if (!empty($title)): covernews_render_section_title($title); endif; ?>
        </div>
      <?php endif; ?>
      <?php
      $all_posts = covernews_get_posts($number_of_posts, $category);
      ?>
      <div class="posts-carousel row">
        <?php
        if ($all_posts->have_posts()) :
          while ($all_posts->have_posts()) : $all_posts->the_post();
            $thumbnail_size = 'medium';
            global $post;
            $covernews_post_id = $post->ID;
        ?>
            <div class="slick-item">
              <figure class="carousel-image col-sm-12">
                <div class="spotlight-post" data-mh="carousal-height">
                  <figure class="featured-article  inside-img">
                    <div class="featured-article-wrapper">
                      <div class="data-bg-hover data-bg-featured read-bg-img">
                        <a href="<?php the_permalink(); ?>"
                          aria-label="<?php echo esc_attr(get_the_title($covernews_post_id)); ?>">
                          <?php covernews_the_post_thumbnail($thumbnail_size, $covernews_post_id);
                          ?>
                        </a>

                      </div>
                    </div>
                    <?php echo covernews_post_format($post->ID); ?>
                    <div class="figure-categories figure-categories-bg">

                      <?php covernews_post_categories('/'); ?>
                    </div>
                  </figure>

                  <figcaption>

                    <div class="title-heading">
                      <h3 class="article-title article-title-1">
                        <a href="<?php the_permalink(); ?>">
                          <?php the_title(); ?>
                        </a>
                      </h3>
                    </div>
                    <div class="grid-item-metadata">
                      <?php covernews_post_item_meta(); ?>
                    </div>
                  </figcaption>
                </div>
              </figure>
            </div>
        <?php
          endwhile;
        endif;
        wp_reset_postdata();
        ?>
      </div>

<?php
      //print_pre($all_posts);

      // close the widget container
      echo $args['after_widget'];
    }

    /**
     * Back-end widget form.
     *
     * @see WP_Widget::form()
     *
     * @param array $instance Previously saved values from database.
     */
    public function form($instance)
    {
      $this->form_instance = $instance;
      $categories = covernews_get_terms();
      if (isset($categories) && !empty($categories)) {
        // generate the text input for the title of the widget. Note that the first parameter matches text_fields array entry
        echo parent::covernews_generate_text_input('covernews-posts-slider-title', 'Title', 'Posts Carousel');
        echo parent::covernews_generate_select_options('covernews-select-category', __('Select category', 'covernews'), $categories);
      }
    }
  }
endif;
