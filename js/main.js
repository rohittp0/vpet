const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl", {xrCompatible: true});

const hit = document.getElementById("hit");
const pose = document.getElementById("pose");

const startButton = document.getElementById("startButton");

let referenceSpace;
let binding;

let i = 0;

let time = new Date().getTime();

async function createImageFromTexture(gl, texture, width, height) {
    // TODO: make the code less bad.
    // Create a framebuffer backed by the texture
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    // Read the contents of the framebuffer
    var data = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);

    gl.deleteFramebuffer(framebuffer);

    // Create a 2D canvas to store the result
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');

    // Copy the pixels to a 2D canvas
    var imageData = context.createImageData(width, height);
    imageData.data.set(data);
    context.putImageData(imageData, 0, 0);

    canvas.toBlob((b) => {
        /*
         * TODO: Save the blob to db.
         * Left for database engineer as an exercise.
         *
         */
    });
}

async function initWebXr() {
    const session = await navigator.xr?.requestSession(
        "immersive-vr",
        {requiredFeatures: ["camera-access", "hit-test"]}
    );

    session.addEventListener("select", () => {
        console.log("Select");
    });

    await session.updateRenderState({baseLayer: new XRWebGLLayer(session, gl)});
    referenceSpace = await session.requestReferenceSpace("local");

    binding = new XRWebGLBinding(session, gl);

    session.requestAnimationFrame(onXRFrame);
}

function onXRFrame(t, frame) {
    if (!gl || !referenceSpace)
        return;

    const session = frame.session;
    session.requestAnimationFrame(onXRFrame);

    const pose = frame.getViewerPose(referenceSpace);
    if (pose) {
        // In mobile AR, we only have one view.
        const view = pose.views[0];
        const vMatrix = view.transform.matrix

        pose.innerText = vMatrix.toString();

        const cameraTexture = binding.getCameraImage(view.camera);

        // Save the camera texture to a file.
        createImageFromTexture(gl, cameraTexture, 640, 480);
    }

    console.log("FPS", 1000 / (-time + new Date().getTime()));
    time = new Date().getTime();
}


startButton.addEventListener("click", initWebXr);
