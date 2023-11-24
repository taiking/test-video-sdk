require('dotenv').config()
const KJUR = require('jsrsasign')
const path = require('path')

const express = require('express')
const app = express()
const port = 3000

app.set("view engine", "ejs");
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get("/", function (req, res) {
  const signature = generateSignature("zoom topic name 345", 1)
  res.render("./index.ejs", { signature: signature });
});

app.post("/signature", function (req, res) {
  const sessionName = req.body.sessionName
  const isHost = req.body.isHost ? 1 : 0;
  console.log(isHost)
  const signature = generateSignature(sessionName, isHost)
  res.json({ signature: signature })
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

function generateSignature(sessionName, role) {

  const iat = Math.round(new Date().getTime() / 1000) - 30
  const exp = iat + 60 * 60 * 2
  const oHeader = { alg: 'HS256', typ: 'JWT' }

  const oPayload = {
    app_key: process.env.ZOOM_SDK_KEY,
    tpc: sessionName,
    role_type: role,
    version: 1,
    iat: iat,
    exp: exp
  }

  const sHeader = JSON.stringify(oHeader)
  const sPayload = JSON.stringify(oPayload)
  const sdkJWT = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.ZOOM_SDK_SECRET)
  return sdkJWT
}