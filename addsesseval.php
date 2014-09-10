<?php
// Parameters in $_POST: currSession, entryNN, NN>=0
// result will be concatenated from entryNN values (first character),
// missing or blank results replaced by 0
// TODO: error handling (e.g. SQL server isn't running...)

$ocedb = new mysqli('localhost', 'ocewebuser', 'ocewebuser', 'oce');
$max = 0;
foreach ($_POST as $req_name => $req_val) {
   if ($req_name == "currSession") 
      $currSession = $req_val;
   else if (preg_match ("/^entry([0-9]+)$/", $req_name, $matches)) {
      $entrynum = $matches[1];
      if ($entrynum > $max) $max = $entrynum;
      $the_ans = substr($req_val, 0, 1);
      if ($the_ans == "" || $the_ans == " ") $the_ans = "0";
      $answer_tab[$entrynum] = $the_ans;
   }
}
for ($i = 0; $i <= $max; $i++)
   if (!isset($answer_tab[$i]))
      $answer_tab[$i] = "0";
$answers = join ("", $answer_tab);

$result = $ocedb->query("insert into sessevals values (null, $currSession, \"$answers\")");
header('Content-type: text/json');
echo 1;  // success; no other return value defined for this function
$ocedb->close();
?>
