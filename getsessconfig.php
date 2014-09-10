<?php
require('confconfig.php');   // sets up $sessconfig
$output = json_encode($sessconfig);
header('Content-type: text/json');
echo $output;
?>
