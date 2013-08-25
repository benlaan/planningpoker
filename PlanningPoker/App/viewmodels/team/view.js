define([

    'knockout',
    'components/signalr',
    'components/timeManager',
    'components/states',
    'components/teamManager'

], function (ko, signalr, timer, states, TeamManager) {

    function View() {

        var self = this;

        this.topClassName = ko.observable("");
        this.bottomClassName = ko.observable("hide");
        this.teamName = ko.observable("Violet Team");

        this.teamManager = new TeamManager(self);

        // FIX: copying observables from timer for ease of knockout binding shouldn't required!!
        this.players = self.teamManager.players;

        this.state = states.Init;

        // copy observables from timer for ease of knockout binding
        this.plannedDuration = timer.plannedDuration;
        this.remainingDuration = timer.remainingDuration;
        this.progress = timer.progress;

        this.updateState = function (state) {

            self.state = state;
            timer.updateState(self.state);
        };

        this.submit = function () {

            signalr.newViewer(this.teamName());

            self.topClassName("hide");
            self.bottomClassName("");
        };

        this.updateState(this.state);
    };

    return new View();
});