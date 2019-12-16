

// Cloned by Brendan on 9 Dec 2019 from World "Character recognition neural network (clone by Brendan)" by Brendan 
// Please leave this clone trail here.
 


// Cloned by Brendan on 1 Dec 2019 from World "Character recognition neural network" by "Coding Train" project 
// Please leave this clone trail here.
 

// Port of Character recognition neural network from here:
// https://github.com/CodingTrain/Toy-Neural-Network-JS/tree/master/examples/mnist
// with many modifications 


// --- defined by MNIST - do not change these ---------------------------------------

const PIXELS        = 28;                       // images in data set are tiny 
const PIXELSSQUARED = PIXELS * PIXELS;

// number of training and test exemplars in the data set:
const NOTRAIN = 60000;
const NOTEST  = 10000;



//--- can modify all these --------------------------------------------------

// no of nodes in network 
const noinput  = PIXELSSQUARED;
const nohidden = 100;
const nooutput = 10;

var learningRate = 0.1; 
const LEARNING_MULTIPLIER = 0.01;
var dynamicLearning = true;

// should we train every timestep or not 
let do_training = true;

// how many to train and test per timestep 
const TRAINPERSTEP = 120;        // 6:1 train v test
const TESTPERSTEP  = 20;

// multiply it by this to magnify for display 
const ZOOMFACTOR    = 7;                        
const ZOOMPIXELS    = ZOOMFACTOR * PIXELS; 

// 3 rows of
// large image + 50 gap + small image    
// 50 gap between rows 

const canvaswidth = ( PIXELS + ZOOMPIXELS ) + 50;
const canvasheight = ( ZOOMPIXELS * 3 ) + 100;


const DOODLE_THICK = 15;    // thickness of doodle lines 
const DOODLE_BLUR = 6;      // blur factor applied to doodles 
const DOODLE_POSTERIZE = 2;
const DOODLE_COLOUR = '#dddddd';

let mnist;      
// all data is loaded into this 
// mnist.train_images
// mnist.train_labels
// mnist.test_images
// mnist.test_labels


let nn;

let trainrun = 1;
let train_index = 0;

let testrun = 1;
let test_index = 0;
let total_tests = 0;
let total_correct = 0;

// images in LHS:
let doodle, demo;
let doodle_exists = false;
let demo_exists = false;

let mousedrag = false;      // are we in the middle of a mouse drag drawing?  


// save inputs to global var to inspect
// type these names in console 
var train_inputs, test_inputs, demo_inputs, doodle_inputs;


// Matrix.randomize() is changed to point to this. Must be defined by user of Matrix. 

function randomWeight()
{
    return ( AB.randomFloatAtoB ( -0.5,0.5 ) );
            // Coding Train default is -1 to 1
}    



// CSS trick 
// make run header bigger 
 $("#runheaderbox").css ( { "max-height": "95vh" } );



//--- start of AB.msgs structure: ---------------------------------------------------------
// We output a series of AB.msgs to put data at various places in the run header 
var thehtml;

  // 1 Doodle header 
  thehtml = "<hr> <b>doodle:</b><br> " +
        "<button onclick='wipeDoodle();' class='normbutton' >clear doodle</button> <br> ";
   AB.msg ( thehtml, 1 );

  // 2 Doodle variable data (guess)
  
  // 3 Training header
  thehtml = "<hr><b>training:</b><br>  " +
        " <button onclick='do_training = false;' class='normbutton' >stop training</button> <br> ";
  AB.msg ( thehtml, 3 );
     
  // 4 variable training data 
  
  // 5 Testing header
  thehtml = "<b><br>tests:</b> " ;
  AB.msg ( thehtml, 5 );
           
  // 6 variable testing data 
  
  // 7 Demo header 
  thehtml = "<hr><b>demo:</b><br>" +
    "<button onclick='makeDemo();' class='normbutton' >demo</button> <br> ";
   AB.msg ( thehtml, 7 );
   
  // 8 Demo variable data (random demo ID)
  // 9 Demo variable data (changing guess)
  
