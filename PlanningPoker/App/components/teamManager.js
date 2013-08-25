define([
    'knockout',
    'components/signalr',
    'components/timeManager',
    'components/states',
    'components/player'

], function (ko, signalr, timer, states, Player) {

    return function TeamManager(host) {

        var self = this;

        this.host = host;
        this.players = ko.observableArray([]);
        this.teamName = host.teamName();
        this.state = ko.observable(states.Init);

        this.showSubmittedScores = function () {

            $.each(self.players(), function (i, p) {

                p.score(p.submittedScore());
            });
        }

        signalr.client.started = function (endTime) {

            timer.endTime = endTime;
            host.updateState(states.Running);
        };

        signalr.client.stopped = function () {

            timer.totalDuration = 0;
            host.updateState(states.Finished);
            self.showSubmittedScores();
        };

        signalr.client.paused = function (endTime, durationRemaining) {

            timer.updateEndTime(endTime, durationRemaining);
            host.updateState(self.state == states.Paused ? states.Running : states.Paused);
        };

        signalr.client.reset = function () {

            host.updateState(states.Init);
        };

        signalr.client.addPlayer = function (playerName, score) {

            self.players.push(new Player(playerName, score));
        };

        signalr.client.removePlayer = function (playerName) {

            self.players.remove(function (p) { return p.name == playerName; });
        };

        signalr.client.updateScore = function (playerName, score) {

            var player = ko.utils.arrayFilter(self.players(), function (p) { return p.name == playerName; });

            if (player.length > 0)
                player[0].updateScore(score);

            var submitCount = ko.utils.arrayFilter(self.players(), function (p) { return p.isSubmitted(); });
            if (self.players().length == submitCount.length)
                self.showSubmittedScores();
        };

    };
});