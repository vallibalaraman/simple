#!/usr/bin/python

# get_syns.py
#
# authored by Team 8 (Simpletons) for
# Roger West's class CSC 478 at UIS Spring 2013.
#
# this python script imports/exposes the Natural Language Toolkit (NLTK)
# to the webserver.  it is needed when the words are not members of the
# set of 1600 simplest words.  it will return the entire list of synomyms
# (synset) for the inputed word.
#
# (REQUIREMENT 2.6)

import sys
from nltk.corpus import wordnet as wn

#import json
# json here or in php? probably parse/encode on the php side...

if len(sys.argv) != 2:
    print "bad input!"
    print len(sys.argv)
    sys.exit("bad input!")

# prototype syn_set iterator

def synonym(word):
    syn_sets = wn.synsets(word)

    for syn_set in syn_sets:
        print '%s ->\t%s' % (syn_set, syn_set.lemma_names)

# iterate through the synsets, separate by pos
# and remove "word" from returned results

def synonyms(word):

    syn_sets = wn.synsets(word)

    for syn_set in syn_sets:
	
	if (len(syn_set.lemmas) > 1):
	    
	    print "pos: '%s'" % syn_set.pos

            for l in syn_set.lemmas:
		if(l.name != word):
                    print l.name

# get synonyms for "word" argument

synonyms( sys.argv[1].lower() )
