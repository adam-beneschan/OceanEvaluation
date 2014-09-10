<?php
// TODO: error handling (e.g. SQL server isn't running...)
$sess = $_REQUEST['currSession'];
$ocedb = new mysqli('localhost', 'ocewebuser', 'ocewebuser', 'oce');
$result = $ocedb->query('select title, name, instructor1, instructor2 from sessions where sessionid = ' . $sess);
if ($result->num_rows == 1) {
  $row = $result->fetch_assoc();  
  $output = '["' . $row['title'] . '","' . $row['name'] . '","' .
            $row['instructor1'] . '","' . $row['instructor2'] . '"]';
} else
  $output = "0";
header('Content-type: text/json');
echo $output;
$ocedb->close();
?>
