<?php
/**
 * Register patterns
 *
 * @package CoverNews
 */

 

function covernews_register_patterns_categories(){
    register_block_pattern_category(
        'covernews',
        array( 'label' => __( 'CoverNews', 'covernews' ) )
    );
}

add_action( 'init', 'covernews_register_patterns_categories' );

function covernews_register_patterns() {

    if ( ! function_exists( 'register_block_pattern' ) ) {
        return;
    }

    $patterns = [        
        'block-1',      
        'block-2',      
        'block-3',      
        'block-4',      
        'block-5',      
        'section-1',      
        'section-2',      
        'section-3',      
        'section-4', 
        'full',     
             
    ];

    foreach ( $patterns as $pattern ) {
        register_block_pattern(
            'covernews/' . $pattern,
            require __DIR__ . '/patterns/' . $pattern . '.php'
        );
    }
}

add_action( 'init', 'covernews_register_patterns' );