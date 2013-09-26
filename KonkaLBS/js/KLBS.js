//全局KLBS
(function (window) {
    var KLBS = {};
    KLBS.init = function () {
        this.admin = {
            comId: 1,
            name: 'KAdmin'
        };
        this.api = 'http://zhl.kkplayer.cn/index.php?jsoncallback=?';
        //根据DIV初始化地图
        this.BD.init('RTMonitor');
        //根据管理员id初始化组织架构
        this.CompanyOrg.init(this.admin.comId);
    };
    window.KLBS = KLBS;
})(window);

//MPSet 监控终端对象集合
(function (KLBS) {
    var MPSet = {};
    MPSet.checkHandler = function (treeId, treeNode) {
        //treeId  String 对应 zTree 的 treeId，便于用户操控
        //treeNode JSON 进行 勾选 或 取消勾选 的节点 JSON 数据对象
        var id = (treeNode.id + '').slice((treeNode.pid + '').length);
        if (!treeNode.checked) {//用户勾选节点
            if (!MPSet.hasOwnProperty(id)) {//首次勾选，异步获取终端坐标
                var action = {
                    r: 'gate/getLatestSessionByPhone',
                    phone: treeNode.phone
                };
                $.getJSON(KLBS.api, action)
                    .done(function (data) {
                        //todo
                        //创建MP实例，并加入集合
                        MPSet[id] = new MP(treeNode, data);

                    });
            } else {//非首次勾选
                MPSet[id].updateMP();
            }
        } else {//取消勾选
            //todo
            //移除坐标更新句柄
            var mp = MPSet[id];
            mp.updateTimeout = clearTimeout(mp.updateTimeout);
            //隐藏Marker
            mp.marker.hide();
            //去掉勾显示
        }
    };

    function MP(treeNode, data) {
        //用户关键信息
        this.clientInfo = {
            cName: treeNode.name,
            cPhone: treeNode.phone,
            cFrequency: treeNode.frequency * 1000 //
        };

        //用户坐标
        this.coord = data;
        //MP在地图中的组件
        this.onMap = new KLBS.BD(this.coord.longitude, this.coord.latitude);


        //监听更新事件
        //倒计时
        this.updateTimeout = setTimeout(this.updateMP, this.clientInfo.cFrequency);
    }

    MP.prototype.updateMP = function () {
        //todo
        //把原坐标变成旧坐标
        //获取新坐标
        //创建路书，移动Marker，更新infoWindow内容

        //this.moveMarker();
    };
    MP.prototype.moveMarker = function () {
        this.marker.setPosition(this.point);
    }


    MPSet.clickHandler = function (treeId, treeNode, clickFlag) {
    };
    KLBS.MPSet = MPSet;
})(KLBS);


//初始化组织构架CompanyOrg, clientNodes
(function (KLBS) {
    var CompanyOrg = {},
        MPSet = KLBS.MPSet,
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
            callback: {//勾选回调函数，转到MPSet对象运行
                beforeCheck: MPSet.checkHandler,
                beforeClick: MPSet.clickHandler
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
        newCount = 1; //此处以0填充，以区别新增节点

    CompanyOrg.init = function (cid) {
        //获取后台数据
        var action = {
            r: 'gate/getCompanySc',
            cid: cid/*,
             format: 'json'*/
        };
        $.getJSON(KLBS.api, action)
            .done(function (json) {
                var treeNodes = treeJson(json), treeObj;
                treeObj = CompanyOrg.treeObj = $.fn.zTree.init($('#CompanyOrg'), setting, treeNodes);
                treeObj.expandNode(treeObj.getNodeByParam('name', '科技办'));//展开科技办父节点
            });
    };

    //格式化JSON为组织树
    function treeJson(json) {
        var com = json.company && json.company.name ? json.company : {cid: 1, name: '深圳康佳通信科技'},
            sections = json.sections ? json.sections : [],
            clients = json.clients ? json.clients : [],
            tree = [],
            i = 0;

        tree.push({id: 0, name: com.name}); //公司

        for (; i < sections.length; i++) { //部门格式化
            var sec = sections[i],
                pid = sec.pid,
                tmp = {
                    id: sec.sid - 0,
                    pid: pid.substr(pid.lastIndexOf(',') + 1) - 0,
                    name: sec.name,
                    isParent: true
                };
            tree.push(tmp);
        }

        for (i = clients.length - 1; i > -1; i--) { //员工格式化
            var client = clients[i];
            var tmp = {
                pid: client.sid - 0,
                frequency: client.frequency - 0,
                name: client.name,
                phone: client.phone,
                id: client.sid + client.id - 0
            };
            tree.push(tmp);
        }
        return tree;
    }

    //增加人员
    function addHoverDom(treeId, treeNode) {
        var sObj = $("#" + treeNode.tId + "_span");
        if (treeNode.editNameFlag || $("#addBtn_" + treeNode.id).length > 0 || !treeNode.isParent) return;
        var addStr = "<span class='button add' id='addBtn_" + treeNode.id
            + "' title='add node' onfocus='this.blur();'></span>";
        sObj.after(addStr);
        var btn = $("#addBtn_" + treeNode.id);
        if (btn) btn.bind("click", function () {
            var zTree = CompanyOrg.treeObj;
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

    KLBS.CompanyOrg = CompanyOrg;
}(KLBS));