//spajanje socket.io
$(document).ready(function(){
    var socket=io();
    //spajanje klijenta na server
    socket.on('connect', function(socket){
        console.log('sSpojen na server');
    });
    //odspajanje od servera
    socket.on('disconnect',function(socket){
        console.log('Odspojen sa servera');
    });
});


