// Global Functions
function dataURLtoBlob(dataURI) {
  var binary = atob(dataURI.split(',')[1]);
  var array = [];
  for(var i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
}

function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode('0x' + p1);
  }));
}

// Helper function
function fixUndefined(str){
  return str === undefined ? "" : str;
}

angular.module('vida.services', ['ngCordova', 'ngResource'])

.factory('httpRequestInterceptor', function(networkService) {
   return {
      request: function (config) {
        config.headers.Authorization = networkService.getBasicAuthentication();
        config.timeout = 45000;  //45s because of long face recognition request :(
        return config;
      }
    };
})

.config(function($interpolateProvider, $httpProvider, $resourceProvider) {
//  $interpolateProvider.startSymbol('{[');
//  $interpolateProvider.endSymbol(']}');

  //$httpProvider.defaults.xsrfCookieName = 'csrftoken';
  //$httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
  $httpProvider.interceptors.push('httpRequestInterceptor');
  $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  //$httpProvider.defaults.headers.common['X-Auth-Token'] = undefined;

  $resourceProvider.defaults.stripTrailingSlashes = false;
})

.factory('Camera', ['$q', function($q){
  return {
    getPicture: function(options) {
      var q = $q.defer();
      navigator.camera.getPicture(function(result) {
        q.resolve(result);
      }, function(err) {
        q.reject(err);
      }, options);
      return q.promise;
    }
  };
}])

.service('uploadService', function($http, networkService, optionService, $ionicPopup) {
  this.uploadPhotoToUrl = function(photo, uploadUrl, callSuccess, callFailure) {

    var photoBlob = dataURLtoBlob(photo);
    var formData = new FormData();
    formData.append("file", photoBlob, 'filename.jpg');

    $http.post(uploadUrl, formData, {
      transformRequest: angular.identity,
      headers: {
        'Content-Type': undefined,
        'Authorization': networkService.getAuthenticationHeader().headers.Authorization
      }
    }).success(function(data) {
      callSuccess(data);
    }).error(function(err) {
      if (err) {
        // if err is null, server not found?
        $ionicPopup.alert({
          title: 'Error',
          template: 'Photo not uploaded! Error: ' + err.error_message
        });
      }
      callFailure(err);
    });
  };

  this.updatePerson = function(person, callSuccess, callFailure){
    var JSONPerson = '{';
    var hasItem = false;

    var uploadFields = optionService.getPersonUploadInfo();

    for (var i = 0; i < uploadFields.length; i++) {
      if (i > 0 && i < uploadFields.length) {
        // Add ,
        if (hasItem)
          JSONPerson += ', ';
      }

      JSONPerson += '"' + uploadFields[i] + '":"' + fixUndefined(person[uploadFields[i]]) + '"';
      hasItem = true;
    }

    JSONPerson += '}';

    $http.put(networkService.getPeopleURL() + person.id + '/', JSONPerson,
      networkService.getAuthenticationHeader()).then(function (xhr) {
      if (xhr.status === 204) {
        callSuccess();
      } else {
        callFailure();
      }
    });
  };

  this.uploadPersonToUrl = function(person, uploadUrl, callSuccess, callFailure) {

    var JSONPerson = '{';
    var hasItem = false;

    var uploadFields = optionService.getPersonUploadInfo();

    for (var i = 0; i < uploadFields.length; i++) {
      if (i > 0 && i < uploadFields.length) {
        // Add ,
        if (hasItem)
          JSONPerson += ', ';
      }

      JSONPerson += '"' + uploadFields[i] + '":"' + fixUndefined(person[uploadFields[i]]) + '"';
      hasItem = true;
    }

    JSONPerson += '}';

    $http.post(uploadUrl, JSONPerson, {
      transformRequest: angular.identity,
      headers: {
        'Authorization': networkService.getAuthenticationHeader().headers.Authorization
      }
    }).success(function() {
      callSuccess();
    }).error(function(err) {
      callFailure('Person not uploaded! Error: ' + err);
    });
  };

  this.deletePerson = function(person, successCallback, errorCallback) {
    $http.delete(networkService.getPeopleURL() + person.id + '/', {
      headers: {
      'Authorization': networkService.getAuthenticationHeader().headers.Authorization
    }}).then(function(xhr){
      if (xhr.status === 204) {
        successCallback();
      } else {
        errorCallback();
      }
    });
  };
})

