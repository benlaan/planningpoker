define(['plugins/router'], function (router)
{
    var ctor = function ()
    {
        var that = this;
        this.groupName = ko.observable("Ben");

        this.hostTeam = function ()
        {
            alert(that.groupName());
            router.navigate("/team/host");
        }

        this.joinTeam = function () {
            router.navigate("/team/join");
        }

        this.viewTeam = function () {
            router.navigate("/team/view");
        }
    };

    //Note: This module exports a function. That means that you, the developer, can create multiple instances.
    //This pattern is also recognized by Durandal so that it can create instances on demand.
    //If you wish to create a singleton, you should export an object instead of a function.
    //See the "flickr" module for an example of object export.

    return ctor;
});