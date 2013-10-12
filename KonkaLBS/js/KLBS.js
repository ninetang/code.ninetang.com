//全局KLBS对象
(function (window, $) {//admin对象, BDMap对象, CompanyTree对象

    var KLBS = {},
        Events = KLBS.Events = {
            gpsReceived: 'gpsReceived'
        },
        Handlers = KLBS.Handlers = {
            userCheck: function (treeId, treeNode) {
                //treeId  String 对应 zTree 的 treeId，便于用户操控
                //treeNode JSON 进行 勾选 或 取消勾选 的节点 JSON 数据对象
            },
            userClick: function (treeId, treeNode, clickFlag) {
            },
            gpsReceivedHandler: function (e, data) {  //收到gps数据就处理MP对象
                var id = data.id,
                    gps_json = data.json,
                    MPSet = KLBS.MPSet,
                    map = KLBS.BDMap.map;

                if (!MPSet.hasOwnProperty(id)) { //首次勾选？
                    //todo
                    //创建MP实例，并加入集合
                    var mp = new MP(id, gps_json);
                    MPSet[id] = mp;
                    //mp.kBing.blink()
                    map.addOverlay(mp.kBing.marker);
                } else {//非首次勾选
                    var mp = MPSet[id];
                    mp.update();
                }
            }
        };
    $(KLBS).on(Events.gpsReceived, Handlers.gpsReceivedHandler);


    //该函数在每次node被勾选之前运行
    KLBS.setupAction = function (treeNode) {
        if (!treeNode.isParent) {
            var id = (treeNode.id + '').slice((treeNode.pid + '').length),
                phone = this.clients[id].phone;

            if (treeNode.checked) {//用户每次勾选 都 请求数据
                KLBS.getInstantGPS(id, phone);
            } else {//取消勾选
                if (this.MPSet.hasOwnProperty(id)) {
                    var mp = KLBS.MPSet[id];
                    return mp.cancelCheck();
                } else {
                }
            }
        }
    }

    KLBS.init = function () {
        this.admin = {
            comId: 1,
            name: 'KAdmin'
        };
        this.api = 'http://zhl.kkplayer.cn/index.php?jsoncallback=?';
        this.clients = {};
        this.BDMap.init('RTMonitor');    //根据DIV初始化地图
        this.CompanyTree.init(this.admin.comId);//根据管理员id初始化组织架构
        this.MPSet = {}; //监控终端对象集合
    };


    KLBS.getInstantGPS = function (id, phone) {//收到数据，发送事件
        var action = {
            r: 'gpslocation/getLatestGpsByPhone',
            phone: phone
        };
        $.getJSON(KLBS.api, action)
            .done(function (gps_json) {
                if (gps_json && gps_json.hasOwnProperty('phonenumber')) { //收到数据，发送事件
                    var evt = $.Event(Events.gpsReceived);
                    $(KLBS).trigger(evt, {
                        id: id,
                        json: gps_json
                    });
                } else {
                }
            });
    }


    /** MP构造函数
     * @constructor MP
     * @param {String} id
     * @param {JSON} data
     */
    function MP(id, data) {
        this.id = id;
        var cFrequency = KLBS.clients[id].frequency;
        //用户坐标
        this.coord = data;
        //kBing实例
        this.kBing = new KLBS.BDMap.KBing(this.coord.longitude, this.coord.latitude, cFrequency);
        this.autoUpdate();
    }

    MP.prototype.cancelCheck = function () {
        //todo
        //移除坐标更新句柄
        //不再更新坐标
        this.kBing.stopUpdate();
        //隐藏Marker
        this.kBing.marker.hide();
        //去掉勾显示
        return true;
    };

    MP.prototype.update = function () {
        var id = this.id;
        KLBS.getInstantGPS(id, KLBS.clients[id].phone);
        //this.kBing.update();
    };
    MP.prototype.autoUpdate = function () {
        this.kBing.autoUpdate();
    };


    window.KLBS = KLBS;
})(window, $);


