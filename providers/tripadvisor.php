<?php
include ('includes.php');
define ( 'DOMAIN', 'http://www.tripadvisor.com' );
define ( 'QUERY_ENDPOINT', 'http://www.tripadvisor.com/Search?q={query}&geo=&where=nav&returnTo=__2F__' );

if (isset ( $_POST ['location'] ) || isset ( $_POST ['hotel'] )) {
	if (isset ( $_POST ['location'] )) {
		$query = $_POST ['location'];
	}
	if (isset ( $_POST ['hotel'] )) {
		$query .= ' ' . $_POST ['hotel'];
	}
	$query = str_replace ( ' ', '+', trim ( $query ) );
	$url = str_replace ( '{query}', $query, QUERY_ENDPOINT );
	$html = file_get_html ( $url );
	//$count = $html->find ( '.pgCount' );
	$entries = $html->find ( '.srLODGING' );
	
	$found = array ();
	foreach ( $entries as $entry ) {
		// TODO : add checking for / links and sub with domain being requested with parse_url
		$a = $entry->find ( '.srHead a', 0 );
		$type = $entry->find ( '.srSubHead', 0 );
		$found [] = array ( 
			
				'type' => $type->find ( '.srHitType', 0 )->innertext, 
				'title' => strip_tags ( $a->innertext ) . ' ' . trim ( preg_replace ( '/<[^>]+>.+<[^>]+>|\&ndash;/', '', $type->innertext ) ), 
				'link' => 'http://www.tripadvisor.com' . $a->href 
		);
	
	}
	// TODO check if $count matches the current count found if not fetch next page
	echo json_encode ( $found );
} else {
	
	if (isset ( $_POST ['url'] )) 

	{
		$url = $_POST ['url'];
	} else 

	{
		$url = 'http://www.tripadvisor.com/Hotel_Review-g60956-d570285-Reviews-Hotel_Contessa-San_Antonio_Texas.html';
	}
	$html = fetch_html ( $url );
	$popularity = $html->find ( '.popularity' );
	$response = array ( 
		
			'popularity' => array (), 
			'rating' => 'Unknown where to fetch from', 
			
			'reviews_counts' => array (), 
			'reviews' => array () 
	);
	
	foreach ( $popularity as $entry ) {
		if (strpos ( $entry->class, 'additional' ) !== FALSE) {
			// additional
			$score = trim ( str_replace ( '#', '', $entry->find ( "b", 0 )->innertext ) );
			$response ['popularity'] ['business'] = array ( 
				
					'score' => $score 
			);
		} else {
			// regular
			$score = trim ( str_replace ( '#', '', strip_tags ( $entry->find ( 'var', 0 )->innertext ) ) );
			preg_match ( '/of\s+([0-9]+)/', $entry->find ( 'span', 0 )->innertext, $matches );
			if (count ( $matches )) {
				$out_of = $matches [1];
			} else {
				$out_of = "Unkown";
			}
			$response ['popularity'] ['hotel'] = array ( 
				
					'score' => $score, 
					'out_of' => $out_of 
			);
		
		}
	
	}
	// Rating
	

	// Total Reviews
	

	$review_types = $html->find ( "#REVIEW_FILTER_FORM .filter" );
	
	foreach ( $review_types as $type ) {
		$value = strip_tags ( $type->innertext );
		preg_match ( '/([0-9]+)/', $value, $matches );
		$count = $matches [1];
		$value = str_replace ( ' ', '_', trim ( strtolower ( preg_replace ( '/reviews|\(\d+\)/', '', $value ) ) ) );
		$response ['reviews_counts'] [$value] = $count;
	}
	unset ( $review_types );
	
	$review_ids = array ();
	// get token id
	preg_match ( '/(\w\d+-\w\d+)/', $url, $matches );
	if ($matches) {
		$token = $matches [1];
	}
	define ( 'MAX_REVIEWS', 10 );
	$review_count = 0;
	$review_link = "http://www.tripadvisor.com/SingleUserReview-$token?review=";
	
	$reviews = $html->find ( "#REVIEWS div" );
	foreach ( $reviews as $review ) {
		if ($review_count == MAX_REVIEWS)
			break;
		if (strpos ( $review->id, 'review_' ) !== FALSE) {
			++ $review_count;
			
			$review_html = fetch_html ( $review_link . $review->id . '&expand=' . $review_count );
			$title = $review_html->find ( '.quote a', 0 );
			if (! $title) {
				$title = clean ( trim ( $review_html->find ( '.quote', 0 )->innertext ) );
			} else {
				$link = DOMAIN . $title->href;
				$title = clean ( $title->innertext );
			
			}
			$rating_values = array ();
			//date
			$date = trim ( str_replace ( 'Date of review:', '', $review_html->find ( '.date', 0 )->innertext ) );
			if (strpos ( $date, 'triptype' ) !== FALSE) {
				$date = str_replace ( '|', '', preg_replace ( '/<[^>]+>.+<\/[^>]+>/sm', '', $date ) );
			}
			
			$lists = $review_html->find ( 'ul li' );
			$review_id = str_replace ( 'review_', '', $review->id );
			$review_data = array ( 
				
					'url' => $review_link . $review->id . '&expand=' . $review_count, 
					'id' => $review_id, 
					'date' => $date, 
					'management' => 'Nope', 
					'title' => $title, 
					'link' => str_replace ( $token, $token . '-r' . $review_id, $url ), 
					'ratings' => &$rating_values, 
					'comment' => trim ( $review_html->find ( '.entry p', 0 )->innertext ) 
			);
			// management response
			$management = $review_html->find ( '.mgrRspn', 0 );
			if ($management) {
				$review_data ['management'] = array ( 
					
						'from' => trim ( $management->find ( '.header', 0 )->innertext ), 
						'date' => trim ( $management->find ( '.date', 0 )->innertext ), 
						'response' => trim ( $management->find ( '.displayText', 0 )->innertext ) 
				);
			}
			foreach ( $lists as $list ) {
				
				if (strpos ( $list->class, 'recommend-answer' ) !== FALSE) {
					$score = preg_replace ( '/[^\d]/', '', $list->find ( 'span', 0 )->class );
					$score = intval ( $score ) / 10;
					$name = str_replace ( ' ', '_', strtolower ( trim ( strip_tags ( $list->innertext ) ) ) );
					$rating_values [$name] = $score;
				
				} else {
					$value = $list->innertext;
					
					if (strpos ( $value, 'Visit was for' ) !== FALSE) {
						$review_data ['vist_for'] = strip_tags ( trim ( str_replace ( 'Visit was for:', '', $value ) ) );
					} else if (strpos ( $value, 'Traveled with:' ) !== FALSE) {
						$review_data ['travel_with'] = trim ( str_replace ( 'Traveled with:', '', $value ) );
					} else if (strpos ( $value, 'Would you recommend' ) !== FALSE) {
						$review_data ['would_recommend'] = strpos ( $value, 'No' ) !== FALSE ? 'No' : 'Yes';
					
					}
				}
			}
			
			$response ['reviews'] [] = $review_data;
			
			unset ( $review );
			unset ( $review_html );
		}
	}
	echo '<pre>';
	print_r ( $response );
	echo '</pre>';

}