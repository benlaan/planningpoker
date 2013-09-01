define([
    'components/signalr',
    'components/timeManager',
    'components/states',
    'knockout'

], function (signalr, timer, states, ko) {

    function Client()
    {
        var self = this;

        this.state = states.Init;
        this.topClassName = ko.observable("");
        this.bottomClassName = ko.observable("hide");

        this.teamName = ko.observable("Violet Team");
        this.playerName = ko.observable("Laany");
        this.errorText = ko.observable();

        this.scores = ko.observableArray([]);

        // copy observables from timer for ease of knockout binding
        this.plannedDuration = timer.plannedDuration;
        this.remainingDuration = timer.remainingDuration;
        this.progress = timer.progress;

        submit = function () {

            signalr.newPlayer(self.teamName(), self.playerName());

        };

        signalr.client.joined = function (scores) {

            self.topClassName("hide");
            self.bottomClassName("");

            for (var i = 0; i < scores.length; i++) {
                self.scores.push(scores[i]);
            }
        };

        this.updateState = function (state) {

            self.state = state;
            timer.updateState(self.state);
        };

        signalr.client.started = function (currentTime, endTime) {

            timer.setTime(currentTime, endTime);
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

        updateScore = function (score) {

            signalr.submitScore(score);

        };

        signalr.client.error = function (exception) {

            console.log(exception);
            self.errorText(exception);
        };

        timer.updateState(self.state);
    }

    return new Client();
});