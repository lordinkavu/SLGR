const debounce = (callback, wait) => {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
};

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

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
  const landmarks = results.multiHandLandmarks[0];
  if (landmarks) {
    const arr = [];
    landmarks.forEach((landmark) => {
      arr.push(landmark.x, landmark.y, landmark.z);
    });
    fetch(`http://127.0.0.1:5000/predict`, {
      method: 'POST',
      body: JSON.stringify(arr),
      headers: {
        'Content-Type': 'application/json',
      },
    });
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
