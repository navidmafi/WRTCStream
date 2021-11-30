const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const webrtc = require("wrtc");
const {json} = require("body-parser");
const allowedClients = ["kobs", "choobs"]
let senderStream;
let mediaOptions;
let clientOptions;
let isBroadcasting = false;
app.use('/assets', express.static('assets'))
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

app.get('/rcvr', function(req, res) {
    res.sendFile(path.join(__dirname, '/views/receiver.html'));
});
app.get('/vbrod', function(req, res) {
    res.sendFile(path.join(__dirname, '/views/videobroadcaster.html'));
});
app.get('/fbrod', function(req, res) {
    res.sendFile(path.join(__dirname, '/views/filebroadcaster.html'));
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post("/api/consumer", async ({body}, res) => {
    outputLog('debug', "requested broadcast. isBroadcasting : " + isBroadcasting)
    if (isBroadcasting) {
        const peer = new webrtc.RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.easyvoip.com:3478"
                }
            ]
        });
        const desc = new webrtc.RTCSessionDescription(setBandwidth(body.sdp, mediaOptions));
        await peer.setRemoteDescription(desc);
        senderStream.getTracks().forEach(track => peer.addTrack(track, senderStream));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const payload = {
            mediaOptions,
            isBroadcasting,
            sdp: peer.localDescription
        }
        res.json(payload);
    } else {
        const payload = {
            isBroadcasting,
        }
        res.json(payload);
    }


});

app.post('/api/broadcast', async ({body}, res) => {
    mediaOptions = body.mediaOptions;
    clientOptions = body.clientOptions;
    if (allowedClients.includes(clientOptions.token)) {
        outputLog('AUTH', 'Auth succeeded')
        const peer = new webrtc.RTCPeerConnection({
            iceServers: [
                {urls: "stun:stun1.l.google.com:19302"},
                {urls: "stun:stun2.l.google.com:19302"},
                {urls: "stun:stun3.l.google.com:19302"},
                {urls: "stun:stun.nextcloud.com:443"}
            ]
        });

        peer.ontrack = (e) => handleTrackEvent(e, peer);

        peer.ondatachannel = function (event) {
            const channel = event.channel;
            channel.onopen = function (event) {
                channel.send('established');
                outputLog('events',JSON.stringify(event) + ' on ' + JSON.stringify(channel));
            }
            channel.onmessage = function (event) {
                outputLog('events',JSON.stringify(event) + ' on ' + JSON.stringify(channel));
            }
        }
        const desc = new webrtc.RTCSessionDescription(setBandwidth(body.sdp, mediaOptions));
        await peer.setRemoteDescription(desc);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const payload = {
            authStatus: true,
            sdp: peer.localDescription
        }

        res.json(payload);
    } else {
        outputLog('AUTH', 'Auth failed with token : ' + clientOptions.token)
        const payload = {
            authStatus: false
        }

        res.json(payload);
    }
});

function handleTrackEvent(e, peer) {

    senderStream = e.streams[0];
    outputLog('status', 'Set senderStream OK')
    isBroadcasting = true;
}


function setBandwidth(sdp, mediaOptions) {
    // console.log(sdp);
    // let bandwidth = mediaOptions.videoOptions.videoBitrate;
    // let modifier = 'AS';
    // if (sdp.sdp.indexOf('b=' + modifier + ':') === -1) {
    //     // insert b= after c= line.
    //     sdp.sdp = sdp.sdp.replace(/c=IN (.*)\r\n/, 'c=IN $1\r\nb=' + modifier + ':' + bandwidth + '\r\n');
    // } else {
    //     sdp.sdp = sdp.sdp.replace(new RegExp('b=' + modifier + ':.*\r\n'), 'b=' + modifier + ':' + bandwidth + '\r\n');
    // }
    // return sdp;
    outputLog('debug', 'audioBitrate : ' + mediaOptions.audioOptions.audioBitrate)
    sdp.sdp = sdp.sdp.replace(/a=mid:0\r\n/g, 'a=mid:0\r\nb=AS:' + mediaOptions.videoOptions.videoBitrate + '\r\n');
    sdp.sdp = sdp.sdp.replace(/a=mid:1\r\n/g, 'a=mid:1\r\nb=AS:' + mediaOptions.audioOptions.audioBitrate + '\r\n');
    return sdp;

}

function outputLog(type, text) {
    let time = new Date();
    let ftext = time.toLocaleTimeString() + ' [' + type.toUpperCase() + '] : ' + text;
    console.log(ftext);
}

// function handleDisconnection() {
//     isBroadcasting = false;
// }

app.listen(5000, () => outputLog('status', 'Server Startup'));