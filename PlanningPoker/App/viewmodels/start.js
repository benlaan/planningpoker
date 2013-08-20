define(['plugins/router'], function (router)
{
    var ctor =
    {
        hostTeam: function () {
            router.navigate("host");
        },

        joinTeam: function () {
            router.navigate("join");
        },

        viewTeam: function () {
            router.navigate("view");
        }
    };
    return ctor;
});