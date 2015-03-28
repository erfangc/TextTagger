/**
 * Text Tagger plugin extends jQuery (potentially expandable to AngularJS)
 * A simple widget that enables user to highlight text with hover instead of drag.
 * With the ability to bring up a context menu. Useful for allowing users to tag/annotate text
 */
jQuery.fn.textTagger = function (text, tagTypes, callback) {

    var $mainElem = $(this), $textPane = convertAnnotatedTextToHTML(text), currentAction = {
        highlightMode: false,
        endIdx: NaN,
        startIdx: NaN,
        currentSelection: []
    }, $contextMenu = $(
        "<ul class='dropdown-menu context-menu' role='menu'>" +
        "<li role='presentation' class='bg-danger' data-type='cancel'><a role='menuitem'><span>Cancel</span></span></a></li>" +
        "</ul>"
    ).prepend(tagTypes.map(
            function (type) {
                return $("<li role='presentation' data-type='" + type.value + "'><a role='menuitem'>" + type.textLabel + "</a></li>")
            }
        )
    ).hide()

    $mainElem.append($textPane).append($contextMenu)

    $textPane.children("span").on('click', function (e) {
        var $elem = $(this)
        // user must have terminated selection, so show them a context menu
        if (currentAction.highlightMode) {
            currentAction.highlightMode = false
            showContextMenu(e).done(function (selectedType) {
                if (selectedType != 'cancel') {
                    addTaggedSpansToHTML($textPane, currentAction, selectedType)
                    callback({
                        type: selectedType,
                        nlpText: convertHTMLToAnnotatedText($textPane),
                        taggedText: currentAction.currentSelection.join(" ")
                    })
                }
                resetState()
            })
        } else { // user must have initiated selection
            $(this).addClass('active')
            currentAction.startIdx = $elem.index()
            currentAction.endIdx = $elem.index()
            currentAction.currentSelection.push($elem.text())
            currentAction.highlightMode = true
        }
    })

    // hover event handler - once in highlight mode, hovering causes additional words to be added to the selection
    $textPane.children("span").hover(
        // TODO disable the hover if overlapping with a tagged span
        function () {
            if (!currentAction.highlightMode) return
            var $elem
            var selectedIndex = $(this).index()
            if (selectedIndex > currentAction.endIdx) { // user is continuing selection
                $elem = $($(this).siblings().andSelf().get(currentAction.endIdx + 1))
                while (selectedIndex > currentAction.endIdx) {
                    $elem.addClass('active')
                    currentAction.currentSelection.push($elem.text())
                    currentAction.endIdx++
                    $elem = $elem.next('span.token')
                }
            } else if (selectedIndex < currentAction.endIdx) { // user must have rewinded selection
                $elem = $(this).next('span.token.active')
                while ($elem.length > 0) {
                    $elem.removeClass('active')
                    currentAction.currentSelection.pop()
                    $elem = $elem.next('span.token.active')
                    currentAction.endIdx = selectedIndex
                }
            }
        }
    )

    function showContextMenu(lastEvent) {
        var $promise = $.Deferred()
        $contextMenu.css({
            top: lastEvent.pageY + "px",
            left: lastEvent.pageX + "px"
        }).show()
        $contextMenu.children("li").on('click', function (e) {
            e.stopPropagation()
            $promise.resolve($(this).data('type'))
        })
        return $promise
    }

    /**
     * Converts OpenNLP style annotated text to <span></span> wrapped HTML jQuery element
     * @param rawText String with annotated text
     * @return jQuery element that wraps the text
     */
    function convertAnnotatedTextToHTML(rawText) {
        var normalTokens = rawText.split(/<START:\w+>[\w|\s]+<END>/g).map(function (tokenFragment) {
            // TODO wrap punctuation as well
            return tokenFragment.replace(/\b(\w+)\b/g, "<span class='token'>$1</span>")
        })

        var taggedMatches = rawText.match(/<START:(\w+)>([\w|\s]+)<END>/g)
        var taggedTokens = taggedMatches ? taggedMatches.map(function (match) {
            return match.replace(/<START:(\w+)>([\w|\s]+)<END>/g, "<span data-type='$1' class='$1 tagged'>$2</span>")
        }) : []

        var result = normalTokens[0]
        for (var i = 0; i < taggedTokens.length; i++) {
            result = result + taggedTokens[i] + normalTokens[i + 1]
        }
        return $("<div>" + result + "</div>")
    }

    /**
     * Converts HTML jQuery element containing <span></span> text to OpenNLP style annotated text
     * @param $htmlContainer jQuery object that wraps around the underlying HTML
     * @return Plain text annotated with OpenNLP tags
     */
    function convertHTMLToAnnotatedText($htmlContainer) {
        var $html = $htmlContainer.clone()
        // for every span w/ class 'tagged' we surround the inner text with <START:...>...<END>
        $.each($html.children('span.tagged'), function (idx, taggedSpan) {
            var $taggedSpan = $(taggedSpan)
            $taggedSpan.html("&lt;START:" + $taggedSpan.data('type') + "&gt; " + $taggedSpan.text() + " &lt;END&gt;")
        })
        // flatten all the spans into plain text
        return $html.text()
    }

    /**
     * Convert a set of <span/> elements into a single <span/> element that constitute a tagged entity
     * @param $htmlContainer The jQuery container element to tag
     * @param start start of the tag to be added
     * @param end end of the tag to be added
     * @param type the type of tag to add
     */
    function addTaggedSpansToHTML($htmlContainer, currentTag, type) {
        // the original text is ruined if it contained any symbols ....
        var $newContent = $("<span data-type='" + type + "' class='" + type + " tagged'>" + currentTag.currentSelection.join(" ") + "</span>")
        // TODO completely not working ... need algo to replace all active spans with $newContent
        $htmlContainer.children("span.token.active").first().before($newContent)
        $htmlContainer.children("span.token.active").remove()
    }

    function resetState() {
        $textPane.children("span.active").removeClass('active')
        currentAction = {
            highlightMode: false,
            endIdx: NaN,
            startIdx: NaN,
            currentSelection: []
        }
        $contextMenu.hide()
    }

    // TODO support for editing/deleting existing tags

}
