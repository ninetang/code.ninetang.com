/**
 * Created By NineTang.
 * Date: 13-8-28
 * Time: 上午11:04
 */
var BAIDU = {
    API: {
        version: 1.5,
        key: 'C826f0811d87710605845cd59fa6b278'
    }
};
document.write('<script type="text/javascript" src="http://api.map.baidu.com/api?v=' + BAIDU.API.version + '&ak=' + BAIDU.API.key + '" ></script>');

(function (window) {
    var __BAIDU = {},
        __DEBUGING = window.DEBUGGING = true,
        __CITY = '深圳',
        __KONKA = {
            //康佳停车场
            lat: 22.540179,
            lng: 113.999549,
            zoom: 19
        },
        __API_CONF = {};

    /**
     @param {string} containerID
     @param {BMap.Point} center
     @return {BMap.Map}
     */
    __BAIDU.initMap = function (containerID, center) {
        center = center || __KONKA;
        var map = new BMap.Map(containerID),
            point = coord2Point(__KONKA);
        map.centerAndZoom(point, center.zoom || 19);
        map.enableScrollWheelZoom();
        if (__DEBUGING) { //测试坐标用
            map.addEventListener('click', function (e) {
                alert("lng: " + e.point.lng + "\n" +
                    "lat : " + e.point.lat);
            });
        }
        __BAIDU.API_CONF = initAPIConf(map);
        __BAIDU.map = map;
        //return map;
    };

    /**
     @param {Array.<Object>} jsonData
     */
    __BAIDU.buildStage = function (jsonData) {
        this.map.removeEventListener("tilesloaded", $$.ExtEvents.tilesLoadedHandler);  //TODO 可否这样移除事件？
        this.coords = filterJsonData(jsonData);
        this.points = coordsToPoints(this.coords.valid);
        //this.transitRoute = drawTransitRoute(__KONKA, __YANG_END);

        //创建移动对象player
        this.player = createPlayer(this.points[0]);
        this.Animation = createAnimation();
    };

    __BAIDU.drawDrivingRoute = function (start, end) {
        //search(start:String|Point|LocalResultPoi, end: String|Point|LocalResultPoi [,options:object])	none	发起检索。
        //start: 起点，参数可以是关键字、坐标点（自1.1版本支持）和LocalSearchPoi实例。 end: 终点，参数可以是关键字、坐标点（自1.1版本支持）或LocalSearchPoi实例。
        // option:{startCity:String,endCity:string} startCity表示是驾车查询的起点城市，可以是城市名或者城市编码，endCity表示驾车查询的终点城市，可以是城市名或者城市编码。

        //getResults()	DrivingRouteResult	返回最近一次检索的结果
        //clearResults()	none	清除最近一次检索的结果

        //enableAutoViewport()	none	启用自动调整地图层级，当指定了搜索结果所展现的地图时有效。
        //disableAutoViewport()	none	禁用自动调整地图层级。

        //setLocation(location:Map|Point|String)	none	设置检索范围，参数类型可以为地图实例、坐标点或字符串。例：setLocation("北京市")
        //setPolicy(policy:DrivingPolicy)	none	设置路线规划策略，参数为策略常量
        //setSearchCompleteCallback(callback:Function)	none	设置检索结束后的回调函数。
        //参数： results: DrivingRouteResult
        //
        //setMarkersSetCallback(callback:Function)	none	设置添加标注后的回调函数。
        //参数： pois: Array<LocalResultPoi>，起点和目的地点数组，通过marker属性可得到其对应的标注
        //
        //setInfoHtmlSetCallback(callback:Function)	none	设置气泡打开后的回调函数。
        //参数： poi: LocalResultPoi，通过marker属性可得到当前的标注。html: HTMLElement，气泡内的DOM元素。
        //
        //setPolylinesSetCallback(callback:Function)	none	设置添加路线后的回调函数。
        //参数： routes: Array<Route>，驾车线路数组，通过Route.getPolyline()方法可得到对应的折线覆盖物。
        //
        //setResultsHtmlSetCallback(callback:Function)	none	设置结果列表创建后的回调函数。
        //参数： container: 结果列表所用的HTML元素。
        //
        //getStatus()	StatusCodes	返回状态码
        //toString()	String	返回类型说明

        if (!(start instanceof BMap.Point)) {
            start = new BMap.Point(start.lng, start.lat);
        }
        if (!(end instanceof BMap.Point)) {
            end = new BMap.Point(end.lng, end.lat);
        }
        var dr = new BMap.DrivingRoute(__CITY, __API_CONF.drivingRouteOptions);
        dr.setPolicy(1); //1BMAP_DRIVING_POLICY_LEAST_DISTANCE
        dr.search(start, end);
        return dr;
    }

    __BAIDU.drawRoute = function (idx) {
        var routes = splitRoute(this.coords.valid),
            pointArr = coordsToPoints(routes[idx]),
            len = pointArr.length,
            polyline,
            icon_start = __API_CONF.destIcon(0),
            icon_end = __API_CONF.destIcon(1),
            marker_start = new BMap.Marker(pointArr[0]),
            marker_end = new BMap.Marker(pointArr[len - 1]),
            map = __BAIDU.map;
        marker_start.setIcon(icon_start);
        marker_end.setIcon(icon_end);

        polyline = drawPolyline(pointArr);
        polyline.setStrokeColor('#111');

        map.addOverlay(marker_start);
        map.addOverlay(marker_end);
        map.addOverlay(polyline);
        map.setViewport(BAIDU.points);
        return polyline;
    }

    function initAPIConf(map) {
        return __API_CONF = {
            markerSrc: {
                spot: 'http://api.map.baidu.com/images/spotmkrs.png',
                dest: 'http://api.map.baidu.com/images/dest_markers.png',
                letter: 'http://api.map.baidu.com/img/markers.png',
                find: 'http://api.map.baidu.com/images/fdj.png',
                ctrl: 'http://api.map.baidu.com/images/mapctrls1d3.gif',
                trans: 'http://api.map.baidu.com/images/trans_icons.png',
                scTab: 'http://api.map.baidu.com/images/sctab.png',
                arrow_down_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAHCAYAAADTcMcaAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjAzQUMwREYyQ0E0RDExRTE4OENBQ0E5N0Y3NkUyOTM1IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjAzQUMwREYzQ0E0RDExRTE4OENBQ0E5N0Y3NkUyOTM1Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MDNBQzBERjBDQTREMTFFMTg4Q0FDQTk3Rjc2RTI5MzUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MDNBQzBERjFDQTREMTFFMTg4Q0FDQTk3Rjc2RTI5MzUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7nllBJAAAAPUlEQVR42mKcNWvWfwYSAVNqaiojKRpA6plgDGI1gG1CFyCkAUUTPo3o4kyEFGA16P///1gxKFRxyQEEGADGHjVi7d7iOgAAAABJRU5ErkJggg==',
                heart: 'http://api.map.baidu.com/library/TextIconOverlay/1.2/examples/images/heart50.png',
                marker_tool: 'http://api.map.baidu.com/library/MarkerTool/1.2/src/images/us_mk_icon.png'
            },
            lineConf: {
                strokeColor: 'red',      //折线颜色
                strokeWeight: 2,         //折线的宽度，以像素为单位
                strokeOpacity: 1,        //折线的透明度，取值范围0 - 1
                strokeStyle: 'solid',    //折线的样式，solid或dashed
                enableMassClear: true,   //是否在调用map.clearOverlays清除此覆盖物，默认为true
                enableEditing: false,    //是否启用线编辑，默认为false
                enableClicking: true     //是否响应点击事件，默认为true
            },
            polylineOpts: {
                strokeColor: 'red',	//String	//折线颜色
                strokeWeight: 5,	// Number	折线的宽度，以像素为单位。
                strokeOpacity: 0.65,	//  Number	折线的透明度，取值范围0 - 1。
                strokeStyle: 'solid',	//  String	折线的样式，solid或dashed。
                enableMassClear: true,	//  Boolean	是否在调用map.clearOverlays清除此覆盖物，默认为true。
                enableEditing: false,	//          Boolean	是否启用线编辑，默认为false。
                enableClicking: true	//          Boolean	是否响应点击事件，默认为true。
            },
            iconOpts: {
                image: {
                    url: '../images/red_radar.gif',
                    width: 24,
                    height: 24
                },
                options: {
                    anchor: null,           //Size 图标的定位锚点。此点用来决定图标与地理位置的关系，是相对于图标左上角的偏移值，默认等于图标宽度和高度的中间值。
                    imageOffset: null,      //Size 图片相对于可视区域的偏移值。
                    infoWindowAnchor: null, //Size  信息窗口定位锚点。开启信息窗口时，信息窗口底部尖角相对于图标左上角的位置，默认等于图标的anchor。
                    printImageUrl: ''       //String 用于打印的图片，此属性只适用于IE6，为了解决IE6在包含滤镜的情况下打印样式不正确的问题。
                }
            },
            destIcon: getDestIcon,
            infoWindowOpts: {
                width: 0,	                //Number	信息窗宽度，单位像素。取值范围：0, 220 - 730。如果您指定宽度为0，则信息窗口的宽度将按照其内容自动调整。
                height: 0,	                //Number	信息窗高度，单位像素。取值范围：0, 60 - 650。如果您指定高度为0，则信息窗口的高度将按照其内容自动调整。
                maxWidth: 730,	            //Number	信息窗最大化时的宽度，单位像素。取值范围：220 - 730。
                offset: null,	            //Size	信息窗位置偏移值。默认情况下在地图上打开的信息窗底端的尖角将指向其地理坐标，
                // 在标注上打开的信息窗底端尖角的位置取决于标注所用图标的infoWindowOffset属性值，您可以为信息窗添加偏移量来改变默认位置。
                title: '详细信息',	        //String	信息窗标题文字，支持HTML内容。
                enableAutoPan: false,	    //Boolean	是否开启信息窗口打开时地图自动移动（默认开启）。(自 1.1 新增)
                enableCloseOnClick: true,	// Boolean	是否开启点击地图关闭信息窗口（默认开启）(自 1.1 新增)
                enableMessage: false,	    //Boolean	是否在信息窗里显示短信发送按钮（默认开启）（自1.5新增）。
                message: ''	                //String	自定义部分的短信内容，可选项。完整的短信内容包括：自定义部分+位置链接，不设置时，显示默认短信内容。短信内容最长为140个字。（自1.5新增）
            },
            transitRouteOpts: {
                renderOptions: {
                    map: map,             //展现结果的地图实例。当指定此参数后，搜索结果的标注、线路等均会自动添加到此地图上
                    panel: $$('detail'),//$$('result'), //结果列表的HTML容器id或容器元素，提供此参数后，结果列表将在此容器中进行展示。此属性对LocalCity无效
                    selectFirstResult: true,    //是否选择第一个检索结果。此属性仅对LocalSearch有效
                    autoViewport: true,         //检索结束后是否自动调整地图视野。此属性对LocalCity无效
                    highlightMode: 2 //BMAP_HIGHLIGHT_ROUTE
                    // BMAP_HIGHLIGHT_STEP //驾车结果展现中点击列表后的展现点步骤
                    // BMAP_HIGHLIGHT_ROUTE 驾车结果展现中点击列表后的展现路段
                },
                policy: 0,//BMAP_TRANSIT_POLICY_AVOID_SUBWAYS,
                // BMAP_TRANSIT_POLICY_LEAST_TIME, //  最少时间 公交导航的策略参数
                // BMAP_TRANSIT_POLICY_LEAST_TRANSFER	最少换乘
                // BMAP_TRANSIT_POLICY_LEAST_WALKING	最少步行
                // BMAP_TRANSIT_POLICY_AVOID_SUBWAYS	不乘地铁
                pageCapacity: 1, //返回方案的个数

                onSearchComplete: function (results) {
                    if (__BAIDU.transitRoute.getStatus() == BMAP_STATUS_SUCCESS) {
                        if (__DEBUGING) {
                            alert('transitRoute成功！');
                        }
                        var arrPois = results.getPlan(0).getRoute(0).getPath();
                        //__BAIDU.map.addOverlay(__BAIDU.player);
                    }
                },
                //检索完成后的回调函数。
                // 参数：results: TransitRouteResult，公交导航结果

                onMarkersSet: function (pois, transfers) {
                },
                //标注添加完成后的回调函数。 参数：
                // pois: Array<LocalResultPoi>，起点和目的地数组
                // transfers: Array<LocalResultPoi>，公交车站数组

                onInfoHtmlSet: function (poi, html) {
                },
                //气泡内容创建后的回调函数。 参数：
                // poi: LocalResultPoi，表示当前气泡对应的点（可以是起点、终点或换乘车站）
                // html: HTMLElement，气泡内的DOM元素

                onPolylinesSet: function (lines, routes) {
                },
                //折线添加完成后的回调函数。参数：
                // lines: Array<Line>，公交线路数组
                // routes: Array<Route>，步行线路数组，通过Route.getPolyline()方法可得到对应的折线覆盖物

                onResultsHtmlSet: function (container) {
                }
                //结果列表添加完成后的回调函数。// 参数：
                // container: 结果列表所用的HTML元素
            },
            drivingRouteOptions: {
                renderOptions: {
                    map: map,
                    panel: $$('detail'),
                    selectFirstResult: true,
                    autoViewport: true,
                    highlightMode: 2 //BMAP_HIGHLIGHT_ROUTE
                },
                policy: 0, //BMAP_DRIVING_POLICY_LEAST_TIME
                onSearchComplete: function (results) {
                    if (__BAIDU.drivingRoute.getStatus() == BMAP_STATUS_SUCCESS) {
                        var arrPois = results.getPlan(0).getRoute(0).getPath();
                    }
                },
                //检索完成后的回调函数。参数：
                //results: DrivingRouteResult

                onMarkersSet: function (pois) {
                    setTimeout(function () {
                        __BAIDU.player.setAnimation(BMAP_ANIMATION_DROP); //BMAP_ANIMATION_DROP
                        __BAIDU.map.addOverlay(__BAIDU.player);
                    }, 1000);
                    __BAIDU.iconLib = __BAIDU.iconLib || {};
                    var dest = (__BAIDU.iconLib.dest = __BAIDU.iconLib.dest || {});
                    dest['start'] = pois[0].marker.getIcon();
                    dest['end'] = pois[1].marker.getIcon();
                },
                //标注添加完成后的回调函数。
                //参数： pois: Array<LocalResultPoi>，起点和目的地点数组，通过marker属性可得到其对应的标注。

                onInfoHtmlSet: function (poi, html) {
                },
                //标注气泡内容创建后的回调函数。
                //参数： poi: LocalResultPoi，通过marker属性可得到当前的标注。html: HTMLElement，气泡内的DOM元素。

                onPolylinesSet: function (routes) {
                },
                //折线添加完成后的回调函数。
                //参数： routes: Array<Route>，驾车线路数组，通过Route.getPolyline()方法可得到对应的折线覆盖物。

                onResultsHtmlSet: function (container) {
                }
                //结果列表添加完成后的回调函数。
                //参数： container: 结果列表所用的HTML元素。
            }
        };
    }

    /**
     @param  {Boolean} idx
     @return {BMap.Icon}
     */
    function getDestIcon(idx) {
        var dest_start = {
                image: {
                    url: __API_CONF.markerSrc.dest,
                    width: 42,
                    height: 34
                },
                options: {
                    anchor: new BMap.Size(14, 32),           //Size 图标的定位锚点。此点用来决定图标与地理位置的关系，是相对于图标左上角的偏移值，默认等于图标宽度和高度的中间值。
                    imageOffset: null,      //Size 图片相对于可视区域的偏移值。
                    infoWindowAnchor: new BMap.Size(14, 0), //Size  信息窗口定位锚点。开启信息窗口时，信息窗口底部尖角相对于图标左上角的位置，默认等于图标的anchor。
                    printImageUrl: ''       //String 用于打印的图片，此属性只适用于IE6，为了解决IE6在包含滤镜的情况下打印样式不正确的问题。
                }
            },
            dest_end = {
                image: {
                    url: __API_CONF.markerSrc.dest,
                    width: 42,
                    height: 34
                },
                options: {
                    anchor: new BMap.Size(14, 32),           //Size 图标的定位锚点。此点用来决定图标与地理位置的关系，是相对于图标左上角的偏移值，默认等于图标宽度和高度的中间值。
                    infoWindowAnchor: new BMap.Size(14, 0), //Size  信息窗口定位锚点。开启信息窗口时，信息窗口底部尖角相对于图标左上角的位置，默认等于图标的anchor。
                    imageOffset: new BMap.Size(0, -34)
                }
            } ,
            iconStart = createIcon(dest_start),
            iconEnd = createIcon(dest_end);
        return idx ? iconEnd : iconStart;
    }

    function drawPolyline(pointArr, opts) {
//        setPoints(points:Array<Point>)	none	设置折线的点数组。(自 1.2 废弃)
//        getPoints()	Array<Point>	返回折线的点数组。(自 1.2 废弃)
//        setPath(path:Array<Point>)	none	设置折线的点数组（自1.2新增）
//        getPath()	Array<Point>	返回折线的点数组（自1.2新增）
//        setStrokeColor(color:String)	none	设置折线的颜色。
//        getStrokeColor()	String	返回折线的颜色。
//        setStrokeOpacity(opacity:Number)	none	设置透明度，取值范围0 - 1。
//        getStrokeOpacity()	Number	返回透明度。
//        setStrokeWeight(weight:Number)	none	设置线的宽度，范围为大于等于1的整数。
//        getStrokeWeight()	Number	返回线的宽度。
//        setStrokeStyle(style:String)	none	设置是为实线或虚线，solid或dashed。
//        getStrokeStyle()	String	返回当前线样式状态，实线或者虚线。
//        getBounds()	Bounds	返回覆盖物的地理区域范围。(自 1.1 新增)
//        enableEditing()	none	开启编辑功能。(自 1.1 新增)
//        disableEditing()	none	关闭编辑功能。(自 1.1 新增)
//        enableMassClear()	none	允许覆盖物在map.clearOverlays方法中被清除。(自 1.1 新增)
//        disableMassClear()	none	禁止覆盖物在map.clearOverlays方法中被清除。(自 1.1 新增)
//        setPointAt(index: Number, point: Point)	none	修改指定位置的坐标。Number从0开始计数。例如setPointAt(2, point2a)代表将折线的第3个点，坐标设为point2a。(自 1.2 废弃)
//        setPositionAt(index:Number, point:Point)	none	修改指定位置的坐标。索引index从0开始计数。例如setPointAt(2, point)代表将折线的第3个点的坐标设为point(自 1.2 新增)
//        getMap()	Map	返回覆盖物所在的map对象。（自1.2新增)
//        addEventListener(event:String, handler:Function)	none	添加事件监听函数
//        removeEventListener(event:String, handler:Function)	none	移除事件监听函数

        opts = opts || __API_CONF.polylineOpts;
        return new BMap.Polyline(pointArr, opts);
    };


    function coordsToPoints(coords) {
        var points = [],
            len = coords.length,
            i = 0;
        for (; i < len; i++) {
            points.push(coord2Point(coords[i]));
        }
        return points;
    }

    /**
     @param {Array.<Object>} jsonData
     @return  {Object}
     */
    function filterJsonData(jsonData) {
        var valid = [],
            less_accuracy = [],
            west = [],
            east = [],
            north = [],
            south = [],
            __FILTER_POLICY = {//排除算法 ，用于优化
                ACCURACY_VALVE: 20, //精确度排除算法，删除大于20m的数据
                REMOVE_METHOD: {
                    WANDER: true,
                    LESS_ACCURACY: true
                }
            },

            i = 2,
            len = jsonData.length;


        valid.push(jsonData[0], jsonData[1]);
        for (; i < len; i++) {
            var coord = jsonData[i],
                preCrd = jsonData[i - 1],
                prePre = jsonData[i - 2];

            if (coord.accuracy < __FILTER_POLICY.ACCURACY_VALVE) {//精确度accuracy算法 : 适用于gpstime查询条件获取数据的情况
                //前两点比较算法： 不适用于环线车道、急掉头
                //正东西南西行驶方向的飘移数据，均排除
                if (__FILTER_POLICY.REMOVE_METHOD.WANDER) {
                    if (coord.longitude > preCrd.longitude && coord.longitude < prePre.longitude) { //西行 lng -- 时往东飘移
                        if (i > 3) {
                            east.push(coord);
                            continue;
                        }
                    } else if (coord.longitude < preCrd.longitude && coord.longitude > prePre.longitude) { //东行 lng++ 时往西飘移
                        west.push(coord);
                        continue;
                    } else if (coord.latitude < preCrd.latitude && coord.latitude > prePre.latitude) {// 北行 lat ++ 时往南飘移
                        south.push(coord);
                        continue;
                    } else if (coord.latitude > preCrd.latitude && coord.latitude < prePre.latitude) { //南行 lat-- 时 往北飘移
                        north.push(coord);
                        continue;
                    }
                }
                //起点 + 前一点比较算法
                valid.push(coord);
            } else {
                //精度不准数据
                less_accuracy.push(coord);
            }
        }

        var coords = {
            valid: valid,
            dropped: {
                less_accuracy: less_accuracy,
                wander: {
                    west: west,
                    east: east,
                    north: north,
                    south: south
                }
            }
        };
        return coords;
    }

    function splitRoute(validCoords) {//按停车超时分段
        var PARK_LIMIT = 300 ,// 停车超时: 5分钟
            i = 1,
            j = 0,
            start = 0,
            len = validCoords.length,
            routes = [],
            coord,
            preCrd,
            currentTime,
            lastTime,
            interval;

        for (; i < len; i++) {
            coord = validCoords[i];
            if (isNaN(coord.intervals - 0)) {
                preCrd = validCoords[i - 1];
                currentTime = Date.parse(coord.lastupdate);
                lastTime = Date.parse(preCrd.lastupdate);
                interval = ( currentTime - lastTime) / 1000;
                //interval = Math.round(interval);
                coord.intervals = interval;
            } else {
                interval = coord.intervals;
            }
            routes[j] = [];
            if (interval > PARK_LIMIT) {
                routes[j++] = validCoords.slice(start, i);
                start = i;
            } else if (i == len - 1) {
                routes[j] = validCoords.slice(start);
            }
        }
        return routes;
    }

    function createIcon(iconObj) {
        iconObj = iconObj || __API_CONF.iconOpts;
        var image = iconObj.image,
            url = image.url,
            size = new BMap.Size(image.width, image.height);
        return new BMap.Icon(url, size, iconObj.options);
    }


    //添加动画组件
    function createAnimation() {
        var idx = 0;
        return {
            play: function () {
                idx++;
                var player = __BAIDU.player,
                    html = createHtml(__BAIDU.coords.valid[idx]),
                    icon = createIcon();
                player.setIcon(icon);
                player.infoWindow.setContent(html);
                player.infoWindow.redraw();
                player.setPosition(__BAIDU.points[idx]);
            },
            pause: function () {
            },
            reset: function () {
                var player = __BAIDU.player,
                    len = __BAIDU.points.length;
                player.setPosition(__BAIDU.points[len]);
                player.setIcon(player.defaultIcon);
                idx = 0;
            },
            stop: function () {
            }
        };
    }

    //添加移动对象player
    function createPlayer(point) {
        //  openInfoWindow(infoWnd:InfoWindow)	none	打开信息窗。
        //  closeInfoWindow()	none	关闭信息窗。
        //  setIcon(icon:Icon)	none	设置标注所用的图标对象。
        //  getIcon()	Icon	返回标注所用的图标对象。
        //  setPosition(position:Point)	none	设置标注的地理坐标。
        //  getPosition()	Point	返回标注的地理坐标。
        //  setOffset(offset:Size)	none	设置标注的偏移值。
        //  getOffset()	Size	返回标注的偏移值。
        //  getLabel()	Label	返回标注的文本标注。
        //  setLabel(label:Label)	none	为标注添加文本标注。
        //  setTitle(title:String)	none	设置标注的标题，当鼠标移至标注上时显示此标题。
        //  getTitle()	String	返回标注的标题。
        //  setTop(isTop:Boolean)	none	将标注置于其他标注之上。默认情况下，纬度较低的标注会覆盖在纬度较高的标注之上，从而形成一种立体效果。通过此方法可使某个标注覆盖在其他所有标注之上。注意：如果在多个标注对象上调用此方法，则这些标注依旧按照纬度产生默认的覆盖效果。
        //  enableDragging()	none	开启标注拖拽功能。
        //  (自 1.1 新增)
        //          disableDragging()	none	关闭标注拖拽功能。
        //  (自 1.1 新增)
        //          enableMassClear()	none	允许覆盖物在map.clearOverlays方法中被清除。
        //  (自 1.1 新增)
        //          disableMassClear()	none	禁止覆盖物在map.clearOverlays方法中被清除。
        //  (自 1.1 新增)
        //          setZIndex(zIndex:Number)	none	设置覆盖物的zIndex。
        //  (自 1.1 新增)
        //          getMap()	Map	返回覆盖物所在的map对象。
        //  (自 1.2 新增)
        //          addContextMenu(menu:ContextMenu)	none	添加右键菜单。
        //  (自 1.2 新增)
        //          removeContextMenu(menu:ContextMenu)	none	移除右键菜单。
        //  (自 1.2 新增)
        //          setAnimation(animation:Animation|Null)	none	设置标注动画效果。如果参数为null，则取消动画效果。该方法需要在addOverlay方法后设置。
        //  (自 1.2 新增)
        //          setShadow(shadow:Icon)	none	设置标注阴影图标。
        //  (自 1.2 新增)
        //          getShadow()	Icon	获取标注阴影图标。
        //  (自 1.2 新增)
        //  addEventListener(event:String, handler:Function)	none	添加事件监听函数
        //  removeEventListener(event:String, handler:Function)	none	移除事件监听函数
        var player;
        player = new BMap.Marker(point);
        player.defaultIcon = player.getIcon();
        player.setTop(true);
        player.infoWindow = createInfoWidow(point);
        player.addEventListener('click', function () {
            this.openInfoWindow(this.infoWindow);
        });
        return player;
    }

    function createInfoWidow(data, opts) {
        //    InfoWindow(content:String|HTMLElement[, opts:InfoWindowOptions])
        //    创建一个信息窗实例，其中content支持HTML内容。1.2版本开始content参数支持传入DOM结点。

        //    setWidth(width:Number)	none	设置信息窗口的宽度，单位像素。取值范围：220 - 730。
        //    setHeight(height:Number)	none	设置信息窗口的高度，单位像素。取值范围：60 - 650。
        //    redraw()	none	重绘信息窗口，当信息窗口内容发生变化时进行调用。
        //    setTitle(title:String|HTMLElement)	none	设置信息窗口标题。支持HTML内容。1.2版本开始title参数支持传入DOM结点。
        //    getTitle()	String|HTMLElement	返回信息窗口标题。//(自 1.2 新增)

        //    setContent(content:String|HTMLElement)	none	设置信息窗口内容。支持HTML内容。1.2版本开始content参数支持传入DOM结点。
        //    getContent()	String|HTMLElement	返回信息窗口内容。//(自 1.2 新增)

        //    getPosition()	Point	返回信息窗口的位置。
        //    enableMaximize()	none	启用窗口最大化功能。需要设置最大化后信息窗口里的内容，该接口才生效。
        //    disableMaximize()	none	禁用窗口最大化功能。
        //    isOpen()	Boolean	返回信息窗口的打开状态。
        //    setMaxContent(content:String)	none	信息窗口最大化时所显示内容，支持HTML内容。
        //    maximize()	none	最大化信息窗口(自 1.1 新增)
        //    restore()	none	还原信息窗口(自 1.1 新增)
        //    enableAutoPan()	none	开启打开信息窗口时地图自动平移。(自 1.1 新增)
        //
        //    disableAutoPan()	none	关闭打开信息窗口时地图自动平移。(自 1.1 新增)
        //
        //    enableCloseOnClick()	none	开启点击地图时关闭信息窗口。(自 1.1 新增)
        //
        //    disableCloseOnClick()	none	关闭点击地图时关闭信息窗口。(自 1.1 新增)
        //
        //    addEventListener(event:String, handler:Function)	none	添加事件监听函数
        //    removeEventListener(event:String, handler:Function)	none	移除事件监听函数

        opts = opts || __API_CONF.infoWindowOpts;

        //todo 修改infoWin 的 offset;
        var html = createHtml(data),
            infoWin = new BMap.InfoWindow(html, opts);
        infoWin.disableAutoPan();
        return infoWin;
    }

    function createHtml(data) {
        var obj = {},
            prop,
            html = '<table id="playerInfoWinContent">';
        if (obj.toString.call(data) == '[object Object]') {
            for (prop in data) {
                if (data.hasOwnProperty(prop)) {
                    html += '<tr><td class="propName">' + prop + ' :</td><td class="propValue">' + data[prop] + '</td></tr>';
                }
            }

            //todo 数组优化 array.join()
        }
        html += '</table>';
        return html;
    }

    function drawTransitRoute(start, end) {
        //        search(start:String|Point|LocalResultPoi, end:String|Point|LocalResultPoi)	none	发起检索。
        //start: 起点，参数可以是关键字、坐标点（自1.1版本支持）或者LocalSearchPoi实例。 end: 终点，参数可以是关键字、坐标点（自1.1版本支持）或者LocalSearchPoi实例。
        //
        //getResults()	TransitRouteResult	返回最近一次检索的结果
        //        clearResults()	none	清除最近一次检索的结果
        //        enableAutoViewport()	none	启用自动调整地图层级，当指定了搜索结果所展现的地图时有效。
        //disableAutoViewport()	none	禁用自动调整地图层级。
        //setPageCapacity(capacity:Number)	none	设置每页返回方案个数（1-5），默认为5
        //        setLocation(location:Map|Point|String)	none	设置检索范围，参数类型可以为地图实例、坐标点或字符串。例：setLocation("北京市")
        //        setPolicy(policy:TransitPolicy)	none	设置路线规划策略，参数为策略常量
        //        setSearchCompleteCallback(callback:Function)	none	设置检索结束后的回调函数。
        //参数： results: TransitRouteResult，公交导航结果
        //
        //        setMarkersSetCallback(callback:Function)	none	设置添加标注后的回调函数。
        //参数： pois: Array<LocalResultPoi>，起点和目的地数组。 transfers: Array<LocalResultPoi>，公交车站数组。
        //
        //setInfoHtmlSetCallback(callback:Function)	none	设置气泡打开后的回调函数。
        //参数： poi: LocalResultPoi，表示当前气泡对应的点（可以是起点、终点或换乘车站） html: HTMLElement，气泡内的DOM元素
        //
        //        setPolylinesSetCallback(callback:Function)	none	设置添加路线后的回调函数。
        //参数： lines: Array<Line>，公交线路数组。 routes: Array<Route>，步行线路数组，通过Route.getPolyline()方法可得到对应的折线覆盖物
        //
        //        setResultsHtmlSetCallback(callback:Function)	none	设置结果列表创建后的回调函数。
        //参数： container: 结果列表所用的HTML元素
        //
        //        getStatus()	StatusCodes	返回状态码
        //        toString()	String	返回类型说明

        start = new BMap.Point(start.lng, start.lat);
        end = new BMap.Point(end.lng, end.lat);
        var transitRoute = new BMap.TransitRoute(__CITY, __API_CONF.transitRouteOpts);
        transitRoute.search(start, end);
        return transitRoute;
    }

    /**
     @param {Array.<BMap.Point>} points
     @param {Object} lineConfig
     */
    function drawLine(points, lineConfig) {
        var config = lineConfig || __API_CONF.lineConf;
        var polyline = new BMap.Polyline(points, config);
        __BAIDU.map.addOverlay(polyline);
    }

    /**
     @param {Object} coord
     @return {BMap.Point}
     */
    function coord2Point(coord) {
        var lng = coord.longitude || __KONKA.lng,
            lat = coord.latitude || __KONKA.lat;
        return new BMap.Point(lng, lat);
    }

    /**
     @param {Array.<object>}  points
     * */
    function addMarker(points) {
//  openInfoWindow(infoWnd:InfoWindow)	none	打开信息窗。
//  closeInfoWindow()	none	关闭信息窗。
//  setIcon(icon:Icon)	none	设置标注所用的图标对象。
//  getIcon()	Icon	返回标注所用的图标对象。
//  setPoint(point:Point)	none	设置标注的地理坐标。
//  getPoint()	Point	返回标注的地理坐标。
//  setPosition(position:Point)	none	设置标注的地理坐标。
//  getPosition()	Point	返回标注的地理坐标。
//  setOffset(offset:Size)	none	设置标注的偏移值。
//  getOffset()	Size	返回标注的偏移值。
//  getLabel()	Label	返回标注的文本标注。
//  setLabel(label:Label)	none	为标注添加文本标注。
//  setTitle(title:String)	none	设置标注的标题，当鼠标移至标注上时显示此标题。
//  getTitle()	String	返回标注的标题。
//  setTop(isTop:Boolean)	none	将标注置于其他标注之上。默认情况下，纬度较低的标注会覆盖在纬度较高的标注之上，从而形成一种立体效果。通过此方法可使某个标注覆盖在其他所有标注之上。注意：如果在多个标注对象上调用此方法，则这些标注依旧按照纬度产生默认的覆盖效果。
//  enableDragging()	none	开启标注拖拽功能。
//  disableDragging()	none	关闭标注拖拽功能。
//  enableMassClear()	none	允许覆盖物在map.clearOverlays方法中被清除。
//  disableMassClear()	none	禁止覆盖物在map.clearOverlays方法中被清除。
//  setZIndex(zIndex:Number)	none	设置覆盖物的zIndex。
//  getMap()	Map	返回覆盖物所在的map对象。
//  addContextMenu(menu:ContextMenu)	none	添加右键菜单。
//  removeContextMenu(menu:ContextMenu)	none	移除右键菜单。
//  setAnimation(animation:Animation|Null)	none	设置标注动画效果。如果参数为null，则取消动画效果。该方法需要在addOverlay方法后设置。
//  setShadow(shadow:Icon)	none	设置标注阴影图标。
//  getShadow()	Icon	获取标注阴影图标
//  addEventListener(event:String, handler:Function)	none	添加事件监听函数
//  removeEventListener(event:String, handler:Function)	none	移除事件监听函数
        var headPt = points[0],
            tailPt = points[points.length - 1];
        var hm = new BMap.Marker(headPt),
            tm = new BMap.Marker(tailPt);
        hm.setTop(true);
        tm.setTop(true);
        __BAIDU.map.addOverlay(hm);
        __BAIDU.map.addOverlay(tm);
    }

    window.BAIDU = __BAIDU;
})(window);


