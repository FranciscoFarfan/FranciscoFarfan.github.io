const video = document.getElementById('inputVideo');
const canvas = document.getElementById('overlay');

// Definir faceMatcher en un ámbito global
let faceMatcher;
console.log('Version 2');
 let contador;
(async () => {
    try {
        // Iniciar la cámara
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
        console.log('Camara iniciada');

        // Cargar modelos de detección facial
        const MODEL_URL = './models';
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);

        console.log('Modelos cargados exitosamente');

        // Cargar imágenes etiquetadas para reconocimiento
        const labeledFaceDescriptors = await loadLabeledImages();
        faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

        console.log('FaceMatcher inicializado');

        // Iniciar detección en tiempo real con un intervalo
        video.addEventListener('loadedmetadata', () => {
            if (faceMatcher) {
                console.log('Iniciando detección en tiempo real...');
                setInterval(onPlay, 1000); // Ejecutar onPlay cada 1000ms (1 segundo)
            }
        });
    } catch (error) {
        console.error('Error durante la inicialización:', error);
    }
})();

// Función para cargar imágenes etiquetadas de cada persona
async function loadLabeledImages() {
    const labels = ['Andrea', 'Yo']; // Nombres de personas
    return Promise.all(
        labels.map(async (label) => {
            const descriptions = [];
            for (let i = 1; i <= 3; i++) { // Usa 3 imágenes por persona
                const img = await faceapi.fetchImage(`/Nucleo/labeled_images/${label}/${i}.jpg`);
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                if (!detections) {
                    throw new Error(`No se detectó ningún rostro en la imagen: ${label}/${i}.jpg`);
                }
                console.log('persona ${label}/${i} detectada correctamente ');
                descriptions.push(detections.descriptor);
            }
            
            return new faceapi.LabeledFaceDescriptors(label, descriptions);
        })
    );
}

// Función principal de detección en tiempo real
async function onPlay() {
    console.log('Ejecucion'+ contador);
    contador++;
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

    // Limpia el canvas y dibuja las detecciones
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedResults);
    faceapi.draw.drawFaceLandmarks(canvas, resizedResults);
    faceapi.draw.drawFaceExpressions(canvas, resizedResults, 0.05);

    // Identificar personas y ejecutar acciones específicas
    resizedResults.forEach((result) => {
        const bestMatch = faceMatcher.findBestMatch(result.descriptor);
        const box = result.detection.box;
        const text = bestMatch.toString();

        // Dibuja el nombre en el canvas
        const drawBox = new faceapi.draw.DrawBox(box, { label: text });
        drawBox.draw(canvas);

        // Acciones según la persona identificada
        if (bestMatch.label === 'Andrea') {
            console.log('Acción para Andrea');
        } else if (bestMatch.label === 'Yo') {
            console.log('Acción para mí');
        } else {
            console.log('Persona desconocida');
        }
    });
}
