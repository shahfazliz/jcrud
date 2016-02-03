'use strict';

/*global angular*/
var app = angular.module('jcrud', ['ui.router']);
    
app.constant('jserver', 'https://jcrud-shahfazliz.c9users.io/');
app.constant('jdbserver', 'https://jbase-shahfazliz.c9users.io/');
    
app.config(['$stateProvider', '$urlRouterProvider', '$logProvider', 'jserver',
    function ($stateProvider,$urlRouterProvider,$logProvider,jserver){
        
        $urlRouterProvider.otherwise("/");
        
        $stateProvider.state('admin.error', {
            url         : '/error',
            templateUrl : jserver+'views/error.html',
            params      : {
                toState   : '',
                toParams  : ''
            },
            data        : {
                title     : 'Error',
                model     : '',
                action    : '',
                id        : '',
                debugging : false
            }
        });
        
        $stateProvider.state('admin.auth', {
            abstract    : true,
            url         : '/auth',
            
            // Note: abstract still needs a ui-view for its children to populate.
            // You can simply add it inline here.
            template: '<ui-view/>'        
        });
    
        $stateProvider.state('admin.auth.read', {
            url         : '/read',
            templateUrl : jserver+'scripts/components/CRUD/read.html',
            controller  : 'AuthCtrl',
            controllerAs: 'ctrl',
            data        :{
                title     : 'Authentication Profile',
                model     : 'Auth',
                action    : 'Read',
                debugging : false
            }
        });
    
        $stateProvider.state('admin.auth.read.id', {
            url         : '/:id',
            templateUrl : jserver+'scripts/components/CRUD/read.html',
            controller  : 'AuthCtrl',
            controllerAs: 'ctrl',
            data        :{
                title     : 'Authentication Profile',
                model     : 'Auth',
                action    : 'Read',
                debugging : false
            }
        });
    
        $stateProvider.state('admin.auth.logout', {
            url         : '/logout',
            controller  : ['AuthFactory','$state',function(AuthFactory,$state){
                AuthFactory.setLoggedOut();
                $state.go('home');
            }],
            data        : {
                title     : 'Logout',
                debugging : false
            }
        });
    
        $stateProvider.state('admin.auth.forgot', {
            url         : '/forgot',
            data        : {
                title     : 'Forgot',
                debugging : false
            }
        });
    
        $stateProvider.state('admin.role', {
            abstract    : true,
            url         : '/role',
            
            // Note: abstract still needs a ui-view for its children to populate.
            // You can simply add it inline here.
            template: '<ui-view/>'    
        });
    
        $stateProvider.state('admin.role.main', {
            url         : '/',
            templateUrl : jserver+'scripts/components/role/main.html',
            controller  : 'MainRoleCtrl',
            controllerAs: 'ctrl',
            data        : {
                title     : 'Roles',
                model     : 'Role',
                action    : 'Read',
                debugging : false
            }
        });
        
        $stateProvider.state('admin.role.create', {
            url         : '/create',
            templateUrl : jserver+'scripts/components/CRUD/create.html',
            controller  : 'RoleCtrl',
            controllerAs: 'ctrl',
            data        : {
                title     : 'Create Role',
                model     : 'Role',
                action    : 'Create',
                debugging : false
            }
        });
        
        $stateProvider.state('admin.role.read', {
            url         : '/read',
            templateUrl : jserver+'scripts/components/CRUD/read.html',
            controller  : 'RoleCtrl',
            controllerAs: 'ctrl',
            data        :{
                title     : 'Role',
                model     : 'Role',
                action    : 'Read',
                debugging : false
            }
        });
        
        $stateProvider.state('admin.role.read.id', {
            url         : '/:id',
            templateUrl : jserver+'scripts/components/CRUD/read.html',
            controller  : 'AuthCtrl',
            controllerAs: 'ctrl',
            data        :{
                title     : 'Role',
                model     : 'Role',
                action    : 'Read',
                debugging : false
            }
        });
    }]);
        
