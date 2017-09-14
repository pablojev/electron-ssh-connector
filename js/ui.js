$(document.body).on('keyup', 'ul.fileTree > li > a', function(e) {
    // 38 up
    // 40 down
    var $focused = $(':focus');
    
    if(e.keyCode === 38)
        $focused.parent().prev().find('a').focus();
    if(e.keyCode === 40)
        $focused.parent().next().find('a').focus();
});