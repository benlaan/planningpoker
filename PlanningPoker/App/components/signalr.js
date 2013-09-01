define(function () {

    var proxy = $.connection.teamHub;

    $.connection.hub.logging = true;

    $.connection.hub.start({ transport: ['webSockets', 'serverSentEvents', 'longPolling'] })

    var teamHub = {

        newTeam: function (team, player, duration, participating) {

            return proxy.server.newTeam(team, player, duration, participating)
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

        error: function() {},

        submitScore: proxy.server.submitScore,

        client: proxy.client
    };

    $.connection.hub.error(function (error) {

        console.log('SignalR error', error);
        teamHub.error(error);
    });

    return teamHub;
});
