<?php

$url = "http://mydealerreport.com/fullReport.php?DealerID=6841";

$info = parse_url ( $url );

parse_str ( $info ['query'], $info );
$job_id = $info ['DealerID'];

$html = fetch_html ( $url );

$rating = $html->find ( '.showRating', 0 )->innertext;

preg_match ( '/(?P<rating>[\d.]+)/', $rating, $matches );

$response = array ( 
	
		'rating' => $matches ['rating'] 
);

$reviews = $html->find ( '.tableFullReportComplete .cellJustify' );

foreach ( $reviews as $review ) {
	$entry = array ();
	$entry ['comment'] = $review->find ( '.datafullreport', 0 )->innertext;
}