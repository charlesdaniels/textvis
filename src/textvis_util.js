// https://stackoverflow.com/a/30800715
function downloadObjectAsJson(exportObj, exportName){
    console.log(exportObj);
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, '\t'));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function removeAllChildNodes(node_id) {
    // remove child nodes of a DOM element, but not that element
    let myNode = d3.select(node_id).node();
    console.log(myNode);
    while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
    }
}
