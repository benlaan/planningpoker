define(['components/states'], function (states) {

    function TimeManager() {

        var scale = Math.pow(10, 7);
        var remaining = 120;
        var self = this;

        this.hostState = states.Init;
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

                case states.Init:
                    duration = parseInt(self.plannedDuration());
                    break;

                case states.Running:

                    var nowTicks = self.getTicks(new Date());
                    var endTicks = self.getTicks(new Date(self.endTime));
                    duration = parseInt((endTicks - nowTicks) / scale);
                    break;

                case states.Stopped:
                case states.Paused:
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

            if (state != states.Finished)
                timerId = setInterval(self.updateTime, 1000);
            else
                clearInterval(timerId);

        };

        this.formattedPlannedDuration = function () {

            return formatDuration(parseInt(self.plannedDuration()));
        };

        //this.updateRemainingTime = function () {

        //    self.remainingDuration(self.formattedPlannedDuration());
        //};

        this.updateEndTime = function(endTime, duration) {

            self.endTime = endTime;
            self.duration = duration;

        };
    };

    return new TimeManager();
});