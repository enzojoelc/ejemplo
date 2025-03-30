<?php
/**
 * CoverNewws and Blockspare content pattern.
 *
 * @package CoverNews
 */

return array(
	'title'      => __( 'Three Columns Posts', 'covernews' ),
    'categories' => array( 'covernews' ),
	'content'    => '<!-- wp:group {"align":"full","className":"row","layout":{"type":"constrained"}} -->
    <div class="wp-block-group alignfull row"> 
    
    <!-- wp:group {"align":"full","layout":{"type":"constrained"}} -->
    <div class="wp-block-group alignfull"><!-- wp:heading {"align":"full"} -->
    <h2 class="wp-block-heading alignfull">' . esc_html__( 'Three Columns', 'covernews' ) . ' </h2>
    <!-- /wp:heading -->
    
    <!-- wp:blockspare/blockspare-latest-posts-list {"uniqueClass":"blockspare-b9cd4f9b-525d-4","postsToShow":9,"displayPostDate":false,"displayPostAuthor":false,"postTitleFontSize":14,"linkColor":"#505050","displayPostCategory":false,"columns":"list-col-3","align":"full","imageSize":"thumbnail","marginTop":20,"marginBottom":28,"backGroundColor":"#ffffff","contentPaddingTop":0,"contentPaddingBottom":0,"categoryBackgroundColor":"#003bb3","enableComment":false,"titleOnHoverColor":"#404040","animation":"AFTfadeInRight","ImageUnit":"75","gutterSpace":15} /--></div>
    <!-- /wp:group -->
    
    </div>
    <!-- /wp:group -->',
	
);
