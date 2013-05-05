<?php

  # getsyns.php
  #
  # authored by Team 8 (Simpletons) for
  # Roger West's class CSC 478 at UIS Spring 2013.
  #
  # this script serves as the component for the webserver to interface the
  # python based NLTK / WordNet 3.0 backend, which is utilized when a difficult
  # word.
  #
  # (REQUIREMENT 2.6)
  
  header('Content-type: application/json');

  # function to test if a given word is a part of speech
  # we will use this to format the returned json array
  function isPoS($str)
  {
    $sub = "pos:";
    return (strncmp($str, $sub, strlen($sub)) == 0);
  }

  $q=$_GET["q"];

  # refuse bad inputs!
  if (strlen($q) < 1)
  {
    echo "invalid (no) input";
    return;
  }
  
  # python interface to nltk/wordnet30
  # update to appropriate path for your environment
  $py_script = "/var/simple/simplepy/get_syns.py";
  exec("python $py_script $q", $output);

  $json = array();
  $t_array = array();

  # client needs to know calling word (ajax async issue)
  $json[] = "word: '".$q."'";

  # build the remainder of the json array
  # an array of arrays (1 array per synset)
  foreach($output as $val)
  {
    if(isPoS($val))
    {
      if(!empty($t_array))
      {
        $json[] = $t_array;
        $t_array = array();
      }
      $json[] = $val;
    }
    else
    {
      $t_array[] = $val;
    }
  }

  $json[] = $t_array;

  # we wrap the result in 'callback' in order
  # to allow for cross domain requests
  echo "callback(".json_encode($json).")";

?>