app.factory('CRUD', ['$log','Auth','$resource','$http','$httpParamSerializer',function($log,Auth,$resource,$http,$httpParamSerializer){
    
    // Test callback if callback is a function
    function runCallback( callback, data ){
        console.log('execute callback with data : ', data);
        if(typeof callback === 'function'){
            callback(data);
            console.log('callback executed');
        }
        else console.log('callback NOT executed');
    }
    
    return {
        create: function(model, params, callbackSucess, callbackFail){
            // Populate Database
            // Get only keys and values in model.properties
            var json = {};
            if(Auth.authentication.token){
                json['APIToken'] = Auth.authentication.token;
            }
            
            angular.forEach(model.properties, function(v, k){
                json[k] = v.value;
            });
            angular.forEach(params, function(v,k){
                json[k] = v.value;
            });
            
            // Initialize $resource for POST
            var Resource = $resource(model.resourceLink, {}, {
                save: {
                    method  : 'POST',
                    transformRequest: function (data) {
                        $log.info(model.name + ' CRUDFactory.create() returns $httpParamSerializer(data): ', $httpParamSerializer(data));
                        return $httpParamSerializer(data);
                    },
                    headers : {'Content-Type':'application/x-www-form-urlencoded;charset=utf-8'}
                }
            });
            
            // Save the json data
            $log.info(model.name + ' Initiate CRUD.create() with json:', json);
            Resource.save(json, 
                function(sucessData){
                    console.log(model.name + ' create sucessData : ', sucessData);
                    runCallback(callbackSucess, sucessData);
                },
                function(failData){
                    console.log(model.name + ' create failData : ', failData);
                    runCallback(callbackFail, failData);
                });
        },
        
        read: function(model, params, callbackSucess, callbackFail){
            if(Auth.authentication.token){
                if(!params) params = {};
                params['APIToken'] = Auth.authentication.token;
            }
            
            // Read from Database
            var Resource = $resource(model.resourceLink, {}, {
                get : {
                    method  : 'GET',
                    isArray : true,
                    transformRequest: function (data) {
                        $log.info(model.name + ' CRUDFactory.read() returns $httpParamSerializer(data): ', $httpParamSerializer(data));
                        return $httpParamSerializer(data);
                    },
                    headers : {'Content-Type':'application/x-www-form-urlencoded;charset=utf-8'}
                }
            });
            
            $log.info(model.name + ' Initiate CRUD.read() with params:', params);
            Resource.get(params,
                function(sucessData){
                    // If there is only one data in sucessData array, then just dump into one model
                    console.log(model.name + ' read sucessData : ', sucessData);
                    if(sucessData.length === 1){
                        // Populate Model
                        angular.forEach(sucessData[0].properties, function(value, key){
                            model.properties[key] = value;
                            try{
                                model.properties[key].value = JSON.parse(model.properties[key].value);
                            }catch(SyntaxError){
                                // Do nothing. Because value is not JSON type.
                            }
                        });
                        model.initialized = true;
                    }
                    
                    // More than one data in the sucessData array
                    else{
                        // Populate Model
                        // TODO: this else block is a temporary fix.
                        console.log(model.name + ' model.properties', model.properties);
                        angular.forEach(model.properties, function(value, key){
                            model.properties[key] = value;
                        });
                        model.initialized = true;
                    }
                    
                    runCallback(callbackSucess, sucessData);
                },
                function(failData){
                    console.log(model.name + ' read failData : ', failData);
                    runCallback(callbackFail, failData);
                });
                
            // TODO: Listen to updates on Database then update Model to reflect on template
        },
        
        update: function(model, params, callbackSucess, callbackFail){
            if(Auth.authentication.token){
                if(!params) params = {};
                params['APIToken'] = Auth.authentication.token;
            }
            
            // Initialize from Database
            var Resource = $resource(model.resourceLink, {}, {
                put : {
                    method  : 'PUT',
                    transformRequest: function (data) {
                        $log.info(model.name + ' CRUDFactory.update() returns $httpParamSerializer(data): ', $httpParamSerializer(data));
                        return $httpParamSerializer(data);
                    },
                    headers : {'Content-Type':'application/x-www-form-urlencoded;charset=utf-8'}
                }
            });
            
            $log.info(model.name + ' Initiate CRUD.update() with params:', params);
            Resource.put(params,
                function(sucessData){
                    console.log(model.name + ' update sucessData : ', sucessData);
                    runCallback(callbackSucess, sucessData);
                },
                function(failData){
                    console.log(model.name + ' update failData : ', failData);
                    runCallback(callbackFail, failData);
                });
        },
        
        remove: function(model, params, callbackSucess, callbackFail){
            if(Auth.authentication.token){
                if(!params) params = {};
                params['APIToken'] = Auth.authentication.token;
            }
            
            // Initialize from Database
            // Use $http insted of $resource because angular ignores body in method delete 
            // thus there will be no data send to transformRequest()
            $log.info(model.name + ' Initiate CRUD.remove() with params:', params);
            $http({ 
                url     : model.resourceLink,
                method  : 'DELETE',
                transformRequest: function(data){
                    $log.info(model.name + ' CRUDFactory.remove() returns $httpParamSerializer(data): ', $httpParamSerializer(data));
                    return $httpParamSerializer(data);
                },
                data    : params,
                headers : {'Content-Type':'application/x-www-form-urlencoded;charset=utf-8'}
            }).then(
                function(sucessData){
                    console.log(model.name + ' remove sucessData : ', sucessData);
                    runCallback(callbackSucess, sucessData);
                },
                function(failData){
                    console.log(model.name + ' remove failData : ', failData);
                    runCallback(callbackFail, failData);
                });
        },
        
        options: function(model, params, callbackSucess, callbackFail){
            if(!model.initialized){
                if(Auth.authentication.token){
                    if(!params) params = {};
                    params['APIToken'] = Auth.authentication.token;
                }
                
                // Initialize from Database
                var Resource = $resource(model.resourceLink, {}, {
                    options : {
                        method  : 'OPTIONS',
                        transformRequest: function (data) {
                            $log.info(model.name + ' CRUDFactory.options() returns $httpParamSerializer(data): ', $httpParamSerializer(data));
                            return $httpParamSerializer(data);
                        },
                        headers : {'Content-Type':'application/x-www-form-urlencoded;charset=utf-8'}
                    }
                });
                
                $log.info(model.name + ' Initiate CRUD.options() with params:', params);
                Resource.options(params,
                    function(sucessData){
                        console.log(model.name + ' option sucessData : ', sucessData);
                        if(!model.initialized){
                            // Populate Model
                            angular.forEach(sucessData.properties, function(value, key){
                                model.properties[key] = value;
                                try{
                                    model.properties[key].value = JSON.parse(model.properties[key].value);
                                }catch(SyntaxError){
                                    // Do nothing. Because value is not JSON type.
                                }
                            });
                            model.initialized = true;
                        }
                        runCallback(callbackSucess, sucessData);
                    },
                    function(failData){
                        console.log(model.name + ' option failData : ', failData);
                        runCallback(callbackFail, failData);
                    });
            }
        }
    };
}]);