const greenspan = "<span style='font-weight:bold; color:darkgreen'> "  ;

//--- end of AB.msgs structure: ---------------------------------------------------------




function setup() 
{
  createCanvas ( canvaswidth, canvasheight );

  doodle = createGraphics ( ZOOMPIXELS, ZOOMPIXELS );       // doodle on larger canvas 
  doodle.pixelDensity(4);
  
// JS load other JS 
// maybe have a loading screen while loading the JS and the data set 

      AB.loadingScreen();
 
 $.getScript ( "/uploads/codingtrain/matrix.js", function()
 {
//   $.getScript ( "/uploads/codingtrain/nn.js", function()
//   {
        $.getScript ( "/uploads/codingtrain/mnist.js", function()
        {
            console.log ("All JS loaded");
//            nn = new NeuralNetworkMulti( [noinput, nohidden, nohidden/2, nooutput] );
              nn = new NeuralNetwork( noinput, nohidden, nooutput );
            nn.setLearningRate ( learningRate );
            loadData();
        });
//   });
 });
}



// load data set from local file (on this server)

function loadData()    
{
  loadMNIST ( function(data)    
  {
    mnist = data;
    console.log ("All data loaded into mnist object:")
    console.log(mnist);
    AB.removeLoading();     // if no loading screen exists, this does nothing 
  });
}



function getImage ( img )      // make a P5 image object from a raw data array   
{
    let theimage  = createImage (PIXELS, PIXELS);    // make blank image, then populate it 
    theimage.loadPixels();        
    
    for (let i = 0; i < PIXELSSQUARED ; i++) 
    {
        let bright = img[i];    // greyscale, so RGB the same
        let index = i * 4;
        theimage.pixels[index + 0] = bright;
        theimage.pixels[index + 1] = bright;
        theimage.pixels[index + 2] = bright;
        theimage.pixels[index + 3] = 255;
    }
    

    theimage.updatePixels();
    return theimage;
}


function getInputs ( img )      // convert img array into normalised input array 
{
    
    // todo: rotate image randomly
   let startTracking = false;
   var ignoreRows = 0;
    
    let inputs = [];
    
    for (let i = 0; i < PIXELSSQUARED ; i++)          
    {
        
        let bright = img[i];
        inputs[i] = bright / 255;       // normalise to 0 to 1
    } 
    return ( inputs );
}

var targets_count = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function trainit (show)        // train the network with a single exemplar, from global var "train_index", show visual on or off 
{
  let img   = mnist.train_images[train_index];
  let label = mnist.train_labels[train_index];
  
  // optional - show visual of the image 
  if (show && (trainrun > 1))                
  {
    var theimage = getImage ( img );    // get image from data array 
//    theimage.filter(POSTERIZE,2);

    
    image ( theimage,   0,                ZOOMPIXELS+50,    ZOOMPIXELS,     ZOOMPIXELS  );      // magnified 
    image ( theimage,   ZOOMPIXELS+50,    ZOOMPIXELS+50,    PIXELS,         PIXELS      );      // original
    
   
  }

  // set up the inputs
  let inputs = getInputs ( img );       // get inputs from data array 

  // set up the outputs
  let targets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  targets[label] = 1;       // change one output location to 1, the rest stay at 0 
    targets_count[label] += 1;
  // console.log(train_index);
  // console.log(inputs);
  // console.log(targets);

    var plearningRate = learningRate;
    
    if (dynamicLearning) {
        //  Reduce LearningRate as we become more accurate
        if (accuracy >= 0.90){
            learningRate = 1;
        } else if (accuracy >= 0.75) {
            learningRate = 5;
        } else if (accuracy >= 0.50){
            learningRate = 8;
        } else {
            // default rate is 12.5%
            learningRate = 10;
        }
        
        learningRate = learningRate * LEARNING_MULTIPLIER;
        //forget tiered learning, implement continuous rates
//        learningRate =  Math.round(1/(accuracy * 100)*100)/100;
        nn.setLearningRate(learningRate);
    }

    
  train_inputs = inputs;        // can inspect in console 
  nn.train ( inputs, targets );

  thehtml = "train: " + trainrun + " / " + train_index +
    "<br>learning rate: " + learningRate;
  
  let t1 = targets_count.reduce((a,b) => a + b, 0);
  
  // console.log("the targets are : " + targets_count);
  AB.msg ( thehtml, 4 );

  train_index++;
  if ( train_index == NOTRAIN ) 
  {
    train_index = 0;
    console.log( "finished trainrun: " + trainrun );
    trainrun++;
  }
}

