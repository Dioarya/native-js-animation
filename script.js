

const canvas = document.getElementById("canvas");
let cols = 1;
let rows = 1;
let w = Math.max(window.screen.width / 10, window.screen.height / 10);
let h = Math.max(window.screen.width / 10, window.screen.height / 10);
let width;
let height;

let images1 = [];
let images2 = [];
let endImagePaths = ['end1.jpg', 'end2.jpg'];
let videoEnding;
let endImagePath;
console.log(getQueryVariable("o"));
if (getQueryVariable("o") == "a" || ((getQueryVariable("o") != "a" && getQueryVariable("o") != "b") && Math.random() < 0.5)) {
    endImagePath = endImagePaths[0];
    videoEnding = true;
} else if (getQueryVariable("o") == "b" || (getQueryVariable("o") != "a" && getQueryVariable("o") != "b")) {
    endImagePath = endImagePaths[1];
    videoEnding = false;
}

let animationStyles = 3;
let animationStyle = Math.floor(Math.random() * 100) % animationStyles;
animationStyle = 2;
let animationStartTime = 2;
let backgroundImage;
let backgroundVideo;
let audio, sound, film, movie;
let pieces;
let resizing = true;
let framecount = 0;

let t;
let animationTime = 0.25;
let holdTime = 1;
let totalAnimationTime = animationTime + holdTime;
let holdRatio = holdTime / totalAnimationTime;


/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

async function main() {

    await setup();
    window.onresize = handleResize;
    handleResize();
    setInterval(() => {
        draw();
    }, 1000 * 1 / 60);
}

function draw() {
    if (resizing) return;

    audio.audioPlay = (getTime() - animationStartTime) / totalAnimationTime > 1 / 2 + holdRatio / 2;
    sound.soundPlay = (getTime() - animationStartTime) / totalAnimationTime > 1 / 2 + holdRatio / 2 - 0.1;
    film.filmPlay = (getTime() - animationStartTime) / totalAnimationTime > 1 / 2 + holdRatio / 2;

    if (videoEnding && film.filmPlay && !film.filmPlayed) {
        if (!film.ended) {
            film.play();
            film.filmPlayed = true;
        }
    }
    if (movie.moviePlay) {
        movie.play();
    }
    if (audio.audioPlay && !audio.audioPlayed) {
        if (!audio.ended) {
            audio.play();
            audio.audioPlayed = true;
        }
    }
    if (sound.soundPlay && !sound.soundPlayed && videoEnding) {
        if (!sound.ended) {
            sound.play();
            sound.soundPlayed = true;
        }
    }
    if (backgroundVideo.videoPlay && !backgroundVideo.videoPlayed) {
        if (!backgroundVideo.ended) {
            backgroundVideo.play()
            ctx.drawImage(backgroundVideo, 0, 0, width, height);
        }
    } else ctx.drawImage(backgroundImage, 0, 0, width, height);
    for (let piece of pieces) piece.show();

}

async function setup() {

    await loadVideo('film.mp4').then(flm => {
        flm.filmPlay = false;
        if (film) { flm.filmPlayed = film.filmPlayed } else { flm.filmPlayed = false; }
        flm.onended = () => { flm.filmPlayed = true; movie.moviePlay = true; }
        film = flm;
    })

    await loadVideo('movie.mp4').then(mov => {
        if (movie) { mov.moviePlay = movie.moviePlay; } else { mov.moviePlay = false; }
        // mov.onended = () => {
        //     mov.moviePlay = false;
        // }
        movie = mov;
    })

    await loadVideo('video.mp4').then(vid => {
        vid.videoPlay = false;
        vid.videoPlayed = false;
        vid.onended = () => { vid.videoPlayed = true; }
        backgroundVideo = vid;
    })

    await loadAudio('audio.mp3').then(aud => {
        aud.audioPlay = false;
        if (audio) { aud.audioPlayed = audio.audioPlayed } else { aud.audioPlayed = false; }
        aud.onended = () => { aud.audioPlayed = true; }
        audio = aud;
    })

    await loadAudio('sound.mp3').then(snd => {
        snd.soundPlay = false;
        if (sound) { snd.soundPlayed = sound.soundPlayed } else { snd.soundPlayed = false; }
        snd.onended = () => { snd.soundPlayed = true; }
        sound = snd;
    })

}

async function handleResize() {
    resizing = true;

    width = window.innerWidth;
    height = window.innerHeight;
    cols = Math.round(width / w);
    rows = Math.round(height / h);

    tw = (width / cols);
    th = (height / rows);

    images1 = create2DArray(cols, rows);
    await loadImage('start.jpg').then(async image => {
        await resizeImage(image, width, height).then(async image => {
            for (let j = 0; j < rows; j++) {
                for (let i = 0; i < cols; i++) {
                    images1[j][i] = { source: image, x: i, y: j, resized: true };
                }
            }
        });
    });
    images2 = create2DArray(cols, rows);
    if (!videoEnding) await loadImage(endImagePath).then(async image => {
        await resizeImage(image, width, height).then(async image => {
            for (let j = 0; j < rows; j++) {
                for (let i = 0; i < cols; i++) {
                    images2[j][i] = { source: image, x: i, y: j, resized: true };
                }
            }
        });
    });


    if (videoEnding) {
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                images2[j][i] = async () => {
                    let source = film;
                    if (movie.moviePlay) {
                        source = movie;
                    }
                    source.width = 1920
                    source.height = 1080
                    return { source: source, x: i, y: j, resized: false };
                }

            }
        }
    }

    pieces = []
    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
            const image1 = images1[j][i];
            const image2 = images2[j][i];
            const x = i * tw;
            const y = j * th;
            pieces.push(new Piece(image1, image2, x, y));
        }
    }

    if (framecount == 0) {
        t = Date.now();
        await loadImage('background.jpg').then(async (image) => {
            backgroundImage = image;
        });
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    firstResizing = true;
    resizing = false;
    framecount++;
}