app.service('Auth', ['jdbserver',function(jdbserver){
    var self = this;
    
    var resourceLink    = jdbserver+'/auth/index.php';
    var properties      = {};
    var initialized     = false;
    var name            = 'Auth';
    var authentication  = {
        id      : '',
        token   : '',
        roles   : '',
        loggedIn: false
    };
    
    self.resourceLink   = resourceLink;
    self.properties     = properties;
    self.initialized    = initialized;
    self.name           = name;
    
    // Extra info for this Authentication
    self.authentication = authentication;
}]);

app.factory('AuthFactory', ['Auth','$log','$uibModal','jserver', function(Auth,$log,$uibModal,jserver){
    var uibModalObject;
    
    return {
        setLoggedin : function(id, token, roles){
            Auth.properties.Username.value = '';
            Auth.properties.Password.value = '';
            
            Auth.authentication.id          = id;
            Auth.authentication.token       = token;
            Auth.authentication.roles       = roles;
            Auth.authentication.loggedIn    = true;
            
            $log.info('Logged in: ', Auth.authentication);
        },
        
        setLoggedOut : function(){
            Auth.authentication.id          = '';
            Auth.authentication.token       = '';
            Auth.authentication.roles       = '';
            Auth.authentication.loggedIn    = false;
            
            $log.info('Logged out: ', Auth.authentication);
        },
        
        popUpLogin : function(){
            uibModalObject = $uibModal.open({
                animation: true,
                templateUrl: jserver + 'scripts/components/Auth/login.html',
                controller: 'AuthCtrl',
                controllerAs : 'ctrl',
                size: 'sm'
            });
        },
        
        popDownLogin : function(){
            uibModalObject.close();
            uibModalObject = null;
        },
        
        popUpRegister : function(){
            uibModalObject = $uibModal.open({
                animation: true,
                templateUrl: jserver+'scripts/components/Auth/register.html',
                controller: 'AuthCtrl',
                controllerAs : 'ctrl',
                size: 'lg'
            });
        },
        
        popDownRegister : function(){
            uibModalObject.close();
            uibModalObject = null;
        }
    };
}]);

