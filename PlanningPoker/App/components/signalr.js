define(function () {

    var proxy = $.connection.teamHub;

    $.connection.hub.start({ transport: ['webSockets', 'serverSentEvents', 'longPolling'] })

    var teamHub = {

        newPlayer: function (team, player) {

            proxy.server.newPlayer(team, player);
        },

        newViewer: function (team, player) {

            proxy.server.newViewer(team, player);
        },

        newTeam: function (team, duration) {

            proxy.server.newTeam(team, duration);
        },

        start: function () {

            proxy.server.start();
        },

        stop: function () {

            proxy.server.stop();
        },

        pause: function () {

            proxy.server.pause();
        },

        newRound: function () {

            proxy.server.newRound();
        },

        client: proxy.client
    };

    return teamHub;
});