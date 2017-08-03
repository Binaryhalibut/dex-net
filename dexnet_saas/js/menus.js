$(function(){
    $("#upload-link").on('click', function(e){
        e.preventDefault();
        closeL1Menus(function(){});
        $("#mesh-file-field:hidden").trigger('click');
    });
});

MENU_WIDTHS = {"download-menu":"250px",
               "settings-menu":"300px"}

function openL0Menu() {
    document.getElementById("menu").style.width = "250px";
}
function closeL0Menu() {
    closeL1Menus(function() {
        document.getElementById("menu").style.width = "0px"
    });
}
function openL1Menu(menu_name) {
    closeL1Menus(function() {
        
        document.getElementById(menu_name).style.width = MENU_WIDTHS[menu_name]
    });
}
function closeL1Menu(menu_name) {
    var menu = document.getElementById(menu_name)
    if (menu.style.width === "0px" || menu.style.width === "") {
        return 0;
    }
    menu.style.width = "0px";
    return 1;
}
function closeL1Menus(todo) {
    setTimeout(todo, (closeL1Menu("download-menu") +
                      closeL1Menu("settings-menu")) * 200);
}

$('input[type=checkbox]').onoff();