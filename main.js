window.onload = function () {
    var button = document.getElementById("searchButton");
    button.onclick = searchButtonOnClick;
}

function searchButtonOnClick() {
    var textInput = document.getElementById("searchTextInput");
    var text = textInput.value;
    if (text != "") {
        var resultList = document.getElementById("resultList");
        var li = document.createElement("li");
        li.innerText = text;
        resultList.appendChild(li);
    }
}