app.controller('AuthCtrl', ['$log','$window','$state','$stateParams','$location','Auth','AuthFactory','CRUD','googleCaptchaSiteKey',function($log,$window,$state,$stateParams,$location,Auth,AuthFactory,CRUD,googleCaptchaSiteKey){
    var self = this;
    var notification = {
        display : false,
        type    : '',
        message : ''
    };
    
    self.notification = notification;
    
    var popNotification = function(type, message){
        notification.display = true;
        notification.type    = type;
        notification.message = message;
    };
    
    // self.title      = $state.current.data.title;
    // self.debugging  = $state.current.data.debugging;
        
    try{
        self.title      = $state.current.data.title;
        self.debugging  = $state.current.data.debugging;
    
    // $state.current may not have any data because $stateChangeStart may have
    // block it from getting the proper initialization duit to unauthorized access
    }catch(err){
        self.title      = '';
        self.debugging  = false;
    }
    
    self.model      = Auth;
    self.style      = {
        imageClassWidth: 3,
        labelClassWidth: 3,
        inputClassWidth: 9
    };
    
    self.recaptcha = {
        sitekey: googleCaptchaSiteKey
    };
    
    self.onClick = function(actionName, params){
        actions[actionName](params);
    };
    
    var actions = {
        // Login
        Login : function(){
            popNotification('alert', 'Please wait..');
            
            CRUD.update(self.model, {
                Username : self.model.properties.Username.value,
                Password : self.model.properties.Password.value
            },
                // If Sucess
                function(sucessData){
                    $log.info('CRUD.update() via Login function returns sucessData', sucessData);
                    
                    if(sucessData.id && sucessData.APIToken){
                        $log.info('Login sucess');
                        AuthFactory.setLoggedin(sucessData.id, sucessData.APIToken, sucessData.Roles);
                        AuthFactory.popDownLogin();
                        
                        if($stateParams.toState){
                            $state.go($stateParams.toState, $stateParams.toParams);
                        }
                        else $state.reload();
                    }
                    else{
                        popNotification('error', 'Invalid username or password');
                        $log.error('Login Error with sucessData.id: ', sucessData.id);
                        $log.error('Login Error with sucessData.APIToken: ', sucessData.APIToken);
                    }
                },
                // If Fail
                function(failData){
                    $log.error('CRUD.update() via Login function returns failData', failData);
                }
            );
        },
        
        // Save self.model
        Create : function(){
            var params = {
                "g-recaptcha-response": document.getElementById("g-recaptcha-response") 
            };
            
            CRUD.create(self.model, params,
                // If Sucess
                function(sucessData){
                    $log.info('CRUD.create() returns sucessData', sucessData);
                    AuthFactory.popDownRegister();
                    // $state.go('home');
                },
                // If Fail
                function(failData){
                    $log.error('CRUD.create() returns failData', failData);
                });
        },
        
        // Initialize self.model
        Read : function(params){
            var token = self.model.authentication.token;
            if(token) params['APIToken'] = token;
            
            CRUD.read(self.model, params,
                // If Sucess
                function(sucessData){
                    $log.info('CRUD.read() returns sucessData',sucessData);
                },
                // If Fail
                function(failData){
                    $log.error('CRUD.read() returns failData', failData);
                });
        },
        
        // Update self.model
        Update : function(params){
            var newParams = {id: $state.params.id};
            newParams[params[0]] = params[1];
            
            CRUD.update(self.model, newParams,
                // If Sucess
                function(sucessData){
                    self.model.properties[params[0]].value = params[1];
                    $log.info('CRUD.update() returns sucessData',sucessData);
                },
                // If Fail
                function(failData){
                    $log.error('CRUD.update() returns failData', failData);
                });
        },
        
        // Delete self.model
        Remove : function(){
            CRUD.remove(self.model, $state.params,
                // If Sucess
                function(sucessData){
                    $log.info('CRUD.remove() returns sucessData',sucessData);
                },
                // If Fail
                function(failData){
                    $log.error('CRUD.remove() returns failData', failData);
                });
        }
    };
    
    // Initialize Model
    // TODO: copy this to all other projects
    CRUD.options(self.model, {}, function(sucessData){
        if($state.params) CRUD.read(self.model, $state.params);
    }, function(failData){
        console.log('in AuthCtrl options failData');
    });
}]);

