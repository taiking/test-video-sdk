const ZoomVideo = window.WebVideoSDK.default
const client = ZoomVideo.createClient()

let stream
let showUserIndex = -1;

client.init('en-US', 'CDN').then(() => {
}).catch((error) => {
    console.log(error)
})

function getSigunature(sessionName, isHost) {
    let xhr = new XMLHttpRequest()
    xhr.open('POST', '/signature', true)
    xhr.setRequestHeader('content-type', 'application/json')
    xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
            const signature = JSON.parse(xhr.response).signature
            onJoin(signature, sessionName)
        }
    }
    const body = {}
    body["sessionName"] = sessionName
    body["isHost"] = isHost
    xhr.send(JSON.stringify(body))
}

function onJoin(signature, sessionName) {
    client.join(sessionName, signature, "chocovayashi").then(() => {

        document.getElementById("list-container").style.display = 'none'
        document.getElementById("joined-container").style.display = 'block'

        stream = client.getMediaStream()
        renderMyVideo(function () {
            const firstUser = client.getAllUser().filter((e) => e.userId !== client.getCurrentUserInfo().userId)[0]
            if (firstUser) {
                showUserIndex = 0
                stream.renderVideo(document.querySelector('#participant-video'), firstUser.userId, 640, 360, 0, 0, 2)
            }

            client.on('peer-video-state-change', (payload) => {
                if (payload.action === 'Start' && showUserIndex == -1) {
                    showUserIndex = 0
                    stream.renderVideo(document.querySelector('#participant-video'), payload.userId, 640, 360, 0, 0, 2)
                }
            })
            stream.startAudio()
        })
    }).catch((error) => {
        console.log(error)
    })
}

function onLeave() {
    if (client.isHost()) {
        client.leave(true)
    } else {
        client.leave()
    }
    document.getElementById("list-container").style.display = 'block'
    document.getElementById("joined-container").style.display = 'none'
}

function nextVideo() {
    const participants = client.getAllUser().filter((e) => e.userId !== client.getCurrentUserInfo().userId);
    if (showUserIndex >= participants.length - 1) {
        return;
    }
    stream.stopRenderVideo(document.querySelector('#participant-video'), participants[showUserIndex].userId)
    showUserIndex = showUserIndex + 1
    stream.renderVideo(document.querySelector('#participant-video'), participants[showUserIndex].userId, 640, 360, 0, 0, 2)
}

function previousVideo() {
    if (showUserIndex <= 0) {
        return;
    }
    const participants = client.getAllUser().filter((e) => e.userId !== client.getCurrentUserInfo().userId);
    stream.stopRenderVideo(document.querySelector('#participant-video'), participants[showUserIndex].userId)
    showUserIndex = showUserIndex - 1
    stream.renderVideo(document.querySelector('#participant-video'), participants[showUserIndex].userId, 640, 360, 0, 0, 2)
}

function renderMyVideo(handler) {
    if (stream.isRenderSelfViewWithVideoElement()) {
        stream.startVideo({ videoElement: document.querySelector('#my-video') }).then(() => {
            document.querySelector('#my-video').style.display = 'block'
            handler()
        }).catch((error) => {
            console.log(error)
        })
    } else {
        stream.startVideo().then(() => {
            stream.renderVideo(document.querySelector('#my-video'), client.getCurrentUserInfo().userId, 1920, 1080, 0, 0, 2).then(() => {
                document.querySelector('#my-video').style.display = 'block'
            }).catch((error) => {
                console.log(error)
            })
        }).catch((error) => {
            console.log(error)
        })
    }
}