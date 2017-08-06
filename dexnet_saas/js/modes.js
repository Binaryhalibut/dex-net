function enter_grasp_mode(){
    document.getElementById("footer-metric-slider").style.display = null;
    document.getElementById("footer-upload-button").style.display = "none";
    document.getElementById("footer-progress-bar").style.display = "none";
}

function enter_upload_mode(){
    document.getElementById("footer-metric-slider").style.display = "none";
    document.getElementById("footer-upload-button").style.display = null;
    document.getElementById("footer-progress-bar").style.display = "none";
}

function enter_pbar_mode(){
    document.getElementById("footer-metric-slider").style.display = "none";
    document.getElementById("footer-upload-button").style.display = "none";
    document.getElementById("footer-progress-bar").style.display = null;
}