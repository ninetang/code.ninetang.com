(function (KLBS, $) {
    var BD = {},
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

    function initConf() {
        return {
            Konka: {//康佳停车场
                lat: 22.540179,
                lng: 113.999549
            },
            MapOptions: {
                minZoom: 15,	//  Number	地图允许展示的最小级别。
                maxZoom: 19,	//    Number	地图允许展示的最大级别。
                mapType: BMAP_NORMAL_MAP,	//    MapType	地图类型，默认为BMAP_NORMAL_MAP。
                //BMAP_PERSPECTIVE_MAP	此地图类型展示透视图像视图。
                //BMAP_SATELLITE_MAP	此地图类型展示卫星视图。(自 1.2 新增)
                //BMAP_HYBRID_MAP	此地图类型展示卫星和路网的混合视图。(自 1.2 新增)
                enableHighResolution: true,
                // Boolean是否启用使用高分辨率地图。在iPhone4及其后续设备上，可以通过开启此选项获取更高分辨率的底图，v1.2,v1.3版本默认不开启，v1.4默认为开启状态。
                enableAutoResize: true,	//    Boolean	是否自动适应地图容器变化，默认启用。
                enableMapClick: true	//    Boolean	是否开启底图可点功能，默认启用。
            }
        };
    }

    function showMap(map) {//显示地图
        var KK = CONF.Konka,
            LEVEL = 19,
            center = new BMap.Point(KK.lng, KK.lat),
            MapStyle = {
                features: ['road', 'point', /*'water', 'land', */'building'],
                style: 'normal' //normal（默认样式）,dark（深色样式）,light（浅色样式）
            };
        map.centerAndZoom(center, LEVEL);
        map.enableScrollWheelZoom();
        map.setMapStyle(MapStyle);
    }

    KLBS.BD = BD;
})(KLBS, $);