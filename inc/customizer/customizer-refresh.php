<?php
// Frontpage

$wp_customize->selective_refresh->add_partial('show_date_section', array(
    'selector' => 'span.topbar-date',     
));

$wp_customize->selective_refresh->add_partial('banner_advertisement_section', array(
    'selector' => 'div.promotion-section',     
));

$wp_customize->selective_refresh->add_partial('show_flash_news_section', array(
    'selector' => 'div.banner-exclusive-posts-wrapper',     
));

$wp_customize->selective_refresh->add_partial('select_slider_news_category', array(
    'selector' => 'div.main-story-wrapper',     
));

$wp_customize->selective_refresh->add_partial('select_editors_picks_category', array(
    'selector' => 'div.af-main-banner-editors-picks',     
));

$wp_customize->selective_refresh->add_partial('select_trending_news_category', array(
    'selector' => 'div.af-main-banner div.trending-story',     
));

$wp_customize->selective_refresh->add_partial('show_featured_news_section', array(
    'selector' => 'div.af-main-banner-featured-posts',     
));

$wp_customize->selective_refresh->add_partial('archive_layout', array(
    'selector' => 'main.aft-archive-post',     
));

$wp_customize->selective_refresh->add_partial('frontpage_show_latest_posts', array(
    'selector' => 'div.af-main-banner-latest-posts div.widget-title-section',     
));

$wp_customize->selective_refresh->add_partial('footer_copyright_text', array(
    'selector' => 'div.site-info',     
));

$wp_customize->selective_refresh->add_partial('enable_breadcrumb', array(
    'selector' => 'div.em-breadcrumbs',     
));

$wp_customize->selective_refresh->add_partial('single_show_featured_image', array(
    'selector' => 'article.af-single-article',     
));

$wp_customize->selective_refresh->add_partial('single_show_related_posts', array(
    'selector' => 'div.em-reated-posts',     
));

