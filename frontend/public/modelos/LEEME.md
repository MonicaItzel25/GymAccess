# Modelos faciales preentrenados de face-api.js

Colocar aquí los archivos de pesos descargados del repositorio de `face-api.js`
(`justadudewhohacks/face-api.js/tree/master/weights`, rama `master`):

- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`

Son aproximadamente 6 MB y se descargan **solo una vez**. El frontend los sirve
estáticamente y `CapturaRostro.jsx` los carga en el navegador. Ver
`specs/002-sprint-2-membresias-pagos-reconocimiento-acceso/quickstart.md`.

> Estos binarios de pesos no se versionan en este repositorio; el `.gitignore`
> los excluye salvo este archivo de instrucciones.