app.service('Role', ['CRUD','jdbserver',function(CRUD,jdbserver){
    var self = this;
    
    var resourceLink    = jdbserver+'auth/role/index.php';
    var properties      = {};
    var initialized     = false;
    var name            = 'Role';
    
    self.resourceLink   = resourceLink;
    self.properties     = properties;
    self.initialized    = initialized;
    self.name           = name;
    
    // Initialize Model
    CRUD.options(self);
}]);

app.factory('RoleFactory', ['CRUD','Role',function(CRUD,Role){
    
    // Role list
    var RoleList = {};
    
    // Test callback if callback is a function
    function runCallback( callback, data ){
        if(typeof callback === 'function') callback();
    }
    
    // Function test from RoleList given string of Role Names
    function testRole(modelName, action, roleList){
        var roleAuthenticated = false;
        
        // Test for Public role if return true then skip all authentication
        try{
            if(RoleList['Public'][modelName][action]) return true;
            else throw "No Public access";
            
        }catch(err){
            // If Public role does not return true
            roleList = roleList.split(',');
            angular.forEach(roleList, function(roleName){
                try{
                    if(RoleList[roleName][modelName][action]) roleAuthenticated = true;
                
                // Sometimes if statement is not enough, may return undefines in some roles
                // catch error and just continue iterate forEach loop
                }catch(err){}
            });
        }
        
        return roleAuthenticated;
    }
    
    return {
        // Function to reload from server
        reloadRoles: function(){
            CRUD.read(Role, {}, 
                function(sucessData){
                    
                    // Populate RoleList
                    angular.forEach(sucessData, function(objects){
                        
                        var roleName = '';
                        var models = {};
                        
                        angular.forEach(objects.properties, function(stringJson, modelName){
                            if(modelName == 'Name') roleName = stringJson.value;
                            else{
                                models[modelName] = JSON.parse(stringJson.value);
                            }
                        });
                        
                        RoleList[roleName] = models;
                    });
                },
                function(failData){});
        },
        
        can: function(modelName, action, roleList, callback){
            if(testRole(modelName, action, roleList)){
                runCallback(callback);
            }
        },
        
        canRead: function(modelName, roleList, callback){
            if(testRole(modelName, 'Read', roleList)){
                runCallback(callback);
            }
        },
        canCreate: function(modelName, roleList, callback){
            if(testRole(modelName, 'Create', roleList)){
                runCallback(callback);
            }
        },
        canUpdateOwner: function(modelName, roleList, callback){
            if(testRole(modelName, 'Update (owner)', roleList)){
                runCallback(callback);
            }
        },
        canUpdateOther: function(modelName, roleList, callback){
            if(testRole(modelName, 'Update (other)', roleList)){
                runCallback(callback);
            }
        },
        canDeleteOwner: function(modelName, roleList, callback){
            if(testRole(modelName, 'Delete (owner)', roleList)){
                runCallback(callback);
            }
        },
        canDeleteOther: function(modelName, roleList, callback){
            if(testRole(modelName, 'Delete (other)', roleList)){
                runCallback(callback);
            }
        }
    };
}]);

