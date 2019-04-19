// https://stackoverflow.com/a/30800715
function downloadObjectAsJson(exportObj, exportName){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, '\t'));
    downloadString(dataStr, exportName)
}

function downloadString (dataStr, exportName) {
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function removeAllChildNodes(node_id) {
    // remove child nodes of a DOM element, but not that element
    let myNode = d3.select(node_id).node();
    while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
    }
}

function sleep(milliseconds) {
    // hack to pretend we have sleep(). This is super awful and should be used
    // sparingly.
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}
