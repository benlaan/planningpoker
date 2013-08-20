define(function () {

    var proxy = $.connection.teamHub;

    $.connection.hub.start({ transport: ['webSockets', 'serverSentEvents', 'longPolling'] })

    var teamHub = {

        newPlayer:   proxy.server.newPlayer,
        newViewer:   proxy.server.newViewer,
        newTeam:     proxy.server.newTeam,
        newRound:    proxy.server.newRound,

        start:       proxy.server.start,
        stop:        proxy.server.stop,
        pause:       proxy.server.pause,

        submitScore: proxy.server.submitScore,

        client:      proxy.client
    };

    return teamHub;
});