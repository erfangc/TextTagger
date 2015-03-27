$(function () {
    var origText = $("#main").text()

    $("#main").html($("#main").text().replace(/\b(\w+)\b/g, "<span class='token'>$1</span>"))

    // these needs to reset
    var highlightMode = false
    var currentIndex = NaN
    var currentSelection = []

    var $contextMenu = $("<ul class='dropdown-menu' role='menu' aria-labelledby='dropdownMenu1'>" +
    "<li role='presentation'><a role='menuitem' tabindex='-1' href='#'>Action</a></li>" +
    "<li role='presentation'><a role='menuitem' tabindex='-1' href='#'>Another action</a></li>" +
    "<li role='presentation'><a role='menuitem' tabindex='-1' href='#'>Something else here</a></li>" +
    "<li role='presentation'><a role='menuitem' tabindex='-1' href='#'>Separated link</a></li>" +
    "</ul>")

    // click event handler
    $("#main span").on('click', function (e) {
        var $elem = $(this)
        if (highlightMode) { // user must have terminated selection
            // TODO callback should return a promise
            var isCancelled = selectionCompleteCallback(currentSelection, e)
            if (!isCancelled) {
                // reset everything
                highlightMode = false
                currentSelection = []
                currentIndex = NaN
            }
            $("#main span.active").removeClass('active')
        } else { // user must have initiated selection
            $(this).addClass('active')
            currentIndex = $elem.index()
            currentSelection.push($elem.text())
            highlightMode = true
        }
    })

    $("#main span").hover(
        function (e) {
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
        },
        function (e) {
        }
    )

    selectionCompleteCallback = function (selection, lastEvent) {
        // TODO somehow display context menu
        $contextMenu.appendTo($(lastEvent.currentTarget))
        return false
    }

})
