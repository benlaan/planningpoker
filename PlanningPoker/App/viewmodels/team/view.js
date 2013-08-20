define(['components/signalr', 'knockout'], function (signalr, ko) {

    return {

        groupName: ko.observable(""),
        playerName: ko.observable(""),

        submit: function () {

            alert("Hotsing.. " + groupName());
            signalr.newViewer(groupName(), playerName());

        }
    };
});