var accuracy;

function testit()    // test the network with a single exemplar, from global var "test_index"
{ 
  let img   = mnist.test_images[test_index];
  let label = mnist.test_labels[test_index];

  // set up the inputs
  let inputs = getInputs ( img ); 
  
  test_inputs = inputs;        // can inspect in console 
  let prediction    = nn.predict(inputs);       // array of outputs 
  let guess         = findMax(prediction);      // the top output 

  total_tests++;
  if (guess == label)  total_correct++;

  accuracy = (total_correct / total_tests);
  let percent = accuracy* 100 ;
  
  thehtml =  "run: " + testrun + " / " + total_tests +
        " / " + total_correct +
        " / " + greenspan + percent.toFixed(2) + "%</span>";
  AB.msg ( thehtml, 6 );

  test_index++;
  if ( test_index == NOTEST ) 
  {
    console.log( "finished testrun: " + testrun + " score: " + percent.toFixed(2) );
    testrun++;
    test_index = 0;
    total_tests = 0;
    total_correct = 0;
  }
}


//--- find no.1 (and maybe no.2) output nodes ---------------------------------------
// (restriction) assumes array values start at 0 (which is true for output nodes) 


function find12 (a)         // return array showing indexes of no.1 and no.2 values in array 
{
  let no1 = 0;
  let no2 = 0;
  let no1value = 0;     
  let no2value = 0;
  
  for (let i = 0; i < a.length; i++) 
  {
    if (a[i] > no1value) 
    {
      no1 = i;
      no1value = a[i];
    }
    else if (a[i] > no2value) 
    {
      no2 = i;
      no2value = a[i];
    }
  }
  
  var b = [ no1, no2 ];
  return b;
}


// just get the maximum - separate function for speed - done many times 
// find our guess - the max of the output nodes array

function findMax (a)        
{
  let no1 = 0;
  let no1value = 0;     
  
  for (let i = 0; i < a.length; i++) 
  {
    if (a[i] > no1value) 
    {
      no1 = i;
      no1value = a[i];
    }
  }
  
  return no1;
}




// --- the draw function -------------------------------------------------------------
// every step:
 
function draw() 
{
  // check if libraries and data loaded yet:
  if ( typeof mnist == 'undefined' ) return;


// how can we get white doodle on black background on yellow canvas?
//        background('#ffffcc');    doodle.background('black');

      background ('black');
    
if ( do_training )    
{
  // do some training per step 
    for (let i = 0; i < TRAINPERSTEP; i++) 
    {
      if (i === 0)    trainit(true);    // show only one per step - still flashes by  
      else           trainit(false);
    }
    
  // do some testing per step 
    for (let i = 0; i < TESTPERSTEP; i++)
      testit();
}

  // keep drawing demo and doodle images 
  // and keep guessing - we will update our guess as time goes on 
  
  if ( demo_exists )
  {
    drawDemo();
    guessDemo();
  }
  
  if ( doodle_exists ){
    drawDoodle();
    guessDoodle();
  }


// detect doodle drawing 
// (restriction) the following assumes doodle starts at 0,0 

  if ( mouseIsPressed )         // gets called when we click buttons, as well as if in doodle corner  
  {
     // console.log ( mouseX + " " + mouseY + " " + pmouseX + " " + pmouseY );
     var MAX = ZOOMPIXELS + 20;     // can draw up to this pixels in corner 
     if ( (mouseX < MAX) && (mouseY < MAX) && (pmouseX < MAX) && (pmouseY < MAX) )
     {
        mousedrag = true;       // start a mouse drag 
        doodle_exists = true;
        doodle.stroke(DOODLE_COLOUR);               // change colour to match MNIST
        doodle.strokeWeight( DOODLE_THICK );
        doodle.line(mouseX, mouseY, pmouseX, pmouseY);      
     }
  }
  else 
  {
      // are we exiting a drawing
      if ( mousedrag )
      {
            mousedrag = false;
            // console.log ("Exiting draw. Now blurring.");
            // pixelate(doodle, 4);

            doodle.filter (POSTERIZE,DOODLE_POSTERIZE); // run posterize filter to reduce edges
            doodle.filter (BLUR, DOODLE_BLUR);          // just blur once 
            //   console.log (doodle);
    }
  }
}

