const debounce = (callback, wait) => {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
};

const displayElement = document.getElementById('alpha-display');
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const landmarkContainer = document.getElementsByClassName(
  'landmark-grid-container'
)[0];
const canvasCtx = canvasElement.getContext('2d');

const grid = new LandmarkGrid(landmarkContainer, {
  connectionColor: 0xcccccc,
  definedColors: [
    { name: 'Left', value: 0xffa500 },
    { name: 'Right', value: 0x00ffff },
  ],
  range: 0.2,
  fitToGrid: false,

  landmarkSize: 2,
  numCellsPerAxis: 8,
  showHidden: false,
  centered: true,
});

const debouncedFetch = debounce((arr) => {
  fetch(`http://127.0.0.1:5000/`, {
    method: 'POST',
    body: JSON.stringify(arr),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((res) => res.json())
    .then((data) => (displayElement.innerHTML = data.result))
    .catch((e) => console.log(e.message));
}, 0);

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  paintGrid(results);
  const landmarks = results.multiHandLandmarks[0];

  if (landmarks && landmarks.length) {
    const arr = [];
    landmarks.forEach((landmark) => {
      arr.push(landmark.x, landmark.y, landmark.z);
    });
    debouncedFetch(arr);
  } else {
    displayElement.innerHTML = '';
  }

  drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
    color: '#00FF00',
    lineWidth: 5,
  });
  drawLandmarks(canvasCtx, landmarks, {
    color: '#FF0000',
    lineWidth: 2,
  });

  canvasCtx.restore();
}

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  },
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  staticImageMode: true,
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 1280,
  height: 720,
});
camera.start();

function paintGrid(results) {
  if (results.multiHandWorldLandmarks) {
    const landmarks = results.multiHandWorldLandmarks.reduce(
      (prev, current) => [...prev, ...current],
      []
    );

    const colors = [];
    let connections = [];
    for (let loop = 0; loop < results.multiHandWorldLandmarks.length; ++loop) {
      const offset = loop * HAND_CONNECTIONS.length;
      const offsetConnections = HAND_CONNECTIONS.map((connection) => [
        connection[0] + offset,
        connection[1] + offset,
      ]);
      connections = connections.concat(offsetConnections);
      const classification = results.multiHandedness[loop];
      colors.push({
        list: offsetConnections.map((unused, i) => i + offset),
        color: classification.label,
      });
    }
    grid.updateLandmarks(landmarks, connections, colors);
  } else {
    grid.updateLandmarks([]);
  }
}
