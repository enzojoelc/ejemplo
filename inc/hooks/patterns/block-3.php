<?php
/**
 * CoverNewws and Blockspare content pattern.
 *
 * @package CoverNews
 */

return array(
	'title'      => __( 'Featured News', 'covernews' ),
    'categories' => array( 'covernews' ),
	'content'    => '<!-- wp:group {"align":"full","className":"row","layout":{"type":"constrained"}} -->
    <div class="wp-block-group alignfull row">
    
    <!-- wp:group {"align":"full","layout":{"type":"constrained"}} -->
    <div class="wp-block-group alignfull"><!-- wp:heading {"align":"full"} -->
    <h2 class="wp-block-heading alignfull">' . esc_html__( 'Featured News', 'covernews' ) . '</h2>
    <!-- /wp:heading -->
    
    <!-- wp:blockspare/blockspare-latest-posts-grid {"categories":[],"taxType":"","uniqueClass":"blockspare-84a98b29-8639-4","linkColor":"#505050","columns":4,"align":"full","imageSize":"medium","marginTop":0,"marginBottom":28,"backGroundColor":"#ffffff","categoryBorderRadius":1,"titleOnHoverColor":"#404040","animation":"AFTfadeInDown","gutterSpace":15} /--></div>
    <!-- /wp:group -->    
    </div>
    <!-- /wp:group -->',
	
);