var resizeDoodle = false;


//--- demo -------------------------------------------------------------
// demo some test image and predict it
// get it from test set so have not used it in training


function makeDemo()
{
    demo_exists = true;
    var  i = AB.randomIntAtoB ( 0, NOTEST - 1 );  
    
    demo        = mnist.test_images[i];     
    var label   = mnist.test_labels[i];
    
   thehtml =  "test[" + i + "]" + 
            " = " + label + "<br>" ;
   AB.msg ( thehtml, 8 );
   
   // type "demo" in console to see raw data 
}


function drawDemo()
{
    var theimage = getImage ( demo );
     //  console.log (theimage);
     
    image ( theimage,   0,                canvasheight - ZOOMPIXELS,    ZOOMPIXELS,     ZOOMPIXELS  );      // magnified 
    image ( theimage,   ZOOMPIXELS+50,    canvasheight - ZOOMPIXELS,    PIXELS,         PIXELS      );      // original
}


function guessDemo()
{
   let inputs = getInputs ( demo ); 
   
  demo_inputs = inputs;  // can inspect in console 
  
  let prediction    = nn.predict(inputs);       // array of outputs 
  let guess         = findMax(prediction);      // the top output 

   thehtml =   "predict: " + greenspan + guess + "</span>" ;
   AB.msg ( thehtml, 9 );
}




//--- doodle -------------------------------------------------------------

function drawDoodle()
{
    // doodle is createGraphics not createImage
    let theimage = doodle.get();
    
    // best method for matching MNIST is to reduce and enlarge
    theimage.loadPixels();
        theimage.resize ( PIXELS, PIXELS );
        theimage.resize ( ZOOMPIXELS, ZOOMPIXELS );
        theimage.updatePixels();

    image ( theimage,   0,                0,    ZOOMPIXELS,     ZOOMPIXELS  );      // original 
    image ( theimage,   ZOOMPIXELS+50,    0,    PIXELS,         PIXELS      );      // shrunk

}
      
      
function guessDoodle() 
{
   // doodle is createGraphics not createImage
   let img = doodle.get();
  
  img.resize ( PIXELS, PIXELS );     
  img.loadPixels();

  // set up inputs   
  let inputs = [];
  for (let i = 0; i < PIXELSSQUARED ; i++) 
  {
     inputs[i] = img.pixels[i * 4] / 255;
  }
  
  doodle_inputs = inputs;     // can inspect in console 

  // feed forward to make prediction 
  let prediction    = nn.predict(inputs);       // array of outputs 
  let b             = find12(prediction);       // get no.1 and no.2 guesses  
    showMatrix = false;


  thehtml =   "predict 1: " + greenspan + b[0] + "</span> <br>" +
              "predict 2: " + greenspan + b[1] + "</span>";
  AB.msg ( thehtml, 2 );
}
var showMatrix = false;

function wipeDoodle()    
{
    doodle_exists = false;
    doodle.background('black');
}




