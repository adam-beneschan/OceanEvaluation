<?php

require('confconfig.php');   // sets up $sessconfig
require('fpdf.php');
require('ocereport.php');

global $pdf;

$pdf = new OCEReport();
$pdf->AddPage();
$text_size = 10;
$pdf->SetFont('Times','I',$text_size);

$qcount = count($sessconfig);  // number of questions

$average_layout = new FieldLayout ();
$average_layout->add (LayoutField::Fixed ($pdf, "Averages: ", 'I'), 8);
for ($i = 0; $i < $qcount; $i++)
   $average_layout->add (new LayoutField ("average-$i", 
                            $pdf->GetStringWidthInStyle("8.888",''), 'R'), 8);
$average_layout->add (LayoutField::Fixed ($pdf, "", ''), 4);
$average_layout->add (LayoutField::Fixed ($pdf, "Total: ", 'BI'), 8);
$average_layout->add (new LayoutField ("total", 
                         $pdf->GetStringWidthInStyle("8.888",''), 'R'), 0);

// TODO: error handling (e.g. SQL server isn't running...)
$ocedb = new mysqli('localhost', 'ocewebuser', 'ocewebuser', 'oce');

$result = $ocedb->query(
  'select sessionid, instructor2 from sessions where instructor2 is not null');
$num_results = $result->num_rows;
for ($i = 0; $i < $num_results; $i++) {
   $row = $result->fetch_assoc();
   $has_ins2[$row['sessionid']] = true;
}
$result->free();

$result = $ocedb->query('select * from sessevals');
$num_results = $result->num_rows;
for ($i = 0; $i < $num_results; $i++) {
   $row = $result->fetch_assoc();
   $sess_id = $row['sessionid'];
   $answers = $row['answers'];
   $forms[$sess_id]++;
   $maxins = $has_ins2[$sess_id] ? 2 : 1;
   for ($instructor = 1; $instructor <= $maxins; $instructor++) {
      for ($j = 0; $j < $qcount; $j++) {
         if ($instructor == 2 && strlen($answers) > $qcount)
             $strindex = $qcount + $j;
         else
             $strindex = $j;
             // if there is a second instructor but questions were only 
             // answered for one instructor, assume the answers are the same
             // for the second instructor
         $ans = substr($answers, $strindex, 1);
         if ($ans >= 1 && $ans <= 5) {
            $stats[$sess_id][$instructor][$j]["total"] += $ans;
            $stats[$sess_id][$instructor][$j]["count"] ++;
            $stats[$sess_id][$instructor]["total"]["total"] += $ans;
            $stats[$sess_id][$instructor]["total"]["count"] ++;
            $grandtotal[$j] += $ans;
            $grandtotalcount[$j] ++;
            $grandtotal["total"] += $ans;
            $grandtotalcount["total"] ++;
         } 
      }
   }
}
$result->free();

$result = $ocedb->query('select * from sessions');
$num_results = $result->num_rows;
for ($i = 0; $i < $num_results; $i++) {
    $row = $result->fetch_assoc();
    $sess_id = $row['sessionid'];
    $lines = $has_ins2[$sess_id] ? 5 : 3;
    $pdf->EnsureVerticalRoom (14 * $lines);

    $pdf->SetFontStyle('');
    $pdf->Write (14, "Session: ");
    $pdf->SetFontStyle('B');
    $pdf->Write (14, $row['name']);
    $pdf->SetFontStyle('');
    $pdf->Write (14, "  " . $row['title']);
    $pdf->Ln();

    $pdf->SkipPoints (12);
    $num_forms = $forms[$sess_id];
    if (!isset($num_forms)) $num_forms = 0;
    $pdf->Write (14, "Number of forms: $num_forms");
    $pdf->Ln();

    for ($ins = 1; $ins <= ($has_ins2[$sess_id] ? 2 : 1); $ins++) {
       if ($ins == 2) {
          $pdf->SkipPoints (12);
          $pdf->SetFontStyle('B');
          $pdf->Write (14, "Averages for instructor 2:");
          $pdf->Ln();
          $pdf->SetFontStyle('');
       }
       for ($j = 0; $j < $qcount; $j++) {
           $count = $stats[$sess_id][$ins][$j]["count"];
           if ($count == 0)
               $output_data["average-$j"] = "*****";
           else {
               $average = $stats[$sess_id][$ins][$j]["total"] / $count;
               $output_data["average-$j"] = sprintf("%5.3f", $average);
               $avgtotal[$j] += $average;
               $avgcount[$j] ++;
               $avgtotal["total"] += $average;
               $avgcount["total"] ++;
           }
       }
       $count = $stats[$sess_id][$ins]["total"]["count"];
       if ($count == 0)
           $output_data["total"] = "*****";
       else {
           $average = $stats[$sess_id][$ins]["total"]["total"] / $count;
           $output_data["total"] = sprintf("%5.3f", $average);
       }
       $pdf->WriteWithLayout (12, $average_layout, $output_data);
    }

    $pdf->SkipVerticalOrNewPage(12);

}   

$pdf->EnsureVerticalRoom (14 * 4);
$pdf->SetFontStyle('B');
$pdf->Write(14, '*** Overall averages (obtained by averaging all averages):');
$pdf->Ln();
$pdf->SetFontStyle('');
for ($j = 0; $j < $qcount; $j++) {
    $count = $avgcount[$j];
    if ($count == 0)
        $output_data["average-$j"] = "*****";
    else {
        $average = $avgtotal[$j] / $count;
        $output_data["average-$j"] = sprintf("%5.3f", $average);
    }
}
$count = $avgcount["total"];
if ($count == 0)
    $output_data["total"] = "*****";
else {
    $average = $avgtotal["total"] / $count;
    $output_data["total"] = sprintf("%5.3f", $average);
}
$pdf->WriteWithLayout (12, $average_layout, $output_data);

$pdf->SetFontStyle('B');
$pdf->Write(14, '*** Overall averages (taking number of forms into account):');
$pdf->Ln();
$pdf->SetFontStyle('');
for ($j = 0; $j < $qcount; $j++) {
    $count = $grandtotalcount[$j];
    if ($count == 0)
        $output_data["average-$j"] = "*****";
    else {
        $average = $grandtotal[$j] / $count;
        $output_data["average-$j"] = sprintf("%5.3f", $average);
    }
}
$count = $grandtotalcount["total"];
if ($count == 0)
    $output_data["total"] = "*****";
else {
    $average = $grandtotal["total"] / $count;
    $output_data["total"] = sprintf("%5.3f", $average);
}
$pdf->WriteWithLayout (12, $average_layout, $output_data);

$pdf->Output();

$result->free();
$ocedb->close();

?>
