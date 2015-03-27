jQuery.fn.textTagger = function (text, tagTypes, callback) {

    var $mainElem = $(this)

    $mainElem.html(text.replace(/\b(\w+)\b/g, "<span class='token'>$1</span>"))

    // these needs to reset
    var highlightMode = false
    var currentIndex = NaN
    var currentSelection = []

    var $contextMenu = $(
        "<ul class='dropdown-menu context-menu' role='menu'>" +
        "<li role='presentation' data-type='cancel'><a role='menuitem' tabindex='-1' class='bg-danger'><span>Cancel</span></span></a></li>" +
        "</ul>")

    // context menu init and event handler
    $contextMenu.prepend(tagTypes.map(
        function (type) {
            return $("<li role='presentation' data-type='" + type + "'><a role='menuitem' tabindex='-1'>" + type + "</a></li>")
        }
    ))

    // click event handler
    $mainElem.children("span").on('click', function (e) {
        var $elem = $(this)
        if (highlightMode) { // user must have terminated selection, so show them a context menu

            // temporarily turn off highlighting mode while context menu active
            highlightMode = false
            showContextMenu(e).done(function (selection) {
                if (selection != 'cancel') {
                    // Fire Call Back
                    callback({
                        type: selection,
                        taggedText: currentSelection.join(" ")
                    })
                    // reset everything
                    highlightMode = false
                    currentSelection = []
                    currentIndex = NaN
                    $mainElem.children("span.active").removeClass('active')
                } else {
                    // user must have hit the cancel button, re-enable highlighting
                    highlightMode = true
                }
                $contextMenu.detach()
            })
        } else { // user must have initiated selection
            $(this).addClass('active')
            currentIndex = $elem.index()
            currentSelection.push($elem.text())
            highlightMode = true
        }
    })

    // hover event handler - once in highlight mode, hovering causes additional words to be added to the selection
    $mainElem.children("span").hover(
        function () {
            if (!highlightMode) return
            var $elem
            var selectedIndex = $(this).index()
            if (selectedIndex > currentIndex) { // user is continuing selection
                $elem = $($(this).siblings().andSelf().get(currentIndex + 1))
                while (selectedIndex > currentIndex) {
                    $elem.addClass('active')
                    currentSelection.push($elem.text())
                    currentIndex++
                    $elem = $elem.next('span.token')
                }
            } else if (selectedIndex < currentIndex) { // user must have rewinded selection
                $elem = $(this).next('span.token.active')
                while ($elem.length > 0) {
                    $elem.removeClass('active')
                    currentSelection.pop()
                    $elem = $elem.next('span.token.active')
                    currentIndex = selectedIndex
                }
            }
        }
    )

    function showContextMenu(lastEvent) {
        var $promise = $.Deferred()
        $contextMenu.appendTo($(lastEvent.currentTarget)).css({
            top: lastEvent.pageY + "px",
            left: lastEvent.pageX + "px"
        })
        $contextMenu.children("li").on('click', function (e) {
            e.stopPropagation()
            $promise.resolve($(this).data('type'))
        })
        return $promise
    }
}
