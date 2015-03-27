# TextTagger

Text Tagger plugin using jQuery (potentially expandable to AngularJS) A simple widget that enables user to highlight text with hover instead of drag. With the ability to bring up a context menu. Useful for allowing users to tag/annotate text

# Install

    bower install textTagger
    
    <!-- Requires jQuery and Bootstrap as well -->
    <link rel="stylesheet" href="src/TextTagger.css"/>
    <script src="src/TextTagger.js"></script>

# Usage

    $("#myDiv").textTagger("Text to be tagged", ["Tag Option 1","Tag Option 2"], function(tagResult){ ... })
