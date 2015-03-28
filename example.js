$(function () {
    var text = "Lorem <START:policy>ipsum dolor<END> sit amet, sit lacus vestibulum vel platea aliquam. " +
        "Id consectetuer auctor viverra ac orci, repellat <START:organization>cursus in morbi est<END>. " +
        "Pretium erat tellus nunc etiam, ac justo. In non ac ornare sed, volutpat ipsum nunc velit. " +
        "Diam hac quis vestibulum magna fermentum, et erat volutpat et placerat ut id, vitae nulla vestibulum non nisl est, " +
        "tristique fringilla vehicula mauris est.";
    $("#output").text(text)

    $("#main").textTagger(text, [
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
    })
})
