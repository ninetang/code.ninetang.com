/**
 * Created By NineTang.
 * Date: 13-8-28
 * Time: 上午11:04
 */
(function (window) {
    var document = window.document;

    var $$ = $$ || function (id) {
        return document.getElementById(id);
    };


    $$.type = function (obj) {
    };

    $$.isPlainObject = function () {
    };


    // 事件
    $$.Handler = {};
    if (document.addEventListener) {
        $$.Handler.addHandler = function (element, eventType, handler) {
            element.addEventListener(eventType, handler, false);
        };
        $$.Handler.removeHandler = function (element, eventType, handler) {
            element.removeEventListener(eventType, handler, false);
        };
    } else if (document.attachEvent) {
        $$.Handler.addHandler = function (element, eventType, handler) {
            if ($$.Handler._find(element, eventType, handler) != -1) {
                return;
            }
            var wrapperHandler = function (e) {
                e = e || window.event;
                var event = {
                    _event: e,
                    type: e.type,
                    target: e.srcElement,
                    relatedTarget: e.fromElement ? e.fromElement : e.toElement,
                    eventPhase: (e.srcElement == element) ? 2 : 3,

                    //Mouse coordinates
                    clientX: e.clientX, clientY: e.clientY,
                    screenX: e.screenX, screenY: e.screenY,

                    //Key State
                    altKey: e.altKey, ctrlKey: e.ctrlKey,
                    shiftKey: e.shiftKey, charCode: e.keyCode,

                    stopPropagation: function () {
                        this._event.cancelBubble = true;
                    },
                    preventDefault: function () {
                        this._event.returnValue = false;
                    }
                };

                if (Function.prototype.call) {
                    handler.call(element, event);
                } else {
                    element._currentHandler = handler;
                    element._currentHandler(event);
                    element._currentHandler = null;
                }
            };
            element.attachEvent('on' + eventType, wrapperHandler);

            var h = {
                element: element,
                eventType: eventType,
                handler: handler,
                wrappedHandler: wrapperHandler
            };

            var d = element.ownerDocument || element;
            var w = d.parentWindow;
            var id = $$.Handler._uid();
            if (!w._allHandlers) w._allHandlers = {};
            w._allHandlers[id] = h;
            if (!element._handlers) element._handlers = [];

            if (!w._onunloadHandlerRegistered) {
                w._onunloadHandlerRegistered = true;
                w.attachEvent("onunload", $$.Handler._removeAllHandlers);
            }
        };

        $$.Handler.removeHandler = function (element, eventType, handler) {
            var i = $$.Handler._find(element, eventType, handler);
            if (i == -1) return;
            var d = element.ownerDocument || element;
            var w = d.parentWindow;

            var handlerID = element._handlers[i];
            var h = w._allHandlers[handlerID];
            element.detachEvent("on" + eventType, h.wrappedHandler);
            element._handlers.splice(i, 1);
            delete  w._allHandlers[handlerID];
        };

        $$.Handler._find = function (element, eventType, handler) {
            var handlers = element._handlers;
            if (!handlers) {
                return -1;
            }
            var d = element.ownerDocument || element;
            var w = d.parentWindow;

            for (var i = handlers.length - 1; i >= 0; i--) {
                var handlerID = handlers[i];
                var h = w._allHandlers[handlerID];
                if (h.eventType == eventType && h.handler == handler) {
                    return i;
                }
            }
            return -1;
        };

        $$.Handler._removeAllHandlers = function () {
            var w = this;
            for (var id in w._allHandlers) {
                if (w._allHandlers.hasOwnProperty(id)) {
                    var h = w._allHandlers[id];
                    h.element.detachEvent("on" + h.eventType, h.wrappedHandler);
                    delete w._allHandlers[id];
                }
            }
        };

        $$.Handler._counter = 0;
        $$.Handler._uid = function () {
            return "h" + $$.Handler._counter++;
        };
    }


    (function () {
        $$.HTTP = {};
        var _factories = [function () {
            return new XMLHttpRequest();
        }, function () {
            return new ActiveXObject("Msxml2.XMLHTTP");
        }, function () {
            return new ActiveXObject("Microsoft.XMLHTTP");
        }];
        var _factory = null;

        /**
         @return {XMLHttpRequest}
         @constructor
         */
        $$.HTTP.newRequest = (function () {
            if (_factory !== null) {
                return _factory();
            }
            for (var i = 0; i < _factories.length; i++) {
                try {
                    var factory = _factories[i];
                    var request = factory();
                    if (request != null) {
                        _factory = factory;
                        return _factory;
                    }
                } catch (e) {

                }
            }

            throw new Error("XMLHttpRequest not supported");

        })();

        /**
         @param {string} url
         @param {Function} callback
         @param {Function} errorHandler
         */

        $$.HTTP.getHeaders = function (url, callback, errorHandler) {
            var request = $$.HTTP.newRequest();
            request.onreadystatechange = function () {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        callback($$.HTTP.parseHeaders(request));
                    } else {
                        if (errorHandler) {
                            errorHandler(request.status, request.statusText);
                        } else {
                            callback(null);
                        }
                    }
                }
            };
            request.open("HEAD", url);
            request.send(null);
        };


        /**
         @param {XMLHttpRequest} request
         @return {Object}
         */
        $$.HTTP.parseHeaders = function (request) {
            var headerText = request.getAllResponseHeaders();
            var headers = {};
            var ls = /^\s*/;
            var ts = /\s*$/;

            var lines = headerText.split("\n");
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.length == 0) continue;
                var pos = line.indexOf(':');
                if (pos) {
                    var name = line.substring(0, pos).replace(ls, '').replace(ts, '');
                    headers[name] = line.substring(pos + 1).replace(ls, '').replace(ts, '');
                }
            }
            return headers;
        };
        /**
         @param {string} url
         @param {function} callback
         */

        $$.HTTP.getText = function (url, callback) {
            var request = $$.HTTP.newRequest();
            request.onreadystatechange = function () {
                if (request.readyState == 4 && request.status == 200) {
                    callback(request.responseText);
                }
            }

        };

        /**
         @param {string} url
         @param {function} callback
         @param {{timeout: number, timeoutHandler:function, errorHandler:function,
         progressHandler:function, parameters:object }} options
         */
        $$.HTTP.get = function (url, callback, options) {
            var request = $$.HTTP.newRequest();
            var n = 0;
            var timer;
            if (options.timeout) {
                timer = setTimeout(function () {
                    request.abort();
                    if (options.timeoutHandler) {
                        options.timeoutHandler(url);
                    }
                }, options.timeout);
            }

            request.onreadystatechange = function () {
                if (request.readyState == 4) {
                    if (timer) clearTimeout(timer);
                    if (request.status == 200) {
                        callback($$.HTTP._getResponse(request));
                    } else {
                        if (options.errorHandler) {
                            options.errorHandler(request.status, request.statusText);
                        } else {
                            callback(null);
                        }
                    }
                } else if (options.progressHandler) {
                    options.progressHandler(++n);
                }
            };
            var target = url;
            if (options.parameters) {
                var delimiter = url.indexOf('?') ? '&' : '?';
                target += delimiter + $$.HTTP.encodeFormData(options.parameters);
                request.open("GET", target);
                request.send(null);
            }
        };

        /**
         @param {string} url
         @param {function} callback
         @param {object} values
         @param {function} errorHandler
         */


        $$.HTTP.post = function (url, values, callback, errorHandler) {
            var request = $$.HTTP.newRequest();
            request.onreadystatechange = function () {
                if (request.readyState == 4) {
                    if (request.state == 200) {
                        callback($$.HTTP._getResponse(request));
                    } else {
                        if (errorHandler) {
                            errorHandler(request.status, request.statusText);
                        } else callback(null);
                    }
                }
            };
            request.open("POST", url);
            request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            request.send($$.HTTP.encodeFormData(values));
        };

        /**
         @param {object} data
         @return {string}
         */
        $$.HTTP.encodeFormData = function (data) {
            var pairs = [];
            var rSpace = /%20/g;
            for (var name in data) {
                if (data.hasOwnProperty(name)) {
                    var value = data[name].toString();
                    var pair = encodeURIComponent(name).replace(rSpace, "+") + "=" +
                        encodeURIComponent(value).replace(rSpace, "+");
                    pairs.push(pair);
                }
            }
            return pairs.join('&');
        };


        /**
         * 跨域script
         @param {string} url
         @param {object} params
         @param {(function|string)} callback
         */

        $$.HTTP.scriptRequest = function (url, params, callback) {
            var p, delimiter, pairs = [],
                script = document.createElement('script');
            script.type = 'text/javascript';
            delimiter = url.indexOf('?') > 0 ? '&' : '?';
            if (typeof params == 'object') {
                //if plain Object
                for (p in params) {
                    if (params.hasOwnProperty(p) && typeof p === 'string') {
                        if (params[p]) {
                            pairs.push(p + '=' + params[p]);
                        }
                    }
                }
                if (pairs.length > 0) {
                    url += delimiter + pairs.join('&') + '&';
                } else {
                    url += delimiter;
                }

                if (typeof callback === 'string') {
                    url += 'jsoncallback=' + callback;
                }
            }
            script.onload = script.onreadystatechange = function () {
                if (window.console) {
                    window.console.log(script.outerHTML);
                }
                //script.onload = script.onreadystatechange = null;
                //todo
            };
            document.body.appendChild(script);
            script.src = url;
        };


        /**
         @param {XMLHttpRequest } request
         @returns {}
         */
        $$.HTTP._getResponse = function (request) {
            switch (request.getResponseHeader("Content-Type")) {
                case    "text/xml":
                    return request.responseXML;

                case "text/json":
                case "text/javascript":
                case "application/javascript":
                case "application/x-javascript":
                    return eval(request.responseText);

                default :
                    return request.responseText;
            }
        };

    })();

    $$.ExtEvents = {};
    window.$$ = $$;
})(window);


