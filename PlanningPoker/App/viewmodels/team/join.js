define(['components/signalr', 'components/timeManager', 'components/states', 'knockout'], function (signalr, timer, states, ko) {

    function Client()
    {
        groupName = ko.observable("Violet Team");
        playerName = ko.observable("Laany");

        submit = function () {

            signalr.newPlayer(groupName(), playerName());

        };
    }

    return new Client();
});