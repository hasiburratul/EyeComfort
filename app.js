const serverUrl = 'https://eyecomfort.onrender.com';
let currentStyles = {
    fontSize: '16px',
    fontColor: '#000000',
    bgColor: '#FFFFFF'
};
let currentUrl = '';
let cameraActive = false;

let video;
let poseNet;
let poses = [];
let rightEye, leftEye, eyesDistance;
let fontSize;
let eyeCheckInterval;

function setup() {
    createCanvas(160, 120);
    // Video capture
    video = createCapture(VIDEO);
    video.size(width, height);

    // Check if ml5 is loaded
    if (typeof ml5 === 'undefined') {
        console.error('ml5 is not defined. Make sure the ml5 library is loaded correctly.');
        return;
    }

    console.log('ml5 version:', ml5.version);

    // Create a new poseNet method with a single detection
    poseNet = ml5.poseNet(video, modelReady);

    // This sets up an event that listens to 'pose' events
    poseNet.on('pose', function(results) {
        poses = results;
    });
    
    video.hide();

    let cameraView = document.getElementById('cameraView');
    cameraView.appendChild(canvas);
}

function draw() {
    if (cameraActive) {
        image(video, 0, 0, width, height);
    }
}

function checkEyesAndAdjustFont() {
    if (cameraActive) {
        findEyes();
        adjustFontSize();
    }
}

function findEyes() {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
        // For each pose detected, loop through all the keypoints
        let pose = poses[i].pose;
        leftEye = pose.keypoints[1].position;
        rightEye = pose.keypoints[2].position;
        // Calculate distance between both eyes.
        eyesDistance = Math.round(Math.sqrt(Math.pow((leftEye.x - rightEye.x), 2) + Math.pow((leftEye.y - rightEye.y), 2)));
        console.log('Eyes distance:', eyesDistance);
    }
}

function adjustFontSize() {
    if (eyesDistance) {
        fontSize = Math.round(500 / eyesDistance) * 1.25;
        currentStyles.fontSize = `${fontSize}px`;
        document.getElementById('fontSize').value = fontSize;
        applyStyles();
        console.log('Adjusted font size:', fontSize);
    }
}

function modelReady() {
    console.log('PoseNet Model Loaded');
}

// Website modification functions
function loadWebsite(url) {
    url = url || document.getElementById('websiteUrl').value;
    if (url) {
        currentUrl = url;
        document.getElementById('websiteUrl').value = url;
        fetchWebsite(url);
    } else {
        alert('Please enter a valid URL');
    }
}

function fetchWebsite(url) {
    fetch(`${serverUrl}/fetch-website?url=${encodeURIComponent(url)}`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('preview').innerHTML = html;
            applyStyles();
            addLinkListeners();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load the website. Please try again or try a different URL.');
        });
}

function addLinkListeners() {
    const links = document.getElementById('preview').getElementsByTagName('a');
    for (let link of links) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const newUrl = new URL(this.href, currentUrl).href;
            loadWebsite(newUrl);
        });
    }
}

function applyChanges() {
    currentStyles.fontSize = document.getElementById('fontSize').value + 'px';
    currentStyles.fontColor = document.getElementById('fontColor').value;
    currentStyles.bgColor = document.getElementById('bgColor').value;
    applyStyles();
}

function applyStyles() {
    const styleTag = document.createElement('style');
    styleTag.textContent = `
        #preview, #preview * {
            font-size: ${currentStyles.fontSize} !important;
            color: ${currentStyles.fontColor} !important;
        }
        #preview {
            background-color: ${currentStyles.bgColor} !important;
        }
    `;
    document.head.appendChild(styleTag);
}

function resetWebsite() {
    fetch(`${serverUrl}/reset`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('preview').innerHTML = html;
            resetStyles();
            addLinkListeners();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to reset the website. Please try reloading the page.');
        });
}

function resetStyles() {
    currentStyles = {
        fontSize: '16px',
        fontColor: '#000000',
        bgColor: '#FFFFFF'
    };
    document.getElementById('fontSize').value = 16;
    document.getElementById('fontColor').value = '#000000';
    document.getElementById('bgColor').value = '#FFFFFF';
    const existingStyle = document.head.querySelector('style');
    if (existingStyle) {
        existingStyle.remove();
    }
}

function toggleCamera() {
    cameraActive = !cameraActive;
    let cameraView = document.getElementById('cameraView');
    if (cameraActive) {
        document.getElementById('cameraButton').textContent = 'Stop Camera';
        cameraView.style.display = 'block';
        // Start the interval to check eyes every 2 seconds
        eyeCheckInterval = setInterval(checkEyesAndAdjustFont, 2000);
    } else {
        document.getElementById('cameraButton').textContent = 'Start Camera';
        cameraView.style.display = 'none';
        // Clear the interval when camera is stopped
        clearInterval(eyeCheckInterval);
    }
}