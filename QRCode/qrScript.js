function onScanSuccess(decodedText, decodedResult) {
    // Maneja el resultado escaneado aquí
    console.log(`Código QR escaneado: ${decodedText}`);
    document.getElementById('qr-reader-results').innerText = `Código QR escaneado: ${decodedText}`;
}

function onScanFailure(error) {
    // Opcional: Maneja el error de escaneo aquí
    console.warn(`Error de escaneo: ${error}`);
}

let html5QrCode = new Html5Qrcode("qr-reader");

const config = { fps: 10, qrbox: 250 };

// Inicia el escaneo de la cámara
Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
        let cameraId = devices[0].id;
        html5QrCode.start(
            cameraId, 
            config, 
            onScanSuccess, 
            onScanFailure
        );
    }
}).catch(err => {
    console.error(`Error al obtener cámaras: ${err}`);
});
