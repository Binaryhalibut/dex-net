function enter_upload_mode(){
    document.getElementById("footer-metric-slider").style.display = "none";
    document.getElementById("footer-upload-button").style.display = null;
}

function enter_grasp_mode(){
    document.getElementById("footer-metric-slider").style.display = null;
    document.getElementById("footer-upload-button").style.display = "none";
}