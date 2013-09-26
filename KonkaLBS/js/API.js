(function (KLBS, $) {
    function KBing() {
        this.icon = newIcon();
        this.t = 0;

        this.frame = 1;
        this.timeout = 100;

        this.blink();
    }

    KBing.prototype.blink = function () {
        var opt = CONF.IconOptions.KBingIcon,
            kb = this,
            icon = kb.icon;

        kb.t =
            window.setTimeout(function (e) {
                if (kb.frame < 3) {
                    icon.setImageOffset(opt['offset' + kb.frame++]);
                    /*icon.setIcon()*/
                    kb.timeout = 100;
                    kb.blink();
                } else {
                    kb.frame = 0;
                    kb.timeout = 3000;
                    kb.blink();
                }
            }, kb.timeout);
    };

    KBing.prototype.stopBlink = function () {
        clearTimeout(this.t);
        this.icon.setImageOffset(CONF.IconOptions.KBingIcon.offset0);
    };


    var BD = function (lng, lat) {
            //开放BD接口 for KLBS
            //用户在地图中的Point
            this.lastPoint = newPoint();
            this.point = newPoint(lng, lat);
            //用户在地图中的Icon
            //this.icon = newIcon();
            this.kBing = new KBing();
            //地图中的infoWinow
            this.infowindow = newInfoWindow();
            //用户在地图中的Marker
            this.marker = newMarker(this.point, this.kBing.icon);

            BD.map.addOverlay(this.marker);
        },
        CONF,
        API = {
            BAIDU: {
                version: '2.0',
                key: '9d1f784b156ff52c505bfdff123792fc', // 'C826f0811d87710605845cd59fa6b278',
                url: function () {
                    //window.BMap_loadScriptTime = (new Date).getTime();
                    var t = 20130916114116;
                    //return 'http://api.map.baidu.com/api?v=' + this.version + '&ak=' + this.key;
                    return 'http://api.map.baidu.com/getscript?v=' + this.version + '&ak=' + this.key + '&services=&t=' + t;
                    //return '../lib/getscript.js';
                }
            }
        };
    BD.init = function (container) {
        if (typeof BMap == 'undefined') {
            $.getScript(API.BAIDU.url(), function (data, textStatus, jqxhr) {
//                console.log(data); // Data returned
//                console.log(textStatus); // Success
//                console.log(jqxhr.status); // 200
            })
                .done(function (script, textStatus) {
                    CONF = initConf();
                    var map = new BMap.Map(container, CONF.MapOptions);
                    BD.map = map;//BD对象map
                    showMap(map);
                })
                .fail(function (jqxhr, settings, exception) {
                    //console.log("Triggered ajaxError handler.");
                });
        } else {
            var map = new BMap.Map(container, CONF.MapOptions);
            showMap(map);
        }
    };

    function newPoint(lng, lat) {
        var length = arguments.length;
        if (length == 2) {
            //todo 检测经纬度是否合法
            return new BMap.Point(lng, lat);
        } else {
            var KK = CONF.Konka;
            return new BMap.Point(KK.lng, KK.lat);
        }
    };

    function newIcon() {
        var opt = CONF.IconOptions.KBingIcon,
            icon = new BMap.Icon(opt.url, opt.size);//Icon(url:String, size:Size[, opts:IconOptions])	以给定的图像地址和大小创建图标对象实例。

        icon.setAnchor(opt.anchor);
        return icon;

    };


    function newInfoWindow() {
        //todo
    };
    function newMarker(point, icon) {
        var marker = new BMap.Marker(point);
        marker.setIcon(icon);
        marker.setAnimation(BMAP_ANIMATION_DROP); // BMAP_ANIMATION_DROP	坠落动画。 BMAP_ANIMATION_BOUNCE	跳动动画。
        return marker;
    };

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
                    url: '../images/kBing_3X4.png',
                    size: new BMap.Size(30, 40),
                    anchor: new BMap.Size(15, 40),
                    offset0: new BMap.Size(0, 0),
                    offset1: new BMap.Size(-30, 0),
                    offset2: new BMap.Size(-40, 0)
                }
            }
        };
    }

    function showMap(map) {//显示地图
        var
            LEVEL = 19,
            center = newPoint(),
            MapStyle = {
                features: ['road', 'point', /*'water', 'land', */'building'],
                style: 'normal' //normal（默认样式）,dark（深色样式）,light（浅色样式）
            };
        map.enableScrollWheelZoom();
        map.setMapStyle(MapStyle);
        map.centerAndZoom(center, LEVEL);
    }

    KLBS.BD = BD;
})(KLBS, $);