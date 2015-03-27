/**
 * Text Tagger plugin extends jQuery (potentially expandable to AngularJS)
 * A simple widget that enables user to highlight text with hover instead of drag.
 * With the ability to bring up a context menu. Useful for allowing users to tag/annotate text
 */
jQuery.fn.textTagger = function (text, tagTypes, callback) {

    var $mainElem = $(this)
    var $textPane = $('<div></div>').html(text.replace(/\b(\w+)\b/g, "<span class='token'>$1</span>"))

    // these needs to reset
    var textTagger = {
        highlightMode: false,
        currentIndex: NaN,
        currentSelection: []
    }

    var $contextMenu = $(
        "<ul class='dropdown-menu context-menu' role='menu'>" +
        "<li role='presentation' class='bg-danger' data-type='cancel'><a role='menuitem'><span>Cancel</span></span></a></li>" +
        "</ul>").prepend(tagTypes.map(
            function (type) {
                return $("<li role='presentation' data-type='" + type.value + "'><a role='menuitem'>" + type.textLabel + "</a></li>")
            }
        )).hide()

    $mainElem.append($textPane).append($contextMenu)

    // click event handler
    $textPane.children("span").on('click', function (e) {
        var $elem = $(this)
        if (textTagger.highlightMode) { // user must have terminated selection, so show them a context menu
            // temporarily turn off highlighting mode while context menu active
            textTagger.highlightMode = false
            showContextMenu(e).done(function (selection) {
                if (selection != 'cancel') {
                    // Fire Call Back
                    callback({
                        type: selection,
                        nlpText: getNLPText(textTagger.currentIndex - textTagger.currentSelection.length + 1, textTagger.currentIndex, selection),
                        taggedText: textTagger.currentSelection.join(" ")
                    })
                    // reset everything
                    textTagger = {
                        highlightMode: false,
                        currentIndex: NaN,
                        currentSelection: []
                    }
                    $textPane.children("span.active").removeClass('active')
                } else // user must have hit the cancel button, re-enable highlighting
                    textTagger.highlightMode = true

                $contextMenu.hide()
            })
        } else { // user must have initiated selection
            $(this).addClass('active')
            textTagger.currentIndex = $elem.index()
            textTagger.currentSelection.push($elem.text())
            textTagger.highlightMode = true
        }
    })

    // hover event handler - once in highlight mode, hovering causes additional words to be added to the selection
    $textPane.children("span").hover(
        function () {
            if (!textTagger.highlightMode) return
            var $elem
            var selectedIndex = $(this).index()
            if (selectedIndex > textTagger.currentIndex) { // user is continuing selection
                $elem = $($(this).siblings().andSelf().get(textTagger.currentIndex + 1))
                while (selectedIndex > textTagger.currentIndex) {
                    $elem.addClass('active')
                    textTagger.currentSelection.push($elem.text())
                    textTagger.currentIndex++
                    $elem = $elem.next('span.token')
                }
            } else if (selectedIndex < textTagger.currentIndex) { // user must have rewinded selection
                $elem = $(this).next('span.token.active')
                while ($elem.length > 0) {
                    $elem.removeClass('active')
                    textTagger.currentSelection.pop()
                    $elem = $elem.next('span.token.active')
                    textTagger.currentIndex = selectedIndex
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

    function getNLPText(start, end, type) {
        // copy the entire text with the spans in memory
        var $text = $textPane.clone()

        var $start = $($text.children('span')[start])
        $start.html("&lt;START:" + type + "&gt; " + $start.text())

        var $end = $($text.children('span')[end])
        $end.html($end.text() + " &lt;END&gt;")

        return $text.text()
    }

    return textTagger
}


