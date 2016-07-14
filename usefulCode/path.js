************************************ path.js ***********************************************
;(function(window, undefined){

    'use strict';

    var Path = null;

    Path = function(){
        return new Path.fn.init();
    };

    Path.fn = Path.prototype = {
        constructor: Path,
        init: function(){
            this.ID         = 'Path';
            this.NAME       = 'Path';
        }
    };

    Path.fn.init.prototype = Path.fn;

    // 定义A*算法里面的元素 ==START==
    var Element = function() {
        if (!(this instanceof Element)) {
            return new Element();
        }

        // 记录元素的状态 0 标识空白，可被放置
        this.status = 0;

        // 定义元素四周的元素
        this.right = this.left = this.top = this.bottom = null;

        var option = arguments[0];
        if (option && option.afterCreate) {
            option.afterCreate.call(this);
        }
    };

    // 设置Element的set，get方法
    var methods = ["top", "bottom", "left", "right", "status", "x", "y"];
    var defineSetGetMethod = function(fn, methods) {
        var fnPrototype = fn.prototype;
        for (var i = 0; i < methods.length; i++) {
            var methodName = methods[i].charAt(0).toLocaleUpperCase() + methods[i].substring(1);
            fn.prototype['set' + methodName] = new Function("value", "this." + methods[i] + "= value;");
            fn.prototype['get' + methodName] = new Function("return this." + methods[i]+";");
            fn.prototype['toString'] = new Function('return "matrix-item-" + this.x + "-" + this.y;');
        }
    };
    defineSetGetMethod(Element, methods);

    //扩展函数的实例方法
    var extend = function(fn, option) {
        var fnPrototype = fn.prototype;
        for (var i in option) {
            fnPrototype[i] = option[i];
        }
    };

    extend(Element, {
        atLeft : function(element) {
            return this.getX() < element.getX();
        },
        atTop : function(element) {
            return this.getY() < element.getY();
        },
        atRight : function(element) {
            return this.getX() > element.getX();
        },
        atBottom : function(element) {
            return this.getY() > element.getY();
        },
        isSelf : function(element) {
            return this == element;
        }
    });

    // 定义A*算法里面的元素 ==END==

    /**
     * 创建矩阵项集合
     * @param row       矩阵行
     * @param col       矩阵咧
     * @param option    参数
     * @returns {Array} 返回矩阵项集合
     */
    Path.fn.createElements = function(row, col, option) {
        var eArr = [];  // 存放矩阵项的数组
        //  1、初始化二维数组
        for (var i = 0; i < row; i++) {
            for ( j = 0; j < col; j++) {
                eArr[i] || (eArr[i] = []);
                var element = new Element(option);
                element.setX(i);
                element.setY(j);
                eArr[i][j] = element;
            }
        }

        // 2、遍历二维数组，对每一项的上下左右位置进行判断并设置
        for (var i = 0; i < row; i++) {
            for ( j = 0; j < col; j++) {
                var item    = eArr[i][j];
                var left    = (j > 0) ? eArr[i][j - 1] : null;
                var right   = (j + 1 < col) ? eArr[i][j + 1] : null;
                var top     = (i > 0) ? eArr[i-1][j] : null;
                var bottom  = (i + 1 < row) ? eArr[i+1][j] : null;
                item.setLeft(left);
                item.setRight(right);
                item.setBottom(bottom);
                item.setTop(top);
            }
        }
        return eArr;
    };

    /**
     * 寻找起点到终点的最短路径
     * @param element 起点
     * @param target 终点
     * @param switchTag true则返回可到达的所有区域
     * @returns {*}
     */
    Path.fn.getPath = function(element, target) {

        // 记录element可到达区域对应的路径
        var result = {
            arrivePath : {}
        };

        if (element == target) {
            return result;
        }

        // 设置查找的方向
        var dirArr = ["Top", "Right", "Bottom", "Left"];

        // 递归查找元素elements四周可到达的元素
        var addPath = function(elements, target) {
            if (!elements || !elements.length) {
                return;
            }

            // 缓存elements中元素周围可到达的元素
            var nearElements = [];
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];
                for (var j = 0; j < dirArr.length; j++) {
                    var dir = dirArr[j];
                    var nearElement = element["get"+dir]();
                    // 遇到障碍则中断
                    if (!nearElement || (nearElement != target && nearElement.getStatus() > 0) || result.arrivePath[nearElement]) {
                        continue;
                    }
                    nearElements.push(nearElement);
                    var lastPath = result.arrivePath[element];
                    if (!lastPath) {
                        lastPath = [];
                    }
                    result.arrivePath[nearElement] = [].concat(lastPath);
                    result.arrivePath[nearElement].push(nearElement);
                    if (target && target == nearElement) {
                        break;
                        return;
                    }
                }
            }
            addPath(nearElements, target);
        };
        addPath([element], target);
        result.arriveTargetPath = result.arrivePath[target];
        if (target) {
            var newJson = {};
            newJson[target] = result.arrivePath[target] || [];
            return newJson;
        } else {
            return result.arrivePath;
        }
    };

    window.Path = Path;

})(window);

