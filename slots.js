function initialize()
{
    class Slot {
        Lines=new Array();

        constructor(id,stopTime,posOnCanvas){
            this.id=id;
            this.posOnCanvas=posOnCanvas;
            this.images=getImages();
            this.stopTime=stopTime;
            this.resetState();
        }

        resetState(){
            this.pixelstep=0;
            this.chosenSlot=-1;
            this.EndBetweenSlots=false;
            this.spin=false;
        }

        startSpin(){
            this.pixelstep=speedStep;
            this.spin=true;
            this.getWinningState();
        }

        endSpin(){
            this.spin=false;
            this.pixelstep=0;
        }

        getWinningState(){
            var min = 0;
            var max=this.images.length;
            this.chosenSlot= getRndSlotIndex(this);
            if(this.chosenSlot>4)
            {
                this.chosenSlot=this.chosenSlot-5;
                this.EndBetweenSlots=true;
            }

            if(this.EndBetweenSlots){
                var topImgIndex=this.chosenSlot==0?4:this.chosenSlot-1;
                var bottomImgIndex=this.chosenSlot;
                
                this.Lines=[null,this.images[topImgIndex],null,this.images[bottomImgIndex],null];
            }

            else{
                var topImgIndex=this.chosenSlot==0?4:this.chosenSlot-1;
                var centerImgIndex=this.chosenSlot;
                var bottomImgIndex=this.chosenSlot==4?0:this.chosenSlot+1;
                
                this.Lines=[this.images[topImgIndex],null,this.images[centerImgIndex],null,this.images[bottomImgIndex]];
            }
        }

        calculatePosition(){
            var overflowImgIndex=-1;
            var imgObj;

            for(var i =0 ;i<this.images.length;i++)
            {
                imgObj=this.images[i];
                imgObj.position=imgObj.position + this.pixelstep;
                if(imgObj.position+ImageHeight>=ImageBox.height)
                    overflowImgIndex=i;
            }   

            //check if image needs to go back on top.
            if(overflowImgIndex>-1)
            {
                this.images[overflowImgIndex].position=this.images[overflowImgIndex+1>this.images.length-1?0:overflowImgIndex+1].position-ImageHeight;
            }
            
            this.images.forEach((imgObj)=>{
                ctx.drawImage(imgObj.image,this.posOnCanvas,imgObj.position);
            });

            if(this.spin)
            {
                var timestampStop=new Date();
                
                if((timestampStop-timestampStart)/1000 > this.stopTime)
                    {
                        if(!this.EndBetweenSlots && this.images[this.chosenSlot].position >=60-speedStep && this.images[this.chosenSlot].position<=60)
                        {
                            var finalPos=[60.5
                                ,181.5
                                ,302.5
                                ,-181.5
                                ,-60.5];
                            var counter=0
                            for(var i =this.chosenSlot;i<this.chosenSlot+5;i++)
                            {
                                this.images[i % 5].position=finalPos[counter];
                                counter++;
                            }
                            this.endSpin();
                        }
                        else if(this.EndBetweenSlots && this.images[this.chosenSlot].position >=120-speedStep && this.images[this.chosenSlot].position<=120)
                        {
                            var finalPos=[120
                                ,241
                                ,362
                                ,483
                                ,-1];
                            var counter=0
                            for(var i =this.chosenSlot;i<this.chosenSlot+5;i++)
                            {
                                this.images[i % 5].position=finalPos[counter];
                                counter++;
                            }
                            this.endSpin();
                        }
                    }
                }
            }

    }

    Slot1=new Slot(1,2,100 + 1*((canvas.width-200)/6)-(ImageWidth/2));
    Slot2=new Slot(2,2.5,100+ 3*((canvas.width-200)/6)-(ImageWidth/2));
    Slot3=new Slot(3,3,100 + 5*((canvas.width-200)/6)-(ImageWidth/2));

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    slots=[Slot1,Slot2,Slot3];
    slots.paylines=[0,0,0,0,0];
    
    startAnimation();
}

