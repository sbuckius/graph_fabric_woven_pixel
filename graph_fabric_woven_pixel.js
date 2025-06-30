let input, submitButton, showGraphButton, showPatternButton, restartButton;
let saveGraphButton, savePatternButton, saveDataButton;
let weaveSelector;
let responses = {};
let responseList = [];
let responseImages = {};
let images = [];
let database;
let showPattern = false;
let totalResponses = 0;
let tileSize = 20;

function preload() {
  for (let i = 1; i <= 6; i++) {
    images.push(loadImage('images/img_' + i + '.png'));
  }
}

function setup() {
  createCanvas(800, 400);
  input = createInput();
  input.position(20, 20);

  submitButton = createButton('Submit');
  submitButton.position(input.x + input.width + 10, 20);
  submitButton.mousePressed(handleSubmit);

  showGraphButton = createButton('Show Bar Graph');
  showGraphButton.position(submitButton.x + submitButton.width + 10, 20);
  showGraphButton.mousePressed(() => {
    showPattern = false;
    redraw();
  });

  showPatternButton = createButton('Show Pattern');
  showPatternButton.position(showGraphButton.x + showGraphButton.width + 10, 20);
  showPatternButton.mousePressed(() => {
    showPattern = true;
    redraw();
  });

  saveGraphButton = createButton('Save Graph');
  saveGraphButton.position(showPatternButton.x + showPatternButton.width + 10, 20);
  saveGraphButton.mousePressed(() => {
    showPattern = false;
    redraw();
    saveCanvas('bar_graph', 'png');
  });

  savePatternButton = createButton('Save Pattern');
  savePatternButton.position(saveGraphButton.x + saveGraphButton.width + 10, 20);
  savePatternButton.mousePressed(() => {
    showPattern = true;
    redraw();
    saveCanvas('jacquard_pattern', 'png');
  });

  restartButton = createButton('Restart');
  restartButton.position(savePatternButton.x + savePatternButton.width + 10, 20);
  restartButton.mousePressed(() => {
    if (confirm("Reset all data?")) resetGraph();
  });

  saveDataButton = createButton('Save CSV');
  saveDataButton.position(restartButton.x + restartButton.width + 10, 20);
  saveDataButton.mousePressed(saveDataToCSV);

  weaveSelector = createSelect();
  weaveSelector.position(20, height + 10);
  ["plain", "twill", "satin", "basket", "pointed", "herringbone", "warp rib", "weft rib", "double"].forEach(style => {
    weaveSelector.option(style);
  });
  weaveSelector.selected("twill");
  weaveSelector.changed(() => redraw());

  const firebaseConfig = {
    apiKey: "AIzaSyCj71SpCy3aCXPhVhRFWK2ieovrmK-568k",
    authDomain: "game1dataunbiased.firebaseapp.com",
    databaseURL: "https://game1dataunbiased-default-rtdb.firebaseio.com",
    projectId: "game1dataunbiased",
    storageBucket: "game1dataunbiased.appspot.com",
    messagingSenderId: "427174534513",
    appId: "1:427174534513:web:2b309de3a1ec2d62c92ad0"
  };

  firebase.initializeApp(firebaseConfig);
  database = firebase.database();

  database.ref("responses").on("child_added", snapshot => {
    let response = snapshot.val().response;
    totalResponses++;

    if (totalResponses >= 100) {
      alert("100 responses reached. Resetting graph.");
      resetGraph();
      return;
    }

    if (responses[response]) {
      responses[response]++;
    } else {
      responses[response] = 1;
      responseList.push(response);
      responseImages[response] = random(images);
    }

    redraw();
  });

  noLoop();
  redraw();
}

function draw() {
  background(255);
  fill(0);
  textSize(14);
  textAlign(LEFT);
  text("Does AI support you by saving you time at home?", 20, 60);

  if (showPattern) {
    drawJacquardPattern();
  } else {
    drawBarGraph();
  }
}

function handleSubmit() {
  let val = input.value().trim();
  if (val !== "") {
    database.ref("responses").push({ response: val, timestamp: Date.now() });
    input.value('');
  }
}

function drawBarGraph() {
  let barWidth = width / max(responseList.length, 1);
  let maxCount = max(Object.values(responses));

  for (let i = 0; i < responseList.length; i++) {
    let resp = responseList[i];
    let count = responses[resp];
    let barHeight = map(count, 0, maxCount, 0, height - 100);
    let img = responseImages[resp];

    if (img) {
      for (let y = height - barHeight - 20; y < height - 20; y += img.height) {
        for (let x = i * barWidth + 20; x < i * barWidth + 20 + barWidth - 30; x += img.width) {
          image(img, x, y, img.width, img.height);
        }
      }
    }

    fill(0);
    textSize(12);
    textAlign(CENTER);
    text(resp, i * barWidth + 20 + (barWidth - 30) / 2, height - 5);
  }
}

function drawJacquardPattern() {
  background(245);
  const style = weaveSelector.value();
  const cols = ceil(width / tileSize);
  const rows = ceil(height / tileSize);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let patternIndex;

      switch (style) {
        case "plain":
          patternIndex = ((x + y) % 2 === 0) ? x : y;
          break;

        case "twill":
          patternIndex = (x + y);
          break;

        case "satin":
          patternIndex = (x * 5 + y * 3);
          break;

        case "basket":
          patternIndex = ((x % 4 < 2) === (y % 4 < 2)) ? x : y;
          break;

        case "pointed":
          const zig = abs((x % 8) - 4);
          patternIndex = (y % 8 === zig) ? x : y;
          break;

        case "herringbone":
          const dir = (floor(y / 8) % 2 === 0) ? 1 : -1;
          patternIndex = (x + dir * y);
          break;

        case "warp rib":
          patternIndex = (x % 4 < 3) ? x : y;
          break;

        case "weft rib":
          patternIndex = (y % 4 < 3) ? y : x;
          break;

        case "double":
          patternIndex = ((x + y) % 4 < 2) ? x : y;
          break;

        default:
          patternIndex = x + y;
      }

      patternIndex = abs(patternIndex) % responseList.length;
      const resp = responseList[patternIndex];
      const img = responseImages[resp];
      if (!img) continue;

      image(img, x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  fill(0);
  textSize(12);
  textAlign(LEFT);
  text("Weave: " + style, 20, height - 10);
}

function resetGraph() {
  database.ref("responses").remove();
  responses = {};
  responseList = [];
  responseImages = {};
  totalResponses = 0;
  redraw();
}

function saveDataToCSV() {
  let rows = [["Response", "Count"]];
  for (let resp of responseList) {
    rows.push([resp, responses[resp]]);
  }
  let csv = rows.map(row => row.join(",")).join("\n");
  let blob = new Blob([csv], { type: 'text/csv' });
  let a = createA(URL.createObjectURL(blob), 'responses.csv');
  a.attribute("download", "responses.csv");
  a.hide();
  a.elt.click();
}