app.directive('showRole', ['RoleFactory','Auth',function(RoleFactory,Auth){
    
    // sample <button showRole='Baju' action-type='Delete (owner)'>
    return function(scope, element, attrs) {
        
        var authorized = false;
        RoleFactory.can(attrs.modelName, attrs.actionType, Auth.authentication.roles, function(){
            authorized = true;
        });
        
        if(!authorized) element.hide();
        else element.show();
    };
}]);

app.controller('RoleCtrl', ['$log','$state','Role','CRUD',function($log,$state,Role,CRUD){
    var self = this;
    var notification = {
        display : false,
        type    : '',
        message : ''
    };
    
    self.notification = notification;
    
    var popNotification = function(type, message){
        notification.display = true;
        notification.type    = type;
        notification.message = message;
    };
    
    self.title      = $state.current.data.title;
    self.debugging  = $state.current.data.debugging;
    self.model      = Role;
    self.style      = {
        imageClassWidth: 3,
        labelClassWidth: 3,
        inputClassWidth: 9
    };
    
    self.onClick = function(actionName, params){
        actions[actionName](params);
    };
    
    var actions = {
        // Save self.model
        Create : function(){
            CRUD.create(self.model,
                // If Sucess
                function(sucessData){
                    $log.info('sucessData', sucessData);
                },
                // If Fail
                function(failData){
                    $log.error('failData', failData);
                });
        },
        
        // Initialize self.model
        Read : function(params){
            CRUD.read(self.model, params,
                // If Sucess
                function(sucessData){
                    $log.info('sucessData',sucessData);
                },
                // If Fail
                function(failData){
                    $log.error('failData', failData);
                });
        },
        
        // Update self.model
        Update : function(params){
            var newParams = {id: $state.params.id};
            newParams[params[0]] = params[1];
            
            CRUD.update(self.model, newParams,
                // If Sucess
                function(sucessData){
                    self.model.properties[params[0]].value = params[1];
                    $log.info('sucessData',sucessData);
                },
                // If Fail
                function(failData){
                    $log.error('failData', failData);
                });
        },
        
        // Delete self.model
        Remove : function(){
            CRUD.remove(self.model, $state.params,
                // If Sucess
                function(sucessData){
                    $log.info('sucessData',sucessData);
                },
                // If Fail
                function(failData){
                    $log.error('failData', failData);
                });
        }
    };
    
    // Initialize Model
    if($state.params) actions.Read($state.params);
}]);

