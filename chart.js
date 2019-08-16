var jsonUri = 'https://gist.githubusercontent.com/arazmj/2136e077ed1b12825792b1fff06729e8/raw/d9c65e92ec1ab19c68eaffb91749b4ae92892645/graph.json';
d3.json(jsonUri).then(function(data) {
    update(data);
});

var width = 600;
var height = 700;
var padding = 150;
var top_padding = 50;
let radius = 15;

var roles = new Map([
    ["VPNC",       {x: 0, y:padding * 0 + top_padding, c: 0}],
    ["INET",       {x: 0, y:padding * 1 + top_padding, c: 0}],
    ["Controller", {x: 0, y:padding * 2 + top_padding, c: 0}],
    ["Switch",     {x: 0, y:padding * 3 + top_padding, c: 0}],
    ["IAP",        {x: 0, y:padding * 4 + top_padding, c: 0}]]);

var svg = d3.select( 'div.chart' ).append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g").attr("transformation", "translate(510, 510)");

var diagonal = function link(d) {
    return "M" + d.source.x + "," + d.source.y
        + "C" + (d.source.x + d.target.x) / 2 + "," + d.source.y
        + " " + (d.source.x + d.target.x) / 2 + "," + d.target.y
        + " " + d.target.x + "," + d.target.y;
};

function update(data){
    /* add INET just like another device */
    data.devices.push({role: "INET", serial: "aruba_inet", name: "aruba INET"});

    /* calculate count of role in each row */
    data.devices.forEach(function (d) {
        roles.get(d.role).c++;
    });

    /* calculate coordinates of nodes */
    data.devices.forEach(function (d) {
        var r = roles.get(d.role);
        roles.get(d.role).x += width / (r.c + 1);
        d.pos = {x: r.x,  y:r.y};
    });

    data.edges.forEach(function (edge) {
        var fromDevices = data.devices.filter(function (device) {
            return device.serial === edge.fromIf.serial;
        });
        edge.fromIf.pos = fromDevices[0].pos;

       var toDevices = data.devices.filter(function (device) {
           return device.serial === edge.toIf.serial;
       });
       edge.toIf.pos = toDevices[0].pos;
    });

    var edges = svg.selectAll("path")
        .data(data.edges)
        .enter()
        .append("path")
        .attr("stroke", "red")
        .attr("stroke-width", "2")
        .style("stroke", function (d) { return "orange"; })
        .attr("d", function(d) {
            return diagonal({source:d.fromIf.pos, target:d.toIf.pos });
        });

    svg.selectAll("circle")
        .data(data.devices)
        .enter()
        .append("circle")
        .attr("cx", function (d, i) {
            return d.pos.x;
        })
        .attr("cy", function (d) {
            return d.pos.y;
        })
        .attr("r", radius)
        .style("stroke", "gray")
        .style("stroke-width", "2px")
        .style("fill", "white")
        .call(d3.drag().on("drag", dragged))
        .on('click', click);


    svg.selectAll("text")
        .data(data.devices)
        .enter()
        .append("text")
        .text(function(d) {return d.name;})
        .attr("x", function (d) { return d.pos.x; })
        .attr("y", function(d) { return d.pos.y + 25;})
        .attr("text-anchor", "middle")
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .style("fill", "gray")
        .attr("font-size", 9)


    function click(d) {
        console.log(d);
    }
    function dragged(d) {
        d.pos.x = d3.event.x, d.pos.y = d3.event.y;
        d3.select(this).attr("cx", d.pos.x).attr("cy", d.pos.y);
        edges.filter(function(l) { return l.fromIf.pos === d.pos; })
        .attr("d", function(ll) {
           return diagonal({ source:d.pos, target: ll.toIf.pos});
        });
        edges.filter(function(l) { return l.toIf.pos === d.pos; }).attr("d", function(ll){
             return diagonal({source: ll.fromIf.pos, target: d.pos});
        });
        d3.selectAll("text").filter(function (dd) {
            return dd.pos.x == d.pos.x && dd.pos.y == d.pos.y;
        }).attr("x", d.pos.x).attr("y", d.pos.y + 25);
    }
}