************************************华丽丽的分割线*******************************************
************************************ HTML部分***********************************************
<!DOCTYPE html>
<html>
<head lang="en">
    <meta charset="UTF-8">
    <title>最短路径算法</title>
    <script type="text/javascript" src="jquery-1.8.1.min.js"></script>
    <script type="text/javascript" src="path.js"></script>
    <style type="text/css">
        body {
            font-family: "Arial", "微软雅黑";
            font-size: 12px;
        }

        .item {
            position: absolute;
            border: 1px solid #000;
            cursor: pointer;
            height: 20px;
            width: 20px;
        }

        .item:hover {
            cursor: pointer;
        }

        .status-0 {
            background: #E4A157;
        }

        .status-3 {
            background: #ff1934;
        }

        .status-start {
            background: #0084ff;
        }

        .status-end {
            background: #8a03ff;
        }

        .status-path {
            background: #1eff0d;
        }

        .matrix {
            position: relative;
            border: 1px solid #000;
        }
    </style>
</head>
<body>
<h3>最短路径算法DEMO</h3>

<p>红色的为障碍节点，只要任意选一个起点，然后任意选一个终点，就能自动展示出最短路径。</p>

<div id="matrix" class="matrix">

</div>
<script type="text/javascript">
    var path = new window.Path();

    // 矩阵参数
    var row = 25,       // 矩阵行
            col = 25,       // 矩阵列
            itemWidth = 20,       // 矩阵项宽
            borderWidth = .5,        // 边宽
            matrixId = 'matrix'; // 矩阵ID

    // 初始化矩阵
    var matrix = document.getElementById(matrixId),    // 矩阵对象
            boxWidth = itemWidth + 2 * borderWidth,          // 矩阵项宽度
            boxHeight = itemWidth + 2 * borderWidth;          // 矩阵项高度
    matrix.style.width = boxWidth * row + 'px';              // 矩阵总宽度
    matrix.style.height = boxHeight * col + 'px';            // 矩阵总高度

    var startElement,
            endElement,
            startCache,
            elementCache = [],
            calculatePathSwitch = false;

    // 创建矩阵项集合
    var elements = path.createElements(row, col, {
        afterCreate: function () {
            // 创建完矩阵项集合以后，在矩阵里随机安置障碍物的位置。
            if (Math.random() * 10 < 3) {
                this.setStatus(3);
            }
        }
    });

    // 对矩阵项的位置进行设置
    for (var i = 0; i < elements.length; i++) {
        for (var j = 0; j < elements[i].length; j++) {
            var item = elements[i][j];
            var mItem = document.createElement('div');
            mItem.id = item.toString();
            mItem.className = 'item status-' + item.getStatus();
            mItem.style.left = boxWidth * j + 'px';
            mItem.style.top = boxHeight * i + 'px';
            matrix.appendChild(mItem);
            mItem.onclick = function (e) {
                var e = e || window.event;
                var target = e.target || e.srcElement;
                var id = target.id;
                var coordinate = id.split('-'),
                        x = coordinate[2],
                        y = coordinate[3];

                // 1、选择了起点
                if (startElement) {
                    endElement = elements[x][y];
                } else {
                    startCache = elements[x][y];
                    startElement = elements[x][y];
                    if (!calculatePathSwitch) {
                        document.getElementById(startElement).className += ' status-start';
                    }
                }

                // 2、选择了起点和终点
                if (startElement && endElement) {
                    elementCache.push([startElement, endElement]);
                    if (!calculatePathSwitch) {
                        calculatePathSwitch = true;
                        calculatePath();
                    }
                    startElement = endElement = null;
                }
            };
        }
    }

    /**
     * 寻路动画过程
     */
    var calculatePath = function () {
        window.setTimeout(function () {
            if (!elementCache.length) {
                calculatePathSwitch = false;
                return;
            }
            // 获取缓存中起点和终点的数组
            var elArr = elementCache.shift();
            var startEl = elArr[0];
            var endEl = elArr[1];
            var mStartEl = document.getElementById(startEl);
            var mEndEl = document.getElementById(endEl);
            mStartEl.className += ' status-start';
            mEndEl.className += ' status-end';

            // 获取起点和终点路径
            var elements = path.getPath(startEl, endEl)[endEl];
            if (!elements.length) {
                calculatePath();
            }
            var nearEl, index = 0;
            var loop = function () {
                nearEl = elements[index];
                if (nearEl) {
                    var mNearEl = document.getElementById(nearEl);
                    mNearEl.style.opacity = .3;
                    if (nearEl != endEl) {
                        mNearEl.className += ' status-path';
                    }
                    // 用jquery的动画函数
                    $(mNearEl).animate({
                        opacity: 1
                    }, 200, function () {
                        mNearEl.className = mNearEl.className.replace(' status-path', '');
                        index++;
                        loop();
                    });
                } else {
                    document.getElementById(startCache).className = document.getElementById(startCache).className.replace(' status-start', '');
                    mStartEl.className = mStartEl.className.replace(' status-start', '');
                    mEndEl.className = mEndEl.className.replace(' status-end', '');
                    calculatePath();
                }
            };
            loop();
        }, 20);
    };

</script>
</body>
</html>
