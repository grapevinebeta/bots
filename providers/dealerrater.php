<?php
include ('includes.php');
define ( 'DOMAIN', 'http://www.dealerrater.com' );

$url = "http://www.dealerrater.com/dealer/Best-Chevrolet-review-1698/";

preg_match ( '/review-([0-9]+)/', $url, $matches );

// retrive job_id 
$job_id = $matches [0];

$response = array ( 
	
		'rating' => 0, 
		'reviews' => array ( 
			
				'count' => 0, 
				'entries' => array () 
		) 
);
$html = fetch_html ( $url );
$response ['rating'] = $html->find ( 'span.average', 0 )->innertext;
$response ['reviews'] ['count'] = $html->find ( 'span.count', 0 )->innertext;
function inner(&$ref, $sel, $i = 0) {
	return $ref->find ( $sel, $i )->innertext;
}
function condense($str) {
	return strtolower ( trim ( str_replace ( '_', '', $str ) ) );
}
// retrive views


$reviews = $html->find ( '.hreview' );
foreach ( $reviews as $review ) {
	$entry = array ();
	$entry ['date'] = $review->find ( 'span.value-title', 0 )->title;
	$entry ['comment'] = inner ( $review, 'span.description' );
	$entry ['scores'] = array ();
	
	$scores = $review->find ( '.userReviewTopRight span', 0 );
	$review_id = $scores->id;
	preg_match ( "/ratings(?P<id>[0-9]+)',\s(?P<customer_service>[0-9]+),\s(?P<quality_of_work>[0-9]+),\s(?P<friendless>[0-9]+),\s(?P<overall_experience>[0-9]+),\s(?P<price>[0-9]+)/", $scores->innertext, $matches );
	foreach ( $matches as $key => $value ) {
		if (is_int ( $key ))
			continue;
		$entry ['scores'] [$key] = $value;
	}
	preg_match ( '/rating-(?P<rating>[0-9]+).png/', $scores->innertext, $matches );
	$entry ['scores'] ['overrall_score'] = $matches ['rating'];
	
	array_push ( $response ['reviews'] ['entries'], $entry );

}
echo "<pre>";
print_r ( $response );
echo "</pre>";