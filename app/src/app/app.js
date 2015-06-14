angular.module('app', [
    'templates',
    'vendorModules',
    'commonModules',
    'stateManager'
])
    .constant('API_URL', '/api')
    .config(function($mdIconProvider, $mdThemingProvider){
        $mdIconProvider.fontSet('fa', 'fontawesome');

        $mdThemingProvider.theme('default')
            .primaryPalette('green')
            .accentPalette('grey')
        ;

    })

    .run(function($rootScope) {
        moment.locale('en-gb');
        $rootScope.$on("$stateChangeError", _.bind(console.error, console));
    })

    .controller('AppCtrl', function($scope, $mdSidenav) {


        $scope.test = 'hello world';
        $scope.toggleLeftNav = function(){
            $mdSidenav('left').toggle();
        }

    })

;