//组织构架
(function (KLBS, $) {//初始化KLBS.CompanyTree对象, clientNodes
    var CompanyTree = {},
        setting = {
            view: {
                addDiyDom: null, //
                addHoverDom: addHoverDom, //用于当鼠标移动到节点上时，显示用户自定义控件，显示隐藏状态同 zTree 内部的编辑、删除按钮
                autoCancelSelected: true, //点击节点时，按下 Ctrl 键是否允许取消选择操作。
                dblClickExpand: true, //双击节点时，是否自动展开父节点的标识
                expandSpeed: 'fast', //zTree 节点展开、折叠时的动画速度，设置方法同 JQuery 动画效果中 speed 参数。
                fontCss: {}, //个性化文字样式，只针对 zTree 在节点上显示的<A>对象
                nameIsHTML: false, //设置 name 属性是否支持 HTML 脚本
                removeHoverDom: removeHoverDom, //用于当鼠标移出节点时，隐藏用户自定义控件，显示隐藏状态同 zTree 内部的编辑、删除按钮
                selectedMulti: false, //设置是否允许同时选中多个节点。
                showIcon: true, //设置 zTree 是否显示节点的图标。
                showLine: true, //设置 zTree 是否显示节点之间的连线。
                showTitle: true // 设置 zTree 是否显示节点的 title 提示信息(即节点 DOM 的 title 属性)。
            },
            check: {
                enable: true,
                enableItems: true
            },
            key: {},
            keep: {},
            data: {
                simpleData: {
                    enable: true,
                    enableItems: true,
                    idKey: 'id',
                    // secKey: 'sid', //部门ID
                    pIdKey: 'pid', //部门的上级部门ID
                    rootPId: null
                }
            },
            callback: {//事件API
                beforeCheck: KLBS.Handlers.userCheck,
                beforeClick: KLBS.Handlers.userClick
            },
            edit: {
                drag: {
                    autoExpandTrigger: true, //拖拽时父节点自动展开是否触发 onExpand 事件回调函数
                    isCopy: true, //拖拽时, 设置是否允许复制节点
                    isMove: true, //拖拽时, 设置是否允许移动节点
                    // 规则1、isCopy = true; isMove = true 时，拖拽节点按下 Ctrl 键表示 copy; 否则为 move
                    prev: true, //拖拽到目标节点时，设置是否允许移动到目标节点前面的操作
                    next: true,
                    inner: false,
                    borderMax: 10, //拖拽节点成为根节点时的 Tree 内边界范围 (单位：px)
                    borderMin: -5, //
                    minMoveSize: 5, //
                    maxShowNodeNum: 5, //
                    autoOpenTime: 500 //
                },
                editNameSelectAll: false,//
                enable: true,          //
                removeTitle: '移除',  //
                renameTitle: '重命名',  //
                showRemoveBtn: true,    //
                showRenameBtn: true     //
            }
            //todo
        },
        newCount = 1; //区别新增节点


    CompanyTree.init = function (cid) {
        //获取后台数据
        var action = {
            r: 'gate/getCompanySc',
            cid: cid
        };
        $.getJSON(KLBS.api, action)
            .done(function (json) {//异步加载数据1
                /*
                 var evt = $.Event(KLBS.Events.treeReceived);
                 $(KLBS).trigger(evt, json);*/

                var treeNodes = formatJSON(json), treeObj;
                treeObj /*= CompanyTree.treeObj */ = $.fn.zTree.init($('#CompanyTree'), setting, treeNodes);
                treeObj.expandNode(treeObj.getNodeByParam('name', '科技办'));//展开科技办父节点
            });
    };

    //格式化JSON为组织树
    function formatJSON(json) {
        /** @namespace json.sections */
        /** @namespace json.clients */
        /** @namespace json.company */
        var com = json.company && json.company.name ? json.company : {cid: 1, name: '深圳康佳通信科技'},
            sections = json.sections ? json.sections : [],
            clients = json.clients ? json.clients : [],
            tree = [],
            i = 0;

        tree.push({id: 0, name: com.name}); //公司

        for (; i < sections.length; i++) { //部门格式化
            var sec = sections[i],
                pid = sec.pid;
            /** @namespace sec.sid */
            tree.push({
                id: sec.sid - 0,
                pid: pid.substr(pid.lastIndexOf(',') + 1) - 0,
                name: sec.name,
                isParent: true
            });
        }

        for (i = clients.length - 1; i > -1; i--) { //员工格式化
            var client = clients[i];
            addClients(client);
            tree.push({
                pid: client.sid - 0,
                //frequency: client.frequency - 0,
                name: client.name,
                //phone: client.phone,
                id: client.sid + client.id - 0
            });
        }
        return tree;
    }


    //存入KLBS.clients ，以便查询
    function addClients(client) {
        KLBS.clients[client.id] = {
            name: client.name,
            phone: client.phone,
            frequency: client.frequency
        }
    }

    //增加人员
    function addHoverDom(treeId, treeNode) {
        var sObj = $("#" + treeNode.tId + "_span");
        var btn = $("#addBtn_" + treeNode.id);


        if (treeNode.editNameFlag || btn.length > 0 || !treeNode.isParent) return;
        var addStr = "<span class='button add' id='addBtn_" + treeNode.id
            + "' title='add node' onfocus='this.blur();'></span>";
        sObj.after(addStr);

        if (btn) btn.bind("click", function () {
            var zTree = CompanyTree.treeObj;
            zTree.addNodes(treeNode, {
                id: (treeNode.id + '0' + newCount), //此处以0填充，以区别新增节点
                pId: treeNode.id,
                name: "新增人员" + (newCount++)
            });
            return false;
        });
    }

    function removeHoverDom(treeId, treeNode) {
        $("#addBtn_" + treeNode.id).unbind().remove();
    }

    KLBS.CompanyTree = CompanyTree;
}(KLBS, $));


