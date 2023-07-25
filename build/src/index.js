"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const cors_1 = __importDefault(require("cors"));
const axios_1 = __importDefault(require("axios"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const uuid_1 = require("uuid");
const NodeID3tag = require('node-id3tag');
// import MP3Tag from 'mp3tag.js';
// import musicmetadata from 'musicmetadata';
const PORT = process.env.PORT || 5000;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, express_fileupload_1.default)());
app.use((0, cors_1.default)({
    origin: "http://localhost:3000"
}));
app.get('/test', (_, res) => {
    res.send('App running');
});
app.post('/file', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const track = req.body.track;
    if (!req.files || Object.keys(req.files).length === 0) {
        res.json('No se subió un archivo');
    }
    else {
        const file = req.files.file;
        if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp4' || file.mimetype === 'audio/wave') {
            const claveFile = (0, uuid_1.v4)();
            yield fs_extra_1.default.ensureDir(`${__dirname}/../uploads/`);
            yield file.mv(`${__dirname}/../uploads/${claveFile}.${file.name.split('.')[1]}`, (err) => {
                if (err) {
                    res.json(`No se pudo subir el archivo, ${err}`);
                }
                else {
                    axios_1.default.post('https://accounts.spotify.com/api/token', {
                        grant_type: "client_credentials",
                        client_id: "0f77648b9a024841b07f1e2e33fb626b",
                        client_secret: "2db664c593d94af9a232b43d9b1c94f7",
                    }, {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded"
                        }
                    }).then((response) => __awaiter(void 0, void 0, void 0, function* () {
                        const token = response.data;
                        yield axios_1.default.get(`https://api.spotify.com/v1/tracks/${track}`, {
                            headers: {
                                Authorization: `${token.token_type} ${token.access_token}`
                            }
                        })
                            .then(response => {
                            const track = response.data;
                            axios_1.default.get(`${track.album.images[0].url}`, {
                                responseType: "text",
                                responseEncoding: "base64",
                            })
                                .then(response => {
                                fs_extra_1.default.writeFileSync(`${__dirname}/../uploads/${claveFile}.jpg`, response.data, { encoding: "base64" });
                                let tags = {
                                    title: track.name,
                                    artist: track.artists[0].name,
                                    album: track.album.name,
                                    APIC: `${__dirname}/../uploads/${claveFile}.jpg`,
                                };
                                NodeID3tag.create(tags);
                                NodeID3tag.write(tags, `${__dirname}/../uploads/${claveFile}.${file.name.split('.')[1]}`);
                                res.send(claveFile);
                            });
                        });
                    }));
                }
            });
        }
        else {
            res.json('El archivo no es soportado');
        }
    }
}));
app.get('/download/:id/:file', (req, res) => {
    const { id, file } = req.params;
    res.download(`${__dirname}/../uploads/${id}.${file.split('.')[1]}`);
});
app.get('/clean/:id/:file', (req, res) => {
    const { id, file } = req.params;
    fs_extra_1.default.unlink(`${__dirname}/../uploads/${id}.${file.split('.')[1]}`);
    fs_extra_1.default.unlink(`${__dirname}/../uploads/${id}.jpg`);
    res.send('Directotio limpiado');
});
app.listen(PORT, () => {
    console.log(`App running in port ${PORT}`);
});
