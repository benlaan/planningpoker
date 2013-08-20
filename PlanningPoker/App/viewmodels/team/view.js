define(['components/signalr', 'components/timeManager', 'components/states', 'knockout'], function (signalr, timer, states, ko) {

    function View() {

        var self = this;

        this.topClassName = ko.observable("");
        this.bottomClassName = ko.observable("hide");
        this.groupName = ko.observable("Violet Team");

        this.state = states.Init;

        this.players = ko.observableArray([]);

        // copy observables from timer for ease of knockout binding
        this.plannedDuration = timer.plannedDuration;
        this.remainingDuration = timer.remainingDuration;
        this.progress = timer.progress;

        this.updateState = function (state) {

            self.state = state;
            timer.updateState(self.state);
        };

        this.submit = function () {

            signalr.newViewer(this.groupName());

            self.topClassName("hide");
            self.bottomClassName("");
        };

        signalr.client.started = function (endTime) {

            timer.endTime = endTime;
            self.updateState(states.Running);
        };

        signalr.client.stopped = function () {

            timer.totalDuration = 0;
            self.updateState(states.Finished);
        };

        signalr.client.paused = function (endTime, durationRemaining) {

            timer.updateEndTime(endTime, durationRemaining);
            self.updateState(self.state == states.Paused ? states.Running : states.Paused);
        };

        signalr.client.reset = function () {

            self.updateState(states.Init);
        };

        signalr.client.addPlayer = function (playerName, score) {

            self.players.push({ name: playerName, score: ko.observable(score) });
        };

        signalr.client.removePlayer = function (playerName) {

            self.players.remove(function (p) { return p.name == playerName; });
        };

        signalr.client.updateScore = function (playerName, score) {

            var player = ko.utils.arrayFilter(self.players(), function (p) { return p.name == playerName; });

            if (player.length > 0)
                player[0].score(score);
        };

        this.updateState(this.state);
    };

    return new View();
});