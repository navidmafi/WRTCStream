// © Copyright Navid Mafi Ranji 2021 . <navidmafi2006@gmail.com> ALL RIGHT RESERVED



const startbtn = document.getElementById('start-stream');
const connectionloader = document.getElementById('connectionloader');
const notifier = new AWN({position: "top-right"});
const tokenInput = document.getElementById('token');
let lastResult;
const clientStatus = {
    connected : false ,
    bitrateNow : 0,
    usageEst : 0
}
const footerStats = document.getElementById('footerstat');
//TODO ROOM ID ON WINDOW.ONLOAD

function startBroadcast(form) {
    startbtn.disabled = true;
    connectionloader.classList.remove("hidden");
    tokenInput.classList.add('hidden');
    init({
        token: tokenInput.value
    }, {
        audioOptions: {
            audioBuffer : 2,
            audioBitrate: form.getElementsByTagName("select")[3].value
        },
        videoOptions: {
            videoBuffer: 5,
            videoQuality: form.getElementsByTagName("select")[0].value,
            videoFPS: form.getElementsByTagName("select")[1].value,
            videoBitrate: form.getElementsByTagName("select")[2].value
        }
    });
    return false;
}

async function init(clientOptions, mediaOptions) {
    const stream = await navigator.mediaDevices.getDisplayMedia({
        "audio": {
            noiseSuppression: true,
            autoGainControl: true

        },
        "video": {
            frameRate: mediaOptions.videoOptions.videoFPS,
            height: mediaOptions.videoOptions.videoQuality
        }
    });
    document.getElementById("video").srcObject = stream;
    connectionloader.classList.add("hidden");
    const peer = createPeer(clientOptions, mediaOptions);
    stream.getTracks().forEach(track => {
        track.onended = (track) => {
            console.log(track,' ended');
        }
        peer.addTrack(track, stream);
    });

}


function createPeer(clientOptions, mediaOptions) {
    const peer = new RTCPeerConnection({
        iceServers: [
            {urls: "stun:stun1.l.google.com:19302"},
            {urls: "stun:stun2.l.google.com:19302"},
            {urls: "stun:stun3.l.google.com:19302"},
            {urls: "stun:stun.nextcloud.com:443"}

        ]
    });

    // Network Monitor
    window.setInterval(() => {
        //TODO add audio est too
        const sender = peer.getSenders()[0];
        sender.getStats().then(res => {
            res.forEach(report => {
                let bytes;
                //let packets;
                if (report.type === 'outbound-rtp') {
                    if (report.isRemote) {
                        return;
                    }
                    const now = report.timestamp;
                    bytes = report.bytesSent;
                    // packets = report.packetsSent;
                    if (lastResult && lastResult.has(report.id)) {
                        // calculate bitrate
                        const bitrate = 8 * (bytes - lastResult.get(report.id).bytesSent) /
                            (now - lastResult.get(report.id).timestamp);

                        // console.log(bitrate,now,now, packets - lastResult.get(report.id).packetsSent);
                        footerStats.children[1].innerText='Current Bitrate : ' + Math.round(bitrate) + 'KB/s';
                        clientStatus.usageEst += Math.round(bitrate * 2);
                        footerStats.children[2].innerText='Usage Est. : ' + Math.round(8*bytes/1000) + 'KB';
                    }
                }
            });
            lastResult = res;
        });
    }, 2000);

    const eventsChannel = peer.createDataChannel("RTCEvents");
    eventsChannel.onopen = event => {
        eventsChannel.send('Hi you!');
        console.log('sent', event);
    };
    eventsChannel.onmessage = event => {
        console.log(event.data);
        if (event.data == 'established'){
            clientStatus.connected = true;
            notifier.success('RTC connection established', {labels: {success: "RTC Connected"}});
            footerStats.children[0].innerText="RTC Connected";
        }
    }
    setTimeout( function() {
        if (clientStatus.connected == false) {
            notifier.alert('RTC Connection timeout, probably because ICE failed please refresh the page and turn off any sort of VPN or proxy', {labels: {alert: "RTC : No route"}});
        }
    },3000)
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer, clientOptions, mediaOptions);
    return peer;
}

async function handleNegotiationNeededEvent(peer, clientOptions, mediaOptions) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        clientOptions,
        mediaOptions,
        sdp: peer.localDescription
    };

    const {data} = await axios.post('/api/broadcast', payload, {timeout: 3000});
    if (data.authStatus) {
        const desc = new RTCSessionDescription(data.sdp);
        peer.setRemoteDescription(desc).catch(e => notifier.alert(e, {labels: {alert: "RTC Failed"}}));
    } else if (data.authStatus == false) {
        notifier.alert('Authorization failed, please provide valid connection token', {labels: {alert: "Cannot Authorize"}});
        startbtn.classList.remove("hidden");
        tokenInput.classList.remove('hidden');

    }
}

function loaddefaultsettings() {
    let elements = document.getElementsByTagName("select");
    tokenInput.value = 'kobs';

    for (let element of elements) {
       element.children[2].selected= true;
    }
}
loaddefaultsettings();