

const openFilesBtn = document.getElementById('select-btn');
const imageListContainer = document.getElementById('image-list');
const previewBtn = document.getElementById('preview-btn');
const createGifBtn = document.getElementById('create-btn');
const previewImage = document.getElementById('preview-image');
const previewPlaceholder = document.getElementById('preview-placeholder');
const speedSlider = document.getElementById('speed-slider');
const progressBar = document.getElementById('progress-bar');
let animationInterval;
let currentFrameIndex = 0;
let frameDelay = 1000 / speedSlider.value;

speedSlider.addEventListener('change', () => {
    frameDelay = 1000 / speedSlider.value;
    console.log(frameDelay);
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
       // StopAnimation();
        StartAnimation();
});


openFilesBtn.addEventListener('click', async () => {
    try {
        const filePaths = await window.api.openFile();
        imageListContainer.innerHTML = '';

        if (filePaths.length === 0) {
            previewImage.style.display = 'none';
            previewPlaceholder.style.display = 'block';
            return;
        }

        previewImage.style.display = 'block';
        previewPlaceholder.style.display = 'none';
        filePaths.forEach((filePath) => {
            const img = document.createElement('img');
            img.src = filePath;
            img.className = 'frame-image';
            imageListContainer.appendChild(img);
        });

        clearInterval(animationInterval);
        currentFrameIndex = 0;
        previewImage.src = filePaths[currentFrameIndex];
        console.log(filePaths);
    } catch (err) {
        console.log(err);
    }
})

function StartAnimation() {
    animationInterval = setInterval(() => {
        currentFrameIndex++;
        if (currentFrameIndex >= imageListContainer.children.length) {
            currentFrameIndex = 0;
        }
        previewImage.src = imageListContainer.children[currentFrameIndex].src;
    }, frameDelay);
}

function StopAnimation() {
    clearInterval(animationInterval);
}

createGifBtn.addEventListener('click', async () => {
    console.log('create gif');
    try {

        const filePaths = [...imageListContainer.children].map(img => {
            let imgSrc = img.src;
            if (imgSrc.startsWith('file:///')) {
                imgSrc = imgSrc.substring(8);
            }
            //onst imgSrc = img.src.replace(/^file:\/\//,'');
            return imgSrc.replace(/^\/[A-Z]:/, '');
           // return decodeURIComponent(imgSrc);
        });

        const filePath = await window.api.saveFile(filePaths, frameDelay);

        if (filePath === '') {
            console.log('no file path');
            return;
        }
        console.log("Save file path: " + filePath);
        //createGIF(filePath);
    } catch (err) {
        console.log(err);
    }
});


previewBtn.addEventListener('click', async () => {
    if(animationInterval){
        clearInterval(animationInterval);
        animationInterval = null;
    }
    StartAnimation();
});

window.api.onProgressUpdate((progress) => {
    console.log('progress: ' + progress);
    progressBar.value = progress * 100;
    if(progress >= 1){
        progressBar.value = 0;
        //set progress bar style to progress-bar-done

    }

});