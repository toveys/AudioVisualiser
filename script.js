
let audioContext = new AudioContext;

const container = document.getElementById('container');
const canvas = document.getElementById('canvas1');
const canvas2 = document.getElementById('canvas2');
const file = document.getElementById('fileupload');
const controls = document.getElementById('controls');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas2.width = window.innerWidth;
canvas2.height = window.innerHeight;

//two canvases, one for the background and one for the foreground
const ctx = canvas.getContext('2d');
const ctx2 = canvas2.getContext('2d');
let audioSource;
let analyser;

//bars array to hold the bar objects
let bars = [];
let rdm;

//on file change load the url and play it
//also create a random number to be used to pick the
//main audio visualiser
file.addEventListener('change', function(){
    const files = this.files;
    controls.src = URL.createObjectURL(files[0]);
    controls.load();
    controls.play();
    rdm = Math.floor(Math.random()*3);
});

//continue animation after pressing play
controls.addEventListener('play', function(){
    //clean up audioContext just in case its still using previous resources
    audioContext.close();
    //connect a buch of audio stuff up
    audioContext = new AudioContext;
    audioSource = audioContext.createMediaElementSource(controls);
    analyser = audioContext.createAnalyser();
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 1024;
    //bufferLength is half the size of the fftSize and represents the number of bars in the audio visualiser effect
    const bufferLength = analyser.frequencyBinCount;
    //convert bufferLength into a special type of array, Uint8Array
    const dataArray = new Uint8Array(bufferLength);

    let angle = 0;
    drawVisualiser(bufferLength, rdm);
    //recursive animate function, calls itself and uses the bar objects draw and update methods to
    //animate the canvas
    function animate(){
        //clear background before updating
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx2.clearRect(0,0,canvas.width,canvas.height);
        //frequency data are integers between 0 and 255, will control height of bars
        analyser.getByteFrequencyData(dataArray);
    
        //angle I rotate the canvas each time I draw a scene
        angle+=0.004;
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(angle);
        //for each bar object in my bars array I call their update and draw method
        bars.forEach(function(bar,i){
            bar.update(dataArray[i]);
            bar.draw(ctx, ctx2, bufferLength);
        });
        ctx.restore();

        //if the audio ends then clear the canvas and jump out of the function
        //we want to be able to stop the recursion when we want to
        if(controls.ended){
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx2.clearRect(0,0,canvas.width,canvas.height);
            return;
        }
        //If the audio gets paused then jump out of the function
        else if(controls.paused){
            return;
        }
        //else use some recursion and continuously this animate function to update and draw the next frame
        else{
            requestAnimationFrame(animate);
        }
    }
    animate();
});

//Bar Class
class Bar{
    constructor(x, y, width, height, hue, index, rdm){
        this.x = x; 
        this.y = y;
        this.width = width;
        this.height=height;
        this.hue = hue;
        this.index = index;
        this.rdm = rdm;
    }
    //TEMPLATE
    // for(let i=0; i<bufferLength; i++){
    //     barHeight = dataArray[i]*2;
    //     const red=i*barHeight/20;
    //     const green=i/2;
    //     const blue=barHeight/2;
    //     ctx.fillStyle='white';
    //     ctx.fillRect(x, canvas.height-barHeight-30, barWidth, 15)
    //     ctx.fillStyle = 'rgb('+red+','+green+','+blue+')';
    //     ctx.fillRect(x, canvas.height-barHeight, barWidth, barHeight)
    //     x += barWidth;
    // }
    update(sample){
        this.height = sample*1.3;
    }
    draw(ctx, ctx2, bufferLength){
        //Background
        ctx.save();
        // set centerpoint of the canvas to the center of the canvas
        ctx.translate(0, 0);
        //rotate canvas
        ctx.rotate(this.index);
        ctx.scale(1,3)
        ctx.strokeStyle = this.hue;
        ctx.beginPath();
        ctx.moveTo(this.x, this.x);
        ctx.lineTo(this.y, this.height);
        ctx.stroke();
        ctx.restore();
        
        if(this.rdm==0){
            // Main Visualiser #1 - Heat Map
            ctx2.save();
            ctx2.translate(canvas.width/2, canvas.height/2)
            //set centerpoint of the canvas to the center of the canvas
            //rotate canvas
            ctx2.rotate(this.index*Math.PI*10/bufferLength);
            let hue2 = this.index*.6;
            ctx2.fillStyle = 'hsla('+hue2+',100%, 50%,'+.9+')';
            ctx2.fillRect(0, 0, 15, this.height*.9);
            ctx2.restore();
        }
        
        if(this.rdm==1){
            // // Main Visualiser #2 - rainbow parrot
            ctx2.save();
            ctx2.translate(canvas.width/2, canvas.height/2);
            ctx2.rotate(this.index * 4.196);
            let hue2 = 10+this.index*1.2;  
            ctx2.fillStyle = 'hsl('+hue2+',100%, 50%)';
            ctx2.beginPath();
            ctx2.arc(10,this.height/2, this.height/2, 0, Math.PI/4);
            ctx2.fill();
            ctx2.stroke();
            ctx2.restore();
        }
        if(this.rdm==2){
            //Main Visualiser #3 - mushrooms
            ctx2.save();
            //ctx2.globalCompositeOperation = 'hard-light';
            ctx2.translate(canvas.width/2, canvas.height/2);
            ctx2.rotate(this.index * Math.PI*15/bufferLength);
            let hue2 = 300-(this.height+(this.index*.5));  
            ctx2.fillStyle = 'hsla('+hue2+',100%, '+50+'%,'+1+')';
            ctx2.strokeStyle = 'hsla('+(hue2+30)+',100%, '+40+'%,'+1+')';
            ctx2.lineWidth = this.height/20;
            ctx2.beginPath();
            ctx2.moveTo(0,0);
            ctx2.lineTo(0,this.height*.75);
            ctx2.stroke();

            ctx2.beginPath();
            ctx2.arc(0,(this.height*.8),this.height/25, 0, Math.PI);
            ctx2.fill();

            ctx2.beginPath();
            ctx2.arc(0,(this.height*.75),this.height/15, 0, Math.PI);
            ctx2.fill();

            ctx2.restore();
        }
    }
}
//C:\Users\tovey\Documents\CreativeCoding

//create the bar objects
function drawVisualiser(bufferLength, rdm){
    for(i=0; i < bufferLength; i++){
        let hue = 'hsl('+200+(i*.2)+',100%, 50%)';
        bars.push(new Bar(i,canvas.height/2,1,20,hue,i,rdm));
    }
}