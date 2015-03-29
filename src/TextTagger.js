/**
 * Text Tagger plugin extends jQuery (potentially expandable to AngularJS)
 * A simple widget that enables user to highlight text with hover instead of drag.
 * With the ability to bring up a context menu. Useful for allowing users to tag/annotate text
 */
jQuery.fn.textTagger = function (text, tagTypes, callback) {

    // global variables / state variables
    var $mainElem = $(this)
    var $textPane
    var callbackFn
    var currentAction
    var $creationMenu, $modificationMenu

    var api = {
        setText: function (newText) {
            if ($textPane)
                $textPane.remove()
            $textPane = convertAnnotatedTextToHTML(newText)
            bindEventHandlers($textPane);
            $mainElem.prepend($textPane)
            resetState()
        },
        setTagTypes: function (newTagTypes) {
            var menus = buildContextMenus(newTagTypes)
            $creationMenu = menus.$creationMenu;
            $modificationMenu = menus.$modificationMenu;
            $mainElem.append($creationMenu).append($modificationMenu)
        },
        setCallback: function (newCallback) {
            callbackFn = newCallback
        }
    }

    // initialization
    api.setText(text)
    api.setTagTypes(tagTypes)
    api.setCallback(callback)

    // ------------ private functions ------------

    /**
     * Bind events to the toke/span inside $textPane
     * @param $textPane
     */
    function bindEventHandlers($textPane) {
        // when tokens are clicked either begin/end tagging
        $textPane.children("span.token").on('click', handleTokenClick)
        // when tagged content is clicked - trigger modification
        $textPane.children("span.tagged").on('click', handleModification)
        // hover event handler - once in highlight mode, hovering causes additional words to be added to the selection
        $textPane.children("span").hover(handleTokenHover)
    }

    /**
     * create context menus for creation/modification mode
     * @param tagTypes
     * @return {{$creationMenu: (*|void), $modificationMenu: (*|void)}}
     */
    function buildContextMenus(tagTypes) {
        var $contextMenu = $(
            "<ul class='dropdown-menu context-menu' role='menu'></ul>"
        ).prepend(tagTypes.map(
                function (type) {
                    return $("<li class='menu-item' role='presentation' data-type='" + type.value + "'><a role='menuitem'>" + type.textLabel + "</a></li>")
                }
            )
        ).hide()
        var $cancel = $("<li role='presentation' class='bg-warning menu-item' data-type='cancel'><a role='menuitem'><span>Cancel</span></span></a></li>")
        var $delete = $("<li role='presentation' class='bg-danger menu-item' data-type='delete'><a role='menuitem'><span>Delete</span></span></a></li>")
        var $creationMenu = $contextMenu.clone().append($cancel.clone())
        var $modificationMenu = $contextMenu.clone().append($delete.clone()).append($cancel.clone())
        return {$creationMenu: $creationMenu, $modificationMenu: $modificationMenu};
    }

    /**
     * Display context menu and return a promised. Resolved when the user selects an item from the displayed context menu
     * @param lastEvent Javascript Event to help determine/anchor context menu display location
     * @param $contextMenu
     * @return {*}
     */
    function showContextMenu(lastEvent, $contextMenu) {
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

    function handleModification(event) {
        var $elem = $(this)
        showContextMenu(event, $modificationMenu).done(function (selectedType) {
            if (selectedType == 'delete') {
                $elem.before($(textToSpan($elem.text())).on('click', handleTokenClick).hover(handleTokenHover)).remove()
                callbackFn({
                    type: selectedType,
                    nlpText: convertHTMLToAnnotatedText($textPane),
                    taggedText: currentAction.selectedToken.join(" ")
                })
            }
            else if (selectedType != 'cancel') {
                $.each(tagTypes, function (idx, tagType) {
                    $elem.removeClass(tagType.value)
                })
                $elem.addClass(selectedType)
                $elem.attr('data-type', selectedType)
                callbackFn({
                    type: selectedType,
                    nlpText: convertHTMLToAnnotatedText($textPane),
                    taggedText: currentAction.selectedToken.join(" ")
                })
            }
            resetState()
        })
    }

    function handleTokenClick(event) {
        var $elem = $(this)
        // user must have terminated selection, so show them a context menu
        if (currentAction.highlightMode) {
            currentAction.highlightMode = false
            showContextMenu(event, $creationMenu).done(function (selectedType) {
                if (selectedType != 'cancel') {
                    addTaggedSpanToHTML($textPane, currentAction, selectedType)
                    callbackFn({
                        type: selectedType,
                        nlpText: convertHTMLToAnnotatedText($textPane),
                        taggedText: currentAction.selectedToken.join(" ")
                    })
                }
                resetState()
            })
        } else { // user must have initiated selection
            $(this).addClass('active')
            currentAction.startIdx = $elem.index()
            currentAction.endIdx = $elem.index()
            currentAction.selectedToken.push($elem.text())
            currentAction.limit = computeHighlightLimit($elem.index(), $textPane) // limit = index of the next tagged entity
            currentAction.highlightMode = true
        }
    }

    function handleTokenHover(event) {
        if (!highlightable(currentAction, $(this)))
            return

        var $elem
        var selectedIndex = $(this).index()
        // user is continuing selection
        if (selectedIndex > currentAction.endIdx) {
            $elem = $($(this).siblings().andSelf().get(currentAction.endIdx + 1))
            while (selectedIndex > currentAction.endIdx) {
                $elem.addClass('active')
                currentAction.selectedToken.push($elem.text())
                currentAction.endIdx++
                $elem = $elem.next('span.token')
            }
        } else if (selectedIndex < currentAction.endIdx) { // user must have rewinded selection
            $elem = $(this).next('span.token.active')
            while ($elem.length > 0) {
                $elem.removeClass('active')
                currentAction.selectedToken.pop()
                $elem = $elem.next('span.token.active')
                currentAction.endIdx = selectedIndex
            }
        }

        function highlightable(currentAction, $elem) {
            return currentAction.highlightMode && $elem.index() < currentAction.limit
        }

    }

    /**
     * Determines the location of the next tagged entity within the text. Used to prevent overlapping named entity identification
     *
     * @param index the starting index
     * @param $textPane jQuery element containing <span/> wrapped tokens
     * @return {number}
     */
    function computeHighlightLimit(index, $textPane) {
        var dataArray = $textPane.children('span')
        for (var i = 0; i < dataArray.length; i++) {
            if ($(dataArray.get(i)).hasClass('tagged') && i > index)
                return i
        }
        return dataArray.length
    }

    /**
     * Converts OpenNLP style annotated text to <span/> wrapped HTML jQuery element
     * @param rawText String with annotated text
     * @return jQuery element that wraps the text
     */
    function convertAnnotatedTextToHTML(rawText) {
        var normalTokens = rawText.split(/<START:\w+>[\w|\s]+<END>/g).map(function (tokenFragment) {
            return textToSpan(tokenFragment)
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
     * Converts HTML jQuery element containing <span/> text to OpenNLP style annotated text
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
    function addTaggedSpanToHTML($htmlContainer, currentTag, type) {
        // the original text is ruined if it contained any symbols ....
        var $newContent = $("<span data-type='" + type + "' class='" + type + " tagged'>" + currentTag.selectedToken.join(" ") + "</span>").on('click', handleModification)
        $htmlContainer.children("span.token.active").first().before($newContent)
        $htmlContainer.children("span.token.active").remove()
    }

    function resetState() {
        if ($textPane)
            $textPane.children("span.active").removeClass('active')
        currentAction = {
            highlightMode: false,
            endIdx: NaN,
            startIdx: NaN,
            limit: NaN,
            selectedToken: []
        }
        if ($creationMenu)
            $creationMenu.hide()
        if ($modificationMenu)
            $modificationMenu.hide()
    }

    return api
}

// helper
function textToSpan(text) {
    return text.split(' ').map(function (token) {
        return "<span class='token'>" + token + "</span>"
    }).join(' ')
}
