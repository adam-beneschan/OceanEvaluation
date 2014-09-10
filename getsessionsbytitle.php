<?php
// TODO: error handling (e.g. SQL server isn't running...)
$ocedb = new mysqli('localhost', 'ocewebuser', 'ocewebuser', 'oce');
$result = $ocedb->query("select title, sessionid from sessions order by title asc");
$output = '[';
$result_count = $result->num_rows;
for ($i = 0; $i < $result_count; $i++) {
   $row = $result->fetch_assoc();
   $output_element = '["' . $row['title'] . '",' . $row['sessionid'] . ']'; 
   if ($i > 0) $output .= ',';
   $output .= $output_element;
}
$output .= ']';
header('Content-type: text/json');
echo $output;
$result->free;
$ocedb->close();
?>
