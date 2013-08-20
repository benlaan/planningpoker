define(['plugins/router', 'durandal/app'], function (router, app)
{
    return {
        router: router,

        activate: function () {

            router.map([
                { route: '', title:'Start', moduleId: 'viewmodels/start', nav: true },
                { route: 'host', moduleId: 'viewmodels/team/host', nav: false },
                { route: 'join', moduleId: 'viewmodels/team/join', nav: false },
                { route: 'view', moduleId: 'viewmodels/team/view', nav: false }
            ])
            .buildNavigationModel();
            
            return router.activate();
        }
    };
});