define(['components/signalr', 'knockout'], function (signalr, ko) {

    var join = new Client()
    {
        groupName = ko.observable("");
        playerName = ko.observable("");

        submit = function () {

            signalr.newPlayer(groupName(), playerName());

        };
    };

    return join;
});