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

function get_link_heatmap_by_par(paragraphs, relations) {
    // return an object associating paragraph indices with # of links and
    // link intensity as a % (i.e. the paragraph with the most links of any
    // in the document has an intensity of 1.0).
    //
    // We only consider incoming links.

    let heatmap = {}

    let min_links = 999999;
    let max_links = 0;

    for (let par of paragraphs) {
        heatmap[par.index] = {"links": 0, "intensity": 0};
    }

    for (let rel of relations) {
        heatmap[rel.to.paragraph].links ++;
    }

    for (let i in heatmap) {
        let h = heatmap[i];
        if (h.links < min_links) {
            min_links = h.links;
        }

        if (h.links > max_links) {
            max_links = h.links;
        }
    }

    // avoid div by 0
    if (max_links == 0) { max_links ++; }

    for (let i in heatmap) {
        let h = heatmap[i];
        h.intensity = (h.links - min_links) / (max_links - min_links);
    }

    return heatmap
}

function clear_minimap() {
    // delete the minimap if it already exists
    try {
        d3.select("#textvis_minimap").remove();
    } catch (e) {
        console.log("caught exception: ", e)
    };
}

function update_minimap(container, paragraphs, relations, parpos, heatmap) {
    // container is the div where the minimap should be placed
    //
    // paragraphs and relations are as for instantiate_vis
    //
    // parpos should map paragraph indices to their y position on the page
    //
    // heatmap should associate paragraph indices with objects that define an
    // "intensity" key that specifies an intensity value in 0..1

    // call this when turning the minimap on, or if it needs to be re-rendered,
    // such as on a screen size change.

    console.log("updating minimap... ");

    clear_minimap();

    let minimap = container.append('div')
        .attr("id", "textvis_minimap")
        .style("position", "fixed")
        .style("top", "150px")
        .style("left", "5px")
        .style("border-radius", "5px")
        .style("border-width", "2px")
        .style("border", "solid")
        .style("border-color", "black")
        .style("opacity", 0.8);

    let minimap_height = window.innerHeight - 200;

    let minimap_svg = minimap.append("svg")
        .attr("width", 25)
        .attr("height", minimap_height)
        .attr("id", "textvis_minimap_svg");


    let rect_height = minimap_height / Object.keys(heatmap).length;

    let start_y = parpos[Object.keys(parpos)[0]]
    let stop_y = parpos[Object.keys(parpos)[Object.keys(parpos).length-1]];

    let current_scroll_percent = (window.pageYOffset - start_y) / (stop_y - start_y);

    if (current_scroll_percent < 0) { current_scroll_percent = 0.0; }
    if (current_scroll_percent > 1.0) { current_scroll_percent = 1.0; }

    let heat_scale = d3.scaleLinear()
        .domain([0, 1.0])
        .range(["#f5f5f5", "#CC3333"]);

    let count = 0;
    for (let i in heatmap) {
        let h = heatmap[i];
        let elem = minimap_svg.append("rect")
            .attr("x", 0)
            .attr("y", count * rect_height)
            .attr("width", 25)
            .attr("height", rect_height)
            .attr("fill", heat_scale(h.intensity))
            .on("click", function(d) {
                window.scrollTo(0, d.parpos);
            }).on("mouseover", function(d) {
                d3.select(this).attr("stroke", "black")
                .attr("stroke-width", 4);
            }).on("mouseout", function(d) {
                d3.select(this).attr("stroke", "none");
            });

        elem.data([{
            "parpos": parpos[i]
        }]);
        count ++;
    }

    minimap_svg.append("rect")
        .attr("x", 0)
        .attr("y", minimap_height * current_scroll_percent)
        .attr("width", 25)
        .attr("height", 3)
        .attr("fill", "black");


}

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

    function show_tooltip(text, x, y) {
        if (text == null) { return; }
        if (text == "") { return; }
        tooltip.html(text)
            .style("left", x + "px")
            .style("top", y + "px")
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
    parpos = {}

    for (par of paragraphs) {
        pos[par.index] = {};
        sentences[par.index] = {};
        let annotation_svg_str = "";
        if (par.annotation != null) {
            annotation_svg_str = par.annotation;
        }
        let got_parpos = false;
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
            if (!got_parpos) {
                parpos[par.index] = elem.node().getBoundingClientRect().y;
                got_parpos = true;
            }
        }
        ypos += textheight;
    }

    function drawarc(fromx, fromy, tox, toy) {
        midx = Math.max(fromx, tox) - 0.5 * xpos - 0.35 * Math.abs(fromy - toy);
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
                let bounds = d.to.node().getBoundingClientRect();
                if (d.from.node().getBoundingClientRect().y > bounds.y) {
                    bounds = d.from.node().getBoundingClientRect();
                }

                show_tooltip(d.tooltip_text, 100, bounds.y + 50);

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

    if (typeof textvis_enable_minimap == 'undefined') {
        textvis_enable_minimap = false;
    }

    if (textvis_enable_minimap) {
        let heatmap = get_link_heatmap_by_par(paragraphs, relations);
        update_minimap(container, paragraphs, relations, parpos, heatmap);
    }

    window.addEventListener('resize', function(event) {
        if (textvis_enable_minimap) {
            let heatmap = get_link_heatmap_by_par(paragraphs, relations);
            update_minimap(container, paragraphs, relations, parpos, heatmap);
        }
    });

    window.addEventListener("scroll", function(event) {
        if (textvis_enable_minimap) {
            let heatmap = get_link_heatmap_by_par(paragraphs, relations);
            update_minimap(container, paragraphs, relations, parpos, heatmap);
        }
    });


}
