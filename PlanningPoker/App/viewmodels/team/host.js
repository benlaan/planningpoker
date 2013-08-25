define([

    'knockout',
    'components/signalr',
    'components/timeManager',
    'components/teamManager',
    'components/states'

], function (ko, signalr, timer, TeamManager, states) {

    function Host() {

        var self = this;

        this.topClassName = ko.observable("");
        this.bottomClassName = ko.observable("hide");
        this.pauseTitle = ko.observable("Pause");
        this.teamName = ko.observable("Violet Team");

        self.teamManager = new TeamManager(self);

        // FIX: copying observables from timer for ease of knockout binding shouldn't be required!!
        self.players = self.teamManager.players;

        this.state = states.Init;
        this.canStart = ko.observable();
        this.canStop  = ko.observable();
        this.canPause = ko.observable();
        this.canReset = ko.observable();

        this.participating = ko.observable(false);
        this.playerName = ko.observable("Hoster");
        this.playerNameShow = ko.computed(

            function () { return self.participating() ? "" : "hide"; },
            self
        );

        // FIX: copying observables from timer for ease of knockout binding shouldn't be required!!
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
                this.teamName(),
                this.playerName(), 
                parseInt(timer.plannedDuration()), 
                this.participating()
            );

            self.topClassName("hide");
            self.bottomClassName("");
        };

        this.updateState(this.state);
    };

    var host = new Host();
    return host;
});