// --- debugging --------------------------------------------------
// in console
// showInputs(demo_inputs);
// showInputs(doodle_inputs);


function showInputs ( inputs )
// display inputs row by row, corresponding to square of pixels 
{
    var str = "";
    for (let i = 0; i < inputs.length; i++) 
    {
      if ( i % PIXELS === 0 )    str = str + "\n";                                   // new line for each row of pixels 
      var value = inputs[i];
      str = str + " " + value.toFixed(2) ; 
    }
    console.log (str);
}


// Other techniques for learning

/*
class ActivationFunction {
  constructor(func, dfunc) {
    this.func = func;
    this.dfunc = dfunc;
  }
}

let sigmoid = new ActivationFunction(
  x => 1 / (1 + Math.exp(-x)),
  y => y * (1 - y)
);

let tanh = new ActivationFunction(
  x => Math.tanh(x),
  y => 1 - (y * y)
);

let rhlu = new ActivationFunction(
  x => x < 0 ? 0 : x,
  y => y < 0 ? 0 : 1
);

let dsigmoid = new ActivationFunction(
  x => x * (1 - x),
  y => 1 / (1 + Math.exp(-y))
);
*/

// New Activation Functions with storage
class ActivationFunction {
    constructor(func, dfunc, use_X_values = false) {
        this.func = func;
        this.dfunc = dfunc;
        this.use_X_values = use_X_values;
    }
}

// Range (0, 1)
let sigmoid = new ActivationFunction(
    x => 1 / (1 + Math.exp(-x)),
    y => y * (1 - y)
);

// Range (-1, 1)
let tanh = new ActivationFunction(
    x => Math.tanh(x),
    y => 1 - (y * y)
);

// Range (-PI/2, PI/2)
let arctan = new ActivationFunction(
    x => Math.atan(x),
    y => 1 / ((y * y) + 1),
    use_X_values = true
);

// Range (-1, 1)
let softsign = new ActivationFunction(
    x => x / (1 + Math.abs(x)),
    y => 1 / Math.pow((Math.abs(y) + 1), 2),
    use_X_values = true
);

// Range [0, INFINITY)
let relu = new ActivationFunction(
    x => x < 0 ? 0 : x,
    y => y < 0 ? 0 : 1,
    use_X_values = true
);

// Range (-INFINITY, INFINITY)
let leaky_relu = new ActivationFunction(
    x => x < 0 ? 0.01 * x : x,
    y => y < 0 ? 0.01 : 1,
    use_X_values = true
);

// Range (0, INFINITY)
let softplus = new ActivationFunction(
    x => Math.log(1 + Math.exp(x)),
    y => 1 / (1 + Math.exp(-y)),
    use_X_values = true
);

// Range (0, 1]
let gaussian = new ActivationFunction(
    x => Math.exp(-1 * (x * x)),
    y => -2 * y * Math.exp(-1 * (y * y)),
    use_X_values = true
);


// nn.js imported to make it easier to code in Ancient Brain

class NeuralNetwork {
  /*
  * if first argument is a NeuralNetwork the constructor clones it
  * USAGE: cloned_nn = new NeuralNetwork(to_clone_nn);
  */
  constructor(in_nodes, hid_nodes, out_nodes) {
    if (in_nodes instanceof NeuralNetwork) {
      let a = in_nodes;
      this.input_nodes = a.input_nodes;
      this.hidden_nodes = a.hidden_nodes;
      this.output_nodes = a.output_nodes;

      this.weights_ih = a.weights_ih.copy();
      this.weights_ho = a.weights_ho.copy();

      this.bias_h = a.bias_h.copy();
      this.bias_o = a.bias_o.copy();
    } else {
      this.input_nodes = in_nodes;
      this.hidden_nodes = hid_nodes;
      this.output_nodes = out_nodes;

      this.weights_ih = new Matrix(this.hidden_nodes, this.input_nodes);
      this.weights_ho = new Matrix(this.output_nodes, this.hidden_nodes);
      this.weights_ih.randomize();
      this.weights_ho.randomize();

      this.bias_h = new Matrix(this.hidden_nodes, 1);
      this.bias_o = new Matrix(this.output_nodes, 1);
      this.bias_h.randomize();
      this.bias_o.randomize();
    }

    // TODO: copy these as well
    this.setLearningRate();
    this.setActivationFunction();


  }

