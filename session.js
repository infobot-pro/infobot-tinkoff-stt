const auth = require('./auth');

const EventEmitter = require('events').EventEmitter;
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = __dirname + '/stt.proto';

class RecognitionSession {
    constructor(apiKey, secretKey, streamingConfig) {
        const self = this;
        self.events = new EventEmitter;

        const packageDefinition = protoLoader.loadSync(
            PROTO_PATH,
            {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true
            });

        const stt_proto = grpc.loadPackageDefinition(packageDefinition).tinkoff.cloud.stt.v1;
        const channelCredentials = grpc.credentials.createSsl();
        const callCredentials = grpc.credentials.createFromMetadataGenerator(
            auth.jwtMetadataGenerator(apiKey, secretKey, "test_issuer", "test_subject"));
        const creds = grpc.credentials.combineChannelCredentials(channelCredentials, callCredentials);
        const client = new stt_proto.SpeechToText('stt.tinkoff.ru:443', creds);

        self._call = client.StreamingRecognize();

        self._call.on('data', function (data) {
            self._onData(data)
        });
        self._call.on('error', function (data) {
            self._onError(data)
        });


        self._call.write(streamingConfig);
    }

    _onData(data) {
        this.events.emit('data', data);
    }

    _onError(data) {
        this.events.emit('error', data);
    }

    writeChunk(chunk) {
        this._call.write({audio_content: chunk});
    }

    finishStream() {
        this._call.end();
    }

    on(event, callback) {
        this.events.on(event, callback);
    }

    once(event, callback) {
        this.events.once(event, callback);
    }
}

module.exports = RecognitionSession;