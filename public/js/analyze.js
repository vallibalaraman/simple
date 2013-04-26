//This is a worker script.
//To make it work, don't include it in the html page.
//To make it work from file in chrome, close chrome and in command prompt from chrome.exe location run the following:
//chrome.exe --allow-file-access-from-files
//This opens chrome with lower security. Then click on the html file as usual.

importScripts('setOf1600.js', 'irregVerbs.js', 'porter1980.min.js');

//stem word list
var stem = '', word = '', stemmed1600 = {};
for (word in setOf1600) {
  stem = stemmer(word);
  stemmed1600[stem] = word;
}


onmessage = function (oEvent) {
  //break up user text
  //First, break at line breaks
  var text = '';
  if (oEvent.text) {
    text = oEvent.data.text;
  } else {
    text = oEvent.data;
  }
  var paragraphs = text.split('\n');
  var pText = '', div = [], sentenceLength = 0, currentSentence = [], isFinalizer = false, isFinalDot = false;
  var isBeforeWord = true, isCap = false, prevCap = false, isEasy = false, sentenceCount = 0, sentenceId, obj = {};
  var hardWords = {}, progress = 'started', infinitive = '', testNote = '';
  for (var i in paragraphs) {
    pText = paragraphs[i];
    //find first alphabetical characters, case insensitive
    //split and take first as non-word
    //for every non-word, keep track of first char, last (and length?)
    div = pText.split(/([a-zA-Z].*)/);
    //keep track of sentence length
    sentenceLength = div[0].length
    //for every non-word, add to current sentence
    currentSentence = [div[0]];
    //deal with the remainder of the pText
      if (div[1]) {
        pText = div[1];
      } else pText = '';
    while (pText) {
      //get an alphabetical word, isolating it from ' if not followed by alph or any non-alph and all that follows.
      div = pText.split(/(\'(?![a-zA-Z])(.|\n)*|[^a-zA-Z\'](.|\n)*)/);
      //keep track of sentence length
      sentenceLength += div[0].length;
      //if the first letter of the last word was capitalized, the final period and following cap may not mean anything
      //e.g. Mr. Doe
      prevCap = isCap;
      //if the first letter is capitalized, it may be the beginning of a sentence
      isCap = /^[A-Z]/.test(div[0]);
      //check to see if it is in the easy-list
      isEasy = (setOf1600[div[0]] || setOf1600[div[0].toLowerCase()] || stemmed1600[stemmer(div[0])]) ? true: false;
      if (!isEasy) {
        //check if the "hard word" is really an irregular form of an easy word
        infinitive = irregVerbForms[div[0].toLowerCase()];
        isEasy = (setOf1600[infinitive]) ? true: false;
      }
      //TODO add affixes here, trying again to make it easy if it presently fails the isEasy test (e.g. 'undo', because do is in list and un- is easy)
      if (!isEasy) {
        //if hard word not encountered yet, make a location for it
        if (!hardWords[div[0]]) {
          hardWords[div[0]] = {};
          hardWords[div[0]].sentences = {}
        }
        //add this sentence as one instance of this hard word
        hardWords[div[0]].sentences[sentenceCount] = {textArrayIndex: currentSentence.length};
      }
    //console.log('length: ' + div.length + ', div[0]: *' + div[0] + '*, isFin: ' + isFinalizer + ', isSp: ' + isBeforeWord + ', div[1]: *' + div[1] + '*, isCap: ' + isCap + ', isEasy: ' + isEasy + ', div[2]: *' + div[2] + '*, div[3]: *' + div[3] + '*');
      //check if paragraph is over or sentence is long enough and there's still a ways to go; if so, save and start new sentence
      if (!pText || (sentenceLength > 70 && pText.length > sentenceLength && (isFinalizer || (isFinalDot && !prevCap)) && isBeforeWord && isCap)) {
        //sentence is complete, pass it on
        postSentence('mid');
    //console.log('sentence length: ' + sentenceLength);
        currentSentence = [];
        sentenceLength = 0;
        hardWords = {};
      }
      //for every word, add to current sentence
      currentSentence.push(div[0]);
      //deal with the remainder of the pText
      if (div[1]) {
        pText = div[1];
      } else pText = '';
      //get non-alphabetic characters after each word
      div = pText.split(/([a-zA-Z].*)/);
      //if it includes a final punctuation not followed by a digit, it may be the end of a sentence
      isFinalizer = /[!?]/.test(div[0]);
      //if it includes a dot not followed by a digit, it may be the end of a sentence.
      isFinalDot = /\.(?!\d)/.test(div[0]);
      //if it ends with a space, it is end of word and may be the end of a sentence
      isBeforeWord = (!div[0] || /\s$/.test(div[0]));
      //for every non-word, add to current sentence
      currentSentence.push(div[0]);
      //keep track of sentence length
      sentenceLength += div[0].length;
    //console.log('length: ' + div.length + ', div[0]: *' + div[0] + '*, isFin: ' + isFinalizer + ', isSp: ' + isBeforeWord + ', div[1]: *' + div[1] + '*, div[2]: *' + div[2] + '*');
      //deal with the remainder of the pText
      if (div[1]) {
        pText = div[1];
      } else pText = '';
    }//end while pText
    //paragraph text is over, so take current sentence and add a line break, then save
    currentSentence.push('\n');
    //pass sentence with hard words on
    postSentence('end');
    hardWords = {};
    
  }//end for each paragraph 
  function postSentence(location) {
    var messageObj = {textArray: currentSentence, hardWords: hardWords, sentenceNumber: sentenceCount++, whence: location, status: progress, testNote: testNote};
    if (oEvent.data.isTest) {
      messageObj.isTest = oEvent.data.isTest;
    }
    postMessage(messageObj);
  }
  var finalObj = {status: 'finished'}
  postMessage(finalObj);
  self.close();
}//end onmessage function


    
    