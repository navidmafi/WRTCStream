
function loaddefaultsettings() {
    let elements = document.getElementsByTagName("select");
    tokenInput.value = 'kobs';

    for (let element of elements) {
        element.children[2].selected= true;
    }
}
loaddefaultsettings();