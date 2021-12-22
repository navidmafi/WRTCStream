
function loaddefaultsettings() {
    let elements = document.getElementsByTagName("select");
    tokenInput.value = 'kobs';

    for (let element of elements) {
        element.children[2].selected= true;
    }
}
loaddefaultsettings();


/*
      <span>This is the last release of this project. <a class="tc-black" href="#" onclick="notifier.info('This project was supposed to be just an experiment for a larger project. And this was not going to be supported in the long run. Although this experiment will still be available for a while, we will not work on it anymore and will not provide support because we want to focus on our bigger projects. ',{labels: {info: 'Why'},durations : {info : 60000}})">Learn more</a></span>
*/