app.controller('MainRoleCtrl',['$state','CRUD','Role','RoleFactory','Auth',function($state,CRUD,Role,RoleFactory,Auth){
    var self = this;
    var notification = {
        display : false,
        type    : '',
        message : ''
    };
    
    self.notification = notification;
    
    var popNotification = function(type, message){
        notification.display = true;
        notification.type    = type;
        notification.message = message;
    };
    
    self.title      = $state.current.data.title;
    self.debugging  = $state.current.data.debugging;
    self.model      = Role;
    self.style      = {
        imageClassWidth: 3,
        labelClassWidth: 3,
        inputClassWidth: 9
    };
    
    self.list = [];
    
    popNotification('alert', 'Loading, please wait..');
    
    RoleFactory.canRead('Role', Auth.authentication.roles, function(){
        CRUD.read(self.model, {}, 
        function(sucessData){
            popNotification('sucess', 'Loading sucess');
            self.list = sucessData;
        },
        function(failData){
            popNotification('error', 'Loading fail');
        });
    });
}]);

app.directive('jNavigation', ['jserver','$http', function(jserver,$http){
    return {
        scope : {
            jBrand : '@',
            jLinks : '='
        },
        templateUrl : jserver + 'scripts/components/navigation/navigation.html',
        controller  : ['Auth','AuthFactory',function(Auth,AuthFactory){
            var self = this;
            self.auth = Auth.authentication;
            
            self.popUpLogin = function(){
                AuthFactory.popUpLogin();
            };
            
            self.popUpRegister = function(){
                AuthFactory.popUpRegister();
            };
        }],
        controllerAs : 'navigationCtrlDirective'
    };
}]);

app.directive('jDebugging', [function(){
    return {
        scope:{
            enableDebugging : '=enable',
            valueInput      : '=value'
        },
        template: '<div ng-show="enableDebugging"><strong style="color:red;">input:</strong> {{ valueInput }}</div>'
        // sample : <j-debugging enable="ctrl.debugging" value="modelValue.value"></j-debugging>
    };
}]);

app.directive('inlineEditor', ['jserver',function(jserver){
    return {
        restrict: 'E',
        scope: {
            inputType       : '=type',
            inputValue      : '=value',
            inputOptions    : '=options',
            inputPlaceholder: '=placeholder',
            inputDisabled   : '=disabled',
            actionClick     : '&onClick'
        },
        controller: [function(){
            var self = this;
            
            self.setTemporary = function(object){
                self.temporary = angular.copy(object);
            };
        }],
        controllerAs: 'inlineCtrlDirective',
        templateUrl: jserver+'/scripts/components/inlineEditor/inlineEditor.html'
    };
}]);

app.directive('jNotification', ['jserver',function(jserver){
    return {
        restrict: 'E',
        // sample : <j-notification display='' type='' message=''></j-notification>
        scope   : {
            notificationDisplay : '=display',
            notificationType    : '=type',
            notificationMsg     : '=message'
        },
        controller: ['$scope', function($scope){
            var self = this;
            
            self.closeNotification = function(){
                $scope.notificationDisplay = false;
            };
        }],
        controllerAs: 'notificationDirective',
        templateUrl : jserver+'/scripts/components/notification/notification.html'
    };
}]);

app.run(['$rootScope','$state','RoleFactory','Auth','AuthFactory',function($rootScope,$state,RoleFactory,Auth,AuthFactory){
    // Initialize RoleList first time
    RoleFactory.reloadRoles();
    
    // Set listerner on $stateChangeStart
    // whenever state changes, check for authorization
    $rootScope.$on('$stateChangeSuccess', 
      function(event, toState, toParams, fromState, fromParams){
        
        // If at state provider did not specify properly model and action in data
        // assume it's open for public
        if(toState.data.model && toState.data.action){
          
          var authorized = false;
          RoleFactory.can(toState.data.model, toState.data.action, Auth.authentication.roles, function(){
            authorized = true;
          });
          
          if(!authorized){
            event.preventDefault();
            // transitionTo() promise will be rejected with 
            // a 'transition prevented' error
            
            AuthFactory.popUpLogin();
            $state.go('admin.error', {toState: toState.name, toParams: toParams}, {location: false});
          }
        }
    });
}]);