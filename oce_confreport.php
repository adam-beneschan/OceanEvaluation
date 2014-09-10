<?php

require('confconfig.php');   // sets up $confconfig
require('fpdf.php');
require('ocereport.php');

global $pdf;

function compute_question_layout ($answerlist) {
  global $pdf;
  $layout = new FieldLayout ();
  foreach ($answerlist as $key => $text) {
    $nested = new FieldLayout ();
    $nested->add (LayoutField::Fixed ($pdf, $text . ": ", ''), 0);
    $nested->add (new LayoutField ("count", 
                                   $pdf->GetStringWidthInStyle("8888",''), 'R'),
                  5);
    $nested->add (LayoutField::Fixed ($pdf, "(", ''), 0);
    $perc = new LayoutField ("percentage", 
                               $pdf->GetStringWidthInStyle("100.8%",'I'), 'R');
    $perc->SetStyle('I');
    $nested->add ($perc, 0);
    $nested->add (LayoutField::Fixed ($pdf, ")", ''), 0);
    $f = new LayoutField ($key);
    $f->SetNestedLayout ($nested);
    $layout->add ($f, 10);    
  }
  return $layout;
}

$curr_index = 0;
foreach ($confconfig as $confentry) {
  if (isset($confentry['answers']))
    $answertab = $confentry['answers'];
  if (isset($confentry['q']) && $confentry['qtype'] != 'none') {
    if (isset($confentry['list'])) {
      for ($i = 1; $i <= count($confentry['list']); $i++) {
//      $confmap ["answer-" . $confentry['q'] . "-" . $i] = $curr_index++;
        $curr_index++;
      }
    } else {
//    $confmap ["answer-" . $confentry['q']] = $curr_index++;
      $curr_index++;
    }
  }
  $confmap_length = $curr_index;
}

$pdf = new OCEReport();
$pdf->AddPage();
$text_size = 10;
$pdf->SetFont('Times','I',$text_size);

// TODO: error handling (e.g. SQL server isn't running...)
$ocedb = new mysqli('localhost', 'ocewebuser', 'ocewebuser', 'oce');
$result = $ocedb->query('select answers from confevals');
$num_results = $result->num_rows;
for ($i = 0; $i < $num_results; $i++) {
   $row = $result->fetch_assoc();
   $ans_array = split ("\|", $row['answers']);
   for ($j = 0; $j < count($ans_array); $j++) {
      $totals[$j][$ans_array[$j]]++;
      $sum[$j] += $ans_array[$j];
      if ($ans_array[$j] != "")
         $question_totals[$j]++;
   }
}

$layouts["yn"] = compute_question_layout (array('Yes', 'No'));
foreach ($answertab as $qtype => $answers)
   $layouts[$qtype] = compute_question_layout ($answers);

$avg_layout = new FieldLayout ();
$avg_layout->add (LayoutField::Fixed ($pdf, "Average:", ''), 10);
$avg_layout->add (new LayoutField ("average", 
                            $pdf->GetStringWidthInStyle("188.88",''), 'L'), 0);

$curr_index = 0;
$first_question = true;
foreach ($confconfig as $confentry) {
  if (isset($confentry['q']) && $confentry['qtype'] != 'none') {
    if (!$first_question)
      $pdf->SetY($pdf->GetY() + 5);
    $first_question = false;
    $pdf->SetFont('','BI');
    $pdf->Write(14, $confentry['q'] . ". " . $confentry['text']);
    $pdf->Ln();
    $pdf->SetFont('','');
    
    if ($confentry['reporton'] == 'mc') {
      if ($confentry['qtype'] == 'yn')
        $answers = array('Yes', 'No');
      else
        $answers = $answertab[$confentry['qtype']];
      $output_data = array();
      for ($i = 0; $i < count($answers); $i++) {
         $val = sprintf("%d", $totals[$curr_index][$i+1]);
         if ($question_totals[$curr_index] == 0)
            $perc_string = "*****%";
         else {
            $perc = (100.0 * $totals[$curr_index][$i+1]) / 
                          $question_totals[$curr_index];
            $perc_string = sprintf("%.1f%%", $perc);
         }
         $output_data[$i] = array("count" => $val, 
                                  "percentage" => $perc_string);
      }
      $pdf->WriteWithLayout (25, $layouts[$confentry['qtype']], $output_data);
      $curr_index++;
    }
    else if ($confentry['reporton'] == 'avg' &&
             $confentry['qtype'] == 'number') {
      if ($question_totals[$curr_index] == 0) 
         $avg_string = "*****";
      else {
         $avg = $sum[$curr_index] / $question_totals[$curr_index];
         $avg_string = sprintf("%6.2f", $avg);
         $pdf->WriteWithLayout (25, $avg_layout, 
                                array("average" => $avg_string));
      }
      $curr_index++;
    }
    else if ($confentry['reporton'] == 'pct' &&
             $confentry['qtype'] == 'number') {
      $start_index = $curr_index;
      $max_width = 0;
      foreach ($confentry['list'] as $qname) {
        $qname_width = $pdf->GetStringWidthInStyle($qname . ":",'');
        if ($qname_width > $max_width) $max_width = $qname_width;
      }
      $pct_layout = new FieldLayout ();
      $qname_field = new LayoutField ("qname", $max_width);
      $qname_field->SetStyle ('');
      $pct_layout->add ($qname_field, 5);
      $pct_layout->add (new LayoutField ("count", 
                                $pdf->GetStringWidthInStyle("8888",''), 'R'),
                        5);
      $pct_layout->add (LayoutField::Fixed ($pdf, "(", ''), 0);
      $perc = new LayoutField ("percentage", 
                             $pdf->GetStringWidthInStyle("100.8%",'I'), 'R');
      $perc->SetStyle('I');
      $pct_layout->add ($perc, 0);
      $pct_layout->add (LayoutField::Fixed ($pdf, ")", ''), 0);
      $question_sum = 0;
      foreach ($confentry['list'] as $qname) {
        $question_sum += $sum[$curr_index++];
      }
      $curr_index = $start_index;
      foreach ($confentry['list'] as $qname) {
        if ($question_sum == 0)
          $perc_string = "*****";
        else {
          $perc = (100.0 * $sum[$curr_index]) / $question_sum;
          $perc_string = sprintf("%.1f%%", $perc);
        }
        $pdf->WriteWithLayout (25, $pct_layout, 
            array("qname" => $qname . ":", 
                  "count" => sprintf("%d", $sum[$curr_index]),
                  "percentage" => $perc_string)); 
        $curr_index++;
      }
    }
    else { // don't know what to do with this question
      $curr_index++;
    }
  }
}

$pdf->SetY($pdf->GetY() + 60);
$pdf->SetFont('Times','B',14);
$pdf->Write(20, "Total number of forms: $num_results");

$pdf->Output();

$result->free();
$ocedb->close();

?>
