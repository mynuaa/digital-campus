var vertexHash = {};
for (var i = 0; i < vertexs.length; i++) {
    vertexHash[vertexs[i].name] = vertexs[i];
}

var color = d3.scale.category20();

function updateEdges(data, status) {
    var edges = graph.edges.selectAll('line').data(data, function (d) { return d.hash; });
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
            var s = (d.degree > 2) ? 'stroke:red' : 'stroke:#1b5e20';
            if (d.degree === 1) {
                s += 'stroke-opacity:0.5';
            }
        })
        .append('title').text(function (d) {
            var degreeText = '';
            switch (d.degree) {
                case 1:
                    degreeText = '单向连通';
                    console.log('[' + d.desc + '] 是单向连通');
                    break;
                case 2:
                    degreeText = '双向连通';
                    break;
                default:
                    degreeText = '有重边';
                    console.log('[' + d.desc + '] 有重边');
                    break;
            }
            return d.desc + ', ' + degreeText;
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
    var vertexs = graph.vertexs.selectAll('g').data(data, function (d) { return d.name; });
    if (status == 'enter') {
        vertexs = vertexs.enter().append('g');
        vertexs.append('title').text(function (d) {
            if (d.label) {
                return '区域：' + d.label;
            } else {
                return '不属于任何区域';
            }
        });
    } else if (status == 'exit') {
        vertexs = vertexs.exit();
        vertexs.remove();
    }
    vertexs = vertexs.attr('style', function (d) {
        return 'transform: translate(' + d.cx + 'px, ' + d.cy + 'px)';
    });
    if (status == 'enter') {
        vertexs.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 1.5)
            .style('fill', function (d) { return color(d.label || 0); });
        vertexs.append('text')
            .text(function (d) { return d.name; })
            .attr('x', 0)
            .attr('y', 5);
        vertexs.call(dragVertex);
    } else {
        vertexs.select('circle')
            .style('fill', function (d) { return color(d.label || 0); });
    }
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
// 先写边，因为 svg 的层叠顺序是 append 的顺序
var graph = {
    edges: map.append('g'),
    vertexs: map.append('g')
};

var directions = '2468';
var directionText = '__南_西_东_北';
var edgeHash = {};
var lineData = [];

var spreadEdge = function (vertex, dir) {
    var near = vertex.near;
    var thatVertex = vertexHash[near[dir]];
    var thatDir = 0;
    for (var d = 0; d < directions.length; d++) {
        if (thatVertex.near[directions[d]] == vertex.name) {
            thatDir = directions[d];
            break;
        }
    }
    var thisName = vertex.name + '(' + directionText[dir] + ')';
    var thatName = thatVertex.name + '(' + directionText[thatDir] + ')';
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
            desc: min + ' - ' + max,
            degree: 1
        };
        lineData.push(edge);
        edgeHash[hash] = edge;
    } else {
        edgeHash[hash].degree++;
    }
};

for (var i = 0; i < vertexs.length; i++) {
    for (var d = 0; d < directions.length; d++) {
        var dir = directions[d];
        if (vertexs[i].near[dir]) {
            spreadEdge(vertexs[i], dir);
        }
    }
}

updateEdges(lineData, 'enter');
updateVertexs(vertexs, 'enter');

var clickStatus = 'normal';

var btnScanImg = document.getElementById('scan-img');
btnScanImg.onclick = function () {
    this.style.background = '#999';
    this.innerHTML = '检测中...';
    var missing = [];
    var directions = 'nesw';
    var processed = 0;
    for (var i in vertexs) {
        for (var k in directions) {
            (function (i, k) {
                var name = vertexs[i].name;
                var direction = directions[k];
                var key = '../places/' + name + '-' + direction + '.jpg';
                processed++;
                fetch(key, { method: 'HEAD' }).then(function (res) {
                    if (!res.ok) {
                        missing.push({
                            name: name,
                            direction: direction
                        });
                    }
                    processed--;
                    if (processed == 0) {
                        console.table(missing);
                        btnScanImg.style.background = '#2196f3';
                        btnScanImg.innerHTML = '检测缺失的图片';
                        alert('检测完毕，结果已输出至 console。');
                    }
                }).catch(function (e) { });
            })(i, k);
        }
    }
};

