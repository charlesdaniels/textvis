// https://gist.github.com/eesur/4e0a69d57d3bfc8a82c2
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};
d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};

function instantiate_vis(container_id, download_btn_id, paragraphs, relations) {
    let textheight = 20;

    let container = d3.select(container_id);

    let download = d3.select(download_btn_id);

    // width and height are mostly bogus, but they seem to fix some wierd
    // glitches with mouseover under Firefox
    let svg = container.append('div').append('svg')
        .attr("id", "textvis_svg")
        .style("overflow", "visible")
        .attr("width", 1000)
        .attr("height", 4000);

    let annotation_container = container.append('div')
        .attr("id", "annotation_container")
        .style("opacity", 0)
        .style("class", "tooltop")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-raidus", "5px")
        .style("padding", "5px")
        .style("left", "1000px");

    // https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html
    let tooltip = container.append("div")
        .attr("id", "tooltip_container")
        .style("opacity", 0)
        .style("class", "tooltop")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-raidus", "5px")
        .style("padding", "5px")
        .moveToBack();

    function handle_svg_download () {
        let html = svg.attr("version", 1.1)
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .node().parentNode.innerHTML;
        let imgstr = 'data:image/svg+xml;base64,' + btoa(html);
        downloadString(imgstr, "figure.svg");
    }

    download.on("click", handle_svg_download);

    function show_tooltip(text) {
        if (text == null) { return; }
        if (text == "") { return; }
        tooltip.html(text)
            .style("left", (d3.mouse(d3.event.currentTarget)[0] - 100) + "px")
            .style("top", (d3.mouse(d3.event.currentTarget)[1] + 200) + "px")
            .style("position", "fixed")
            .style("opacity", 1)
            .moveToFront();
    }

    function hide_tooltip() {
        tooltip.style("opacity", 0).moveToBack().style("left", 1000);
    }

    function show_svg_annotation(data, x, y) {
        if (data == null) {return;}
        if (data == "") {return;}
        annotation_container.style("opacity", 1)
            .style("left", x + "px")
            .style("top", y + "px")
            .style("position", "fixed")
            .moveToFront();
        annotation_container.node().innerHTML = data;
    }

    function hide_svg_annotation() {
        annotation_container.style("opacity", 0).style("left", "1000px").moveToBack();
        annotation_container.node().innerHTML = "";
    }

    let link_color_normal = "#AAAAAA";
    let link_color_active = "#CC3333";
    let sentence_color_normal = "#111111";
    let sentence_color_active = "#CC3333";

    xpos = 300;
    ypos = 100;

    let pos = {}
    let sentences = {}

    for (par of paragraphs) {
        pos[par.index] = {};
        sentences[par.index] = {};
        let annotation_svg_str = "";
        if (par.annotation != null) {
            annotation_svg_str = par.annotation;
        }
        for (sent of par.sentences) {
            let elem = svg.append('text')
                .attr("x", xpos)
                .attr("y", ypos)
                .attr("fill", sentence_color_normal)
                .text(sent.words)
                .on("mouseover", function (d) {
                    let bounds = d3.select(this).node().getBoundingClientRect();
                    d3.select(this).text(d.text_with_pos);
                    d3.select(this).attr("fill", sentence_color_active);
                    show_svg_annotation(d.annotation_svg, bounds.x + 100, bounds.y + 100);
                    for (let e of d.outgoing) {
                        e.attr("stroke", link_color_active);
                    }
                }).on("mouseout", function(d) {
                    d3.select(this).text(d.text);
                    d3.select(this).attr("fill", sentence_color_normal);
                    hide_svg_annotation();
                    for (let e of d.outgoing) {
                        e.attr("stroke", link_color_normal);
                    }
                })
            elem.data([{
                "incoming": [],
                "outgoing": [],
                "text": sent.words,
                "text_with_pos": `(${par.index},${sent.index}) ${sent.words}`,
                "annotation_svg": annotation_svg_str,
            }]);
            pos[par.index][sent.index] = [xpos, ypos - textheight / 4];
            sentences[par.index][sent.index] = elem;
            ypos += textheight;
        }
        ypos += textheight;
    }

    function drawarc(fromx, fromy, tox, toy) {
        midx = Math.max(fromx, tox) - xpos * 0.8;
        midy = (fromy + toy) / 2;
        return `M ${fromx} ${fromy} Q ${midx} ${midy}, ${tox} ${toy}`;
    }

    /* The actual relation objects are annotated with an elem field so they can
     * later be retrieved if needed. We use the old style for loop syntax since
     * the new style interacts strangely with scoping in undesirable ways. */
    for (let r of relations) {
        if ((r.from.paragraph == r.to.paragraph) && (r.from.sentence == r.to.sentence)) { continue; }
        let the_elem = svg.append('path')
            .attr("d", drawarc(
                pos[r.from.paragraph][r.from.sentence][0],
                pos[r.from.paragraph][r.from.sentence][1],
                pos[r.to.paragraph][r.to.sentence][0],
                pos[r.to.paragraph][r.to.sentence][1]))
            .attr("stroke", link_color_normal)
            .attr("fill", "none")
            .style("stroke-width", "2")
            .on("mouseover", function (d) {

                d3.select(this).attr("stroke", link_color_active);
                d3.select(this).moveToFront();

                d.from.attr("fill", sentence_color_active);
                d.to.attr("fill", sentence_color_active);
                d.from.text(d.from.data()[0].text_with_pos);
                d.to.text(d.to.data()[0].text_with_pos);

                tooltip.attr("y", d.tooltip_y);
                tooltip.attr("fill", "black");
                show_tooltip(d.tooltip_text);

            }).on("mouseout", function(d) {
                d3.select(this).attr("stroke", link_color_normal);

                d.from.attr("fill", sentence_color_normal);
                d.to.attr("fill", sentence_color_normal);

                d.from.text(d.from.data()[0].text);
                d.to.text(d.to.data()[0].text);

                hide_tooltip();

            });

        the_elem.data([{
            "from": sentences[r.from.paragraph][r.from.sentence],
            "to": sentences[r.to.paragraph][r.to.sentence],
            "tooltip_y": ((pos[r.from.paragraph][r.from.sentence][1] + pos[r.to.paragraph][r.to.sentence][1]) / 2),
            "tooltip_text": r.annotation,
        }]);

        sentences[r.from.paragraph][r.from.sentence].data()[0].outgoing.push(the_elem);
        sentences[r.to.paragraph][r.to.sentence].data()[0].incoming.push(the_elem);

    }

    hide_svg_annotation();

}