class Piece {
    constructor(image1, image2, x, y) {
        this.image1 = image1;
        this.image2 = image2;
        this.x = x;
        this.y = y;
        this.w = width / cols;
        this.h = height / rows;
    }
    async drawImage(image, t) {
        let newImage = image;
        if (image instanceof Function) newImage = await image();

        if (t === undefined) {
            ctx.drawImage(newImage.source, newImage.x * newImage.source.width / cols, newImage.y * newImage.source.height / rows, newImage.source.width / cols, newImage.source.height / rows, this.x, this.y, this.w, this.h);
            return;
        }

        switch (animationStyle) {
            case 0:
                ctx.translate(this.x, this.y);
                ctx.transform(1, t, t, 1, -t * this.w / 2, -t * this.h / 2);
                ctx.drawImage(newImage.source, newImage.x * newImage.source.width / cols, newImage.y * newImage.source.height / rows, newImage.source.width / cols, newImage.source.height / rows, 0, 0, this.w, this.h);
                ctx.resetTransform();
                break;

            case 1:
                ctx.drawImage(newImage.source, newImage.x * newImage.source.width / cols, newImage.y * newImage.source.height / rows, newImage.source.width / cols, newImage.source.height / rows, this.x + t * this.w / 2, this.y + t * this.h / 2, (1 - t) * this.w, (1 - t) * this.h);
                break;

            case 2:
                ctx.globalAlpha = (1 - t) * (1 - t);
                ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
                ctx.scale(1 - t, 1 - t)
                ctx.rotate(2 * Math.PI * t);
                ctx.drawImage(newImage.source, newImage.x * newImage.source.width / cols, newImage.y * newImage.source.height / rows, newImage.source.width / cols, newImage.source.height / rows, -this.w / 2, -this.h / 2, this.w, this.h);
                ctx.resetTransform();
                ctx.globalAlpha = 1;
                break;

            default:
                break;
        }
    }
    show() {
        let offset = Math.hypot(this.x + this.w / 2 - width / 2, this.y + this.h / 2 - height / 2) / (Math.max(width, height) / 1);
        switch (animationStyle) {
            case 0:
            case 1:
            case 2:
                if (getTime() < animationStartTime + offset) this.drawImage(this.image1);
                else if (getTime() > animationStartTime + offset + totalAnimationTime) this.drawImage(this.image2);
                else {
                    let rel_t = (getTime() - animationStartTime - offset) / totalAnimationTime;
                    if (rel_t < 1 / 2 - holdRatio / 2) { this.drawImage(this.image1, remap(rel_t, 0, 1 / 2 - holdRatio / 2, 0, 1)); }
                    else if (rel_t > 1 / 2 + holdRatio / 2) { this.drawImage(this.image2, 1 - remap(rel_t, 1 / 2 + holdRatio / 2, 1, 0, 1)); }
                    else backgroundVideo.videoPlay = true;
                }
                break;

            default:
                break;
        }
    }
}

async function resizeImage(image, w, h) {
    let newcanvas = document.createElement("canvas");
    newcanvas.width = w;
    newcanvas.height = h;
    newcanvas.getContext("2d").drawImage(image, 0, 0, w, h);
    return loadImage(newcanvas.toDataURL());
}


async function cutImage(image, x, y, w, h) {
    let newcanvas = document.createElement('canvas');
    newcanvas.width = w;
    newcanvas.height = h;
    newcanvas.getContext('2d').drawImage(image, x, y, w, h, 0, 0, w, h);
    return loadImage(newcanvas.toDataURL());
}

const loadImage = async src => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
});

const loadVideo = async src => new Promise((resolve, reject) => {
    const vid = document.createElement("video");
    vid.onloadedmetadata = () => resolve(vid);
    vid.onerror = reject;
    vid.src = src;
});

const loadAudio = async src => new Promise((resolve, reject) => {
    const aud = document.createElement("audio");
    aud.onloadedmetadata = () => resolve(aud);
    aud.onerror = reject;
    aud.src = src;
});


function create2DArray(cols, rows) {
    let array = [];
    for (let j = 0; j < rows; j++) {
        array.push([]);
        for (let i = 0; i < cols; i++) {
            array[j].push(undefined);
        }
    }
    return array;
}

function getTime() {
    return (Date.now() - t) / 1000;
}

function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}

function inverse_lerp(a, b, v) {
    return (v - a) / (b - a);
}

function remap(v, a, b, c, d) {
    return lerp(c, d, inverse_lerp(a, b, v));
}

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    return undefined;
    // console.log('Query variable %s not found', variable);
}