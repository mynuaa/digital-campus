HTMLElement.prototype.setId = function (id) {
    this.id = id;
    return this;
};

HTMLElement.prototype.setClass = function (className) {
    this.className = className;
    return this;
};

HTMLElement.prototype.setInnerHTML = function (innerHTML) {
    this.innerHTML = innerHTML;
    return this;
};

var createElement = function (nodeName, parentNode) {
    var element = document.createElement(nodeName);
    parentNode.appendChild(element);
    return element;
};

document.body.oncontextmenu = function () { return false; };

var stage = document.getElementById('stage');
var labels = createElement('div', stage).setClass('labels');
var labelsContent = createElement('div', labels).setClass('labels-content');
var labelsTitle = createElement('h1', labelsContent).setInnerHTML('地点列表');
var btnHidden = createElement('div', labels).setClass('btn-hidden').setInnerHTML('&raquo;');
var picture = createElement('div', stage).setClass('picture');
var displayName = createElement('div', stage).setClass('display-name');

var labelDict = {};
var directions = ['e', 's', 'w', 'n'];
var currentVertexId;
var currentDirectionIndex;
var stack = [];
var tmpImg = new Image;

var showOnScreen = function (id, dirIndex) {
    currentVertexId = id;
    currentDirectionIndex = dirIndex;
    displayName.innerText = labelDict[data.vertexs[id].label] ? labelDict[data.vertexs[id].label].name : '校园';
    var src = 'places/' + id + '-' + directions[dirIndex] + '.jpg';
    tmpImg.src = src;
    picture.style.webkitFilter = picture.style.MozFilter = picture.style.filter = 'blur(10px)';
    picture.style.webkitTransform = picture.style.MozTransform = picture.style.transform = 'scale(1.1)';
    tmpImg.onload = function () {
        setTimeout(function () {
            // prevent previous onload
            var bgImg = 'url(' + src + ')';
            if (picture.style.backgroundImage !== bgImg) {
                picture.style.backgroundImage = bgImg;
                picture.style.webkitFilter = picture.style.MozFilter = picture.style.filter = 'blur(0)';
                picture.style.webkitTransform = picture.style.MozTransform = picture.style.transform = 'scale(1)';
            }
        }, 300);
    };
};

var goForward = function (id, dirIndex) {
    stack.push({
        id: id,
        dirIndex: dirIndex
    });
    showOnScreen(id, dirIndex);
};

var goBack = function () {
    var stackTop = stack[stack.length - 2];
    if (stackTop) {
        stack.pop();
        showOnScreen(stackTop.id, stackTop.dirIndex);
    }
};

Object.keys(data.labels).forEach(function (key) {
    var label = data.labels[key];
    var ul = createElement('ul', labelsContent).setId(key);
    var click = createElement('li', ul).setClass('click').setInnerHTML(key);
    click.onclick = function () {
        location.hash = key;
    };
    Object.keys(label).forEach(function (item) {
        labelDict[item] = label[item];
        var li = createElement('li', ul).setInnerHTML(label[item].name);
        li.onclick = function () {
            // switching area, clear the stack
            stack = [];
            goForward(label[item].vid, label[item].dir);
        };
    });
});

goForward(data.initVertexId, data.initDirectionIndex);

var calcPosition = function (position) {
    var currentVertex = data.vertexs[currentVertexId];
    var near = currentVertex.near || {};
    var nextVertexId;
    switch (position) {
        case 'w': // w or arrow up, go straight
            nextVertexId = near[directions[currentDirectionIndex]] || null;
            if (nextVertexId !== null) {
                goForward(nextVertexId, currentDirectionIndex);
            }
            break;
        case 's': // s or arrow down, go back
            goBack();
            break;
        case 'a': // a or arrow left, turn left
            stack.pop();
            goForward(currentVertexId, (currentDirectionIndex + 3) % 4);
            break;
        case 'd': // d or arrow right, turn right
            stack.pop();
            goForward(currentVertexId, (currentDirectionIndex + 1) % 4);
            break;
    }
}

document.body.addEventListener('keydown', function (e) {
    switch (e.keyCode) {
        case 38: case 87: calcPosition('w'); break;
        case 40: case 83: calcPosition('s'); break;
        case 37: case 65: calcPosition('a'); break;
        case 39: case 68: calcPosition('d'); break;
    }
});

var controls = createElement('div', stage).setClass('controls');
var go = createElement('button', controls).setClass('control-go').setInnerHTML('W');
var left = createElement('button', controls).setClass('control-left').setInnerHTML('A');
var back = createElement('button', controls).setClass('control-back').setInnerHTML('S');
var right = createElement('button', controls).setClass('control-right').setInnerHTML('D');

// prevent 300ms' click lag
var listener = /mobile/i.test(navigator.userAgent) ? 'touchend' : 'click';
go.addEventListener(listener, function () { calcPosition('w'); });
back.addEventListener(listener, function () { calcPosition('s'); });
left.addEventListener(listener, function () { calcPosition('a'); });
right.addEventListener(listener, function () { calcPosition('d'); });