.factory('geofenceService', function ($rootScope, $window, $q, $log, $ionicLoading, toaster) {
  $window.geofence = $window.geofence || {
    addOrUpdate: function (fences) {
      var deffered = $q.defer();
      $log.log('Mocked geofence plugin addOrUpdate', fences);
      deffered.resolve();
      return deffered.promise;
    },
    remove: function (ids) {
      var deffered = $q.defer();
      $log.log('Mocked geofence plugin remove', ids);
      deffered.resolve();
      return deffered.promise;
    },
    removeAll: function () {
      var deffered = $q.defer();
      $log.log('Mocked geofence plugin removeAll');
      deffered.resolve();
      return deffered.promise;
    },
    receiveTransition: function (obj) {
      $rootScope.$apply(function () {
        toaster.pop('info', 'title', 'text');
      });
    }
  };
  $window.TransitionType = $window.TransitionType || {
    ENTER: 1,
    EXIT: 2,
    BOTH: 3
  };

  var geofenceService = {
    _geofences: [],
    _geofencesPromise: null,
    createdGeofenceDraft: null,
    loadFromLocalStorage: function () {
      var result = localStorage.geofences;
      var geofences = [];
      if (result) {
        try {
          geofences = angular.fromJson(result);
        } catch (ex) {

        }
      }
      this._geofences = geofences;
      return $q.when(this._geofences);
    },
    saveToLocalStorage: function () {
      localStorage.geofences = angular.toJson(this._geofences);
    },
    loadFromDevice: function () {
      var self = this;
      if ($window.geofence && $window.geofence.getWatched) {
        return $window.geofence.getWatched().then(function (geofencesJson) {
          self._geofences = angular.fromJson(geofencesJson);
          return self._geofences;
        });
      }
      return this.loadFromLocalStorage();
    },
    getAll: function () {
      var self = this;
      if (!self._geofencesPromise) {
        self._geofencesPromise = $q.defer();
        self.loadFromDevice().then(function (geofences) {
          self._geofences = geofences;
          self._geofencesPromise.resolve(geofences);
        }, function (reason) {
          $log.log("Error fetching geofences", reason);
          self._geofencesPromise.reject(reason);
        });
      }
      return self._geofencesPromise.promise;
    },
    addOrUpdate: function (geofence) {
      var self = this;
      $window.geofence.addOrUpdate(geofence).then(function () {
        if ((self.createdGeofenceDraft && self.createdGeofenceDraft === geofence) ||
          !self.findById(geofence.id)) {
          self._geofences.push(geofence);
          self.saveToLocalStorage();
        }

        if (self.createdGeofenceDraft) {
          self.createdGeofenceDraft = null;
        }
      });

    },
    findById: function (id) {
      if (this.createdGeofenceDraft && this.createdGeofenceDraft.id === id) {
        return this.createdGeofenceDraft;
      }
      var geoFences = this._geofences.filter(function (g) {
        return g.id === id;
      });
      if (geoFences.length > 0) {
        return geoFences[0];
      }
      return undefined;
    },
    remove: function (geofence) {
      var self = this;
      $ionicLoading.show({
        template: 'Removing geofence...'
      });
      $window.geofence.remove(geofence.id).then(function () {
        $ionicLoading.hide();
        self._geofences.splice(self._geofences.indexOf(geofence), 1);
        self.saveToLocalStorage();
      }, function (reason) {
        $log.log('Error while removing geofence', reason);
        $ionicLoading.show({
          template: 'Error',
          duration: 1500
        });
      });
    },
    removeAll: function () {
      var self = this;
      $ionicLoading.show({
        template: 'Removing all geofences...'
      });
      $window.geofence.removeAll().then(function () {
        $ionicLoading.hide();
        self._geofences.length = 0;
        self.saveToLocalStorage();
      }, function (reason) {
        $log.log('Error while removing all geofences', reason);
        $ionicLoading.show({
          template: 'Error',
          duration: 1500
        });
      });
    },
    getNextNotificationId: function () {
      var max = 0;
      this._geofences.forEach(function (gf) {
        if (gf.notification && gf.notification.id) {
          if (gf.notification.id > max) {
            max = gf.notification.id;
          }
        }
      });
      return max + 1;
    }
  };

  return geofenceService;
})

.factory('geolocationService', function ($q, $timeout) {
  var currentPositionCache;
  return {
    getCurrentPosition: function () {
      if (!currentPositionCache) {
        var deffered = $q.defer();
        navigator.geolocation.getCurrentPosition(function (position) {
          deffered.resolve(currentPositionCache = position);
          $timeout(function () {
            currentPositionCache = undefined;
          }, 10000);
        }, function () {
          deffered.reject();
        });
        return deffered.promise;
      }
      return $q.when(currentPositionCache);
    }
  };
})

