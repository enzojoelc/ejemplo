<?php
/**
 * Template Name: Blank Canvas
 *
 * A completely blank canvas template for use with page builders like Gutenberg Block Editor, Elementor or WPBakery.
 */

if (!defined('ABSPATH')) {
	exit; // Exit if accessed directly.
}
?>
<!DOCTYPE html>
    <html <?php language_attributes(); ?>>

    <head>
        <meta charset="<?php bloginfo('charset'); ?>">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <?php if (!current_theme_supports('title-tag')) : ?>
            <title><?php echo wp_get_document_title(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped 
                    ?></title>
        <?php
        endif; ?>
        <?php wp_head(); ?>

    </head>

<body <?php body_class('aft-pagebuilder-blank-canvas'); ?>>

<div class="aft-pagebuilder-page-section">
	<?php
	// Output the page builder content
	if ( have_posts() ) :
		while ( have_posts() ) :
			the_post();
			the_content();
		endwhile;
	endif;
	?>
</div>

<?php wp_footer(); ?>
</body>
</html>