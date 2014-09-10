<?php
require('confconfig.php');   // sets up $confconfig
$output = json_encode($confconfig);
header('Content-type: text/json');
echo $output;
?>
