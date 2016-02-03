function(jserver,$http){
    return {
        scope : {
            jBrand : '@',
            jLinks : '='
        },
        templateUrl : jserver + 'scripts/components/navigation/navigation.html',
        // controller  : ['Auth','AuthFactory',function(Auth,AuthFactory){
        //     var self = this;
        //     self.auth = Auth.authentication;
            
        //     self.popUpLogin = function(){
        //         AuthFactory.popUpLogin();
        //     };
            
        //     self.popUpRegister = function(){
        //         AuthFactory.popUpRegister();
        //     };
        // }],
        controller : [function(){
            var self = this;
            self.popUpLogin = function(){
                alert('login');
            };
            
            self.popUpRegister = function(){
                alert('register');
            };
        }],
        controllerAs : 'navigationCtrlDirective'
    };
}