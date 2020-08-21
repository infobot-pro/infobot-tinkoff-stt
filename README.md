# infobot-tinkoff-stt
Node.JS library for [Tinkoff VoiceKit](https://voicekit.tinkoff.ru/) service.
Library can work in stream mode or recognize stored audio file.

Based on examples for Node.JS from https://github.com/TinkoffCreditSystems/voicekit-examples/tree/master/nodejs

To work with this library you need to obtain from Tinkoff VoiceKit support:
* API key
* Secret key

## Audio file recognition example:
```javascript
const STT = require('infobot-tinkoff-stt');

const api_key = API_KEY ;
const secret_key = SECRET_KEY;

const stt = new STT(api_key, secret_key);
stt.recognizeFile('test.wav', {
    encoding: STT.FORMAT_LINEAR_16,
    sample_rate_hertz: 16000}).then(res => {
    console.log(JSON.stringify(res));
});
````

Provided by [INFOBOT LLC.](https://infobot.pro) under ISC license.