  predict(input_array) {

    // Generating the Hidden Outputs
    let inputs = Matrix.fromArray(input_array);
    let hidden = Matrix.multiply(this.weights_ih, inputs);
    hidden.add(this.bias_h);
    // activation function!
    hidden.map(this.activation_function.func);

    // crude debugging
    var arr = this.weights_ho.toArray();
    for (var x = 0;x<arr.length;x++){
        arr[x] = Math.round(arr[x]*10); 
    }
    
    if (showMatrix) console.log("predict.hidden : "+ arr); // trying to do debugging


    // Generating the output's output!
    let output = Matrix.multiply(this.weights_ho, hidden);
    output.add(this.bias_o);
     output.map(this.activation_function.func);




    // Sending back to the caller!
    return output.toArray();
  }

  setLearningRate(learning_rate = 0.1) {
    this.learning_rate = learning_rate;
  }


// Test Activation Functions
  setActivationFunction(func = sigmoid) {
    this.activation_function = func;
  }

  train(input_array, target_array) {
    // Generating the Hidden Outputs
    let inputs = Matrix.fromArray(input_array);
    let hidden = Matrix.multiply(this.weights_ih, inputs);
    hidden.add(this.bias_h);
    // activation function!
    
            let xHidden;
        if (this.activation_function.use_X_values) {
            xHidden = new Matrix(hidden.rows, hidden.cols).add(hidden);

            // xHidden = Matrix.duplicate(hidden)
        }
    
    
    hidden.map(this.activation_function.func);

    // Generating the output's output!
//    let outputs = Matrix.multiply(this.weights_ho, hidden);
//    outputs.add(this.bias_o);
//    outputs.map(this.activation_function.func);

        let outputs = Matrix.multiply(this.weights_ho, hidden);
        outputs.add(this.bias_o);
        // Create Copy of outputs matrix if needed.
        let xOutputs;
        if (this.activation_function.use_X_values) {
            xOutputs = new Matrix(outputs.rows, outputs.cols).add(outputs);
            // xOutputs = Matrix.duplicate(outputs)
        }
        outputs.map(this.activation_function.func);


    // Convert array to matrix object
    let targets = Matrix.fromArray(target_array);

    // Calculate the error
    // ERROR = TARGETS - OUTPUTS
    let output_errors = Matrix.subtract(targets, outputs);

    // let gradient = outputs * (1 - outputs);
    // Calculate gradient
    let gradients /*= Matrix.map(outputs, this.activation_function.dfunc)*/;
        if (this.activation_function.use_X_values) {
            gradients = Matrix.map(xOutputs, this.activation_function.dfunc);
        } else {
            gradients = Matrix.map(outputs, this.activation_function.dfunc);
        }
    gradients.multiply(output_errors);
    gradients.multiply(this.learning_rate);



    // Calculate deltas
    let hidden_T = Matrix.transpose(hidden);
    let weight_ho_deltas = Matrix.multiply(gradients, hidden_T);

    // Adjust the weights by deltas
    this.weights_ho.add(weight_ho_deltas);
    // Adjust the bias by its deltas (which is just the gradients)
    this.bias_o.add(gradients);

    // Calculate the hidden layer errors
    let who_t = Matrix.transpose(this.weights_ho);
    let hidden_errors = Matrix.multiply(who_t, output_errors);

    // Calculate hidden gradient
    // let hidden_gradient = Matrix.map(hidden, this.activation_function.dfunc);
            let hidden_gradient;
        if (this.activation_function.use_X_values) {
            hidden_gradient = Matrix.map(xHidden, this.activation_function.dfunc);
        } else {
            hidden_gradient = Matrix.map(hidden, this.activation_function.dfunc);
        }
        
    hidden_gradient.multiply(hidden_errors);
    hidden_gradient.multiply(this.learning_rate);

    // Calcuate input->hidden deltas
    let inputs_T = Matrix.transpose(inputs);
    let weight_ih_deltas = Matrix.multiply(hidden_gradient, inputs_T);

    this.weights_ih.add(weight_ih_deltas);
    // Adjust the bias by its deltas (which is just the gradients)
    this.bias_h.add(hidden_gradient);

    // outputs.print();
    // targets.print();
    // error.print();
  }

