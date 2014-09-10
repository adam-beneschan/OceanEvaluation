<?php
// TODO: error handling (e.g. SQL server isn't running...)
$ocedb = new mysqli('localhost', 'ocewebuser', 'ocewebuser', 'oce');
$title = $_REQUEST['title'];
$name = $_REQUEST['name'];
$ins1 = $_REQUEST['ins1'];
$ins2 = $_REQUEST['ins2'];
if (!get_magic_quotes_gpc()) {
  $title = addslashes($title);
  $name = addslashes($name);
  $ins1 = addslashes($ins1);
  $ins2 = addslashes($ins2);
}
if (!$ins2) 
  $ins2 = "null";
else
  $ins2 = '"' . $ins2 . '"';

$result = $ocedb->query('select * from sessions where title = "' .
                        $title . '"');
if ($result->num_rows > 0) {
  $output = '"ERROR: There is already a session with that title"'; 
} else {
  $result = $ocedb->query('select * from sessions where name = "' .
                          $name . '"');
  if ($result->num_rows > 0) {
    $output = '"ERROR: There is already a session with that session name"';
  } else {
    $result = $ocedb->query('insert into sessions values (null, "' .
                            $title . '", "' . $name . '", "' . $ins1 .
                            '", ' . $ins2 . ')');
       // note that $ins2 already had quotes added if not null
    $result2 = $ocedb->query('select last_insert_id()');
    $row = $result2->fetch_row();  // will be an array of one element, which
                                   // is the sessionid of the session just
                                   // inserted
    $output = '"' . $row[0] . '"';
    $result2->free();
  }
}

header('Content-type: text/json');
echo $output;
$ocedb->close();
?>