var btnAddVertex = document.getElementById('add-vertex');
btnAddVertex.onclick = function () {
    this.style.background = '#999';
    this.innerHTML = '请选择新点的位置';
    clickStatus = 'addingVertex';
};

var btnDelVertex = document.getElementById('del-vertex');
btnDelVertex.onclick = function () {
    this.style.background = '#999';
    this.innerHTML = '请选择要删除的点';
    clickStatus = 'deletingVertex';
};

var btnAddEdge = document.getElementById('add-edge');
btnAddEdge.onclick = function () {
    this.style.background = '#999';
    this.innerHTML = '请选择第一个点';
    clickStatus = 'addingEdge-vertex-1';
};

var btnAddLabel = document.getElementById('add-label');
btnAddLabel.onclick = function () {
    this.style.background = '#999';
    this.innerHTML = '请选择要加标签的点';
    clickStatus = 'addingLabel';
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

var getClickedVertex = function () {
    var element = d3.event.srcElement || d3.event.target;
    if (element.nodeName == 'circle' || element.nodeName == 'text') {
        return vertexHash[element.parentNode.getElementsByTagName('text')[0].innerHTML];
    }
    return null;
};

var restoreClickStatus = function () {
    if (clickStatus != 'normal') {
        clickStatus = 'normal';
        btnAddVertex.style.background = '#2196f3';
        btnAddVertex.innerHTML = '加点';
        btnDelVertex.style.background = '#2196f3';
        btnDelVertex.innerHTML = '删点';
        btnAddEdge.style.background = '#2196f3';
        btnAddEdge.innerHTML = '连边';
        btnAddLabel.style.background = '#2196f3';
        btnAddLabel.innerHTML = '标签';
    }
};

var vertex1 = { instance: null, dir: null };
var vertex2 = { instance: null, dir: null };

svg.on('mouseup', function () {
    // 右键不在这儿处理
    if (d3.event.which == 3) {
        return;
    }
    var clickedVertex = getClickedVertex();
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
        restoreClickStatus();
    } else if (clickStatus == 'deletingVertex') {
        if (clickedVertex) {
            var name = clickedVertex.name;
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
        }
        restoreClickStatus();
    } else if (clickStatus == 'addingEdge-vertex-1') {
        if (clickedVertex) {
            vertex1.instance = clickedVertex;
            vertex1.dir = prompt('请输入方向数字 (2, 4, 6, 8)');
            if (/[2468]/.test(vertex1.dir)) {
                btnAddEdge.innerHTML = clickedVertex.name + '(' + directionText[vertex1.dir] + ')' + ' - [请选择]';
                clickStatus = 'addingEdge-vertex-2';
            } else {
                alert('无效的方向');
                restoreClickStatus();
            }
        }
    } else if (clickStatus == 'addingEdge-vertex-2') {
        if (clickedVertex) {
            vertex2.instance = clickedVertex;
            vertex2.dir = prompt('请输入方向数字 (2, 4, 6, 8)');
            if (/[2468]/.test(vertex2.dir)) {
                var checked = true;
                if (parseInt(vertex1.dir) + parseInt(vertex2.dir) != 10) {
                    checked = confirm('两个方向不为反方向（这意味着这条边将会改变行进方向），确定？');
                }
                if (checked) {
                    vertex1.instance.near[vertex1.dir] = vertex2.instance.name;
                    vertex2.instance.near[vertex2.dir] = vertex1.instance.name;
                    spreadEdge(vertex1.instance, vertex1.dir);
                    spreadEdge(vertex2.instance, vertex2.dir);
                    updateEdges(lineData, 'enter');
                    restoreClickStatus();
                } else {
                    alert('好的，请重新选择第二个点，或按右键取消');
                }
            } else {
                alert('无效的方向');
            }
        }
    } else if (clickStatus == 'addingLabel') {
        if (clickedVertex) {
            var name = clickedVertex.name;
            var label = vertexHash[name].label;
            label = prompt('“' + name + '”的标签为【' + (label || '空') + '】，请输入新标签：');
            if (label && label != '') {
                vertexHash[name].label = label;
            } else {
                delete vertexHash[name].label;
            }
            updateVertexs(vertexs);
        }
        restoreClickStatus();
    }
});

svg.on('contextmenu', function () {
    d3.event.preventDefault();
    restoreClickStatus();
});