  serialize() {
    return JSON.stringify(this);
  }

  static deserialize(data) {
    if (typeof data == 'string') {
      data = JSON.parse(data);
    }
    let nn = new NeuralNetwork(data.input_nodes, data.hidden_nodes, data.output_nodes);
    nn.weights_ih = Matrix.deserialize(data.weights_ih);
    nn.weights_ho = Matrix.deserialize(data.weights_ho);
    nn.bias_h = Matrix.deserialize(data.bias_h);
    nn.bias_o = Matrix.deserialize(data.bias_o);
    nn.learning_rate = data.learning_rate;
    return nn;
  }


  // Adding function for neuro-evolution
  copy() {
    return new NeuralNetwork(this);
  }

  // Accept an arbitrary function for mutation
  mutate(func) {
    this.weights_ih.map(func);
    this.weights_ho.map(func);
    this.bias_h.map(func);
    this.bias_o.map(func);
  }
}


// Did not work as well as double resize!
function pixelate(doodle, sample_size) {
    
  var image = doodle.pixels;

  var w = ZOOMPIXELS;
  var h = ZOOMPIXELS;

  for (var y = 0; y < h; y += sample_size) {
    for (var x = 0; x < w; x += sample_size) {

      var pos = (x + y * w) * 4;
      var red = doodle[pos];
      var green = doodle[pos + 1];
      var blue = doodle[pos + 2];
      
      for (var n = 1;n<sample_size;n++)
      {
        doodle[pos+(4*n)+0] = red;
        doodle[pos+(4*n)+1] = green;
        doodle[pos+(4*n)+2] = blue;
      }
    }
  }
}
    
    
    
// MultiArray Neural Network
// from: https://github.com/Fir3will/Java-Neural-Network
// Allows multi hidden array
class NeuralNetworkMulti {
  constructor(arr, lr) {
    this.nodes = arr
    this.lr = lr || 0.01
    this.activation = NeuralNetworkMulti.sigmoid
    this.dactivation = NeuralNetworkMulti.dsigmoid;
    this.weights = []
    this.biases = []
    for (let i = 0; i < this.nodes.length - 1; i++) {
      this.weights.push(new Matrix(this.nodes[i + 1], this.nodes[i]).randomize())
    }
    for (let i = 1; i < this.nodes.length; i++) {
      this.biases.push(new Matrix(this.nodes[i], 1).randomize())
    }
  }
  static tanh(x) {
    var y = Math.tanh(x);
    return y;
  }
  static dtanh(x) {
    var y = 1 / (pow(Math.cosh(x), 2));
    return y;
  }
  static sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }
  static dsigmoid(y) {
    // return sigmoid(x) * (1s - sigmoid(x));
    return y * (1 - y);
  }
  
  // define rhlu
static rhlu(x){
  return x < 0 ? 0 : x;
} 

