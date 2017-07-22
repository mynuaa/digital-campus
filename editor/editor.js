var vertexHash = {};
for (var i = 0; i < vertexs.length; i++) {
    vertexHash[vertexs[i].name] = vertexs[i];
}


function updateEdges(data, status) {
    var edges = map.selectAll('line').data(data, function (d) { return d.hash; });
    if (status == 'enter') {
        edges = edges.enter().append('line');
    } else if (status == 'exit') {
        edges = edges.exit();
        edges.remove();
    }
    edges.attr('x1', function (d) { return d.origin.cx; })
        .attr('y1', function (d) { return d.origin.cy; })
        .attr('x2', function (d) { return d.next.cx; })
        .attr('y2', function (d) { return d.next.cy; })
        .attr('style', function (d) {
            switch (d.degree) {
                case 1: return 'stroke:#4caf50';
                case 2: return 'stroke:#1b5e20';
                default: return 'stroke:red';
            }
        })
        .on('mousemove', function (d) {
            var degreeText = '';
            switch (d.degree) {
                case 1: degreeText = '单向连通'; break;
                case 2: degreeText = '双向连通'; break;
                default: degreeText = '有重边'; break;
            }
            descText.text(d.desc + '，' + degreeText);
            var mousePos = d3.mouse(this);
            descDom.attr('style', 'transform: translate(' + (mousePos[0] - 1) + 'px, ' + (mousePos[1] - 3) + 'px)');
        })
        .on('mouseout', function () {
            descDom.attr('style', 'transform: translate(0, -1000px)');
        });
}

var dragVertex = d3.behavior.drag()
    .origin(function (d) { return d; })
    .on('drag', function (d) {
        if (clickStatus == 'normal') {
            d.cx += d3.event.dx;
            d.cy += d3.event.dy;
            d3.select(this).attr('style', function (d) {
                return 'transform: translate(' + d.cx + 'px, ' + d.cy + 'px)';
            });
            updateEdges(lineData);
        }
    });

function updateVertexs(data, status) {
    var vertexs = map.selectAll('g').data(data, function (d) { return d.name; });
    if (status == 'enter') {
        vertexs = vertexs.enter().append('g');
    } else if (status == 'exit') {
        vertexs = vertexs.exit();
        vertexs.remove();
    }
    vertexs = vertexs.attr('style', function (d) {
        return 'transform: translate(' + d.cx + 'px, ' + d.cy + 'px)';
    });
    vertexs.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 1);
    if (status == 'enter') {
        vertexs.call(dragVertex);
    }
    vertexs.append('text')
        .text(function (d) { return d.name; })
        .attr('x', 0)
        .attr('y', 5);
}

var svg = d3.select('#stage')
    .append('svg')
    .attr('width', window.innerHeight * 3)
    .attr('height', window.innerHeight * 3)
    .attr('viewBox', '0,0,500,500');

window.onresize = function () {
    svg.attr('width', window.innerHeight * 3).attr('height', window.innerHeight * 3);
}

var map = svg.append('g');
var image = map.append('image')
    .attr('href', 'mini-map.png')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 500);
var descDom = svg.append('g').attr('style', 'transform: translate(0, -1000px)');
descDom.append('rect')
    .attr('fill', 'rgba(0, 0, 0, 0.8)')
    .attr('x', -2)
    .attr('y', -3.5)
    .attr('width', 60)
    .attr('height', 5);
var descText = descDom.append('text')
    .attr('x', 0)
    .attr('y', 0.1);

var directions = ['n', 'e', 's', 'w'];
var directionText = {
    'n': '北',
    'e': '东',
    's': '南',
    'w': '西'
};
var edgeHash = {};
var lineData = [];
for (var i = 0; i < vertexs.length; i++) {
    var vertex = vertexs[i];
    var near = vertex.near;
    for (var d = 0; d < directions.length; d++) {
        var dir = directions[d];
        if (near[dir]) {
            var thisName = vertex.name + '(' + directionText[dir] + ')';
            var thatName = vertexHash[near[dir]].name + '(' + directionText[directions[(d + 2) % 4]] + ')';
            var min = d3.min([thisName, thatName]);
            var max = d3.max([thisName, thatName]);
            var minName = d3.min([vertex.name, vertexHash[near[dir]].name]);
            var maxName = d3.max([vertex.name, vertexHash[near[dir]].name]);
            var hash = minName + '|' + maxName;
            if (!edgeHash[hash]) {
                var edge = {
                    origin: vertex,
                    next: vertexHash[near[dir]],
                    hash: hash,
                    desc: min + '-' + max,
                    degree: 1
                };
                lineData.push(edge);
                edgeHash[hash] = edge;
                console.log(hash);
            } else {
                console.log(hash, edgeHash[hash].degree);
                edgeHash[hash].degree++;
                console.log(hash, edgeHash[hash].degree);
            }
        }
    }
}

updateEdges(lineData, 'enter');
updateVertexs(vertexs, 'enter');

var clickStatus = 'normal';

var btnAddVertex = document.getElementById('add-vertex');
btnAddVertex.onclick = function () {
    this.style.background = '#999';
    clickStatus = 'addingVertex';
};

var btnDelVertex = document.getElementById('del-vertex');
btnDelVertex.onclick = function () {
    this.style.background = '#999';
    clickStatus = 'deletingVertex';
};

var btnSave = document.getElementById('save');
btnSave.onclick = function () {
    vertexs = vertexs.map(function (item) {
        item.cx = parseFloat(parseFloat(item.cx).toFixed(4));
        item.cy = parseFloat(parseFloat(item.cy).toFixed(4));
        return item;
    });
    var data = 'var vertexs = ' + JSON.stringify(vertexs) + ';';
    try {
        var newWindow = window.open();
        newWindow.document.write(data);
        newWindow.document.title = '请保存数据';
    } catch (e) {
        alert('已禁止弹出窗口！将数据输出至 Console...')
        console.log(JSON.stringify(data));
    }
}

svg.on('mouseup', function () {
    if (clickStatus == 'addingVertex') {
        var pos = d3.mouse(this);
        var name = prompt('请输入新点的名称：');
        if (name && name != '') {
            vertexs.push({
                name: name,
                cx: pos[0],
                cy: pos[1],
                near: {}
            });
            updateVertexs(vertexs, 'enter');
        }
        clickStatus = 'normal';
        btnAddVertex.style.background = '#3498db';
    } else if (clickStatus == 'deletingVertex') {
        var element = d3.event.srcElement || d3.event.target;
        var name = element.parentNode.getElementsByTagName('text')[0].innerHTML;
        if (confirm('确定要删除点【' + name + '】吗？')) {
            for (var i = 0; i < lineData.length; i++) {
                var item = lineData[i];
                if (item.origin.name == name || item.next.name == name) {
                    lineData.splice(i, 1);
                }
            }
            for (var i = 0; i < vertexs.length; i++) {
                var item = vertexs[i];
                if (item.name == name) {
                    vertexs.splice(i, 1);
                } else {
                    for (var d = 0; d < directions.length; d++) {
                        var dir = directions[d];
                        if (item.near[dir] == name) {
                            item.near[dir] = undefined;
                        }
                    }
                }
            }
            updateEdges(lineData, 'exit');
            updateVertexs(vertexs, 'exit');
        }
        clickStatus = 'normal';
        btnDelVertex.style.background = '#3498db';
    }
});
