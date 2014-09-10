<?php

require('confconfig.php');   // sets up $confconfig

$curr_index = 0;
foreach ($confconfig as $confentry) {
  if (isset($confentry['q']) && $confentry['qtype'] != 'none') {
    if (isset($confentry['list'])) {
      for ($i = 1; $i <= count($confentry['list']); $i++) {
        $confmap ["answer-" . $confentry['q'] . "-" . $i] = $curr_index++;
      }
    } else {
      $confmap ["answer-" . $confentry['q']] = $curr_index++;
    }
  }
  $confmap_length = $curr_index;
}

for ($i = 0; $i < $confmap_length; $i++)
   $data[$i] = "";

foreach ($_POST as $req_name => $req_val) {
   if (preg_match ("/^answer-/", $req_name)) {
      $entryindex = $confmap [$req_name];
      if (isset($entryindex)) 
         $data[$entryindex] = $req_val;
   }
}
$answers = join ("|", $data);

// TODO: error handling (e.g. SQL server isn't running...)
$ocedb = new mysqli('localhost', 'ocewebuser', 'ocewebuser', 'oce');
$result = $ocedb->query("insert into confevals values (null, \"$answers\")");
header('Content-type: text/json');
echo 1;  // success; no other return value defined for this function
$ocedb->close();
?>