static drhlu(x){
  return x < 0 ? 0 : 1;
}

  
  predict(input_arr) {
    let input = Matrix.fromArray(input_arr)
    for (let i = 0; i < this.weights.length; i++) {
      input = Matrix.multiply(this.weights[i], input)
      input.add(this.biases[i])
      input.map(this.activation)
    }
    return input.toArray()
  }
  train(input_arr, target_arr) {
    let target = Matrix.fromArray(target_arr)
    let output = Matrix.fromArray(this.predict(input_arr))
    let O = []
    let input = Matrix.fromArray(input_arr)
    for (let i = 0; i < this.weights.length; i++) {
      O.push(input)
      input = Matrix.multiply(this.weights[i], input)
      input.add(this.biases[i])
      input.map(this.activation)
    }
    let error = Matrix.subtract(target, output)
    let gradient = Matrix.map(output, this.dactivation)
    gradient.multiply(error)
    gradient.multiply(this.lr)
    for (let i = O.length - 1; i >= 0; i--) {
      let dw = Matrix.multiply(gradient, Matrix.transpose(O[i]))
      this.weights[i].add(dw)
      this.biases[i].add(gradient)
      error = Matrix.multiply(Matrix.transpose(this.weights[i]), error)
      gradient = Matrix.map(O[i], this.dactivation)
      gradient.multiply(error)
      gradient.multiply(this.lr)
    }
  }
  getModel() {
    let model = this
    let k = {
      nodes: model.nodes,
      lr: model.lr,
      activation: model.activation,
      dactivation: model.dactivation,
      weights: [],
      biases: []
    }
    for (let weight of model.weights) {
      let s = {
        rows: weight.rows,
        cols: weight.cols,
        data: []
      }
      for (let d of weight.data) {
        let a = []
        for (let l of d) {
          a.push(l)
        }
        s.data.push(a)
      }
      k.weights.push(s)
    }
    for (let bias of model.biases) {
      let s = {
        rows: bias.rows,
        cols: bias.cols,
        data: bias.data
      }
      k.biases.push(s)
    }
    return k
  }
  static formModel(model) {
    let nn = new NeuralNetworkMulti(model.nodes, model.lr)
    nn.nodes = model.nodes
    nn.lr = model.lr
    nn.activation = model.activation
    nn.dactivation = model.dactivation
    for (let i = 0; i < nn.weights.length; i++) {
      nn.weights[i].rows = model.weights[i].rows
      nn.weights[i].cols = model.weights[i].cols
      for (let j = 0; j < model.weights[i].rows; j++) {
        for (let k = 0; k < model.weights[i].cols; k++) {
          nn.weights[i].data[j][k] = model.weights[i].data[j][k]
        }
      }
      nn.weights[i].rows = model.weights[i].rows
    }
    return nn
  }
  copy() {
    let model = this.getModel()
    return NeuralNetworkMulti.formModel(model)
  }
  mutate(func) {
    for (let weight of this.weights) {
      weight.map(func)
    }
    for (let bias of this.biases) {
      bias.map(func);
    }
  }
  merge(net, ratio = 0.5){
    let r1 = 1- ratio;
    let r2 = ratio;
    for(let i=0; i<this.nodes.length; i++){
      if(this.nodes[i] != net.nodes[i]){
        console.error("Neural Networks can not be merged");
        return; 
      }
    }
    this.lr = (this.lr*r1)+(net.lr*r2);
    for(let i=0; i<this.weights.length; i++){
      for (let j = 0; j < this.weights[i].rows; j++) {
        for (let k = 0; k < this.weights[i].cols; k++) {
          this.weights[i].data[j][k] = (this.weights[i].data[j][k]*r1)+(net.weights[i].data[j][k]*r2);
        }
      }
    }
    for (let i = 0; i < this.biases.length; i++) {
      for (let j = 0; j < this.biases[i].rows; j++) {
        for (let k = 0; k < this.biases[i].cols; k++) {
          this.biases[i].data[j][k] = (this.biases[i].data[j][k] * r1) + (net.biases[i].data[j][k] * r2);
        }
      }
    }
    return this;
  }
  setActivation(activation, dactivation) {
    this.activation = activation;
    this.dactivation = dactivation;
  }
  setLearningRate(lr) {
    this.lr = lr;
  }
}
    