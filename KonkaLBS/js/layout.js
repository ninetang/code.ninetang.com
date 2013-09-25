$(function () {
    $('#accordion')
        .accordion({//折叠
            heightStyle: "fill"
        })
        .sortable({//排序
            axis: 'y',
            handle: 'h3',
            stop: function (event, ui) {
                // IE doesn't register the blur when sorting
                // so trigger focusout handlers to remove .ui-state-focus
                ui.item.children("h3").triggerHandler("focusout");
            }
        });
    $('#ControlPanel')
        .resizable({//右拉
            handles: "e", //右
            maxWidth: 450,  //px
            minWidth: 250,
            resize: function (event, ui) {
                //var ml = $('#Perspective').css('marginLeft');
                $("#accordion").accordion("refresh");
                $('#Perspective').css('marginLeft', this.clientWidth);
                //ui.width();
            }
        });

    var perspective = $('#Perspective').tabs(); //选项卡
    perspective.find('.ui-tabs-nav').sortable({
        axis: 'x',
        stop: function () {
            perspective.tabs('refresh');
        }
    });

    //交互布局完成
    $('#MaskLayer').hide();

    //$('#ControlPanel').show('drop');
    $('#ControlPanel').animate({marginLeft: '0'}, 'slow', function () {
        //发送布局完成事件，脱耦
        var evt = $.Event('layoutDone');
        $(document).trigger(evt);
    });
});
