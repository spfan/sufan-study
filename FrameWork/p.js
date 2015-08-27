/**
 * 主框架
 * 基于jQuery 和 BootStrap UI
 * 主张配置化的简洁业务逻辑，特别适用于管理系统，尽量保持简洁
 * 代码风格上：
 * 	- 驼峰
 * 	- 英文含义
 * 	- 二级命名空间带有分类型前缀，以减少调用层级
 * @type {[type]}
 */

(function(P) {
    // 本文件的二级命名空间，常用的会直接将函数挂载到一级
    P.config = P.config || {}; // 业务框架配置
    P.getter = null; // GET请求
    P.poster = null; // POST请求
    P.uploader = null; // 包含文件的POST请求
    P.generate = null; // 生成模块
    P.generateCgis = null; // 生成模块下的cgi
    P.generatePages = null; // 生成模块下的页面
    P.util = P.util || {}; // 通用功能
    P.form = P.form || {}; // 表单操作
    P.dict = P.dict || {}; // 字典存储，用于各类静态、动态产生的映射表等
    P.uiPage = P.uiPage || 　{}; // 页面级的ui操作
    P.subscribe = null; // 订阅操作
    P.unsubscribe = null; // 退订操作
    P.publish = null; // 触发订阅事件
    P.init = null; // 对外抛出的入口函数
    P.initPage = null; // 初始化页面的业务逻辑
    P.initUI = null; // 初始化页面的UI

    ////////////////////////// P.util //////////////////////////////

    /**
     * hash算法，基于time33，用于将字符串转换为一组数
     * @param  {[type]} str [description]
     * @return {[type]}     [description]
     */
    P.util.genHash = function(str) {
        var hash = 5381;
        str = str || '';

        for (var i = 0, len = str.length; i < len; ++i) {
            hash += (hash << 5) + str.charAt(i).charCodeAt();
        }

        return hash & 0x7fffffff;
    };

    // 模板填充 P.tmpl
    (function(P) {
        var cache = {};
        P.util.tmpl = function tmpl(str, data) {
            // Figure out if we're getting a template, or if we need to
            // load the template - and be sure to cache the result.
            var fn = !/\W/.test(str) ?
                cache[str] = cache[str] ||
                tmpl(document.getElementById(str).innerHTML) :
                // Generate a reusable function that will serve as a template
                // generator (and which will be cached).
                new Function("obj",
                    "var p=[],print=function(){p.push.apply(p,arguments);};" +

                    // Introduce the data as local variables using with(){}
                    "with(obj){p.push('" +

                    // Convert the template into pure JavaScript
                    str
                    .replace(/[\r\t\n]/g, " ")
                    .split("<%").join("\t")
                    .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                    .replace(/\t=(.*?)%>/g, "',$1,'")
                    .split("\t").join("');")
                    .split("%>").join("p.push('")
                    .split("\r").join("\\'") + "');}return p.join('');");

            // Provide some basic currying to the user
            return data ? fn(data) : fn;
        };
    })(P);

    /**
     * 跳转到页面
     * @param  {[type]} mod    模块
     * @param  {[type]} page   页面
     * @param  {[type]} params 带的参数
     * @return {[type]}        [description]
     */
    P.util.goPage = function(mod, page, params) {
        location.href = P.util.getPageUrl(mod, page, params); // 现在只是简单规则
    };

    // 获取实际的url
    P.util.getPageUrl = function(mod, page, params) {
        var url = '';

        page = page || '';
        url = mod + page;
        if (params) {
            if (typeof params === 'object') {
                var kv = [];
                $.each(params, function(k, v) {
                    kv = k + '=' + encodeURIComponent(v);
                });
                url += '?' + kv.join('&');
            } else {
                url += '?' + encodeURI(params);
            }
        };

        return url;
    };

    /**
     * 获取URL参数，支持数组格式来批量获取
     * 优先从querystring获取，其次为fragment
     * @param  {[type]} params [description]
     * @return {[type]}        [description]
     */
    P.util.getUrlParams = function(params) {
        var result, ps = {},
            search = location.search.substring(1).split('&') || [],
            hash;

        hash = location.hash;
        hash.substring(0, 2) == '#!' && (hash = hash.substring(1)); // 支持下#!的情况
        hash = hash.substring(1).split('&') || [];

        // 优先取search，再取hash
        $.each(search, function(k, v) {
            var t;

            if (v) {
                t = v.split('=');
                ps[t[0]] = t.length > 0 ? t[1] : '';
            }
        });

        $.each(hash, function(k, v) {
            var t;

            if (k in ps) {
                return;
            }

            if (v) {
                t = v.split('=');
                ps[t[0]] = t.length > 0 ? t[1] : '';
            }
        });

        if ($.isArray(params)) {
            result = {};
            $.each(params, function(i, v) {
                result[v] = ps[v] || '';
            });
        } else {
            // 如果没有传入参数，则返回所有
            result = params ? (ps[params] || '') : ps;
        }

        return result;
    };

    /**
     * 获取到完整的http地址
     *
     * @param  {[type]} url
     * @return {[type]}
     */
    P.util.getFullUri = function(url) {
        if (/^(http(s)?:)?\/\/|^\/\//.test(url) === false) {
            url = P.config.API_DOMAIN + url;
        }

        return url;
    };

    /**
     * 判断请求目标是否跨域
     * @return {Boolean} [description]
     */
    P.util.isCrossDomain = function(url) {
        var rt = true;

        // 简单判断为同域（暂时忽略了protocol和port）
        if ((new RegExp('//' + location.host, 'i')).test(url)) {
            rt = false;
        }

        return rt;
    };

    /**
     * 字符串转换为JSON对象
     * Logic borrowed frome jQuery 1.6.2
     */
    P.util.parseJSON = function(data) {
        if (typeof data !== "string" || !data) {
            return null;
        }

        var rvalidchars = /^[\],:{}\s]*$/,
            rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
            rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
            rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
            rbrace = /^(?:\{.*\}|\[.*\])$/;

        // 如果包含空格，IE可能出错
        data = data.replace(/^\s+|\s+$/g, '');

        if (rbrace.test(data)) {
            data = (data + '').replace(/^\s+|\s+$/g, '');

            if (window.JSON && window.JSON.parse) {
                return window.JSON.parse(data);
            }

            // Make sure the incoming data is actual JSON
            // Logic borrowed from http://json.org/json2.js
            if (rvalidchars.test(data.replace(rvalidescape, "@")
                .replace(rvalidtokens, "]")
                .replace(rvalidbraces, ""))) {

                return (new Function("return " + data))();
            }
        } else {
            return data;
        }
    };

    /**
     * 对象转换为字符串，来自QZFL.lang.obj2str
     */
    P.util.stringify = function(obj) {
        var t, sw;

        if (typeof(obj) == 'object') {
            if (obj === null) {
                return 'null';
            }

            if (window.JSON && window.JSON.stringify) {
                return JSON.stringify(obj);
            }

            sw = P.util.isArray(obj);
            t = [];
            for (var i in obj) {
                t.push((sw ? "" : ("\"" + P.util.escString(i) + "\":")) + P.util.stringify(obj[i]));
            }
            t = t.join();
            return sw ? ("[" + t + "]") : ("{" + t + "}");
        } else if (typeof(obj) == 'undefined') {
            return 'undefined';
        } else if (typeof(obj) == 'number' || typeof(obj) == 'function') {
            return obj.toString();
        }
        return !obj ? "\"\"" : ("\"" + P.util.escString(obj) + "\"");
    };

    /**
     * 深度复制
     */
    P.util.copydata = function(obj, preventName) {
        if ((typeof obj) == 'object') {
            var res = P.util.isArray(obj) ? [] : {};
            for (var i in obj) {
                if (i != preventName)
                    res[i] = P.util.copydata(obj[i], preventName);
            }
            return res;
        } else if ((typeof obj) == 'function') {
            return Object;
        }
        return obj;
    };

    /**
     * 是否为数组
     */
    P.util.isArray = function(obj) {
        return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() == 'array';
    };

    /**
     * 字符串\转义，来自QZFL.string.escString
     */
    P.util.escString = function(str) {
        var m = {
            '\\\\': /\\/g,
            '\\/': /\//g,
            '\\n': /\n/g,
            '': /\r/g,
            '\\t': /\t/g,
            '\\\'': /\x27/g,
            '\\"': /\x22/g
        };

        str = str.toString();
        for (var x in m) {
            str = str.replace(m[x], x);
        }

        return str;
    };

    /*
	本地存储
	支持json格式数据的存储
*/
    (function(ql) {
        var store = null,
            engine = null,
            searchOrder,
            engines;

        searchOrder = ['localStorage', 'userData']; //, 'globalStorage'];
        engines = {
            localStorage: {
                test: function() {
                    return !!window.localStorage;
                },
                init: function() {
                    store = window.localStorage;
                },
                getItem: function(key) {
                    return (P.util.parseJSON(store.getItem(key)));
                },
                setItem: function(key, value) {
                    typeof value === 'object' && (value = P.util.stringify(value));

                    return store.setItem(key, value);
                },
                removeItem: function(key) {
                    return store.removeItem(key);
                }
            },
            userData: {
                test: function() {
                    return window.ActiveXObject ? true : false;
                },
                init: function() {
                    store = document.documentElement;
                    store.addBehavior('#default#userdata');
                },
                getItem: function(key) {
                    store.load(key);
                    return P.util.parseJSON(store.getAttribute(key));
                },
                setItem: function(key, value) {
                    typeof value === 'object' && (value = P.util.stringify(value));

                    store.load(key);
                    store.setAttribute(key, value);
                    return store.save(key);
                },
                removeItem: function(key) {
                    store.load(key);
                    store.expires = new Date(315532799000).toUTCString();
                    return store.save(key);
                }
            }
        };
        for (var i = 0, l = searchOrder.length, engine; i < l; i++) {
            engine = engines[searchOrder[i]];

            // 防止读异常，都try下
            try {
                if (engine.test()) {
                    engine.init();
                    break;
                }
            } catch (ex) {
                engine = null;
            }
        }

        /**
         * P.localStorage.set 存入
         * @param	string	key		键
         * @param	mix		data	值，可以是hashmap对象
         */
        ql.set = function(key, value) {
            /* 这里对所有的读写都做try，原因：
			1. userdata的存储文件属性被修改为只读时，调用load方法时会失败。来自betawang
			2. ie10 for win7,访问window.localStorage时提示：The system cannot find the path specified。来自scorpionxu
		*/
            try {
                return engine.setItem(key, value);
            } catch (ex) {
                return false;
            }
        };

        /**
         * P.localStorage.get 取出
         * @param	string	key		键
         * @return	mix		可能返回json对象，或字符串值
         */
        ql.get = function(key) {
            try {
                return engine.getItem(key);
            } catch (ex) {
                return null;
            }
        };

        /**
         * P.localStorage.remove 删除值
         * @param	string	key		键
         */
        ql.remove = function(key) {
            try {
                return engine.removeItem(key);
            } catch (ex) {
                return false;
            }
        };
    })(P.localStorage = {});


    /* 存储管理 */
    (function(qs) {
        var SMEDIA,
            _config = {
                _expire: 300000 // 有效时间默认5分钟,单位ms,如果为-1(小于零的数)，则永不过期。每个存储的数据都带有这个字段。
            },
            _isExpired,
            _allKeys = '_P_stored_keys_'; // 存储的所有字段

        // 存储介质，各自的存活周期不一样。根据业务需求取用适当的存储介质。
        SMEDIA = {
            // 内存变量，整页刷新时清除
            memory: (function() {
                var _datapool = {},
                    _md;

                return {
                    set: function(key, val) {
                        // 需要拷贝一份，避免被引用修改
                        _datapool[key] = P.util.copydata(val);
                    },
                    get: function(key) {
                        // 不能直接返回，需要拷贝一份返回，避免原始数据被篡改
                        return key in _datapool ? P.util.copydata(_datapool[key]) : null;
                    },
                    remove: function(key) {
                        _datapool[key] = null;
                        delete _datapool[key];
                    }
                }
            })(),
            // 本地存储，和页面跳转无关，始终有效
            local: {
                set: function(key, val) {
                    P.localStorage.set(key, val);
                },
                get: function(key) {
                    return P.localStorage.get(key);
                },
                remove: function(key) {
                    P.localStorage.remove(key);
                }
            }
        };

        // 当前数据是否有效
        _isExpired = function(data) {
            return data._expire > 0 && ((new Date).getTime() - data._time > data._expire) ? true : false;
        };

        /**
         * 获取数据
         * @param	{string}	key		必须
         * @param	{string}	media	可选，值可以为local或memory，前者从本地存储中取，后者从内存变量取
         * @return	{mixed}
         */
        qs.get = function(key, media) {
            var sdata;

            media && (sdata = SMEDIA[media].get(key));

            if (sdata) {
                if (!_isExpired(sdata)) {
                    // 还有效，则返回数据
                    return sdata.data;
                } else {
                    // 否则清理过期的数据
                    //SMEDIA[media].remove(key);
                    qs.del(key, media);
                    return false;
                }
            } else {
                return false;
            }
        };

        /**
         * 写入数据
         * @param	{string}	key		必须
         * @param	{string}	data	必须，数据
         * @param	{object}	cfg		可选，media: 指定存储介质（local|memory），expire：存储的有效时间(ms)
         * @return	{boolean}
         */
        qs.set = function(key, data, cfg) {
            var sdata, skeys;

            typeof cfg === 'undefined' && (cfg = {});
            cfg.media === 'undefined' && (cfg.media = 'parent'); // 默认存储到parent上

            // 约定的存储结构
            sdata = {
                data: data,
                _time: (new Date).getTime(), // 存储的当前时间
                _expire: cfg.expire || _config._expire // 此数据的有效期
            };

            // 更新下已经存储的字段
            cfg.media == 'local' && key != _allKeys && (
                skeys = qs.get(_allKeys, 'local') || {},
                skeys[key] = 1, // 标明此key还可用
                qs.set(_allKeys, skeys, {
                    media: 'local',
                    expire: -1
                })
            );

            return SMEDIA[cfg.media].set(key, sdata);
        };

        /**
         * 删除数据
         * @param	{string}	key		必须
         * @return	{boolean}
         */
        qs.del = function(key, media) {
            var sdata, skeys, rt = true;

            typeof media === 'string' ?
                (sdata = SMEDIA[media].get(key)) :
            // 未指定存储介质时，先检索memory有无此存储，若无则检查本地存储是否有
            (media = 'memory', sdata = SMEDIA[media].get(key)) || (media = 'local', sdata = SMEDIA[media].get(key));

            // 已有的存储，则删除
            if (sdata) {
                rt = SMEDIA[media].remove(key);

                // 同时从字段列表中删除此字段
                media == 'local' && (skeys = qs.get(_allKeys, 'local') || {});
                skeys && (key in skeys) && (
                    skeys[key] = null, delete skeys[key],
                    qs.set(_allKeys, skeys, {
                        media: 'local',
                        expire: -1
                    })
                );
            }

            return rt;
        };

        // 清除已过期的数据(仅本地存储的)
        qs.purge = function() {
            var skeys = qs.get(_allKeys, 'local');

            for (var k in skeys) {
                qs.get(k, 'local'); // get时会判断是否有效，并做清除
            }
        };

        // 当前剩余空间判断（目前支持IE8+）
        if (typeof localStorage === 'object' && 'remainingSpace' in localStorage) {
            // 小于阀值(1M，共5M)，开始执行清理工作
            localStorage.remainingSpace < 1000000 && setTimeout(P.storage.purge, 0);
        }

        // 内存变量存储
        /**
         * P.storage.getMemory
         * @param  {[type]} key [description]
         * @return {[type]}     [description]
         */
        qs.getMemory = function(key) {
            return qs.get(key, 'memory');
        };

        /**
         * P.storage.setMemory
         * @param	{string}	key		必须
         * @param	{string}	data	必须，数据
         * @param	{object}	expire	可选，存储的有效时间(ms)。默认5分钟
         * @return	{boolean}
         */
        qs.setMemory = function(key, data, expire) {
            return qs.set(key, data, {
                media: 'memory',
                expire: expire || _config._expire
            });
        };

        /**
         * P.storage.deleteMemory
         * @param	{string}	key		必须
         * @return	{boolean}
         */
        qs.deleteMemory = function(key) {
            return qs.del(key, 'memory');
        };

        // 本地存储
        /**
         * P.storage.getLocal
         * @param  {[type]} key [description]
         * @return {[type]}     [description]
         */
        qs.getLocal = function(key) {
            return qs.get(key, 'local');
        };

        /**
         * P.storage.setLocal
         * @param	{string}	key		必须
         * @param	{string}	data	必须，数据
         * @param	{object}	expire	可选，存储的有效时间(ms)。默认5分钟
         * @return	{boolean}
         */
        qs.setLocal = function(key, data, expire) {
            return qs.set(key, data, {
                media: 'local',
                expire: expire || _config._expire
            });
        };

        /**
         * P.storage.deleteLocal
         * @param	{string}	key		必须
         * @return	{boolean}
         */
        qs.deleteLocal = function(key) {
            return qs.del(key, 'local');
        };
    })(P.storage = {});

    /**
     * 函数队列
     */
    P.fnQueue = function(context) {
        this.queue = [];
        this.context = context || null; // 执行环境
    };
    P.fnQueue.prototype = {
        // 保留式执行，执行完毕，队列尚在
        exec: function(context) {
            var item;

            // 执行的时候，需要保持原来的context...
            for (var i = 0, len = this.queue.length; i < len; i++) {
                item = this.queue[i];
                item.length > 1 ?
                    item[0].apply(context || this.context, item[1]) :
                    item[0].apply(context || this.context);
            }
        },
        // 执行完毕，队列清空
        execOnce: function(context) {
            this.exec(context);
            this.queue = [];
        },
        // 追加到当前队列的最后
        add: function(fn, args) {
            typeof fn === 'function' && this.queue.push(args ? [fn, args] : [fn]);
            return this.queue.length - 1; // 返回当前函数在队列汇总的index
        },
        // 插入到前面
        insert: function(fn, args) {
            typeof fn === 'function' && this.queue.unshift(args ? [fn, args] : [fn]);
            return 0; // 这个时候已经在最前面啦
        },
        // 获取指定索引下的回调函数
        get: function(index) {
            return index <= this.queue.length ? this.queue[index] : null;
        }
    };

    ////////////////////////// 网络请求 //////////////////////////////
    /**
     * 网络请求类
     * @type {Object}
     */
    P.network = {
        // 跨域请求的代理页
        proxyUrl: '',

        /**
         * 获取代理页的XHR的工厂方法，可指定代理url
         * @param  {Function} callback [description]
         * @return {[type]}            [description]
         */
        _timerProxyXHRFactory: null,
        getProxyXHRFactory: function(callback, proxyUrl) {
            var proxyHandler, id;

            clearTimeout(P.network._timerProxyXHRFactory);

            proxyUrl = proxyUrl || P.network.proxyUrl;
            id = 'proxyHandler' + P.util.genHash(proxyUrl);

            proxyHandler = $('#' + id);
            if (proxyHandler.size() > 0) {
                callback(proxyHandler.get(0).getTransport);
            } else {
                $('<iframe id="' + id + '" src="' + proxyUrl + '" width="1px" height="1px" style="display:none"></iframe>')
                    .on('load', (function(callback) {
                        return function() {
                            var xhr = this.getTransport;

                            callback(xhr);

                            // 延时清理，快速请求的时候可以重用下
                            P.network._timerProxyXHRFactory = setTimeout(function() {
                                $('#' + id).remove();
                            }, 3000);
                        };
                    })(callback))
                    .appendTo(document.body);
            }
        },

        // 几个请求切面，按照顺序发生。每个切面都是个队列
        // 内部的this指向请求实例
        requestHandler: new P.fnQueue(),
        beforeRequest: new P.fnQueue(),
        responseHandler: new P.fnQueue(),
        afterResponse: new P.fnQueue(),

        /**
         * 真正的请求，需要通过new 来初始化，以隔离属性
         * @return {[type]}
         */
        send: function(method, url, requestParams, callback, opts) {
            var callbackName, ajaxParams = {};

            this.method = method;

            if (this.method == 'upload') { // 上传类的特别处理
                // @todo 暂未考虑不支持的情况
                this.params = new FormData();
                for (var k in requestParams) {
                    this.params.append(k, requestParams[k]);
                }

                ajaxParams.type = 'POST';
                ajaxParams.enctype = 'multipart/form-data';
                ajaxParams.cache = false,
                ajaxParams.contentType = false;
                ajaxParams.processData = false;
            } else {
                this.params = requestParams || {};

                if (this.method === 'post') {
                    ajaxParams.type = 'POST';
                };
            }

            this.opts = opts || {};
            this.callback = callback;
            this.url = P.util.getFullUri(url); // 补充完整的url

            P.network.requestHandler.exec(this);

            this.id = P.util.genHash(this.url + '?' + P.util.stringify(this.params));

            /*
			// 异步获取到代理的XHR示例
			P.network.getProxyXHRFactory(function(xhr){
				return P.uploader('http://xxxx.com/geturl', params, callback, {
					xhr : xhr
				});
			}, 'http://xxxx.com/helper/proxy.html');
		 */

            // 是否使用第三方的xhr
            this.opts.xhr && (ajaxParams.xhr = this.opts.xhr);

            if (!P.util.isCrossDomain(this.url) || this.opts.crossDomain || this.opts.xhr) { // 同域 或 支持COR 或代理页
                ajaxParams.dataType = this.opts.dataType || 'json';
                this.opts.crossDomain && (ajaxParams.crossDomain = true);

                ajaxParams.complete = (function(m) {
                    return function(d) {
                        // !d.responseJSON && (d.responseJSON = {});
                        // 可能JQ解析失败
                        if (!d.responseJSON) {
                            d.responseJSON = eval('(' + d.responseText + ')');
                        };
                        m.response = d;
                        P.network.afterResponse.exec(m);

                        P.network.responseHandler.exec(m);

                        callback(m.response.responseJSON, {
                            responseText: d.responseText,
                            status: d.status,
                            statusText: d.statusText
                        });
                    };
                })(this);
            } else { // JSONP跨域
                ajaxParams.dataType = this.opts.dataType || 'script';

                callbackName = this.opts.callbackName || ('callback_' + this.id); // 附加参数，以便不同

                this.params.callback = callbackName;

                window[callbackName] = (function(callback, callbackName, m) {
                    return function(d) {
                        m.response = d;
                        P.network.afterResponse.exec(m);

                        P.network.responseHandler.exec(m);

                        callback(m.response);
                        window[callbackName] = null;
                        delete window[callbackName];
                    };
                })(callback, callbackName, this);
            }

            ajaxParams.url = this.url;
            ajaxParams.data = this.params;

            P.network.beforeRequest.exec(this);

            return $.ajax(ajaxParams);
        }
    };

    // 增加几个默认的处理
    P.network.beforeRequest.add(function() {
        if (this.opts.showLoading) {
            P.uiPage.showLoading(this.opts.showLoading);
        };
    });
    P.network.afterResponse.add(function() {
        if (this.opts.showLoading) {
            P.uiPage.hideLoading();
        }
    });

    /**
     * GET 请求
     * @param  {[type]}   url      [description]
     * @param  {[type]}   params   [description]
     * @param  {Function} callback [description]
     * @param  {object}	  opts 	   [description]
     * @return {[type]}            [description]
     */
    P.getter = function(url, params, callback, opts) {
        var instance;

        instance = new P.network.send('get', url, params, callback, opts);

        return instance;
    };

    /**
     * POST 请求
     * @param  {[type]}   url      [description]
     * @param  {[type]}   params   [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    P.poster = function(url, params, callback, opts) {
        var instance;

        instance = new P.network.send('post', url, params, callback, opts);

        return instance;
    };

    /**
     * 包含文件上传的 POST 请求
     * @param  {[type]}   url      [description]
     * @param  {[type]}   data     [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    P.uploader = function(url, params, callback, opts) {
        var instance;

        instance = new P.network.send('upload', url, params, callback, opts);

        return instance;
    };

    ////////////////////////// 系统级弹框 //////////////////////////////

    /**
     * 替换系统的 alert
     * @param  {[type]}   msg      [description]
     * @param  {Function} callback [description]
     * @param  {[type]}   opts     [description]
     * @return {[type]}            [description]
     */
    P.alert = function(msg, callback, opts) {
        opts = opts || {};
        !callback && (callback = function() {});
        return bootbox.alert(msg, callback);
    };

    /**
     * 替换系统的 prompt
     * @param  {[type]}   msg      [description]
     * @param  {Function} callback [description]
     * @param  {[type]}   opts     [description]
     * @return {[type]}            [description]
     */
    P.prompt = function(msg, callback, opts) {
        opts = opts || {};
        !callback && (callback = function() {});
        return bootbox.prompt(msg, callback);
    };

    /**
     * 替换系统的 confirm
     * @param  {[type]}   msg      [description]
     * @param  {Function} callback [description]
     * @param  {[type]}   opts     [description]
     * @return {[type]}            [description]
     */
    P.confirm = function(msg, callback, opts) {
        opts = opts || {};
        !callback && (callback = function() {});
        return bootbox.confirm(msg, callback);
    };

    /**
     * 通用弹框，包含一段html
     *
     * @param  {[type]}   msg      [description]
     * @param  {Function} callback [description]
     * @param  {[type]}   opts     [description]
     * @return {[type]}            [description]
     */
    P.dialog = function(msg, callback, opts) {
        opts = opts || {};
        !callback && (callback = function() {});
        return bootbox.dialog({
            title: opts.title || '',
            message: msg,
            buttons: {
                success: {
                    label: opts.label || 'OK',
                    callback: callback
                }
            }
        });
    };

    /**
     * 关闭以上各种弹框
     * @param  {Boolean} isBubble 是否需要尝试向上查找关闭浮层（iframe使用场景时）
     * @return {[type]}           [description]
     */
    P.closeDialog = function(isBubble) {
        bootbox && bootbox.hideAll();

        if (isBubble) {
            var _parent = parent,
                bubbleClose;

            bubbleClose = function() {
                try {
                    _parent.bootbox.hideAll();
                } catch (err) {}

                while (top !== _parent) {
                    _parent = _parent.parent;
                    bubbleClose();
                }
            };
        };
    };

    //////////////////////////  form 表单操作 //////////////////////////////

    /**
     * 获取表单数据，支持：
     * 	1. 对象传入，key为字段名，value可以为HTML标签名，或者whatever
     * 	2. 数组传入
     * 	3. 字符串，单个字段
     * @param  {object} fields 需要获取的字段name，数组传入则批量获取
     * @param  {object} wrapper 可选，默认取form下的表单元素，但对一个页面有多个表单时，需要指定form，可以是ID
     * @return {[type]}        [description]
     */
    P.form.getData = function(fields, wrapper) {
        var data = {},
            paramsType, fieldsArray = [];

        // 支持多格式输入
        switch ($.type(fields)) {
            case 'object':
                $.each(fields, function(k, v) {
                    fieldsArray.push(k);
                });
                break;

            case 'string':
                fieldsArray = [fields];
                break;

            default:
                fieldsArray = fields;
        }

        wrapper = typeof wrapper === 'string' ? $('#' + wrapper) : (wrapper ? $(wrapper) : '');
        !wrapper && (wrapper = $('form').eq(0));

        // 都格式化成数组来遍历
        $.each(fieldsArray, function(i, field) {
            var el, val, type;

            el = $('[name="' + field + '"]', wrapper);
            type = el.size() > 0 ? (el.attr('type') || '').toUpperCase() : '';

            // 可能取多组数据
            if (el.size() > 1) {
                val = [];
                $.each(el, function(i, v) {
                    var tv;
                    v = $(v);
                    // checkbox元素的默认转换
                    if (type == 'CHECKBOX' || type == 'RADIO') {
                        if (v.prop('checked')) {
                            tv = v.val();
                        }
                    } else {
                        tv = v.val();
                    }
                    tv !== undefined && tv !== '' && val.push(tv);
                });
                val = val.join(',');
            } else {
                val = el.val();

                if (type == 'CHECKBOX' || type == 'RADIO') {
                    if (el.prop('checked')) {} else {
                        val = '';
                    }
                }
            }

            typeof val !== 'undefined' && (data[field] = val);
        });

        return data;
    };

    /**
     * 填充select 下拉框
     * 支持两种数据格式：
     * 	1. key-value对，如{1：'角色',2:'棋牌'}
     * 	2. 数组，可保持顺序，如[{name:'角色',value:1},{name:'棋牌',value:2}]
     * 	3. 数组，值为下标，从0开始，如['角色', '棋牌']
     * @param  {[type]} id   元素本身或id
     * @param  {[type]} list [description]
     * @param  {[type]} opts [description]
     * @return {[type]}      [description]
     */
    P.form.fillSelect = function(id, list, opts) {
        var el, keyField, valField, selected, dict = {},
            isObjectArray = false;

        list = list || [];
        el = typeof id == 'string' ? $('#' + id) : $(id);
        opts = opts || {};

        // 不存在的元素，就跳过了
        if (el.size() === 0) {
            return false;
        };

        // 判断下是哪种输入的数据类型，只要识别类型2即可
        if ($.isArray(list) && $.isPlainObject(list[0])) {
            isObjectArray = true;
            keyField = opts.keyField || 'name';
            valField = opts.valField || 'value';
        }

        selected = opts.selected || '';
        !$.isArray(selected) && (selected = [selected]);

        el = el.get(0);
        // 是否清除原有的
        if (opts.clear) {
            el.options.length = 0;
        };

        if ('defaults' in opts) {
            var dftKey, dftVal;

            if ($.isArray(opts['defaults'])) {
                dftKey = opts['defaults'][0];
                dftVal = opts['defaults'][1];
            } else {
                dftKey = opts['defaults'];
                dftVal = '';
            }

            el.options.add(new Option(dftKey, dftVal, false, true));
        }

        $.each(list, function(i, v) {
            var opt, isSelected, key, val;

            isObjectArray ? (
                key = v[keyField],
                val = v[valField]
            ) : (
                key = v,
                val = i
            );

            isSelected = $.inArray(val, selected) >= 0;
            opt = new Option(key || (val + '(无名称)'), val, false, isSelected);

            // 其他属性都加上去，方便以后用
            if ($.isPlainObject(v)) {
                $.each(v, function(kk, vv) {
                    opt.setAttribute('data-' + kk, vv);
                });
            }

            el.options.add(opt);

            // 存一份到字典，备查
            dict[val] = key;
        });

        // 如果没有值，则给个默认
        if (el.options.length < (opts['defaults'] ? 2 : 1)) {
            el.options.add(new Option('暂无数据', '', false, false));
        }

        // 存储到全局字典
        P.dict.set(el.name || valField, dict);
    };

    // 自动数据填充
    (function() {
        var autoFillDataMapping = {};

        // 新增一类实例
        P.form.addNameMapping = function(name, mapping) {
            autoFillDataMapping[name] = function(el, callback, opts) {
                P.form.fillSelect(el, mapping);

                callback && callback.call(null, mapping);
            }
        };

        // 调用入口
        P.form.autoFillData = function(dataName, element) {
            element && (element = $(element)) && (dataName in autoFillDataMapping) && (
                autoFillDataMapping[dataName].call(null, element, function() {
                    // 告诉下大家，已经加载完毕了，该干嘛的都干嘛去
                    P.publish('autoFill/' + dataName);
                }, {
                    arguments: element.attr('data-arguments')
                })
            );
        };

        // 重填某个元素
        P.form.refreshAutoFillData = function(dataName) {
            P.form.autoFillData(dataName, $('[data-fill=' + dataName + ']'));
        };
    })();

    ////////////////////////// 自定义事件的观察者模式 //////////////////////////////

    (function() {
        var EVENT_POOL = $({});

        /**
         * 订阅
         * @return {[type]} [description]
         */
        P.subscribe = function() {
            EVENT_POOL.on.apply(EVENT_POOL, arguments);
        };

        /**
         * 退订
         * @return {[type]} [description]
         */
        P.unsubscribe = function() {
            EVENT_POOL.off.apply(EVENT_POOL, arguments);
        };

        /**
         * 触发自定义事件
         * @return {[type]} [description]
         */
        P.publish = function() {
            EVENT_POOL.trigger.apply(EVENT_POOL, arguments);
        };
    })();

    ////////////////////////// 字典存储 //////////////////////////////

    /**
     * 全局列表型数据的字典，只是个笼统的存储，后面可以扩展出来仅获取名称、某个字段的这种，或者反转
     * @param  {[type]} P [description]
     * @return {[type]}     [description]
     */
    (function(P) {
        var DICTIONARY = {};

        P.dict = {};

        /**
         * 获取字典值，支持批量
         * @param  {[type]} dictName 字典名称
         * @param  {[type]} key      需要获取的具体词条，可以数组形式获取多个
         * @return {[type]}          [description]
         */
        P.dict.get = function(dictName, key) {
            var result = '';

            if (dictName in DICTIONARY) {
                if (typeof key === 'undefined') {
                    result = DICTIONARY[dictName];
                } else if (typeof key !== 'object') {
                    result = key in DICTIONARY[dictName] ? DICTIONARY[dictName][key] : '';
                } else {
                    result = [];
                    $.each(key, function(i, k) {
                        result.push(k in DICTIONARY[dictName] ? DICTIONARY[dictName][k] : '');
                    });
                }
            }

            return result;
        };

        /**
         * 设置字典的词条
         * @param {[type]} dictName        [description]
         * @param {[type]} keyValueMapping [description]
         */
        P.dict.set = function(dictName, keyValueMapping) {
            // 新建还是追加
            if (dictName in DICTIONARY) {
                $.each(keyValueMapping, function(k, v) {
                    DICTIONARY[dictName][k] = v;
                });
            } else {
                DICTIONARY[dictName] = keyValueMapping || {};
            }
        };

        /**
         * 清空指定字典的所有词条
         * @param  {[type]} dictName [description]
         * @return {[type]}          [description]
         */
        P.dict.reset = function(dictName) {
            DICTIONARY[dictName] = {};
        };

    })(P);

    // UI操作
    (function() {
        // 刷新当前页面
        P.initPage =
            P.refreshPage = function() {
                $('select[data-fill]').each(function(i, el) {
                    P.form.autoFillData(this.getAttribute('data-fill'), el);
                });

                // 加载完依赖资源后，才能开始页面的业务逻辑
                // P.subscribe('aufoFill/AllComplete', function(){
                // }

                P.init && P.init.call();
        };

        // 获取查询参数，这里有id的约定
        P.getListConditionParams = function() {
            var params = {},
                getListFn, page;

            // 获取翻页参数
            getListFn = arguments.callee.caller;
            page = P.getPaginationData('page') || 1;

            params.page = page;

            $('#listCondition input,#listCondition select').each(function(i, v) {
                params[v.name] = v.value;
            });

            return params;
        };

        // 填写列表模板
        P.renderList = function(elId, tplId, data) {
            // 填充内容
            $('#' + elId).html(P.tmpl(tplId, data));

            if (data.conf) {
                // 填充分页
                P.setPagination(elId, data.conf, function(page) {
                    P.refreshPage();
                });
            }
        };

        P._paginationData = {};

        // 获取分页数据
        P.getPaginationData = function(key) {
            return key in P._paginationData ? P._paginationData[key] : '';
        };

        // 设置分页数据，现在用于在翻页时，指定翻到第几页
        P.setPaginationData = function(data) {
            $.extend(P._paginationData, data);
        };

        // 设置分页
    })();

    /**
     * 显示进度条，基于SVG，无资源依赖
     * IE9+
     * @param  {[type]} element [description]
     * @return {[type]}         [description]
     */
    P.uiPage.showLoading = function(element, opts) {
        var loadingUI, config, wrapWidth, wrapHeight;

        typeof element === 'string' && (element = $('#' + element));
        opts = opts || {};

        // 获取容器尺寸，决定显示icon的大小和位置
        wrapWidth = element.width();
        wrapHeight = element.height();

        // 默认的样式配色等
        config = {
            width: wrapWidth + 'px', // 整体宽度
            iconSize: '60px', // icon尺寸，同宽高
            color: '#8ac007', // loading条颜色
            autoClose: 10000 // 单位ms，自动隐藏loading的延时时间
        };
        $.extend(config, opts);

        // 综合参数处理
        // icon上边距
        !config.iconMarginTop && (
            config.iconMarginTop = (Math.max(Math.min(wrapHeight, $(window).height()), parseInt(config.iconSize, 10)) - parseInt(config.iconSize, 10)) / 2 + 'px'
        );
        // 整体高度
        !config.height && (
            config.height = Math.max(100, wrapHeight) + 'px'
        );

        loadingUI = [
            '<div class="P-loadingUI">',
            '	<style type="text/css">',
            '	.P-loadingUI{margin:0 0 2em;height:' + config.height + ';width:' + config.width + ';text-align:center;padding:1em;margin:' + config.iconMarginTop + ' auto;display:inline-block;vertical-align:top;filter:url(#P-loadingIcon)}',
            '	svg path,svg rect{fill:' + config.color + ';}',
            '	</style>',
            '	<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="' + config.iconSize + '" height="' + config.iconSize + '" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;" xml:space="preserve">',
            '	<path opacity="0.2" fill="#000" d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946',
            '	s14.946-6.691,14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634',
            '	c0-6.425,5.209-11.634,11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z"/>',
            '	<path fill="#000" d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0',
            '		C22.32,8.481,24.301,9.057,26.013,10.047z">',
            '		<animateTransform attributeType="xml"',
            '		  attributeName="transform"',
            '		  type="rotate"',
            '		  from="0 20 20"',
            '		  to="360 20 20"',
            '		  dur="0.5s"',
            '		  repeatCount="indefinite"/>',
            '		</path>',
            '	</svg>',
            '</div>'
        ].join('');

        // 延时一点显示，有的返回很快的情况就不要了
        clearTimeout(P.uiPage.showLoading._timer);
        P.uiPage.showLoading._timer = setTimeout((function(loadingUI, element) {
            return function() {
                $(loadingUI).insertBefore(element.first());
                loadingUI = null;
                element = null;
            };
        })(loadingUI, element), 300);

        // 是否自动关闭
        if (config.autoClose > 0) {
            setTimeout(P.uiPage.hideLoading, config.autoClose);
        };
    };

    /**
     * 隐藏加载进度条
     * @return {[type]} [description]
     */
    P.uiPage.hideLoading = function() {
        clearTimeout(P.uiPage.showLoading._timer);
        $('.P-loadingUI').remove();
    };

    P.uiPage.getConditionParams = function() {};

    /**
     * 设置分页
     * @param {[type]} id       填充分页的元素或id
     * @param {[type]} pageConf [description]
     * @param {[type]} onTurn   [description]
     */
    P.uiPage.setPagination = function(id, pageConf, onTurn) {
        var el = typeof id === 'string' ? $('#' + id) : id,
            cont = [],
            page = pageConf.page;

        // 小于二页，则不显示
        if (pageConf.totalpage < 2) {
            $('.pagination').remove();
            return;
        }

        cont.push('<ul class="pagination pull-right">');
        cont.push('<li' + (page == 1 ? ' class="disabled"' : '') + '><a href="javascript:;" data-page="' + Math.max(1, page - 1) + '">«</a></li>');

        // if (page > 5) {
        // 	cont.push('<li><a href="javascript:;" data-page="'+  +'">…</a></li>');
        // }

        for (var i = page > 5 ? page : 1; i <= pageConf.totalpage; i++) {
            // 只显示5个翻页块
            if (i > 5) {
                if (i < page + 5) {
                    cont.push('<li' + (i == page ? ' class="active"' : '') + '><a href="javascript:;" data-page="' + i + '">' + i + '</a></li>');
                } else {
                    break;
                }
            } else {
                if (i < 5) {
                    cont.push('<li' + (i == page ? ' class="active"' : '') + '><a href="javascript:;" data-page="' + i + '">' + i + '</a></li>');
                } else {
                    break;
                }
            }
        }
        cont.push('<li' + (page == pageConf.totalpage ? ' class="disabled"' : '') + '><a href="JavaScript:;" data-page="' + Math.min(pageConf.totalpage, page + 1) + '">»</a></li>');
        cont.push('</ul>');

        $('.pagination').remove();
        $(cont.join('')).insertAfter(el);

        // 翻页事件
        $('.pagination').delegate('a', 'click', function() {
            var page = this.getAttribute('data-page');

            $('.pagination').remove();
            document.body.scrollTop = parent.document.body.scrollTop = 0;

            P.setPaginationData({
                page: page
            });

            onTurn && onTurn.call(null);
        });
    };

    /**
     * 页面启动器 Contller
     * @return {[type]} [description]
     */
    $(function() {
        P.initPage();
        P.initUI && P.initUI();
    });

})(window.P = window.P || {});
