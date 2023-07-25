import express from 'express';
import fileUpload from 'express-fileupload';
import { AccessToken, ItemTrack } from './types';
import cors from 'cors';
import axios from 'axios';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
const NodeID3tag = require('node-id3tag');


// import MP3Tag from 'mp3tag.js';
// import musicmetadata from 'musicmetadata';

const PORT = process.env.PORT || 5000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(cors({
    origin: "https://music-tag.netlify.app"
}));

app.get('/test', (_, res) => {
    res.send('App running')
});

app.post('/file', async (req, res) => {
    const track = req.body.track;

    if (!req.files || Object.keys(req.files).length === 0) {
        res.json('No se subió un archivo');
    } else {

        const file: any = req.files.file;

        if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp4' || file.mimetype === 'audio/wave') {
            const claveFile = uuidv4();
            await fs.ensureDir(`${__dirname}/../uploads/`);
            await file.mv(`${__dirname}/../uploads/${claveFile}.${file.name.split('.')[1]}`, (err: any) => {
                if (err) {
                    res.json(`No se pudo subir el archivo, ${err}`);
                } else {
                    axios.post('https://accounts.spotify.com/api/token', {
                        grant_type: "client_credentials",
                        client_id: "0f77648b9a024841b07f1e2e33fb626b",
                        client_secret: "2db664c593d94af9a232b43d9b1c94f7",
                    }, {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded"
                        }
                    }).then(async (response) => {
                        const token = response.data as AccessToken;

                        await axios.get(`https://api.spotify.com/v1/tracks/${track}`, {
                            headers: {
                                Authorization: `${token.token_type} ${token.access_token}`
                            }
                        })
                        .then(response => {
                            const track = response.data as ItemTrack;
                            axios.get(`${track.album.images[0].url}`, {
                                responseType: "text",
                                responseEncoding: "base64",
                            })
                                .then(response => {
                                    fs.writeFileSync(`${__dirname}/../uploads/${claveFile}.jpg`, response.data, { encoding: "base64" });

                                    let artists = '';
                                    for (let index = 0; index < track.artists.length; index++) {
                                        const element = track.artists[index];
                                        artists += element.name;
                                        if ((index + 1) < track.artists.length) {
                                            artists += ', ';
                                        }
                                    }
        
                                    let tags = {
                                        title: track.name,
                                        artist: artists,
                                        album: track.album.name,
                                        APIC: `${__dirname}/../uploads/${claveFile}.jpg`,
                                    }
                                    NodeID3tag.create(tags);
        
                                    NodeID3tag.write(tags, `${__dirname}/../uploads/${claveFile}.${file.name.split('.')[1]}`);
                                    res.send(claveFile);
                                });
                        });

                    });


                }
            });

        } else {
            res.json('El archivo no es soportado');
        }
    }
});

app.get('/download/:id/:file', (req, res) => {
    const { id, file } = req.params;

    res.download(`${__dirname}/../uploads/${id}.${file.split('.')[1]}`);
});

app.get('/clean/:id/:file', (req, res) => {
    const { id, file } = req.params;

    fs.unlink(`${__dirname}/../uploads/${id}.${file.split('.')[1]}`);
    fs.unlink(`${__dirname}/../uploads/${id}.jpg`);
    res.send('Directotio limpiado');
});

app.listen(PORT, () => {
    console.log(`App running in port ${PORT}`);

}) 