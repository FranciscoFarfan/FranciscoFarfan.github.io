const video = document.getElementById('inputVideo');
const canvas = document.getElementById('overlay');
let faceMatcher;
let contador = 0;
let detectionInterval;

console.log('Versión 7');

(async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
        console.log('Cámara iniciada');

        const MODEL_URL = './models';
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);

        console.log('Modelos cargados exitosamente');

        const labeledFaceDescriptors = await loadLabeledImages();
        faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

        console.log('FaceMatcher inicializado');

        if (faceMatcher) {
            console.log('Iniciando detección en tiempo real...');
            detectionInterval = setInterval(onPlay, 1000);
        }
    } catch (error) {
        console.error('Error durante la inicialización:', error);
    }
})();

async function loadLabeledImages() {
    const labels = ['Farfan', 'Victor'];
    return Promise.all(
        labels.map(async (label) => {
            const descriptions = [];
            for (let i = 1; i <= 3; i++) {
                let img;
                try {
                    img = await faceapi.fetchImage(`/Ingenieria2/labeled_images/${label}/${i}.jpg`);
                } catch (e1) {
                    try {
                        img = await faceapi.fetchImage(`/Ingenieria2/labeled_images/${label}/${i}.jfif`);
                    } catch (e2) {
                        throw new Error(`No se pudo cargar la imagen: ${label}/${i} en formatos .jpg o .jfif`);
                    }
                }

                const detections = await faceapi
                    .detectSingleFace(img)
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (!detections) {
                    throw new Error(`No se detectó ningún rostro en la imagen: ${label}/${i}`);
                }

                console.log(`Persona detectada correctamente: ${label}/${i}`);
                descriptions.push(detections.descriptor);
            }
            return new faceapi.LabeledFaceDescriptors(label, descriptions);
        })
    );
}

async function onPlay() {
    console.log('Ejecución :' + contador);
    contador++;

    if (contador >= 20) {
        clearInterval(detectionInterval);
        document.getElementById('mensaje').textContent = 'Ninguna coincidencia, acceso no concedido';
        console.warn('Se alcanzó el límite de intentos. Detección detenida.');
        return;
    }

    if (!faceMatcher) {
        console.warn('FaceMatcher aún no está inicializado.');
        return;
    }

    if (video.paused || video.ended) {
        console.warn('El video no está activo.');
        return;
    }

    const fullFaceDescriptions = await faceapi
        .detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions();

    const dims = faceapi.matchDimensions(canvas, video, true);
    const resizedResults = faceapi.resizeResults(fullFaceDescriptions, dims);

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedResults);
    faceapi.draw.drawFaceLandmarks(canvas, resizedResults);
    faceapi.draw.drawFaceExpressions(canvas, resizedResults, 0.05);

    let coincidenciaDetectada = false;

    resizedResults.forEach((result) => {
        const bestMatch = faceMatcher.findBestMatch(result.descriptor);
        const box = result.detection.box;
        const text = bestMatch.toString();

        const drawBox = new faceapi.draw.DrawBox(box, { label: text });
        drawBox.draw(canvas);

        if (bestMatch.distance <= 0.4 && bestMatch.label !== 'unknown') {
            coincidenciaDetectada = true;
            document.getElementById('mensaje').textContent = `Acceso concedido a ${bestMatch.label}`;
            clearInterval(detectionInterval);
            window.location.href = 'https://franciscofarfan.github.io/Catalogo.html';
        }
    });

    if (!coincidenciaDetectada) {
        document.getElementById('mensaje').textContent = 'Colócate frente a la cámara para pasar el control de acceso';
    }
}