define(['components/signalr', 'knockout'], function (signalr, ko) {

    // state 'enum'
    var stateInit     = 0;
    var stateRunning  = 1;
    var statePaused   = 2;
    var stateStopped  = 3;
    var stateFinished = 4;

    function Host()
    {
        var scale = Math.pow(10, 7);
        var remaining = 120;
        var self = this;
        
        this.topClassName = ko.observable("");
        this.bottomClassName = ko.observable("hide");
        this.groupName = ko.observable("Test");
        this.pauseTitle = ko.observable("Pause");

        this.state = stateInit;
        this.endTime = null;
        this.totalDuration = remaining;

        this.plannedDuration = ko.observable(remaining.toString());
        this.remainingDuration = ko.observable("");
        this.progress = ko.observable(0);
        this.timerId = null;

        this.canStart = ko.observable(true);
        this.canStop = ko.observable(false);
        this.canPause = ko.observable(false);
        this.canReset = ko.observable(false);

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

        formatDuration = function(duration)
        {
            var remainingMinutes = parseInt(duration / 60);
            var remainingSeconds = parseInt(duration % 60);

            self.totalDuration = duration;
            return remainingMinutes + ":" + (remainingSeconds < 10 ? "0" : "") + remainingSeconds;
        };

        updateState = function (state) {

            self.state = state;
            self.canStart(state == stateInit);
            self.canStop(state == stateRunning || state == statePaused);
            self.canPause(state == stateRunning || state == statePaused);
            self.canReset(state == stateStopped || state == stateFinished || state == statePaused);

            if (state != stateFinished) 
                timerId = setInterval(self.updateTime, 100);
            else
                clearInterval(timerId);
        };

        this.submit = function () {

            signalr.newTeam(this.groupName(), parseInt(this.plannedDuration()));

            if (this.participating()) 
                signalr.newPlayer(this.groupName(), this.playerName());
            else 
                signalr.newViewer(this.groupName(), this.groupName() + "Host");

            this.topClassName("hide");
            this.bottomClassName("");
            this.remainingDuration(formatDuration(parseInt(this.plannedDuration())));
        };

        this.updateTime = function () {

            var getTicks = function (dateTime) {

                return ((dateTime.getTime() * 10000) + 621355968000000000);
            }

            var duration = 0;

            switch (self.state)
            {
                case stateInit:
                    duration = parseInt(self.plannedDuration());
                    break;

                case stateRunning:

                    var nowTicks = getTicks(new Date());
                    var endTicks = getTicks(new Date(self.endTime));
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

        this.start = signalr.start;
        this.stop = signalr.stop;
        this.pause = signalr.pause;
        this.newRound = signalr.newRound;

        signalr.client.started = function (endTime) {

            self.endTime = endTime;
            updateState(stateRunning);
        };

        signalr.client.stopped = function () {

            self.totalDuration = 0;
            updateState(stateFinished);
        };

        signalr.client.paused = function (endTime, durationRemaining) {

            self.endTime = endTime;
            self.duration = durationRemaining;
            var newState = self.state == statePaused ? stateRunning : statePaused;
            updateState(newState);
            var pauseTitle = self.state == statePaused ? "Resume" : "Pause ";
            self.pauseTitle(pauseTitle);
        };

        signalr.client.reset = function () {

            updateState(stateInit);
            self.pauseTitle("Pause");
        };
    };

    return new Host();
});