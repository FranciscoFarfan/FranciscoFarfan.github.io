const video = document.getElementById('inputVideo');
const canvas = document.getElementById('overlay');

// Definir faceMatcher en un ámbito global
let faceMatcher;
let contador = 0;

console.log('Version 6');

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
        if (faceMatcher) {
            console.log('Iniciando detección en tiempo real...');
            setInterval(onPlay, 1000); // Ejecutar onPlay cada 1000ms (1 segundo)
        }
    } catch (error) {
        console.error('Error durante la inicialización:', error);
    }
})();

// Función para cargar imágenes etiquetadas de cada persona
async function loadLabeledImages() {
    const labels = ['Andrea', 'Farfan','Cesar','Max','Rodrigo','Daniel']; // Nombres de personas
    return Promise.all(
        labels.map(async (label) => {
            const descriptions = [];
            for (let i = 1; i <= 3; i++) { // Usa 3 imágenes por persona
                let img;
                try {
                    // Intenta cargar la imagen en formato .jpg
                    img = await faceapi.fetchImage(`/Nucleo/labeled_images/${label}/${i}.jpg`);
                } catch (e1) {
                    try {
                        // Si falla, intenta cargar la imagen en formato .jfif
                        img = await faceapi.fetchImage(`/Nucleo/labeled_images/${label}/${i}.jfif`);
                    } catch (e2) {
                        throw new Error(`No se pudo cargar la imagen: ${label}/${i} en formatos .jpg o .jfif`);
                    }
                }
                
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
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


// Función principal de detección en tiempo real
async function onPlay() {
    console.log('Ejecución :' + contador);
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
            document.getElementById('mensaje').textContent = 'Bienvenida Andrea';
        } else if (bestMatch.label === 'Farfan') {
            document.getElementById('mensaje').textContent = 'Bienvenido Farfan';
        } else if (bestMatch.label === 'Daniel') {
            document.getElementById('mensaje').textContent = 'Bienvenido Daniel';
        } else if (bestMatch.label === 'Rodrigo') {
            document.getElementById('mensaje').textContent = 'Bienvenido Rodrigo';
        } else if (bestMatch.label === 'Max') {
            document.getElementById('mensaje').textContent = 'Bienvenido Max';
        } else if (bestMatch.label === 'Cesar') {
            document.getElementById('mensaje').textContent = 'Bienvenido Cesar';
        } else{
            document.getElementById('mensaje').textContent = 'Colocate frente a la camara para pasar el control de acceso';
        }
        
    });
}
