<?php
// TODO: error handling (e.g. SQL server isn't running...)
$ocedb = new mysqli('localhost', 'ocewebuser', 'ocewebuser', 'oce');
$result = $ocedb->query("select name, sessionid from sessions order by name asc");
$output = '[';
$result_count = $result->num_rows;
for ($i = 0; $i < $result_count; $i++) {
   $row = $result->fetch_assoc();
   $output_element = '["' . $row['name'] . '",' . $row['sessionid'] . ']'; 
   if ($i > 0) $output .= ',';
   $output .= $output_element;
}
$output .= ']';
header('Content-type: text/json');
echo $output;
$result->free;
$ocedb->close();
?>
