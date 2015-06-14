angular.module('app.public.blog', [])

    .config(function(stateHelperServiceProvider) {
        stateHelperServiceProvider.addState('app.public.blog', {
            url: '/blog',
            views: {
                "main@app.public": {
                    controller: 'app.public.blog.controller',
                    templateUrl: 'templates/app/public/blog/blog.tpl.html'
                }
            },
            resolve: /*@ngInject*/{
            },
            data: {
                title: "Blog",
                role: 'public',
                icon: 'content_paste',
                sortAfter: 'app.public.home',
                navigation: true
            }
        });
    })

    .controller('app.public.blog.controller', function($scope) {


    })

;