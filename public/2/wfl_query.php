<?php

	# wfl_query.php
	# (PROTOTYPE / NOT CURRENTLY IMPLEMTED)
	#
	# authored by Team 8 (Simpletons) for
	# Roger West's class CSC 478 at UIS Spring 2013.
	#
	# this script serves as the 'best guess' component such that given a part
	# of speech, followed by an array of words, it will return the 'simplest'
	# word as determined by the COCA 60k word frequency list.
	#
	# NOTE: implementation is slow and utilizes a large amount of memory, which
	# was the reason for its exclusion from the 'final' implementation.
	# to make use of this consider migrating the word frequency list from the
	# ascii file into an actual database.  this should vastly improve
	# performance in terms of memory and response time.
	# 
	# (EXTENSION OF REQUIREMENT(s) 2.3.1, 2.6)
	
    include 'simplexlsx.class.php';

                                    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                    // Word list acquired from
                                    // The Corpus of Contemporary American English (COCA)
                                    //
                                    // http://corpus.byu.edu/coca/
                                    // http://www.wordandphrase.info/frequencyList.asp
                                    // http://davies-linguistics.byu.edu/personal/
                                    //
                                    // xlsx layout, by column:
                                    //  0,  RANK #
                                    //  1,  PoS
                                    //  2,  WORD
                                    //  3,  TOTAL
                                    //  4,  SPOKEN
                                    //  5,  FICTION
                                    //  6,  MAGAZINE
                                    //  7,  NEWSPAPER
                                    //  8,  ACADEMIC
    $word_frequency_list = 'wfl_60k_en-US.xlsx';
    $xlsx = new SimpleXLSX($word_frequency_list);

                                    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                    // returns the simplest word from the
                                    // inputed array of words, preface the
                                    // array w/ applicable Part of Speech (PoS):
                                    //  N,  NOUN
                                    //  V,  VERB
                                    //  J,  ADJECTIVE
                                    //  D,  ADVERB
                                    //  M,  MISC
    function return_simplest($input)
    {

        if(sizeof($input) <= 2)
            return "[INVALID INPUT]";

        global $xlsx;

        foreach( $xlsx->rows() as $r )
        {
            for( $i=1; $i < sizeof($input); $i++)
            {
                if ( ($r[1] == $input[0]) && ($input[$i] == $r[2]) )
                {
                    //echo $r[2].":\t".$r[0]."\n";
                    return $r[2];
                }
            }
        }

        return "[NO MATCH]";
    }

                                    // example call:
    $best_choice = return_simplest( array('J','WRATHFUL','INFURIATED','CROSS','LIVID','IRRITATED','HEATED','MAD') );
    echo $best_choice;

?>
