<?php

class OCEReport extends FPDF {
 
  // default margins are 1 cm, this converts to points (72 pts=1 in=2.54 cm)
  private $leftmargin;
  private $rightmargin;
  private $bottommargin;
  private $width;
  private $height;
  private $style;
 
  public function __construct () {
    parent::__construct ('P','pt','Letter');    
    $this->leftmargin = 72 / 2.54;
    $this->rightmargin = 72 / 2.54;
    $this->bottommargin = (2 * 72) / 2.54;  // default triggering limit is
                                            // 2cm for auto page breaks
    $this->width = 8.5 * 72;
    $this->height = 11 * 72;
  }

  public function SkipPoints ($points) {
    $this->SetX($this->GetX() + $points);
  }
  
  public function SetFont ($family, $style = '', $size = 0) {
     $this->style = $style;
     parent::SetFont ($family, $style, $size);
  }
  
  public function SetFontStyle ($style) {
     $this->style = $style;
     parent::SetFont('',$style,0);
  }

  public function CurrFontStyle () {
     return $this->style;
  }

  public function GetStringWidthInStyle ($s, $style) {
     $save_style = $this->style;
     parent::SetFont('',$style,0);
     $w = parent::GetStringWidth ($s);
     parent::SetFont('',$save_style,0);
     return $w;
  }

  private function WriteField ($field, $data) {
    $nl = $field->NestedLayout();
    if ($nl != null) {
      $this->WriteNestedLayout ($nl, $data);
    } else {
      $switch_to_style = null;
      if (isset($data) && is_array($data) && isset($data["style"]) &&
          isset($data["text"])) {
        $switch_to_style = $data["style"];
        $data = $data["text"];
      } else if ($field->style() != null) {
        $switch_to_style = $field->style();
      }
      if ($switch_to_style != null) {
        $savestyle = $this->style;
        $this->SetFontStyle ($switch_to_style);
      }
      if ($field->fixed_text() != null)
        $data = $field->fixed_text();
      if ($field->alignment() == "R" ||
          $field->alignment() == "C") {
        $textwidth = parent::GetStringWidth ($data);
        $offset = $field->width() - $textwidth;
        if ($offset > 0) {
          if ($field->alignment() == "C") $offset /= 2;
          if ($offset > 0) $this->SkipPoints ($offset);
        }
      }
      parent::Write(14,$data);
      // TODO: height shouldn't be hard-coded
      if ($switch_to_style != null) 
        $this->SetFontStyle ($savestyle);
    }
  }

  private function WriteNestedLayout ($layout, $data) {
    $layout->InitFieldScan();
    while ($layout->NextField ($f, $pad)) {
      $currX = parent::GetX();
      $this->WriteField ($f, $data[$f->name()]);
      parent::SetX ($currX + $f->width() + $pad);
    }
  }

  public function WriteWithLayout ($indent, $layout, $data) {
    $this->SkipPoints ($indent);
    $curwidth = $indent;
    $layout->InitFieldScan();
    while ($layout->NextField ($f, $pad)) {
      if ($curwidth + $f->width() >= 
             $this->width - $this->leftmargin - $this->rightmargin) {
        parent::Ln();
        $this->SkipPoints ($indent);
        $curwidth = $indent;
      }
      $currX = parent::GetX();
      $this->WriteField ($f, $data[$f->name()]);
      parent::SetX ($currX + $f->width() + $pad);
      $curwidth += $f->width() + $pad;
    }    
    parent::Ln();
  }

  public function EnsureVerticalRoom ($points) {
    if (parent::GetY () + $points + $this->bottommargin >= $this->height) 
      parent::AddPage();
  }

  public function SkipVerticalOrNewPage ($points) {
    if (parent::GetY () + $points + $this->bottommargin >= $this->height) 
      parent::AddPage();
    else
      parent::SetY (parent::GetY () + $points);
  }
}

class LayoutField {

  private $name;
  private $width;
  private $alignment;
  private $nested;
  private $style;
  private $fixed_text;

  public function __construct ($name = "", $width = 0, $alignment = 'L') {
    $this->name = $name;
    $this->width = $width;
    $this->alignment = $alignment;
    $this->nested = null;
    $this->style = null;
    $this->fixed_text = null;
  }

  static function Fixed ($pdf, $text, $style) {
    $f = new LayoutField ("", $pdf->GetStringWidthInStyle ($text, $style));
    $f->fixed_text = $text;
    $f->style = $style;
    return $f;
  }

  public function SetNestedLayout ($layout) {
    $this->nested = $layout;
  }

  public function SetStyle ($style) {
    $this->style = $style;
  }

  public function name () {
    return $this->name;
  }

  public function width () {
    if ($this->nested != null)
       return $this->nested->width();
    else
       return $this->width;
  }

  public function alignment () {
    return $this->alignment;
  }

  public function style () {
    return $this->style;
  }

  public function fixed_text () {
    return $this->fixed_text;
  }

  public function NestedLayout () {
    return $this->nested;
  }

} 

class FieldLayout {

  private $fields;
  private $padding;
  private $length;
  private $currindex;

  public function __construct () {
    $this->fields = array();
    $this->padding = array();
    $this->length = 0;
  }

  public function add ($field, $padding) {
    $this->fields[$this->length] = $field;
    $this->padding[$this->length++] = $padding;
  }

  public function width () {
    $total = 0;
    for ($i = 0; $i < $this->length; $i++)
      $total += $this->fields[$i]->width() + $this->padding[$i];
    return $total;
  }

    // Sets up to start scanning the fields in the layout.
  public function InitFieldScan () {
    $this->currindex = 0;
  }

    // Gets the next field, returns TRUE if successful or FALSE if there
    // are no more fields to return.  $padding is the padding that follows
    // the field on the right.
  public function NextField (&$field, &$padding) {
    if ($this->currindex >= $this->length) 
      return false;
    else {
      $field = $this->fields[$this->currindex];    
      $padding = $this->padding[$this->currindex++];    
      return true;
    }
  }

}

?>
