define(['components/signalr', 'components/timeManager', 'components/states', 'knockout'], function (signalr, timer, states, ko) {

    function Player(name, score) {

        var defaultValue = "?";
        var self = this;

        this.name = name;
        this.score = ko.observable(score);
        this.submittedScore = ko.observable(defaultValue);

        this.isSubmitted = function () { return self.submittedScore() != defaultValue; };
        this.isPresented = function () { return self.submittedScore() == self.score(); };

        this.cardClass = ko.computed(function () {

                var cardClass = "card";

                if (self.isPresented())
                    return cardClass + " frontface";

                if (self.isSubmitted())
                    return cardClass + " backface";

                return cardClass; 
            },
            self
        );

        this.updateScore = function (score) {

            self.submittedScore(score);
            if (score == "?")
                self.score(score);
        };
    };

    function Host() {

        var self = this;

        this.topClassName = ko.observable("");
        this.bottomClassName = ko.observable("hide");
        this.pauseTitle = ko.observable("Pause");
        this.groupName = ko.observable("Violet Team");

        this.state = states.Init;
        this.canStart = ko.observable();
        this.canStop  = ko.observable();
        this.canPause = ko.observable();
        this.canReset = ko.observable();

        this.participating = ko.observable(false);
        this.playerName = ko.observable("Hoster");
        this.players = ko.observableArray([]);

        this.playerNameShow = ko.computed(

            function () { return self.participating() ? "" : "hide"; },
            self
        );

        // copy observables from timer for ease of knockout binding
        this.plannedDuration = timer.plannedDuration;
        this.remainingDuration = timer.remainingDuration;
        this.progress = timer.progress;

        // delegate button actions to the signalr client proxy..
        this.start = signalr.start;
        this.stop = signalr.stop;
        this.pause = signalr.pause;
        this.newRound = signalr.newRound;

        this.updateState = function (state) {

            self.state = state;
            self.canStart(state == states.Init);
            self.canStop(state == states.Running || state == states.Paused);
            self.canPause(state == states.Running || state == states.Paused);
            self.canReset(state == states.Stopped || state == states.Finished || state == states.Paused);

            self.pauseTitle(state == states.Paused ? "Resume" : "Pause");

           timer.updateState(self.state);
        };

        this.submit = function () {

            signalr.newTeam(
                this.groupName(),
                this.playerName(), 
                parseInt(timer.plannedDuration()), 
                this.participating()
            );

            self.topClassName("hide");
            self.bottomClassName("");
        };

        this.showSubmittedScores = function () {

            $.each(self.players(), function (i, p) {

                p.score(p.submittedScore());
            });
        }

        signalr.client.started = function (endTime) {

            timer.endTime = endTime;
            self.updateState(states.Running);
        };

        signalr.client.stopped = function () {

            timer.totalDuration = 0;
            self.updateState(states.Finished);
            self.showSubmittedScores();
        };

        signalr.client.paused = function (endTime, durationRemaining) {

            timer.updateEndTime(endTime, durationRemaining);
            self.updateState(self.state == states.Paused ? states.Running : states.Paused);
        };

        signalr.client.reset = function () {

            self.updateState(states.Init);
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

        this.updateState(this.state);
    };

    return new Host();
});