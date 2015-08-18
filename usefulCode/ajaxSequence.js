	
//按顺序执行多个ajax命令，因为数量不定，所以采用递归
function send(action, arg2) {
    //将多个命令按顺序封装成数组对象，递归执行
    //利用了deferred对象控制回调函数的特点
    $.when(send_action(action[0], arg2))
        .done(function () {
        //前一个ajax回调函数完毕之后判断队列长度
        if (action.length > 1) {
            //队列长度大于1，则弹出第一个，继续递归执行该队列
            action.shift();
            send(action, arg2);
        }
    }).fail(function () {
        //队列中元素请求失败后的逻辑
        //重试发送
        //send(action, arg2);
        //忽略错误进行下个
        //if (action.length > 1) {
            //队列长度大于1，则弹出第一个，继续递归执行该队列
        //    action.shift();
        //    send(action, arg2);
        //}
    });
}

//处理每个命令的ajax请求以及回调函数
function send_action(command, arg2) {
    var dtd = $.Deferred();//定义deferred对象
    $.post(
        "url",
        {
            command: command,
            arg2: arg2
        }
    ).done(function (json) {
        json = $.parseJSON(json);
        //每次请求回调函数的处理逻辑
        //逻辑结束
        dtd.resolve();
    }).fail(function () {
        //ajax请求失败的逻辑   
        dtd.reject();
    });
    return dtd.promise();//返回Deferred对象的promise，防止在外部修改状态
}
