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
    