function drawLinearGradient()
{
    var gradient = ctx.createLinearGradient(0,canvas.height, 0,0);

    // Add three color stops
    gradient.addColorStop(0, "#1084ff");
    gradient.addColorStop(.5, "#000000");
    gradient.addColorStop(1, "#1084ff");

    // Set the fill style and draw a rectangle
    ctx.fillStyle = gradient;
    ctx.fillRect(100, 0, canvas.width-200, canvas.height);
}

function getImages()
{
    initialImagePosition=0;
    var imageFileNames=["./content/3xBAR.png","./content/BAR.png","./content/2xBAR.png","./content/7.png","./content/Cherry.png"];
    var images=new Array();

    imageFileNames.forEach((img,index)=>{
        var image = new Image();
        image.src = img;
        images.push(
            {image : image, position :initialImagePosition-relativePosition, name: img.substring(10,img.length-4)}
        );
        initialImagePosition+=ImageHeight;
    });

    return images;
}


function startSpin()
{
    slots.paylines=[0,0,0,0,0];
    
    //hide elements
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    isDrawLine=false;
    DLtimeStart=null;

    $("#btnSpin").css("pointer-events","none");
    $("#sWinMsg").css("visibility","hidden");

    $(".blinking").each((i,el)=>{
        $(el).removeClass("blinking");
    })

    //radnomize image position
    $(slots).each((i,r)=>{
        var positions=new Array();
        
        $(r.images).each((j,img)=>{
            positions.push(img.position);
        })
        
        r.images=shuffle(r.images);

        $(r.images).each((j,img)=>{
            img.position=positions[j];
        })
    });
    

    slots.forEach((r)=>{
        r.resetState();
        r.startSpin();
    })

    timestampStart=new Date();

    //pay coin
    $("#txtBalance")[0].value=$("#txtBalance")[0].value-1;

    startAnimation();
}

function startAnimation()
{
    var timestamp=Date.now();

    function frame(timestamp)
    {
        drawLinearGradient();

        slots.forEach((r)=>{
            
            r.calculatePosition();

            if(calculateWin && slots.filter((r)=>{return r.pixelstep==0 && r.chosenSlot >-1}).length==slots.length)
                {
                    //smoothes the experience
                    cancelAnimationFrame(ReqAnimation);
                    isDrawLine=true;
                    DLtimeStart=Date.now();
                    calculateWin=false;
                    calculateWinConditions();

                    //validateInput() isn't enough because it doesnt cover the 0 case
                    if($("#txtBalance")[0].value>"0")
                        $("#btnSpin").css("pointer-events","");
                }

            if(isDrawLine)
            {
                //a delay is placed to smooth experience.
                var timestampStop=Date.now()
                if((timestampStop-timestampStart)/1000 > 3.1)
                {
                    drawLine();
                }
            }
        })
        ReqAnimation=window.requestAnimationFrame((timestamp)=>{frame(timestamp)});
    }

        var calculateWin=true;
        ReqAnimation=window.requestAnimationFrame((timestamp)=>{frame(timestamp)});
}

function calculateWinConditions()
{
    paytableWins = Array(9).fill(false);
    winsum=0;

    paytableWins[0]=isWin([1],["Cherry"],2000,0);
    paytableWins[1]=isWin([2],["Cherry"],1000,1);
    paytableWins[2]=isWin([3],["Cherry"],4000,2);
    paytableWins[3]=isWin([1,2,3],["7"],150,3);
        paytableWins[4]=isWin([1,2,3],["7","Cherry"],75,4);
    paytableWins[5]=isWin([1,2,3],["3xBAR"],50,5);
    paytableWins[6]=isWin([1,2,3],["2xBAR"],20,6);
    paytableWins[7]=isWin([1,2,3],["BAR"],10,7);
        paytableWins[8]=isWin([1,2,3],["BAR","2xBAR","3xBAR"],5,8);
    
    if(winsum>0)
    {
        $("#sWinMsg").css("visibility","visible");
        if(!isNaN(parseInt($("#txtBalance")[0].value)))
        {
            $("#txtBalance")[0].value=parseInt($("#txtBalance")[0].value)+winsum;
        }
        else{
            $("#txtBalance")[0].value=winsum;
        }

        paytableWins.forEach((p,i)=>{
            if(p)
                $("#payCol"+i).addClass("blinking");
        })
    }

}

