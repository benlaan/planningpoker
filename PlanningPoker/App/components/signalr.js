define(function () {

    var proxy = $.connection.teamHub;

    $.connection.hub.start({transport: ['webSockets', 'serverSentEvents', 'longPolling'] })

    var teamHub = {

        newTeam: function (team, player, duration, participating) {

            proxy.server.newTeam(team, player, duration, participating);
        },

        newPlayer: function (team, player) {

            proxy.server.newPlayer(team, player);
        },

        newViewer: function (team) {

            proxy.server.newViewer(team);
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

        submitScore: proxy.server.submitScore,

        client: proxy.client
    };

    return teamHub;
});
