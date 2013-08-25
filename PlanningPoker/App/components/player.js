define(['knockout'], function (ko) {

    return function Player(name, score) {

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
});