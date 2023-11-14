const prompt = require('prompt-sync')();

class Node {
  constructor(id, isStart = false, isEnd = false) {
    this.value = 0;
    this.error = 0;
    this.id = id;
    this.isStart = isStart;
    this.isEnd = isEnd;
  }

  print() {
    console.log(`Node ${this.id} value: ${this.value} error: ${this.error}`);
  }
}

class Edge {
  constructor(from, to) {
    this.weight = Math.random().toFixed(3);
    this.from = from;
    this.to = to;
  }
  print() {
    console.log(`Edge from ${this.from} to ${this.to} weight: ${this.weight}`);
  }
}

class Network {
  static learningCoefficient = 0.1;
  constructor() {
    this.startNodes = [];
    this.edges = [];
    this.midNodes = [];
    this.outputNodes = [];
    this.expectedOutputs = [0, 0];
  }

  addStartNode(node) {
    this.startNodes.push(node);
  }

  addMidNode(node) {
    this.midNodes.push(node);
  }

  addOutputNode(node) {
    this.outputNodes.push(node);
  }

  addEdge(edge) {
    this.edges.push(edge);
  }

  getEdgesTo(to) {
    return this.edges.filter((edge) => edge.to === to);
  }

  getEdgesFrom(from) {
    return this.edges.filter((edge) => edge.from === from);
  }
  getNode(id) {
    return [...this.startNodes, ...this.midNodes, ...this.outputNodes].find(
      (node) => node.id === id
    );
  }

  init(startNodeCount, outputNodeCount, midNodeCount) {
    for (let i = 0; i < startNodeCount; i++) {
      const startNode = new Node(i, true, false);
      this.addStartNode(startNode);
    }

    for (let i = 0; i < outputNodeCount; i++) {
      const outputNode = new Node(i + 5, false, true);
      this.addOutputNode(outputNode);
    }

    for (let i = 0; i < midNodeCount; i++) {
      const id = Math.floor(Math.random() * 1000);
      const node = new Node(id);
      this.addMidNode(node);

      // start to mid node
      for (let startNode of this.startNodes) {
        this.addEdge(new Edge(startNode.id, node.id));
      }

      // mid to output node
      for (let outputNode of this.outputNodes) {
        this.addEdge(new Edge(node.id, outputNode.id));
      }
    }
  }

  epoch(startValues, expectedOutputs) {
    for (let i = 0; i < startValues.length; i++) {
      this.startNodes[i].value = startValues[i];
    }
    this.expectedOutputs = expectedOutputs;

    this.forward();
    this.backward();
    this.print();
  }

  forward() {
    for (let midNode of this.midNodes) {
      let net = 0;
      const edges = this.getEdgesTo(midNode.id);
      for (let edge of edges) {
        const fromNode = this.getNode(edge.from);
        net += fromNode.value * edge.weight;
      }
      midNode.value = (1 / (1 + Math.exp(-net))).toFixed(3);
    }

    for (let outputNode of this.outputNodes) {
      let net = 0;
      const edges = this.getEdgesTo(outputNode.id);
      for (let edge of edges) {
        const fromNode = this.getNode(edge.from);
        net += fromNode.value * edge.weight;
      }
      outputNode.value = (1 / (1 + Math.exp(-net))).toFixed(3);
    }
  }

  backward() {
    for (let i = 0; i < this.outputNodes.length; i++) {
      this.outputNodes[i].error = (
        this.outputNodes[i].value *
        (1 - this.outputNodes[i].value) *
        (this.expectedOutputs[i] - this.outputNodes[i].value)
      ).toFixed(3);
    }

    for (let midNode of this.midNodes) {
      let sigma = 0;
      const edges = this.getEdgesFrom(midNode.id);
      for (let edge of edges) {
        const toNode = this.getNode(edge.to);
        sigma += toNode.error * edge.weight;
      }
      midNode.error = (midNode.value * (1 - midNode.value) * sigma).toFixed(3);
    }

    // update weights
    for (let edge of this.edges) {
      const fromNode = this.getNode(edge.from);
      const toNode = this.getNode(edge.to);

      // old value + amount of change
      edge.weight = (
        Number(edge.weight) +
        Network.learningCoefficient * toNode.error * fromNode.value
      ).toFixed(3);
    }
  }

  print() {
    [...this.startNodes, ...this.midNodes, ...this.outputNodes].forEach(
      (node) => node.print()
    );

    this.edges.forEach((edge) => edge.print());
  }

  end() {
    console.log('---------------------------------');
    let totalError = 0;
    for (let i = 0; i < this.outputNodes.length; i++) {
      totalError += Math.pow(
        this.expectedOutputs[i] - this.outputNodes[i].value,
        2
      );
    }

    console.log(`Total error: ${totalError / 2}`);
  }
}

const network = new Network();

const starts = [
  [0, 0, 0, 1],
  [0, 0, 1, 0],
  [0, 1, 0, 0],
  [1, 0, 0, 0],
];
const outputs = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

const midNodeCount = parseInt(prompt('Enter mid node count: '));
const epochCount = parseInt(prompt('Enter epoch count: '));
network.init(4, 2, midNodeCount);
for (let i = 0; i < epochCount; i++) {
  console.log(`---------EPOCH - ${i + 1}----------`);
  for (let i = 0; i < starts.length; i++) {
    // network.init(starts, outputs)
    console.log(`---------LINE - ${i}----------`);
    network.epoch(starts[i], outputs[i]);
  }
  network.end();
}