function isWin(lines,names,amount,wincode){
    var isWin=false;

    lines.forEach((line)=>{
        //do not calculate already won lines
        if(slots.filter((r)=>{return r.Lines[line]!=null && slots.paylines[line]==0})
            .filter((r)=>{return names.includes(r.Lines[line].name)}).length==3)
        {
            winsum+=amount;
            slots.paylines[line]=1;
            isWin=true;
        }
    })

    return isWin;
}

function getRndSlotIndex(slot){
    //debugging feature
    var mode=$("#cbMode")[0];
    var ddlImgValue=$("#dbgImgSlot"+slot.id)[0].value;
    var ddlPosValue=$("#dbgPosSlot"+slot.id)[0].value;
    
    var winningIndex=0;

    //fixed case
    if(mode.checked && ddlImgValue!="" && ddlPosValue!="")
    {
        winningIndex=slot.images.findIndex((img)=>{return img.name==ddlImgValue});
        winningIndex =(winningIndex + parseInt(ddlPosValue));
        
        //fix case is last image and top position
        if(winningIndex==10)
            winningIndex=5;
    }

    //random case
    else{
        winningIndex=Math.floor(Math.random() * 10);
    }

    return winningIndex;
}

function drawLine()
{
    ctx.strokeStyle = "#ff0000";
    ctx.beginPath();

    //top 
    if(slots.paylines[1]==1)
    
    {
        ctx.moveTo(0,canvas.height/4);
        ctx.lineTo(canvas.width,canvas.height/4);
        ctx.lineWidth=5;

        ctx.arc(23, canvas.height/4, 20, 0, 2 * Math.PI, false);
        ctx.fillStyle = "red";
        ctx.fill();

        ctx.arc(canvas.width-23, canvas.height/4, 20, 0, 2 * Math.PI, false);
        ctx.fillStyle = "red";
        ctx.fill();
    }

    //bottom
    if(slots.paylines[3]==1)
    {
        ctx.moveTo(0,3*canvas.height/4);
        ctx.lineTo(canvas.width,3*canvas.height/4);
        ctx.lineWidth=5;

        ctx.arc(23, 3*canvas.height/4, 20, 0, 2 * Math.PI, false);
        ctx.fillStyle = "red";
        ctx.fill();

        ctx.arc(canvas.width-23,3* canvas.height/4, 20, 0, 2 * Math.PI, false);
        ctx.fillStyle = "red";
        ctx.fill();
    }

    //center
    if(slots.paylines[2]==1)
    {
        ctx.moveTo(0,canvas.height/2);
        ctx.lineTo(canvas.width,canvas.height/2);
        ctx.lineWidth=5;

        ctx.arc(23, canvas.height/2, 20, 0, 2 * Math.PI, false);
        ctx.fillStyle = "red";
        ctx.fill();

        ctx.arc(canvas.width-23, canvas.height/2, 20, 0, 2 * Math.PI, false);
        ctx.fillStyle = "red";
        ctx.fill();
    }

    ctx.closePath();
    
    ctx.stroke();
}

function validateInput(){
    var balance = $("#txtBalance")[0];
    
    if(balance.value=="" || isNaN(balance.value) || parseInt(balance.value)<0 || parseInt(balance.value)>5000)
        {
            $("#btnSpin").css("pointer-events","none");
            $("#valMsg").css("visibility","visible");
            return false;
        }
    else
        {
            $("#txtBalance")[0].value=parseInt(balance.value);
            $("#valMsg").css("visibility","hidden");

            if(balance.value!=0)
                $("#btnSpin").css("pointer-events","");
            else
                $("#btnSpin").css("pointer-events","none");

            return true;
        }
}

function mousedown(){
    $("#btnSpin").attr("src","./content/Button2.png");

}
function resetImage(){
    $("#btnSpin").attr("src","./content/Button1.png");
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function toggleDebugOptions(elem){
    if(elem.checked)
        $(".dhide").css('visibility','visible');
    else
        $(".dhide").css('visibility','hidden');
}