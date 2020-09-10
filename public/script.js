//spajanje socket.io
$(document).ready(function(){
    //autoscroll funkcija
    $('#list').animate({scrollTop:1000},800);
    var socket=io();
    //spajanje klijenta na server
    socket.on('connect', function(socket){
        console.log('sSpojen na server');
    });
    //korisnicki id
    var ObjectID=$('#ObjectID').val();
    var carID=$('#carID').val();
    socket.emit('ObjectID',{
        carID: carID,
        userID: ObjectID
    });
    //car event
    socket.on('car', function(car){
        console.log(car);
        //AJAQ request za širinu i dužinu
        $.ajax({
            url: `https://maps.googleapis.com/maps/api/geocode/json?address=${car.location}&key=AIzaSyAgevif4AFVodGc6hcnd7HyyOTPSKj4qfo`,
            type:'POST',
            data: JSON,
            processData: true,
            success:function(data){
                console.log(data);
                //slanje širine i dužine u server
                socket.emit('LatLng',{
                    data: data,
                    car: car
                });
            }
        });
    });


    //odspajanje od servera
    socket.on('disconnect',function(socket){
        console.log('Odspojen sa servera');
    });
});