.service('shelterService', function($http, networkService, $resource, $q) {
  var service = this;
  var shelters = [];
  var current_shelter = {};
  current_shelter.str = 'None';
  current_shelter.link = 'None';

  this.getAll = function() {
    var shelter = $resource(networkService.getShelterURL() + ':id', {}, {
      query: {
        method: 'GET',
        isArray: true,
        transformResponse: $http.defaults.transformResponse.concat([
          function (data, headersGetter) {
            shelters = data.objects;
            console.log('----[ transformResponse data: ', data);
            return data.objects;
          }
        ])
      }
    });

    return shelter.query().$promise;
  };

  this.getById = function(id) {
    for(var i = 0; i < shelters.length; i++) {
      if (shelters[i].id == id)
        return shelters[i];
    }
  };

  this.getCurrentShelter = function() {
    return current_shelter;
  };

  this.setCurrentShelter = function(shelter){
    if (shelter !== 'None') {
      current_shelter.str = shelter.name;
      current_shelter.link = '#/vida/shelter-search/shelter-detail/' + shelter.id;
    } else {
      current_shelter.str = 'None';
      current_shelter.link = 'None';
    }
  };

  this.getLatLng = function(id) {
    var shelter = service.getById(id);
    // look for 'point' in wkt and get the pair of numbers in the string after it
    var trimParens = /^\s*\(?(.*?)\)?\s*$/;
    var coordinateString = shelter.geom.toLowerCase().split('point')[1].replace(trimParens, '$1').trim();
    var tokens = coordinateString.split(' ');
    var lng = parseFloat(tokens[0]);
    var lat = parseFloat(tokens[1]);
    return {lat: lat, lng: lng};
  };
})

