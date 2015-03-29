$(function () {
    var text = "Lorem <START:policy>ipsum dolor<END> sit amet, sit lacus vestibulum vel platea aliquam. " +
        "Id consectetuer auctor viverra ac orci, repellat <START:organization>cursus in morbi est<END>. " +
        "Pretium erat tellus nunc etiam, ac justo. In non ac ornare sed, volutpat ipsum nunc velit. " +
        "Diam hac quis vestibulum magna fermentum, et erat volutpat et placerat ut id, vitae nulla vestibulum non nisl est, " +
        "tristique fringilla vehicula mauris est.";
    $("#output").text(text)
    $("#tags-in-text").html("<em>Start tagging and your tags will show up here</em>")
    var textTagger = $("#main").textTagger(text, [
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
        $("#output").text(userTaggedResult.nlpText)
        $("#tags-in-text").html(userTaggedResult.tags.map(function (tag) {
            return "<span class='tagged " + tag.type + "'>" + tag.text + "</span>"
        }).join(' '))
    })

    $('#next').on('click', function () {
        textTagger.setText("This is a new paragraph ... here are some names: <START:person>Jane Doe<END> <START:organization>IMF<END>")
    })

})