//KLBS的BDMap对象
(function (KLBS, $) {
    var BDMap = function () {
        },
        CONF,
        API = {
            BAIDU: {
                version: '2.0',
                key: '9d1f784b156ff52c505bfdff123792fc', // 'C826f0811d87710605845cd59fa6b278',
                url: function () {
                    //window.BMap_loadScriptTime = (new Date).getTime();
                    var t = 20130916114116;

                    return 'http://api.map.baidu.com/getscript?v=' + this.version + '&ak=' + this.key + '&services=&t=' + t;

                }
            }
        };
    BDMap.init = function (container) {
        if (typeof BMap == 'undefined') {
            $.getScript(API.BAIDU.url(), function (data, textStatus, jqxhr) {
//                console.log(data); // Data returned
//                console.log(textStatus); // Success
//                console.log(jqxhr.status); // 200
            })
                .done(function (script, textStatus) {
                    CONF = initConf();
                    var map = new BMap.Map(container, CONF.MapOptions);
                    BDMap.map = map;//BD对象map
                    setupMap(map);
                })
                .fail(function (jqxhr, settings, exception) {
                    //console.log("Triggered ajaxError handler.");
                });
        } else {
            var map = new BMap.Map(container, CONF.MapOptions);
            setupMap(map);
        }
    };

    /**  KBing构造函数
     * @constructor
     * @param {number} lng 经度
     * @param {number} lat 纬度
     */
    (function () {
        var KBing = function (lng, lat, frequency) {
            this.lastPoint = newPoint();
            this.point = newPoint(lng, lat);
            this.icon = newIcon();
            this.iconOpts = CONF.IconOptions.KBingIcon;

            this.infowindow = newInfoWindow();
            this.marker = newMarker(this.point, this.icon);

            this.blinking = 0;//眨眼动画
            this.blink(3, 3000);
            //KBing的更新状态
            this.autoUpdating = 0;
            this.frequency = frequency;

        }

        /**
         * 眨眼动画
         * */
        KBing.prototype.blink = function (times, interval) {
            var timeout = 100,
                tmpTimes = times,
                opt = this.iconOpts,
                icon = this.icon,
                marker = this.marker,
                kBing = this,
                totalFrame = opt.offsets.length,
                nextFrame = opt.loopOffset(),
                frame = 0;

            if (!arguments[0] || !arguments[1]) {
                times = 3;
                interval = 3000;
            }

            if (this.blinking > 0) {
                this.blinking = 0;
            }

            function play() {
                icon.setImageOffset(nextFrame());
                marker.setIcon(icon);
                frame++;//执行完1帧
                if (frame < totalFrame) {
                    timeout = 100;
                } else {//执行完一次循环
                    frame = 0;
                    times--;//执行完一次眨眼动画,
                    if (times == 0) { //哈哈，有意思
                        times = tmpTimes;
                        timeout = 200;
                    } else {
                        timeout = interval; //间隔3秒后执行
                    }
                }
                blink();
            }

            function blink() {
                kBing.blinking = window.setTimeout(play, timeout);
            }

            blink();
        };

        KBing.prototype.stopBlink = function () {
            clearTimeout(this.blinking);
            this.icon.setImageOffset(this.iconOpts.offsets[0]);
            this.marker.setIcon(this.icon);
        };


        //所有的kBing都能根据数据中获取的最新坐标，改变位置
        KBing.prototype.update = function () {
            //获取新坐标
            //获取路书
            //移动
            this.marker.show();
            this.autoUpdate();
        };

        //停止更新坐标
        KBing.prototype.stopUpdate = function () {
            clearTimeout(this.autoUpdating);
        };


        //N秒后自动更新
        KBing.prototype.autoUpdate = function () {
            this.autoUpdating = setTimeout(this.update, this.frequency);
        }


        BDMap.KBing = KBing;
    })();


    function newPoint(lng, lat) {
        var length = arguments.length;
        if (length == 2) {
            //todo 检测经纬度是否合法 check()
            return new BMap.Point(lng, lat);
        } else {
            var KK = CONF.Konka;
            return new BMap.Point(KK.lng, KK.lat);
        }
    }

    function newIcon() {
        var opt = CONF.IconOptions.KBingIcon,
            icon = new BMap.Icon(opt.url, opt.size);//Icon(url:String, size:Size[, opts:IconOptions])	以给定的图像地址和大小创建图标对象实例。

        icon.setAnchor(opt.anchor);
        return icon;
    }


    function newInfoWindow() {
        //todo
    }

    function newMarker(point, icon) {
        var marker = new BMap.Marker(point);
        marker.setIcon(icon);

        marker.setAnimation(BMAP_ANIMATION_DROP); // BMAP_ANIMATION_DROP	坠落动画。 BMAP_ANIMATION_BOUNCE	跳动动画。
        return marker;
    }

    function initConf() {
        return {
            Konka: {//康佳停车场
                lat: 22.540179,
                lng: 113.999549
            },
            MapOptions: {
                minZoom: 9,	//  Number	地图允许展示的最小级别。
                maxZoom: 19,	//    Number	地图允许展示的最大级别。
                mapType: BMAP_NORMAL_MAP,	//    MapType	地图类型，默认为BMAP_NORMAL_MAP。
                //BMAP_PERSPECTIVE_MAP	此地图类型展示透视图像视图。
                //BMAP_SATELLITE_MAP	此地图类型展示卫星视图。(自 1.2 新增)
                //BMAP_HYBRID_MAP	此地图类型展示卫星和路网的混合视图。(自 1.2 新增)
                enableHighResolution: true,
                // Boolean是否启用使用高分辨率地图。在iPhone4及其后续设备上，可以通过开启此选项获取更高分辨率的底图，v1.2,v1.3版本默认不开启，v1.4默认为开启状态。
                enableAutoResize: true,	//    Boolean	是否自动适应地图容器变化，默认启用。
                enableMapClick: true	//    Boolean	是否开启底图可点功能，默认启用。
            },
            IconOptions: {
                anchor: '',	            // Size	图标的定位锚点。此点用来决定图标与地理位置的关系，是相对于图标左上角的偏移值，默认等于图标宽度和高度的中间值。
                imageOffset: '',	    // Size	图片相对于可视区域的偏移值。
                infoWindowOffset: '',   // Size	信息窗口定位锚点。开启信息窗口时，信息窗口底部尖角相对于图标左上角的位置，默认等于图标的anchor。
                infoWindowAnchor: '',   // Size	信息窗口定位锚点。开启信息窗口时，信息窗口底部尖角相对于图标左上角的位置，默认等于图标的anchor。
                printImageUrl: '',	    // String	用于打印的图片，此属性只适用于IE6，为了解决IE6在包含滤镜的情况下打印样式不正确的问题。
                KBingIcon: {
                    url: '../images/3X4w30.png',
                    size: new BMap.Size(30, 40),
                    anchor: new BMap.Size(15, 40),
                    offsets: [
                        new BMap.Size(0, 0),
                        new BMap.Size(-30, 0),
                        new BMap.Size(-60, 0)
                    ],

                    loopOffset: function () {
                        var offsets = this.offsets,
                            curFrame = 0,
                            length = offsets.length;
                        return function () {
                            if (curFrame != (length - 1)) {
                                curFrame++;
                            } else {
                                curFrame = 0;
                            }
                            return  offsets[curFrame];
                        };
                    }
                }
            }
        };
    }

    function setupMap(map) {//设置地图状态并显示
        var
            LEVEL = 10,
            center = newPoint(),
            MapStyle = {
                features: ['road', 'point', /*'water', 'land', */'building'],
                style: 'normal' //normal（默认样式）,dark（深色样式）,light（浅色样式）
            };
        map.enableScrollWheelZoom();
        map.setMapStyle(MapStyle);
        map.centerAndZoom(center, LEVEL);
    }

    KLBS.BDMap = BDMap;
})(KLBS, $);