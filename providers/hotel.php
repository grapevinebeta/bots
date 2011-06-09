<?php
include ('includes.php');
if (isset ( $_POST ['location'] ) || isset ( $_POST ['hotel'] )) {
	
	$location = $_POST ['location'];
	//'san antonio texas';
	$hotel_name = $_POST ['hotel']; //hotel contessa';
	$response = fetch ( 'http://www.hotels.com/suggest/atxt_destination/b0/c4/d30/e5/fen_US/g' . str_replace ( ' ', '%20', $location ) );
	// die bitch
	$response = substr ( str_replace ( 'hcom.common.modules.autosuggest.rp(', '', $response ), 0, - 1 );
	// bitches
	$response = str_replace ( ',,', ',', $response );
	// bitches again
	$response = str_replace ( ',]', ']', $response );
	
	$id_response = json_decode ( $response, false );
	
	$choices = $id_response [2] [0];
	
	// just get the fist one for the user, later show what we found
	$destination_id = $choices [0] [1];
	$params = array ( 
		
			'so' => 'BEST_SELLER', 
			'vt' => 'LIST', 
			'rl' => "destination:$destination_id:EXACT_RED:HIGH", 
			'pn' => '1', 
			'pfm' => '1', 
			'dn' => $location, 
			'nr' => '1', 
			'hn' => $hotel_name, 
			'pfcc' => 'USD', 
			'minp' => '0', 
			'maxp' => '500', 
			'ming' => '0', 
			'maxg' => '5', 
			'r' => '2', 
			'cpr' => '0' 
	);
	$url = "http://www.hotels.com/search/ajaxsearch.html?";
	$url .= http_build_query ( $params );
	$json = json_decode ( fetch ( $url ) );
	$html = $json->body;
	unset ( $json );
	$html = str_get_html ( $html );
	$hotels = array ();
	foreach ( $html->find ( '.hotel' ) as $hotel ) {
		$anchor = $hotel->find ( 'h3 a', 0 );
		$hotels [] = array ( 
			
				'title' => trim ( $anchor->innertext ), 
				'link' => 'http://www.hotels.com' . $anchor->href 
		);
	
	}
	echo json_encode ( $hotels );
} else {
	if (isset ( $_POST ['url'] )) {
		$url = $_POST ['url'];
	} else {
		$url = 'http://www.hotels.com/hotel/details.html?pa=1&pn=1&ps=1&reviewOrder=date_newest_first&roomno=1&destinationId=1490932&rooms[0].numberOfAdults=2&tab=description&hotelId=233166&validate=false#description';
	}
	
	$data = array ( 
		
			'rating' => 0, 
			'percentage_recommend' => 0, 
			'total_reviews' => 0, 
			'scores' => array ( 
				
					'hotel_service' => 0, 
					'hotel_condition' => 0, 
					'room_comfort' => 0, 
					'room_cleanliness' => 0 
			), 
			'trip_types_scores' => array ( 
				
					'all_trip_types' => 0, 
					'business' => 0, 
					'romance' => 0, 
					'family' => 0, 
					'with_friends' => 0, 
					'all_others' => 0 
			), 
			'reviews' => array () 
	);
	
	$reviews_to_find = array ( 
		
			'Hotel Service', 
			'Hotel Condition', 
			'Room Comfort', 
			'Room Cleanliness' 
	);
	
	$html = fetch_html ( $url );
	$summaries = $html->find ( '.summary ul' );
	foreach ( $summaries as $summary ) {
		foreach ( $summary->find ( 'li' ) as $entry ) {
			if (strpos ( $entry->innertext, 'Average rating' ) !== FALSE) {
				$data ['rating'] = trim ( $entry->find ( 'span', 0 )->innertext );
			} else if (strpos ( $entry->innertext, 'Recommended' ) !== FALSE) {
				$data ['percentage_recommend'] = intval ( $entry->find ( 'span', 0 )->innertext );
			} else if (strpos ( $entry->innertext, 'Reviews' ) !== FALSE) {
				$data ['total_reviews'] = trim ( $entry->find ( 'span', 0 )->innertext );
			} else {
				$value = str_replace ( '&nbsp;', '', trim ( strip_tags ( $entry->innertext ) ) );
				$value = explode ( ' ', $value, 2 );
				if (count ( $value ) == 2 && preg_match ( '/(\d\.\d)/', $value [0], $matches ) && in_array ( trim ( $value [1] ), $reviews_to_find )) {
					$value = str_replace ( ' ', '_', trim ( strtolower ( $value [1] ) ) );
					
					$data ['scores'] [$value] = $matches [0];
				
				}
			
			}
		}
		foreach ( $html->find ( '.trip_types tbody tr' ) as $type ) {
			$type_name = $type->find ( '.trip_type', 0 );
			if (! $type_name)
				continue;
			$type_name = strtolower ( trim ( strip_tags ( $type_name->innertext ) ) );
			$type_name = str_replace ( ' ', '_', $type_name );
			if (isset ( $data ['trip_types_scores'] [$type_name] )) {
				$data ['trip_types_scores'] [$type_name] = array ( 
					
						'total' => trim ( strip_tags ( $type->find ( '.number', 0 )->innertext ) ), 
						'score' => trim ( $type->find ( '.average .number', 0 )->innertext ) 
				);
			}
		}
		foreach ( $html->find ( '.property_details_guest_review' ) as $guest_review ) {
			$head = $guest_review->find ( '.review_head', 0 );
			$review_data = array ( 
				
					'type' => trim ( str_replace ( 'Trip type:', '', $head->find ( '.type', 0 )->innertext ) ), 
					'title' => trim ( $head->find ( '.summary', 0 )->innertext ), 
					'date' => trim ( str_replace ( 'Reviewed by a Hotels.com guest on', '', $head->find ( 'p', 0 )->innertext ) ), 
					'review' => trim ( $guest_review->find ( '.description', 0 )->innertext ), 
					'rating' => array ( 
						
							'overall_rating' => trim ( $guest_review->find ( 'span.rating', 0 )->innertext ), 
							'hotel_service' => 0, 
							'hotel_condition' => 0, 
							'room_comfort' => 0, 
							'room_cleanliness' => 0 
					) 
			);
			
			foreach ( $guest_review->find ( '.categories li' ) as $category ) {
				
				preg_match ( '/\d\.\d/', $category->find ( 'span', 0 )->innertext, $matches );
				$value = trim ( preg_replace ( '/<[^>]+>.+<\/[^>]+>/sm', '', $category->innertext ) );
				$value = strtolower ( str_replace ( ' ', '_', $value ) );
				if (isset ( $review_data ['rating'] [$value] )) {
					$review_data ['rating'] [$value] = $matches [0];
				}
			}
			$data ['reviews'] [] = $review_data;
		
		}
	}
	echo '<pre>';
	print_r ( $data );
	echo '</pre>';

}