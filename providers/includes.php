<?php
include 'simplehtmldom/simple_html_dom.php';
function fetch_html($url) {
	
	return str_get_html ( fetch ( $url ) );
}
function fetch($url) {
	$ch = curl_init ();
	curl_setopt ( $ch, CURLOPT_URL, $url );
	curl_setopt ( $ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows; U; Windows NT 5.1; rv:1.7.3) Gecko/20041001 Firefox/0.10.1" );
	@curl_setopt ( $ch, CURLOPT_FOLLOWLOCATION, true );
	curl_setopt ( $ch, CURLOPT_AUTOREFERER, true );
	curl_setopt ( $ch, CURLOPT_RETURNTRANSFER, 1 );
	$contents = curl_exec ( $ch );
	//$response =
	curl_close ( $ch );
	unset ( $ch );
	return $contents;
}
function clean($in, $offset = null) {
	$out = trim ( $in );
	if (! empty ( $out )) {
		$entity_start = strpos ( $out, '&', $offset );
		if ($entity_start === false) {
			// ideal
			return $out;
		} else {
			$entity_end = strpos ( $out, ';', $entity_start );
			if ($entity_end === false) {
				return $out;
			} // zu lang um eine entity zu sein
else if ($entity_end > $entity_start + 7) {
				// und weiter gehts
				$out = clean ( $out, $entity_start + 1 );
			} // gottcha!
else {
				$clean = substr ( $out, 0, $entity_start );
				$subst = substr ( $out, $entity_start + 1, 1 );
				// &scaron; => "s" / &#353; => "_"
				$clean .= ($subst != "#") ? $subst : "_";
				$clean .= substr ( $out, $entity_end + 1 );
				// und weiter gehts
				$out = clean ( $clean, $entity_start + 1 );
			}
		}
	}
	return $out;
} 