define(['components/signalr', 'knockout'], function (signalr, ko) {

    // state 'enum'
    var stateInit = 0;
    var stateRunning = 1;
    var statePaused = 2;
    var stateStopped = 3;
    var stateFinished = 4;

    function TimeManager() {

        var scale = Math.pow(10, 7);
        var remaining = 120;
        var self = this;

        this.hostState = stateInit;
        this.timerId = null;
        this.endTime = null;

        this.totalDuration = remaining;
        this.plannedDuration = ko.observable(remaining.toString());
        this.remainingDuration = ko.observable("");
        this.progress = ko.observable(0);

        formatDuration = function (duration) {

            var remainingMinutes = parseInt(duration / 60);
            var remainingSeconds = parseInt(duration % 60);

            self.totalDuration = duration;
            return remainingMinutes + ":" + (remainingSeconds < 10 ? "0" : "") + remainingSeconds;
        };

        this.getTicks = function (dateTime) {

            return ((dateTime.getTime() * 10000) + 621355968000000000);
        }

        this.updateTime = function () {

            var duration = 0;

            switch (self.hostState) {

                case stateInit:
                    duration = parseInt(self.plannedDuration());
                    break;

                case stateRunning:

                    var nowTicks = self.getTicks(new Date());
                    var endTicks = self.getTicks(new Date(self.endTime));
                    duration = parseInt((endTicks - nowTicks) / scale);
                    break;

                case stateStopped:
                case statePaused:
                    duration = self.totalDuration;
                    break;
            }

            var totalDuration = parseInt(self.plannedDuration());
            var remainingDuration = duration;
            var progression = (100 - (100 * (duration / totalDuration))) + "%";
            self.progress(progression);
            self.remainingDuration(formatDuration(duration));
        };

        this.updateState = function (state) {

            self.hostState = state;

            if (state != stateFinished)
                timerId = setInterval(self.updateTime, 1000);
            else
                clearInterval(timerId);

        };

        this.formattedPlannedDuration = function () {

            return formatDuration(parseInt(self.plannedDuration()));
        };

        this.updateRemainingTime = function () {

            self.remainingDuration(self.formattedPlannedDuration());
        };
    };

    function Host() {

        var self = this;

        this.topClassName = ko.observable("");
        this.bottomClassName = ko.observable("hide");
        this.groupName = ko.observable("Violet Team");
        this.pauseTitle = ko.observable("Pause");

        this.state = stateInit;
        this.canStart = ko.observable();
        this.canStop  = ko.observable();
        this.canPause = ko.observable();
        this.canReset = ko.observable();

        this.participating = ko.observable(false);
        this.playerName = ko.observable("");

        this.playerNameShow = ko.computed(
            function () { return self.participating() ? "" : "hide"; },
            self
        );

        this.players = ko.observableArray();
        this.players().push({ name: "Ben",   score: "?" });
        this.players().push({ name: "Lin",   score: "?" });
        this.players().push({ name: "Lily",  score: "?" });
        this.players().push({ name: "Aiden", score: "?" });
        this.players().push({ name: "Dog",   score: "?" });
        this.players().push({ name: "Cat",   score: "?" });

        this.timer = new TimeManager();

        this.updateState = function (state) {

            self.state = state;
            self.canStart(state == stateInit);
            self.canStop(state == stateRunning || state == statePaused);
            self.canPause(state == stateRunning || state == statePaused);
            self.canReset(state == stateStopped || state == stateFinished || state == statePaused);

            self.pauseTitle(state == statePaused ? "Resume" : "Pause ");

           self.timer.updateState(self.state);
        };

        this.submit = function () {

            signalr.newTeam(this.groupName(), parseInt(self.timer.plannedDuration()));

            if (this.participating())
                signalr.newPlayer(this.groupName(), this.playerName());
            else
                signalr.newViewer(this.groupName(), this.groupName() + "Host");

            this.topClassName("hide");
            this.bottomClassName("");
            this.timer.updateRemainingTime();
        };

        this.start = signalr.start;
        this.stop = signalr.stop;
        this.pause = signalr.pause;
        this.newRound = signalr.newRound;

        signalr.client.started = function (endTime) {

            self.timer.endTime = endTime;
            self.updateState(stateRunning);
        };

        signalr.client.stopped = function () {

            self.timer.totalDuration = 0;
            self.updateState(stateFinished);
        };

        signalr.client.paused = function (endTime, durationRemaining) {

            self.timer.endTime = endTime;
            self.timer.duration = durationRemaining;

            self.updateState(self.state == statePaused ? stateRunning : statePaused);
        };

        signalr.client.reset = function () {

            updateState(stateInit);
            self.pauseTitle("Pause");
        };

        this.updateState(this.state);
    };

    return new Host();
});