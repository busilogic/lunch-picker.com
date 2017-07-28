/* @flow */
// https://scotch.io/quick-tips/easily-create-read-and-erase-cookies-with-jquery

/**
 // Create a Cookie for one week
 createCookie('myCookie', 'The value of my cookie...', 7)
 
 // Read the cookie (note this will only work on the page loads after the cookie is created)
 var myCookie = readCookie('myCookie');
 console.log(myCookie); // Outputs: "The value of my cookie..."
 
 // Erase the cookie (only works on page loads after the cookie was created)
 eraseCookie('myCookie') 
 */

function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name,"",-1);
}

// ---  end cookie mgmt   --------------------------------------------------

// Prevent the form from submitting
$( "form" ).submit(function( event ) {
    event.preventDefault();
});


// Helpers
shuffle = function(o) {
    for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

String.prototype.hashCode = function() {
    // See http://www.cse.yorku.ca/~oz/hash.html        
    var hash = 5381;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        hash = ((hash << 5) + hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

Number.prototype.mod = function(n) {
    return ((this % n) + n) % n;
}


// WHEEL!
var wheel = {
    
    timerHandle: 0,
    timerDelay: 33,
    
    angleCurrent: 0,
    angleDelta: 0,
    
    size: 290,
    
    canvasContext: null,
    
    colors: [ '#40c4ff', // light blue accent 2
              '#0097a7', // cyan darken 2
              '#00897b', // teal darken 2
              '#546e7a', // blue gray darken 1
              '#1e88e5', // blue darken-1
              '#263238', // blue-grey darken-4            
            ],

    segments: [],
    
    seg_colors: [],
    // Cache of segments to colors
    maxSpeed: Math.PI / 16,
    
    upTime: 1000,
    // How long to spin up for (in ms)
    downTime: 17000,
    // How long to slow down for (in ms)
    spinStart: 0,
    
    frames: 0,
    
    centerX: 300,
    centerY: 300,
    
    spin: function() {
        
        // Start the wheel only if it's not already spinning
        if (wheel.timerHandle == 0) {
            wheel.spinStart = new Date().getTime();
            wheel.maxSpeed = Math.PI / (16 + Math.random()); // Randomly vary how hard the spin is
            wheel.frames = 0;
            wheel.sound.play();
            
            wheel.timerHandle = setInterval(wheel.onTimerTick, wheel.timerDelay);
        }
    },

    onTimerTick: function() {

        wheel.frames++;

        wheel.draw();

        var duration = (new Date().getTime() - wheel.spinStart);
        var progress = 0;
        var finished = false;

        if (duration < wheel.upTime) {
            progress = duration / wheel.upTime;
            wheel.angleDelta = wheel.maxSpeed * Math.sin(progress * Math.PI / 2);
        } else {
            progress = duration / wheel.downTime;
            wheel.angleDelta = wheel.maxSpeed * Math.sin(progress * Math.PI / 2 + Math.PI / 2);
            if (progress >= 1) finished = true;
        }

        wheel.angleCurrent += wheel.angleDelta;
        while (wheel.angleCurrent >= Math.PI * 2)
            // Keep the angle in a reasonable range
            wheel.angleCurrent -= Math.PI * 2;

        if (finished) {
            clearInterval(wheel.timerHandle);
            wheel.timerHandle = 0;
            wheel.angleDelta = 0;

            $("#counter").html((wheel.frames / duration * 1000) + " FPS");
        }

        /*
         // Display RPM
         var rpm = (wheel.angleDelta * (1000 / wheel.timerDelay) * 60) / (Math.PI * 2);
         $("#counter").html( Math.round(rpm) + " RPM" );
         */
    },

    init: function(optionList) {
        try {
            wheel.initWheel();
            wheel.initAudio();
            wheel.initCanvas();
            wheel.draw();

            $.extend(wheel, optionList);

        } catch (exceptionData) {
            alert('Wheel is not loaded ' + exceptionData);
        }

    },

    initAudio: function() {
        var sound = document.createElement('audio');
        sound.setAttribute('src', 'wheel.mp3');
        wheel.sound = sound;
    },

    initCanvas: function() {
        var canvas = $('#wheel #canvas').get(0);

        canvas.addEventListener("click", wheel.spin, false);
        wheel.canvasContext = canvas.getContext("2d");
    },

    initWheel: function() {
        shuffle(wheel.colors);
    },

    // Called when segments have changed
    update: function() {
        // Ensure we start mid way on a item
        //var r = Math.floor(Math.random() * wheel.segments.length);
        var r = 0;
        wheel.angleCurrent = ((r + 0.5) / wheel.segments.length) * Math.PI * 2;

        var segments = wheel.segments;
        var len = segments.length;
        var colors = wheel.colors;
        var colorLen = colors.length;

        // Generate a color cache (so we have consistant coloring)
        var seg_color = new Array();
        for (var i = 0; i < len; i++)
            seg_color.push(colors[segments[i].hashCode().mod(colorLen)]);
        
        wheel.seg_color = seg_color;
        //console.log("Seg Color: ", seg_color);
        wheel.draw();
    },

    draw: function() {
        wheel.clear();
        wheel.drawWheel();
        wheel.drawNeedle();
    },

    clear: function() {
        var ctx = wheel.canvasContext;
        ctx.clearRect(0, 0, 1000, 800);
    },

    drawNeedle: function() {
        var ctx = wheel.canvasContext;
        var centerX = wheel.centerX;
        var centerY = wheel.centerY;
        var size = wheel.size;

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000000';
        ctx.fileStyle = '#ffffff';

        ctx.beginPath();

        ctx.moveTo(centerX + size - 40, centerY);
        ctx.lineTo(centerX + size + 20, centerY - 10);
        ctx.lineTo(centerX + size + 20, centerY + 10);
        ctx.closePath();

        ctx.stroke();
        ctx.fill();

        // Which segment is being pointed to?
        var i = wheel.segments.length - Math.floor((wheel.angleCurrent / (Math.PI * 2)) * wheel.segments.length) - 1;

        // Now draw the winning name
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = '#444'; // writing next to needle
        ctx.font = "2em Roboto";
        ctx.fillText(wheel.segments[i], centerX + size + 25, centerY);
    },

    drawSegment: function(key, lastAngle, angle) {
        var ctx = wheel.canvasContext;
        var centerX = wheel.centerX;
        var centerY = wheel.centerY;
        var size = wheel.size;

        var segments = wheel.segments;
        var len = wheel.segments.length;
        var colors = wheel.seg_color;

        var value = segments[key];

        ctx.save();
        ctx.beginPath();

        // Start in the centre
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, size, lastAngle, angle, false); // Draw a arc around the edge
        ctx.lineTo(centerX, centerY); // Now draw a line back to the centre
        // Clip anything that follows to this area
        //ctx.clip(); // It would be best to clip, but we can double performance without it
        ctx.closePath();

        ctx.fillStyle = colors[key];
        ctx.fill();
        ctx.stroke();

        // Now draw the text
        ctx.save(); // The save ensures this works on Android devices
        ctx.translate(centerX, centerY);
        ctx.rotate((lastAngle + angle) / 2);

        ctx.fillStyle = '#FFF';
        ctx.fillText(value.substr(0, 20), size / 2 + 20, 0);
        ctx.restore();

        ctx.restore();
    },

    drawWheel: function() {
        var ctx = wheel.canvasContext;

        var angleCurrent = wheel.angleCurrent;
        var lastAngle = angleCurrent;

        var segments = wheel.segments;
        var len = wheel.segments.length;
        var colors = wheel.colors;
        var colorsLen = wheel.colors.length;

        var centerX = wheel.centerX;
        var centerY = wheel.centerY;
        var size = wheel.size;

        var PI2 = Math.PI * 2;

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff'; // Wheel Lines Seperating Veneues
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.font = "1.4em Roboto";

        for (var i = 1; i <= len; i++) {
            var angle = PI2 * (i / len) + angleCurrent;
            wheel.drawSegment(i - 1, lastAngle, angle);
            lastAngle = angle;
        }
        // Draw a center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, PI2, false);
        ctx.closePath();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.fill();
        ctx.stroke();

        // Draw outer circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, size, 0, PI2, false);
        ctx.closePath();

        ctx.lineWidth = 10;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
    },
}


/**
 * Add new venue to the wheel    
 */
function addNewVenueToWheel(){
    
    // venue to add to wheel
    v = $('#newVenue').val();
    console.log("Add Venue: ", v);
    // Remove default items if exists
    $('.defaultVenue').remove();
    
    newVenueEl = $("#tr-venue").clone();
    
    $(newVenueEl).removeAttr("id");
    $(newVenueEl).removeAttr("style");  

    // Append to table
    $(newVenueEl).find('h4').html(v);
    console.log(newVenueEl);
    // Append to table
    $("#venueTable > tbody").append($(newVenueEl));

    

    // Update wheel
    segments = createWheelSegments();       
    wheel.segments = segments;       
    wheel.update();
    
    // clear the input box
    $('#newVenue').val('');
    $('#newVenue').focus();


}

/**
 * Hide Show Button Toggled
 */

$('#venueTable').on('change', ':checkbox', function () {

    console.log("Venue Checkbox Changed");
    venue = $(this).closest('tr');
    venue = $(venue).find('td > h4').html();
    // Check if already in the wheel
    arrayIndex = $.inArray(venue, segments);
    
    if ($(this).is(':checked')) {
        console.log(venue,  ' is now checked');
        
        if (arrayIndex == -1){
            segments.push(venue);      
        }

    } else {
        console.log(venue, ' is now unchecked');
        if (arrayIndex != -1){
            //remove it from wheel
            segments.splice(arrayIndex, 1);      
        }
    }

    // update wheel
    segments.sort();
    wheel.update();  
});

function createWheelSegments(){
    var segments = new Array();
    
    $.each($('.venue'), function(index, domEl) {       
        console.log("Item #: ", index, "Value: ", $(domEl).html());
        if ($(domEl).html() != ''){
            segments.push($(domEl).html());      
        }

    });
    return segments;
}

/**
 * Enter Button clicked after adding new venue
 */
$('#newVenue').on('keypress', function (event) {
    console.log("Key Pressed: ", event.which);  
    if(event.keyCode == 13){
        addNewVenueToWheel();
        updateCookie();
    }//if enter key pressed
    
});


/**
 * If it doesn't exist in cookie string, add it
 */ 
function updateCookie(){

    // Delete Cookie if it exists
    eraseCookie('lunch-picker.com');

    // Create new cookie from segments    
    cookieStr = '';
    $.each(wheel.segments, function(key, v){
        cookieStr = cookieStr.concat("|", v.trim());      
    });
    console.log("Create cookie: ", cookieStr);
    createCookie('lunch-picker.com', cookieStr);
}


/**
 *  Clear all Link Clicked
 */
$('#clearAll').on('click', function(){
    console.log("Delete Cookie");
    eraseCookie('lunch-picker.com');

    $('.defaultVenue').remove();

    $.each($('#venueTable > tbody').find('tr'), function(index, v){
        if (index != 0) { // skip  item to clone
            $(this).remove();            
        }

    });
    //$('.venuerow').remove();
    segments = [];
    wheel.segments = segments;
    wheel.update();
    
});

/**
 * On Document Ready
 */
$(document).ready(function() {
    
    console.log("Initializing Wheel");

    // Check if cookie exists
    // if cookie exists, use it to create wheel segments & populate choice
    
    wheel.init(); // draw wheel circle
    
    msg1 = "Add places where you normally eat";
    // show toast for 10 seconds         
    Materialize.toast(msg1, 10000);

    var myCookie = readCookie('lunch-picker.com');       
    console.log("My Cookie: ", myCookie);
    if ((myCookie == null) || (myCookie == '')){
        console.log("Initiate => No COokie");        
        wheel.segments = createWheelSegments();
        wheel.update();
        updateCookie();
    }else{
        console.log("Cookie exists, create venues from: ", myCookie);        
        // Create wheel
        venueArray = myCookie.split('|');
        console.log("VenueArray: ", venueArray);
    
        $.each(venueArray, function(key, v){
            console.log("Venue: ", v);
            if (v != ''){
                console.log("Not empty");
                // venue to add to wheel
                $('#newVenue').val(v);
                addNewVenueToWheel();
            }
        });
        
    }//else


});
