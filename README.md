# TextTagger

Text Tagger plugin using jQuery (potentially expandable to AngularJS) A simple widget that enables user to highlight text with hover instead of drag. With the ability to bring up a context menu. Useful for allowing users to tag/annotate text

## Install

    bower install textTagger
    
    <!-- Requires jQuery and Bootstrap as well -->
    <link rel="stylesheet" href="src/TextTagger.css"/>
    <script src="src/TextTagger.js"></script>

## Usage

    $("#myDiv").textTagger(text <String>, tagTypes <Array of Object>, callbackFn <Function>)

`callbackFn` is fired once the user have highlighted a sub-string in `text` and chosen a "type" from the options available in `tagTypes`. See below an example.

## Example
    $(function () {
        $("#main").textTagger("Lorem ipsum dolor sit amet, sit lacus vestibulum vel platea aliquam.",
        [
            {
                textLabel: 'Organization',
                value: 'organization'
            },
            {
                textLabel: 'Person',
                value: 'person'
            },
            {
                textLabel: 'Policy',
                value: 'policy'
            },
            {
                textLabel: 'Location',
                value: 'location'
            },
            {
                textLabel: 'Product',
                value: 'product'
            }
        ], function (userTaggedResult) {
            console.log(userTaggedResult);
        })
    })

The argument passed to the `callbackFn` contains the following properties: `type`, `taggedText` and `nlpText`

`nlpText` comprises of raw text interlaced with the user tagged text, denoted as `<START:type> [User Tagged Text] <END>`. This notation is compatible with OpenNLP Named Entity Recognition training engine.


