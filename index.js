const fs = require('fs');
const RS = require('./session');

class InfobotTinkoffSTT {
    static get FORMAT_OPUS() {
        return 'OGG_OPUS';
    }

    static get FORMAT_LINEAR_16() {
        return 'LINEAR16';
    }

    static get FORMAT_MULAW() {
        return 'MULAW';
    }

    static get FORMAT_ALAW() {
        return 'ALAW';
    }

    static get FORMAT_RAW_OPUS() {
        return 'RAW_OPUS';
    }

    static get FORMAT_MPEG_AUDIO() {
        return 'MPEG_AUDIO';
    }

    constructor(apiKey, secretKey) {
        this.apiKey = apiKey;
        this.secretKey = secretKey;

        if (!this.apiKey) throw new Error('No API key provided');
        if (!this.secretKey) throw new Error('No Secret Key provided');
    }

    startRecognitionSession(streaming_config = {}, interim_results_config = {}, single_utterance = false) {
        const self = this;
        return new Promise((resolve, reject) => {
            streaming_config.language_code = streaming_config.language_code || 'ru-RU';
            streaming_config.sample_rate_hertz = streaming_config.sample_rate_hertz || 8000;
            streaming_config.encoding = streaming_config.encoding || InfobotTinkoffSTT.FORMAT_LINEAR_16;
            streaming_config.num_channels = streaming_config.num_channels || 1;
            streaming_config.max_alternatives = streaming_config.max_alternatives || 5;
            streaming_config.profanity_filter = streaming_config.profanity_filter || false;
            streaming_config.enable_automatic_punctuation = streaming_config.enable_automatic_punctuation || true;
            streaming_config.speech_context = streaming_config.speech_context || null;
            streaming_config.model = streaming_config.model || null;

            interim_results_config.enable_interim_results = interim_results_config.enable_interim_results || true;
            interim_results_config.interval = interim_results_config.interval || 2;

            resolve(new RS(self.apiKey, self.secretKey,
                {
                    streaming_config: {
                        config: streaming_config,
                        interim_results_config: interim_results_config,
                        single_utterance: single_utterance
                    }
                }));
        });
    }

    recognizeFile(path, streaming_config = {}, interim_results_config = {}, single_utterance = false) {
        const self = this;
        return new Promise((resolve, reject) => {
            if (fs.existsSync(path)) {
                self.startRecognitionSession(streaming_config, interim_results_config = {}, single_utterance = false).then((recSess) => {
                    const Writable = require('stream').Writable;
                    const ws = Writable();
                    ws._write = function (chunk, enc, next) {
                        recSess.writeChunk(chunk);
                        next();
                    };

                    const readStream = fs.createReadStream(path);
                    readStream.pipe(ws);

                    readStream.on("end", function () {
                        recSess.finishStream();
                    });

                    recSess.on('data', function (data) {
                        if (data && data.results && data.results[0].is_final) {
                            resolve(data.results[0].recognition_result);
                        }
                    });

                    recSess.on('error', function (data) {
                        reject(data);
                    });
                }).catch((err) => {
                    reject(err);
                });
            } else {
                throw new Error(`File not found ${path}`);
            }
        });
    }
}

module.exports = InfobotTinkoffSTT;