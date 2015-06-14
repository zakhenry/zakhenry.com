

angular.module('app.public.error', [])

    .config(function(stateHelperServiceProvider, $httpProvider) {

        stateHelperServiceProvider.addState('app.public.error', {
            views: {
                "main@app.public": {
                    controller: 'app.public.error.controller',
                    templateUrl: 'templates/app/public/error/error_template.tpl.html'
                }
            },
            params: {
                title: null,
                message: null,
                details: null,
                errorType: null,
                url: null,
                method: null
            }
        });

    })


    .controller('app.public.error.controller', function($rootScope, $scope, $stateParams, $state, $window, $filter) {

        $scope.title = $stateParams.title;
        $scope.message = $stateParams.message;
        $scope.url = $stateParams.url;
        $scope.method = $stateParams.method;

        if (!!$scope.details){
            $scope.details = _.isString($stateParams.details) ? $stateParams.details :  $filter('json')($stateParams.details);
        }

        $scope.goBack = function() {
            $window.history.back();
        };

        $scope.reload = function() {
            $window.location.reload();
        };

    })

;
