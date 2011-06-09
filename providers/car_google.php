<?php
include ('includes.php');
$url = "http://maps.google.com/maps/place?hl=en&bav=on.1,or.&um=1&ie=UTF-8&q=best+chevrolet+kenner+louisiana&fb=1&gl=us&hq=best+chevrolet&hnear=Kenner,+LA&cid=7512427536523652810&dtab=2&ei=-XlcTZeWM4L2gAeEtrW7DA&sa=X&oi=local_result&ct=result&resnum=2&ved=0CB0QqgUwAQ";

$html = fetch_html ( $url );

$response = array ( 
	
		'rating' => $html->find ( '.pp-num-best-ever span', 0 )->innertext, 
		'reviews' => array ( 
			
				'count' => 0, 
				'entries' => array () 
		) 
);

//$reviews = $html->find ( '#pp-reviews-headline .rsw-pp-link span', 0 )->innertext;

//preg_match ( '/(?P<reviews>[\d]+/', $reviews, $matches );

$review_body = $html->find ( '#pp-reviews .pp-story-body',0 );

$reviews = $review_body->find ( '.pp-story-item' );
foreach ( $reviews as $review ) {
	// TODO : normalize date value
	
	$entry = array ( 
		
			'date' => $review->find ( '.date', 1 )->innertext, 
			'review' => count ( $review->find ( '.rsw-starred' ) ) 
	);
	// google breaks up comments into title and snippet sections
	$comment = $review->find ( '.title', 0 )->innertext;
	$comment .= $review->find ( '.snippet', 0 )->innertext;
	
	$entry ['comment'] = strip_tags ( $comment );
	array_push ( $response ['reviews'] ['entries'],$entry );
	//TODO :retrive more comments from google
}
echo "<pre>";
print_r($response);
echo "</pre>";
	