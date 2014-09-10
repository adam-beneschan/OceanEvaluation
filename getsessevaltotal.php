<?php
// TODO: error handling (e.g. SQL server isn't running...)
$ocedb = new mysqli('localhost', 'ocewebuser', 'ocewebuser', 'oce');
$result = $ocedb->query('select count(*) from sessevals');

$row = $result->fetch_row();  // will be an array of one element, which
                              // is the returned count
header('Content-type: text/json');
echo $row[0]; 
$result->free();
$ocedb->close();
?>
