const video = document.getElementById('inputVideo');
const canvas = document.getElementById('overlay');

(async () => {
    // Iniciar la cámara
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;

    // Cargar modelos de detección facial
    const MODEL_URL = '/public/models';
    await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
    await faceapi.loadFaceLandmarkModel(MODEL_URL);
    await faceapi.loadFaceRecognitionModel(MODEL_URL);
    await faceapi.loadFaceExpressionModel(MODEL_URL);

    // Cargar imágenes etiquetadas para reconocimiento
    const labeledFaceDescriptors = await loadLabeledImages();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

    // Iniciar detección en video
    onPlay();
})();

// Función para cargar imágenes etiquetadas de cada persona
async function loadLabeledImages() {
    const labels = ['Persona1', 'Persona2']; // Nombres de personas
    return Promise.all(
        labels.map(async (label) => {
            const descriptions = [];
            for (let i = 1; i <= 3; i++) { // Usa 3 imágenes por persona
                const img = await faceapi.fetchImage(`/Nucleo/labeled_images/${label}/${i}.jpg`);
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                descriptions.push(detections.descriptor);
            }
            return new faceapi.LabeledFaceDescriptors(label, descriptions);
        })
    );
}

// Función principal de detección en tiempo real
async function onPlay() {
    if (video.paused || video.ended) return setTimeout(() => onPlay());

    const fullFaceDescriptions = await faceapi.detectAllFaces(video)
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
        if (bestMatch.label === 'Persona1') {
            console.log('Acción para Persona1');
        } else if (bestMatch.label === 'Persona2') {
            console.log('Acción para Persona2');
        } else {
            console.log('Persona desconocida');
        }
    });

    requestAnimationFrame(onPlay);
}
