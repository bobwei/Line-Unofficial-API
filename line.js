// 必要な処理のみ

var LINE = (function() {

    var request     = require('request');
    var RSAKey      = require('./rsakey.js');
    var querystring = require('querystring');

    function LINE()
    {
        this.setAuthEndpoint();
        this.setRestEndpoint();
    }

    var HOST = 'https://t.line.naver.jp';
    LINE.__defineGetter__('HOST', function() {
        return HOST;
    });

    LINE.prototype = {
        _authEndpoint: null,
        _restEndpoint: null,

        _request: function(settings)
        {
            var method   = settings.method   || 'GET';
            var uri      = settings.uri      || '';
            var form     = settings.form     || {};
            var callback = settings.callback || null;

            // to lower case
            var headers  = {};
            if (settings.headers) {
                for (var key in settings.headers) {
                    headers[key.toLowerCase()] = settings.headers[key];
                }
            }

            if (typeof headers['user-agent'] === 'undefined') {
                headers['user-agent'] = 'Chrome ';
            }

            if (typeof form._ === 'undefined'
                && method.match(/^(GET|DELETE)$/i)
            ) {
                form._ = new Date().getTime();
            }

            if (method.match(/^(GET|DELETE|PUT)$/i)) {
                uri += "?" + querystring.stringify(form);
                form = {};
            }

            var options = {
                method: method,
                uri: uri,
                form: form,
                headers: headers
            };
            var self = this;

            request(options, function(error, response, body) {
                var result = null;
                if (!error) {
                    try {
                        result = JSON.parse(body);
                        if (result.status !== 200 && result.statusMessage) {
                            error = result.statusMessage;
                        }
                        else if (result.status === 401) {
                            error = 'autherror';
                        }
                        else if (result.status === 500) {
                            error = 'servererror';
                        }
                        if (typeof result.data !== 'undefined') {
                            result = result.data;
                        }
                    }
                    catch (e) {
                        error = 'parsererror';
                    }
                }
                return process.nextTick(function() {
                    if (typeof callback === 'function') {
                        return callback.apply(self, [error, result, response.headers]);
                    }
                });
            });
        },

        setAuthEndpoint: function(endpoint)
        {
            this._authEndpoint = HOST + (endpoint || '/authct/v1');
        },

        setRestEndpoint: function(endpoint)
        {
            this._restEndpoint = HOST + (endpoint || '/rest/v1');
        },

        login: function(email, password, callback)
        {
            var self = this;
            this.getKeys(function(error, result) {
                var sessionKey = result.session_key;
                var rsaKey     = result.rsa_key.split(',');
                var keyname    = rsaKey[0];
                var evalue     = rsaKey[1];
                var nvalue     = rsaKey[2];

                password = String.fromCharCode(sessionKey.length) + sessionKey
                    + String.fromCharCode(email.length) + email
                    + String.fromCharCode(password.length) + password;
                
                var rsa = new RSAKey();
                rsa.setPublic(evalue, nvalue);

                self._request({
                    method: 'POST',
                    uri: self._restEndpoint + '/login',
                    form: {
                        id: keyname,
                        password: rsa.encrypt(password),
                        persistent: 0,
                        provider: 1
                    },
                    callback: callback
                });
            });
        },

        logout: function(callback)
        {
            var self = this;
            self._request({
                method: 'POST',
                uri: self._restEndpoint + '/logout',
                callback: function(error, result) {
                    if (typeof callback === 'function') {
                        callback.apply(self, [error, result]);
                    }
                }
            });
        },

        getKeys: function(callback)
        {
            this._request({
                uri: this._authEndpoint + '/keys/line',
                callback: callback
            });
        },

        getSession: function(callback)
        {
            this._request({
                method: 'POST',
                uri: this._restEndpoint + '/session',
                callback: callback
            });
        },

        getProfile: function(callback)
        {
            this._request({
                uri: this._restEndpoint + '/profile',
                callback: callback
            });
        },

        getUnread: function(callback)
        {
            this._request({
                method: 'POST',
                uri: this._restEndpoint + '/chats/unread',
                callback: callback
            });
        },

        deleteUnread: function(id, callback)
        {
            this._request({
                method: 'DELETE',
                uri: this._restEndpoint + '/chats/' + id,
                callback: callback
            });
        },

        sendMessage: function(id, message, callback)
        {
            this._request({
                method: 'POST',
                uri: this._restEndpoint + '/chats/' + id + '/messages',
                form: {
                    message: message
                },
                callback: callback
            });
        }
    };

    return LINE;

})();

module.exports = LINE;