.service('peopleService', function($http, networkService, uploadService, VIDA_localDB, optionService, $q, $cordovaFile, $ionicPopup) {
    var peopleInShelter = [];
    var personByID = {};
    var testPhoto = {};
    var storedSearchQuery = "";

    this.searchForPerson = function(URL, query, success, error) {
      if (query !== '') {
        if (!isDisconnected) {
          var newURL = (URL === networkService.getPeopleURL()) ? URL + '?custom_query=' + query + '&limit=' + networkService.getPersonRetrievalLimit()
            : URL + query + '&limit=' + networkService.getPersonRetrievalLimit(); // Change parameter prefacing
          $http.get(newURL, networkService.getAuthenticationHeader()).then(function (xhr) {
            if (xhr.status === 200) {
              if (xhr.data !== null) {
                peopleInShelter = [];    // Reset list, is safe

                for (var i = 0; i < xhr.data.objects.length; i++) {
                  var personOnServer = xhr.data.objects[i];
                  var newPerson = {};

                  newPerson.given_name = personOnServer.given_name;
                  newPerson.status = 'On Server';
                  newPerson.id = personOnServer.id;
                  newPerson.score = undefined;

                  peopleInShelter.push(xhr.data.objects[i]);
                }

                if (success)
                  success();
              } else {
                if (error)
                  error(undefined);
              }
            } else {
              if (error)
                error(xhr.status);
            }
          }, function (e) {
            if (error)
              error(e.statusText);
          });
        } else {
          // Search local database instead
          var whereAt = {};
          whereAt.restriction = 'LIKE';
          whereAt.column = 'given_name';  // TODO: Make advanced searching
          whereAt.value = query;
          VIDA_localDB.queryDB_select('people', '*', function (results) {
            peopleInShelter = [];
            for (var i = 0; i < results.length; i++) {
              if (results[i].deleted !== true)
                peopleInShelter.push(results[i]);
            }
            peopleInShelter.sort(); // Results comes up weird sometimes, better off just sorting it
            if (success)
              success();
          }, whereAt);
        }
      } else {
        peopleInShelter = [];
        if (success)
          success();
      }
    };

    this.searchPersonByID = function(id, success, error) {
      if (!isDisconnected) {
        var searchURL = networkService.getSearchURL();
        searchURL += id;

        $http.get(searchURL, networkService.getAuthenticationHeader()).then(function (xhr) {
          if (xhr.status === 200) {
            if (xhr.data !== null) {
              if (xhr.data.objects.length > 0) {
                if (xhr.data.objects.length > 1) {
                  // Multiple objects returned, search for ID specifically
                  for (var i = 0; i < xhr.data.objects.length; i++) {
                    if (parseInt(id) === xhr.data.objects[i].id) {
                      personByID = xhr.data.objects[i];
                      break;
                    }
                  }
                } else
                  personByID = xhr.data.objects[0]; // Only 1 object returned

                success();
              } else {
                error(); // No objects returned
              }
            } else {
              error();
            }
          } else {
            error();
          }
        }, function (e) {
          if (e) {
            if (e.status === 401) {
              $ionicPopup.alert({
                title: 'Big Error',
                template: "Something went wrong with credentials.."
              }); // Should never get in here
            } else {
              $ionicPopup.alert({
                title: 'Error',
                template: "A problem occurred when connecting to the server. \nStatus: " + e.status + ": " + e.description
              });
            }
          }
          error();
        });
      } else {
        var whereAt = {};
        whereAt.restriction = 'EXACT';
        whereAt.column = 'id';
        whereAt.value = '\"' + id + '\"';
        VIDA_localDB.queryDB_select('people', '*', function(results){
          if (results.length > 0) {
            personByID = results[0];
            success();
          } else {
            personByID = undefined;
            error();
          }
        }, whereAt);
      }
      personByID = undefined; // Set by default
    };

    this.getRetrievedPersonByID = function (){
      return personByID;
    };

    this.setStoredSearchQuery = function (query) {
      storedSearchQuery = query;
    };

    this.getStoredSearchQuery = function (){
      return storedSearchQuery;
    };

    this.removePersonFromList = function(ID){
      for (var i = 0; i < peopleInShelter.length; i++){
        if (peopleInShelter[i].id === ID){
          peopleInShelter.splice(i, 1); // Remove that person
        }
      }
    };

    this.testPersonForNull = function(ID, isNotNull, isNull){
      $http.get(networkService.getPeopleURL() + ID + "/", networkService.getAuthenticationHeader()).then(function successCallback(xhr) {
        if (xhr.status === 200) {
          if (xhr.data !== null){
            isNotNull();
          } else {
            isNull();
          }
        } else {
          isNull();
        }
      }, function errorCallback(xhr){
        // This could be dangerous
        //if (xhr.status === 404)
        //  isNull();
      });
    };

    this.createSearchResult = function(peopleArr, scoreArr){
      peopleInShelter = [];    // Reset list, is safe

      for (var i = 0; i < peopleArr.length; i++){
        var newPerson = peopleArr[i];
        newPerson.score = scoreArr[i][1].toFixed(5);
        peopleInShelter.push(peopleArr[i]);
      }
    };

    this.updateAllPeople = function(URL, success) {
      $http.get(URL + "?limit=" + networkService.getPersonRetrievalLimit(), networkService.getAuthenticationHeader()).then(function(xhr) {
        if (xhr.status === 200) {
          if (xhr.data !== null) {
            peopleInShelter = [];

            for (var i = 0; i < xhr.data.objects.length; i++) {
              var personOnServer = xhr.data.objects[i];

              // Check for duplicates (only names - then ID so far)
              var duplicate = false;
              for (var j = 0; j < peopleInShelter.length; j++) {
                if (peopleInShelter[j].given_name === personOnServer.given_name){
                  if (peopleInShelter[j].id === personOnServer.id){
                    duplicate = true;
                    break;
                  }
                }
              }

              if (!duplicate) {
                personOnServer.status = "On Server";  //TEMPORARY
                personOnServer.photo = {};

                peopleInShelter.push(personOnServer);
              }
            }

            if (success)
              success();
          }
        }
      });
    };

    this.editPerson_saveChanges = function(newPerson, success, error){
      var putJSON = '{';
      var hasItem = false;

      var changeList = optionService.getPersonToDBInformation();

      for (var i = 0; i < changeList.length; i++) {
        if (newPerson[changeList[i]] !== undefined) {
          // Add ,
          if (i !== 0) {
            if (hasItem)
              putJSON += ', ';
          }

          putJSON += '"' + changeList[i] + '":"' + newPerson[changeList[i]] + '"';
          hasItem = true;
        }
      }

      // Separate photo check (has different method)
      if (newPerson.photo !== undefined) {
        // Photo has changed, upload it
        if (!isDisconnected) {
          uploadService.uploadPhotoToUrl(newPerson.photo, networkService.getFileServiceURL(), function (data) {
            // Successful
            if (hasItem)
              putJSON += ', ';

            putJSON += ' "pic_filename":"' + data.name + '"';
            hasItem = true;

            finishHttpPut(hasItem, newPerson.id, putJSON, success, error);
          }, function () {
            // Error
            finishHttpPut(hasItem, newPerson.id, putJSON, success, error);
          });
        } else {
          // Replace pic_filename_thumb with new picture (Same as write file)
          if (newPerson.pic_filename) {
            // Make filename
            //var pic = newPerson.pic_filename.split('.');
            //var thumbnail = pic[0] + '_thumb.' + pic[1];
            //var picData = window.atob(newPerson.photo.split('base64,')[1]);

            // Write out file
            //$cordovaFile.writeFile(cordova.file.dataDirectory, 'Photos/' + newPerson.pic_filename, picData, true);
            //$cordovaFile.writeFile(cordova.file.dataDirectory, 'Photos/' + thumbnail, picData, true);
          } else {
            //TODO: Take care of edge case if someone didn't have a picture beforehand
            // Generate filename (same way server would)

            // Write out file
          }

          finishHttpPut(hasItem, newPerson.id, putJSON, success, error, newPerson);
        }
      } else {
        finishHttpPut(hasItem, newPerson.id, putJSON, success, error, newPerson);
      }
    };

    var finishHttpPut = function(hasItem, id, putJSON, success, error, newPerson) {
      // Put into it's own function to not have gross copy+paste everywhere
      putJSON += '}';

      if (hasItem === true) {
        if (!isDisconnected) {
          $http.put(networkService.getPeopleURL() + id + '/', putJSON, networkService.getAuthenticationHeader()).then(function (xhr) {
            if (xhr.status === 204) {
              success();
            } else {
              error();
            }
          });
        } else {
          // Use information and put into database for later upload
          var DBInfo = optionService.getPersonToDBInformation();
          var values = [];
          var JSONForPut = JSON.parse(putJSON);

          // Check which information needs to be updated
          for (var i = 0; i < DBInfo.length; i++) {
            if (JSONForPut[DBInfo[i]] !== undefined) {
              values.push({
                type: DBInfo[i],
                value: "\"" + JSONForPut[DBInfo[i]] + "\""
              });
            }
          }

          if (values.length > 0) {
            // There is a change, mark the DB as dirty
            values.push({
              type: 'isDirty',
              value: 1
            });

            // Update DB
            VIDA_localDB.queryDB_update('people', values, 'uuid=\"' + newPerson.uuid + '\"');
          }

          success();
        }
      } else {
        success();
      }
    };

    this.downloadPersonalImage = function(filename, success, error) {
      $http.get(networkService.getFileServiceURL() + filename + '/download/', networkService.getAuthenticationHeader()).then(function (xhr) {
        if (xhr.status === 200) {
<<<<<<< HEAD
          if (xhr.data != null){
            if (!xhr.data.status) {
              //TODO: This is downloading a broken image (see screenshot on desktop)

              /*var canvas = document.createElement('CANVAS');
              var ctx = canvas.getContext('2d');
              var dataURL;
              canvas.height = 1024;
              canvas.width = 1024;
              ctx.drawImage(this, 0, 0);
              dataURL = canvas.toDataURL(xhr.data);

              var reader = new window.FileReader();
              reader.readAsDataURL(new Blob([xhr.data]));

              reader.onloadend = function () {
                var start = reader.result.split(',');
                var Base64Photo = "data:image/jpeg;base64," + start[1];
                success(Base64Photo, filename);
              };
              */
            } else
=======
          if (xhr.data !== null){
            if (!xhr.data.status)
              success(xhr.data, filename);
            else
>>>>>>> disconnected_map
              error(xhr.data.status);
          } else {
            error(xhr.status);
          }
        } else {
          error(xhr.status);
        }
      });
    };

    this.getAllPeopleWithReturn = function(success, error) {
      //var promise = $q.defer();

      $http.get(networkService.getPeopleURL() + "?limit=" + networkService.getPersonRetrievalLimit(), networkService.getAuthenticationHeader()).then(
        function successCallback(xhr) {
        if (xhr.status === 200) {
          if (xhr.data !== null) {
            var temp_peopleInShelter = [];

            for (var i = 0; i < xhr.data.objects.length; i++) {
              temp_peopleInShelter.push(xhr.data.objects[i]);
            }

            //console.log("Get all people retrieval completed!");
            success(temp_peopleInShelter);
          } else {
            // TODO: Translate
            if (error)
              error("Data retrieved was invalid!");
          }
        } else {
          // TODO: Translate
          if (error)
            error("Could not reach the server!");
        }
      }, function errorCallback(err){
        // TODO: Translate
        if (error)
          error("Could not contact the server. Please try again.");
      });
    };

    this.getPeopleInShelter = function() {
      return peopleInShelter;
    };

    this.getPersonalImage = function(pic_filename) {
      if (!isDisconnected) {
        // Get normal image from server
        return networkService.getFileServiceURL() + pic_filename + '/download/';
      } else {
        // Get image from phone
        var picture = pic_filename.split('.');
        var thumbnail = picture[0] + '_thumb.' + picture[1];

        // Temporary until database referencing
        if ($cordovaFile.checkFile(cordova.file.dataDirectory, 'Photos/' + thumbnail))
          return cordova.file.dataDirectory + 'Photos/' + thumbnail;
        else
          return this.getPlaceholderImage();
      }
    };

    this.getPlaceholderImage = function() {
      return cordova.file.applicationDirectory + 'www/img/profile-photo-placeholder.jpg';
    };
  })

.service('optionService', function() {
    var gender_options = [
      {
        "name": 'person_not_specified',
        "value": "Not Specified"
      },
      {
        "name": 'person_gender_male',
        "value": "Male"
      },
      {
        "name": 'person_gender_female',
        "value": "Female"
      },
      {
        "name": 'person_gender_other',
        "value": "Other"
      }
    ];

    var injury_options = [
      {
        "name": 'person_injury_not_injured',
        "value": "Not Injured"
      },
      {
        "name": 'person_injury_moderate',
        "value": "Moderate"
      },
      {
        "name": 'person_injury_severe',
        "value": "Severe"
      }
    ];

    var language_options = [
      {
        "name": 'settings_language_english',
        "value": "English"
      },
      {
        "name": 'settings_language_spanish',
        "value": "Spanish"
      }
    ];

    var nationality_options = [
      {
        "name": 'person_not_specified',
        "value": "Not Specified"
      },
      {
        "name": 'person_nationality_english',
        "value": "English"
      },
      {
        "name": 'person_nationality_african',
        "value": "African"
      },
      {
        "name": 'person_nationality_asian',
        "value": "Asian"
      }
    ];

    var people_table_values = [{
      column: 'id',
      type: 'INTEGER PRIMARY KEY AUTOINCREMENT'
    }, {
      column: 'uuid',
      type: 'TEXT'
    }, {
      column: 'isDirty',
      type: 'TEXT DEFAULT \"false\"'
    }, {
      column: 'deleted',
      type: 'TEXT DEFAULT \"false\"'
    }, {
      column: 'given_name',
      type: 'TEXT'
    }, {
      column: 'family_name',
      type: 'TEXT'
    }, {
      column: 'fathers_given_name',
      type: 'TEXT'
    }, {
      column: 'mothers_given_name',
      type: 'TEXT'
    }, {
      column: 'age',
      type: 'TEXT'
    }, {
      column: 'date_of_birth',
      type: 'TEXT'
    }, {
      column: 'street_and_number',
      type: 'TEXT'
    }, {
      column: 'city',
      type: 'TEXT'
    }, {
      column: 'phone_number',
      type: 'TEXT'
    }, {
      column: 'neighborhood',
      type: 'TEXT'
    }, {
      column: 'gender',
      type: 'TEXT'
    }, {
      column: 'injury',
      type: 'TEXT'
    }, {
      column: 'nationality',
      type: 'TEXT'
    }, {
      column: 'barcode',
      type: 'TEXT'
    }, {
      column: 'shelter_id',
      type: 'TEXT'
    }, {
      column: 'description',
      type: 'TEXT'
    }, {
      column: 'pic_filename',
      type: 'TEXT'
    }, {
      column: 'province_or_state',
      type: 'TEXT'
    }, {
      column: 'personal_picture',
      type: 'TEXT'
    }];

    var settings_and_configurations = ['serverURL', 'username', 'password', 'protocol',' language', 'workOffline'];

    var info_to_put_to_DB = ['given_name', 'family_name', 'fathers_given_name', 'mothers_given_name', 'age', 'date_of_birth',
    'street_and_number', 'city', 'phone_number', 'neighborhood', 'gender', 'injury', 'nationality', 'barcode', 'shelter_id',
    'description', 'pic_filename', 'province_or_state'];

    var info_to_upload_extra = ['given_name', 'family_name', 'fathers_given_name', 'mothers_given_name', 'age', 'date_of_birth',
      'street_and_number', 'city', 'phone_number', 'neighborhood', 'gender', 'injury', 'nationality', 'barcode', 'shelter_id',
      'description', 'pic_filename', 'province_or_state', 'notes', 'status', 'uuid'];

    var default_configurations = {};
    default_configurations.configuration = {};
    default_configurations.configuration.serverURL = "192.168.33.15";
    default_configurations.configuration.username = "admin";
    default_configurations.configuration.password = "admin";
    default_configurations.configuration.protocol = "http";
    default_configurations.configuration.language = "English";
    default_configurations.configuration.workOffline = "false";

    this.getGenderOptions = function() {
      return gender_options;
    };

    this.getInjuryOptions = function() {
      return injury_options;
    };

    this.getLanguageOptions = function() {
      return language_options;
    };

    this.getNationalityOptions = function() {
      return nationality_options;
    };

    this.getDefaultConfigurations = function() {
      return default_configurations;
    };

    this.getDefaultPeopleTableValues = function() {
      return people_table_values;
    };

    this.getPersonToDBInformation = function() {
      return info_to_put_to_DB;
    };

    this.getPersonUploadInfo = function() {
      return info_to_upload_extra;
    };

    this.getCameraOptions = function(source) {
      var camera_options = {
        quality: 90,
        destinationType: Camera.DestinationType.DATA_URL,
        sourceType: source,
        allowEdit: true,
        encodingType: Camera.EncodingType.JPEG,
        popoverOptions: CameraPopoverOptions,
        saveToPhotoAlbum: true
      };

      return camera_options;
    };

    this.getDefaultConfigurationsJSON = function() {
      var configs = settings_and_configurations;
      var JSONObject = "'{\"configuration\":{";
      for (var i = 0; i < configs.length; i++){
        JSONObject += '\"' + configs[i] + '\":\"' + default_configurations.configuration[configs[i]] + '\"';
        if (i !== configs.length - 1)
          JSONObject += ", ";
      }
      JSONObject += "}}'";
      return JSONObject;
    };

    // CREDIT: used from user Kaizhu256 - URL: https://gist.github.com/kaizhu256/4482069
    this.generate_uuid4 = function () {
      //// return uuid of form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      var uuid = '', ii;
      for (ii = 0; ii < 32; ii += 1) {
        switch (ii) {
          case 8:
          case 20:
            uuid += '-';
            uuid += (Math.random() * 16 | 0).toString(16);
            break;
          case 12:
            uuid += '-';
            uuid += '4';
            break;
          case 16:
            uuid += '-';
            uuid += (Math.random() * 4 | 8).toString(16);
            break;
          default:
            uuid += (Math.random() * 16 | 0).toString(16);
        }
      }
      return uuid;
    };
  })

.service('networkService', function(optionService, $translate) {

    var self = this;
    this.configuration = {};

    var default_config = optionService.getDefaultConfigurations();
    this.configuration.username = default_config.configuration.username;
    this.configuration.password = default_config.configuration.password;
    this.configuration.serverURL = default_config.configuration.serverURL;
    this.configuration.protocol = default_config.configuration.protocol;
    this.configuration.language = default_config.configuration.language;
    this.configuration.workOffline = (default_config.configuration.workOffline === 'true');
    this.configuration.api = {};
    this.network_personRetrievalLimit = "1000000";

    this.compute_API_URLs = function() {
      var URL = this.configuration.protocol + '://' + this.configuration.serverURL + '/api/v1';
      this.configuration.api.personURL = URL + '/person/';
      this.configuration.api.searchURL = URL + '/person/?custom_query=';
      this.configuration.api.fileServiceURL = URL + '/fileservice/';
      this.configuration.api.shelterURL = URL + '/shelter/';
      this.configuration.api.faceSearchURL = URL + '/facesearchservice/';
    };

    this.compute_API_URLs();

    this.SetConfigurationFromDB = function(DBSettings) {
      // Set DB settings
      self.configuration.username = DBSettings.configuration.username;
      self.configuration.password = DBSettings.configuration.password;
      self.configuration.serverURL = DBSettings.configuration.serverURL;
      self.configuration.protocol = DBSettings.configuration.protocol;
      self.configuration.language = DBSettings.configuration.language;
      if (self.configuration.language === "English")
        $translate.use('en');
      else if (self.configuration.language === "Spanish")
        $translate.use('es');
      else
        $translate.use('en');
      self.configuration.workOffline = (DBSettings.configuration.workOffline === 'true');

      self.setServerAddress(DBSettings.configuration.serverURL);
    };

    this.getServerAddress = function() {
      return this.configuration.serverURL;
    };

    this.setServerAddress = function(Addr) {
      this.configuration.serverURL = Addr;

      // Need to reset variables
      this.compute_API_URLs();
    };

    this.getBasicAuthentication = function() {
      var authentication = btoa(this.configuration.username + ':' + this.configuration.password);
      return 'Basic ' + authentication;
    };

    this.getAuthenticationHeader = function() {
      var authentication = btoa(this.configuration.username + ':' + this.configuration.password);
      var authen = {};
      authen.headers = {};
      if (authentication !== null) {
        authen.headers.Authorization = 'Basic ' + authentication;
      } else {
        authen.headers.Authorization = '';
      }

      return authen;
    };

    this.setAuthentication = function(username, password){
      this.configuration.username = username;
      this.configuration.password = password;
    };

    this.setLanguage = function(current_language){
      this.configuration.language = current_language;
    };

    this.getUsernamePassword = function() {
      var user_pass = {};
      user_pass.username = this.configuration.username;
      user_pass.password = this.configuration.password;
      return user_pass;
    };

    this.getPersonRetrievalLimit = function(){
      return this.network_personRetrievalLimit;
    };

    this.getConfiguration = function(){
      return this.configuration;
    };

    this.getPeopleURL = function() {
      return this.configuration.api.personURL;
    };

    this.getAuthenticationURL = function() {
      return this.configuration.api.personURL;
    };

    this.getSearchURL = function() {
      return this.configuration.api.searchURL;
    };

    this.getFileServiceURL = function() {
      return this.configuration.api.fileServiceURL;
    };

    this.getShelterURL = function() {
      return this.configuration.api.shelterURL;
    };

    this.getFaceSearchServiceURL = function() {
      return this.configuration.api.faceSearchURL;
    };

  })

.factory('DBHelper', function($cordovaSQLite, $q, $ionicPlatform) {
    var self = this;
    var databases = [];
    var currDB = {};

    self.addDB = function(name, db){
      var newDB = {};
      newDB.name = name;
      newDB.database = db;
      databases.push(newDB);
    };

    self.setCurrentDB = function(dbName){
      for (var i = 0; i < databases.length; i++) {
        if (databases[i].name === dbName) {
          currDB = databases[i].database;
          return;
        }
      }

      console.log("problem choosing database!! was the database chosen incorrectly? dbName: " + dbName);
    };

    self.query = function(query, parameters) {
      parameters = parameters || [];
      var q = $q.defer();

      $ionicPlatform.ready(function() {
        $cordovaSQLite.execute(currDB, query, parameters).then(
          function(result){
            q.resolve(result);
        }, function(error){
            console.log("Error with DB - " + error.message);
            q.reject(error);
          });
      });

      return q.promise;
    };

    self.getAll = function(result) {
      var output = [];

      for (var i = 0; i < result.rows.length; i++){
        output.push(result.rows.item(i));
      }

      return output;
    };

    self.getById = function(result) {
      var output = null;
      output = angular.copy(result.rows.item(0));
      return output;
    };

    return self;
  })

.factory('VIDA_localDB', function($cordovaSQLite, DBHelper, networkService){
    var self = this;

    self.queryDB_createTable = function(tableName, values){
      var query = "CREATE TABLE IF NOT EXISTS " + tableName + "(" + values + ")";
      return DBHelper.query(query).then(function(result){
        console.log(result);
      });
    };

    self.queryDB_select = function(tableName, columnName, afterQuery, where) {
      var query = "SELECT " + columnName + " FROM " + tableName;
      if (where) {
        if (where.restriction == 'LIKE')
          query += " WHERE " + where.column + " LIKE \"%" + where.value + "%\"";
        else if (where.restriction == 'EXACT')
          query += " WHERE " + where.column + "=" + where.value;
      }
      console.log(query);
      return DBHelper.query(query)
        .then(function(result){
          afterQuery(DBHelper.getAll(result));
        });
    };

    self.queryDB_update = function(tableName, values, whereAt, afterQuery) {
      for (var i = 0; i < values.length; i++) {
        var query = "UPDATE " + tableName + " SET " + values[i].type + "=" + values[i].value + " ";

        if (whereAt) {
          query += "WHERE " + whereAt;
        }

        //console.log(query);
        DBHelper.query(query)
          .then(function (result) {
            console.log(result);
            if (afterQuery)
              afterQuery();
          });
      }
    };

    self.queryDB_update_settings = function(success){
      var fields = ['serverURL', 'username', 'password', 'protocol', 'language', 'workOffline'];
      var currentConfiguration = networkService.getConfiguration();
      var JSONObject = "'{\"configuration\":{";
      for (var i = 0; i < fields.length; i++){
        JSONObject += '\"' + fields[i] + '\":\"' + currentConfiguration[fields[i]] + '\"';
        if (i !== fields.length - 1)
          JSONObject += ", ";
      }
      JSONObject += "}}'";
      var query = "UPDATE configuration SET settings=" + JSONObject;
      console.log(query);
      DBHelper.query(query).then(function(result){
        console.log(result);
        if (success)
          success();
      });
    };

    self.queryDB_insert = function(tableName, JSONObject, success) {
      var query = "INSERT INTO " + tableName + " VALUES (" + JSONObject + ")";
      console.log(query);
      DBHelper.query(query)
        .then(function (result) {
          console.log(result);
          if (success)
            success();
        });
    };

    return self;
  });
