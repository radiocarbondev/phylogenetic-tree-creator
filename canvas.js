const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = innerWidth - 50;
canvas.height = innerHeight - (innerHeight / 20);

const xOffsetInput = document.getElementById('xOffsetInput');
const yOffsetInput = document.getElementById('yOffsetInput');
const scaleSlider = document.getElementById('scaleInput');
const selectBtn = document.getElementById('selectBtn');
const deleteBtn = document.getElementById('deleteBtn');
const lineBtn = document.getElementById('lineBtn');
const textBtn = document.getElementById('textBtn');
const selectionX = document.getElementById('selectionX');
const selectionY = document.getElementById('selectionY');
const selectionStyle = document.getElementById('selectionStyle');
const selectionText = document.getElementById('selectionText');
const contextMenu = document.getElementById('contextMenu');
const filesToolbar = document.getElementById('toolbar3');
const filesBtn = document.getElementById('filesBtn');
const filesBackBtn = document.getElementById('filesBackBtn');
const newFileBtn = document.getElementById('newFileBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');


// classes
class TextBox {
  constructor(x, y, content, style) {
    this.x = x;
    this.y = y;
    this.content = content;
    this.style = style;
    this.box = {
      x: 0,
      y: 0,
      width: 100,
      height: 100
    }
  }
}

class Line {
  constructor(startX, startY, endX, endY) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
  }
}

class Style {
  constructor(primaryColor,secondaryColor) {
    this.primaryColor = primaryColor;
    this.secondaryColor = secondaryColor;
  }
}

class File {
  constructor(title, lines, textBoxes, camera, styles) {
    this.title = title;
    this.lines = lines;
    this.textBoxes = textBoxes;
    this.camera = camera;
    this.styles = styles;
  }
}

if (localStorage.getItem('storedFiles')===null){
  localStorage.setItem("storedFiles",JSON.stringify({
    files: []
  }));
}
//
// console.log(JSON.parse(localStorage.getItem('storedFiles')));

// functions

function drawLineItem(startX,startY,endX,endY) {
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(convertX(startX),convertY(startY));
  ctx.bezierCurveTo(
    convertX(startX),
    convertY(endY),
    convertX(endX),
    convertY(startY),
    convertX(endX),
    convertY(endY)
  );
  ctx.stroke();
  ctx.fillStyle = 'darkgrey';
  ctx.beginPath();
  ctx.arc(convertX(startX),convertY(startY),5,0,Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(convertX(endX),convertY(endY),5,0,Math.PI*2);
  ctx.fill();
}

function drawTextItem(xText,yText,content,style,box) {
  let x = convertX(xText);
  let y = convertY(yText);
  ctx.font = `${100}px Arial`;
  box.width = ctx.measureText(content).width+box.height*.5;
  ctx.fillStyle = styles[style].primaryColor;
  ctx.strokeStyle = styles[style].secondaryColor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.rect(x, y, box.width * camera.scale, box.height * camera.scale);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.fillStyle = styles[style].secondaryColor;
  ctx.lineWidth = 2;
  ctx.font = `${100*camera.scale}px Arial`;
  ctx.fillText(content,x+box.height*camera.scale*.25,(y+box.height*camera.scale)-(.1*box.height)*camera.scale);
  ctx.strokeText(content,x+box.height*camera.scale*.25,(y+box.height*camera.scale)-(.1*box.height)*camera.scale);

}

function dist(x1, y1, x2, y2) {
  let a = x1 - x2;
  let b = y1 - y2;
  return Math.sqrt(a*a+b*b);
}

function drawLines() {
  file.lines.forEach(lineItem => {
    drawLineItem(lineItem.startX,lineItem.startY,lineItem.endX,lineItem.endY);
  });
}

function drawText() {
  file.textBoxes.forEach(textItem => {
    drawTextItem(textItem.x,textItem.y,textItem.content,textItem.style,textItem.box);
  });
}

function isPointInside(pointX,pointY,boxX,boxY,boxWidth,boxHeight) {
  let startX = convertX(boxX);
  let startY = convertY(boxY);
  let endX = startX + (boxWidth*camera.scale);
  let endY = startY + (boxHeight*camera.scale);
  if (
    pointX >= startX &&
    pointX <= endX &&
    pointY >= startY &&
    pointY <= endY
  ) {
    return true;
  } else {
    return false;
  }
}

// converts x value to canvas coords
function convertX(offset) {
  return  (offset*camera.scale)+camera.xOffset+(selection.wheel.xOffset);
}

// converts y value to canvas coords
function convertY(offset) {
  return (offset*camera.scale)+camera.yOffset+(selection.wheel.yOffset);
}

// converts canvas x value to space coords
function deconvertX(offset) {
  return ((offset)/camera.scale)-((camera.xOffset)/camera.scale);
}

// converts canvas y value to space coords
function deconvertY(offset) {
  return ((offset)/camera.scale)-((camera.yOffset)/camera.scale);
}

function onCanvas(x,y) {
  if (
    x <= canvasSize.endX &&
    x >= canvasSize.startX &&
    y >= canvasSize.startY &&
    y <= canvasSize.endY
  ) {
    return true;
  } else {return false};
}

function manageEvents() {
  if (selection.wheel.wheelDown) {
    selection.wheel.xOffset = selection.mouse.x - selection.wheel.pivotX;
    selection.wheel.yOffset = selection.mouse.y - selection.wheel.pivotY;
    xOffsetInput.value = Math.floor(camera.xOffset+selection.wheel.xOffset);
    yOffsetInput.value = Math.floor(camera.yOffset+selection.wheel.yOffset);
  } else {
    camera.xOffset += selection.wheel.xOffset;
    camera.yOffset += selection.wheel.yOffset;
    selection.wheel.xOffset = 0;
    selection.wheel.yOffset = 0;
  }

  if (selection.selectItem.selectedList != -1) {
    switch (selection.selectItem.selectedList) {
      case 0: {
          if (selection.selectItem.selectedSide == 0) {
            file.lines[selection.selectItem.selectedIndex].startX = deconvertX(selection.mouse.x);
            file.lines[selection.selectItem.selectedIndex].startY = deconvertY(selection.mouse.y);
          }
          if (selection.selectItem.selectedSide == 1) {
            file.lines[selection.selectItem.selectedIndex].endX = deconvertX(selection.mouse.x);
            file.lines[selection.selectItem.selectedIndex].endY = deconvertY(selection.mouse.y);
          }
      }
        break;
      case 1: {
        if (selection.selectItem.typing) break;
        file.textBoxes[selection.selectItem.selectedIndex].x = deconvertX(selection.mouse.x) - selection.selectItem.pivotX;
        file.textBoxes[selection.selectItem.selectedIndex].y = deconvertY(selection.mouse.y) - selection.selectItem.pivotY;
      }
        break;
    }
  }
}

function saveFile() {
  if(currentFileIndex<0)return;
  file.camera = camera;
  file.styles = styles;
  storedFiles.files[currentFileIndex] = file;
  localStorage.setItem('storedFiles',JSON.stringify(storedFiles));
  loadFiles();
}

function loadFile(index) {
  file = storedFiles.files[index];
  styles = storedFiles.files[index].styles;
  camera = storedFiles.files[index].camera;
  currentFileIndex = index;
}

function loadFiles() {
  storedFiles = JSON.parse(localStorage.getItem('storedFiles'));
  document.getElementById('tabs').innerHTML = '';
  storedFiles.files.forEach((item, i) => {
    document.getElementById('tabs').innerHTML += `<button onclick="loadFile(${i})">${item.title}</button>`;
  });

}

function newFile(name) {
  storedFiles.files.push(new File(
    name,
    [],
    [],
    {xOffset:0,yOffset:0,scale:1},
    [new Style('#2c2d2d','#e0e0e0')]
  ));
  localStorage.setItem('storedFiles',JSON.stringify(storedFiles));
  loadFiles();
}

function importFile(importedFile) {
  storedFiles.files.push(JSON.parse(importedFile));
  localStorage.setItem('storedFiles',JSON.stringify(storedFiles));
  loadFiles();
}

// variables

let animationId;
let file;
// {
//   title: 'title',
//   lines: [],
//   textBoxes: [],
//   camera: {
//     xOffset: 0,
//     yOffset: 0,
//     scale: 1
//   },
//   styles: [
//     new Style('#2c2d2d','#e0e0e0')
//   ]
// };
let styles;
let camera;
let selection = {
  mouse: {
    x: 0,
    y: 0,
    mousedown: false
  },
  selectItem: {
    selecting: false,
    typing: false,
    selectedList: -1,
    selectedIndex: -1,
    selectedSide: -1,
    pivotX: -1,
    pivotY: -1
  },
  wheel: {
    pivotX: 0,
    pivotY: 0,
    xOffset: 0,
    yOffset: 0,
    wheelDown: false
  },
  selectionMode: 'select',
  tempLine: {
    x1: 0,
    y1: 0,
    active: false
  }
}
let canvasSize = {
  startX: 0,
  startY: innerHeight / 20,
  endX: innerWidth - 50,
  endY: innerHeight - (innerHeight / 20)
};
let storedFiles;
let currentFileIndex = -1;
mouseIsOnCanvas = false;

loadFiles();

// event loop

if (storedFiles.files.length === 0) newFile(prompt('Name of new file:'));

loadFile(0);

xOffsetInput.value = Math.floor(camera.xOffset+selection.wheel.xOffset);
yOffsetInput.value = Math.floor(camera.yOffset+selection.wheel.yOffset);

function animate () {
  animationId = requestAnimationFrame(animate);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (camera.scale<.1)camera.scale=.1;
  if(camera.scale>2)camera.scale=2;

  manageEvents();

  drawLines();
  drawText();

  if (selection.selectionMode==='line'&&selection.tempLine.active) {
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(selection.tempLine.x1,selection.tempLine.y1);
    ctx.bezierCurveTo(
      selection.tempLine.x1,
      selection.mouse.y,
      selection.mouse.x,
      selection.tempLine.y1,
      selection.mouse.x,
      selection.mouse.y
    );
    ctx.stroke();
  }

  ctx.strokeStyle = 'lightGrey';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(convertX(0),0);
  ctx.lineTo(convertX(0),canvas.height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0,convertY(0));
  ctx.lineTo(canvas.width,convertY(0));
  ctx.stroke();
}

// event listeners
addEventListener('wheel', e => {
  if (!mouseIsOnCanvas) return;
  if (e.deltaY < 0 && camera.scale*1.05<2) {
    // up
    camera.scale *= 1.05;
    camera.xOffset -= deconvertX(selection.mouse.x) * .025 * camera.scale;
    camera.yOffset -= deconvertY(selection.mouse.y) * .025 * camera.scale;
  }
  if (e.deltaY > 0 && camera.scale*.95>.1){
    // down
    camera.scale *= .95;
    camera.xOffset += deconvertX(selection.mouse.x) * .025 * camera.scale;
    camera.yOffset += deconvertY(selection.mouse.y) * .025 * camera.scale;
  }
  scaleSlider.value = camera.scale*100;
  xOffsetInput.value = Math.floor(camera.xOffset+selection.wheel.xOffset);
  yOffsetInput.value = Math.floor(camera.yOffset+selection.wheel.yOffset);
});
addEventListener('mousemove', e => {
  if (
    e.clientX <= canvasSize.endX &&
    e.clientX >= canvasSize.startX &&
    e.clientY >= canvasSize.startY &&
    e.clientY <= canvasSize.endY
  ) {
    selection.mouse.x = e.clientX;
    selection.mouse.y = e.clientY;
    mouseIsOnCanvas = true;
  } else {
    mouseIsOnCanvas = false;
  }
});
addEventListener('mousedown', e => {
  if (!mouseIsOnCanvas) return;
  selection.selectItem.typing = false;
  contextMenu.style.display = 'none';
  if (e.which == 2) {
    selection.wheel.wheelDown = true;
    selection.wheel.pivotX = e.clientX;
    selection.wheel.pivotY = e.clientY;
  } else {
    selection.mouse.mousedown = true;


    if (selection.selectionMode==='text'&&onCanvas(e.clientX,e.clientY)){
      file.textBoxes.push(new TextBox(deconvertX(e.clientX),deconvertY(e.clientY),'',0));
      return;
    }

    if (selection.selectionMode==='line'&&onCanvas(e.clientX,e.clientY)) {
      if (selection.tempLine.active) {
        file.lines.push(new Line(
          deconvertX(selection.tempLine.x1),
          deconvertY(selection.tempLine.y1),
          deconvertX(selection.mouse.x),
          deconvertY(selection.mouse.y)
        ));
        selection.tempLine.active = false;
      }
      else{selection.tempLine.active = true;}
      selection.tempLine.x1 = e.clientX;
      selection.tempLine.y1 = e.clientY;
      return;
    }


    file.lines.forEach((lineItem,i) => {
      if(dist(convertX(lineItem.startX),convertY(lineItem.startY),e.clientX,e.clientY)<=10){
        if (selection.selectionMode==='delete') file.lines.splice(i,1); return;
        selection.selectItem.selectedList = 0;
        selection.selectItem.selectedIndex = i;
        selection.selectItem.selectedSide = 0;
        selection.selectItem.selecting = true;
      }
      if(dist(convertX(lineItem.endX),convertY(lineItem.endY),e.clientX,e.clientY)<=10){
        if (selection.selectionMode==='delete') file.lines.splice(i,1); return;
        selection.selectItem.selectedList = 0;
        selection.selectItem.selectedIndex = i;
        selection.selectItem.selectedSide = 1;
        selection.selectItem.selecting = true;
      }
    });

    file.textBoxes.forEach((textItem,i) => {
      if (isPointInside(e.clientX,e.clientY,textItem.x,textItem.y,textItem.box.width,textItem.box.height)) {
        if (selection.selectionMode==='delete') file.textBoxes.splice(i,1); return;
        selection.selectItem.selectedList = 1;
        selection.selectItem.selectedIndex = i;
        selection.selectItem.selectedSide = -1;
        selection.selectItem.pivotX = deconvertX(selection.mouse.x) - textItem.x;
        selection.selectItem.pivotY = deconvertY(selection.mouse.y) - textItem.y;
        selection.selectItem.selecting = true;
      }
    });
    if (selection.selectItem.selectedList<0) {
      selection.wheel.wheelDown = true;
      selection.wheel.pivotX = e.clientX;
      selection.wheel.pivotY = e.clientY;
    }
  }
});
addEventListener('mouseup', e => {
  if (!mouseIsOnCanvas) return;
  if (e.which == 2) {
    selection.wheel.wheelDown = false;
  } else {
    selection.wheel.wheelDown = false;
    selection.mouse.mousedown = false;
  }
  selection.selectItem.selectedList = -1;
  selection.selectItem.selectedIndex = -1;
  selection.selectItem.selectedSide = -1;
});
addEventListener('dblclick', e => {
  if (!mouseIsOnCanvas) return;
  if (selection.selectionMode!=='select')return;
  file.textBoxes.forEach((textItem,i) => {
    if (isPointInside(e.clientX,e.clientY,textItem.x,textItem.y,textItem.box.width,textItem.box.height)) {
      selection.selectItem.typing = true;
      selection.selectItem.selectedList = 1;
      selection.selectItem.selectedIndex = i;
      selection.selectItem.selectedSide = -1;
    }
  });
})
addEventListener('keydown', e => {
  if (!mouseIsOnCanvas) return;
  e.preventDefault();
  if (!selection.selectItem.typing) {
    switch (e.key) {
      case 's':{
        selection.selectionMode = 'select';
        selectBtn.style.background = 'black';
        lineBtn.style.background = '#232323';
        textBtn.style.background = '#232323';
        deleteBtn.style.background = '#232323';
        canvas.style.cursor = 'default';
        break;
      }
      case 'l':{
        selection.selectionMode = 'line';
        selectBtn.style.background = '#232323';
        lineBtn.style.background = 'black';
        textBtn.style.background = '#232323';
        deleteBtn.style.background = '#232323';
        canvas.style.cursor = 'cell';
        break;
      }
      case 't':{
        selection.selectionMode = 'text';
        selectBtn.style.background = '#232323';
        lineBtn.style.background = '#232323';
        deleteBtn.style.background = '#232323';
        textBtn.style.background = 'black';
        canvas.style.cursor = 'text';
        break;
      }
      case 'd':{
        selection.selectionMode = 'delete';
        selectBtn.style.background = '#232323';
        lineBtn.style.background = '#232323';
        deleteBtn.style.background = 'black';
        textBtn.style.background = '#232323';
        canvas.style.cursor = 'not-allowed';
        break;
      }
    }
    return;
  }
  if (e.key.length === 1)file.textBoxes[selection.selectItem.selectedIndex].content += e.key;
  if (e.key==='Backspace') {
    let textCopy = file.textBoxes[selection.selectItem.selectedIndex].content;
    file.textBoxes[selection.selectItem.selectedIndex].content = textCopy.substring(0,textCopy.length-1);
  }
});
addEventListener('contextmenu', e => {
  e.preventDefault();
  // contextMenu.style.left = e.clientX + 'px';
  // contextMenu.style.top = e.clientY + 'px';
  // contextMenu.style.display = 'block';
});
xOffsetInput.addEventListener('input', e => {
  camera.xOffset = parseInt(xOffsetInput.value);
});
yOffsetInput.addEventListener('input', e => {
  camera.yOffset = parseInt(yOffsetInput.value);
});
scaleSlider.addEventListener('input', e => {
  camera.scale = parseInt(scaleSlider.value)/100;
});

selectBtn.addEventListener('click', e => {
  selection.selectionMode = 'select';
  selectBtn.style.background = 'black';
  lineBtn.style.background = '#232323';
  textBtn.style.background = '#232323';
  deleteBtn.style.background = '#232323';
  canvas.style.cursor = 'default';
});
lineBtn.addEventListener('click', e => {
  selection.selectionMode = 'line';
  selectBtn.style.background = '#232323';
  lineBtn.style.background = 'black';
  textBtn.style.background = '#232323';
  canvas.style.cursor = 'cell';
  deleteBtn.style.background = '#232323';
});
textBtn.addEventListener('click', e => {
  selection.selectionMode = 'text';
  selectBtn.style.background = '#232323';
  lineBtn.style.background = '#232323';
  textBtn.style.background = 'black';
  deleteBtn.style.background = '#232323';
  canvas.style.cursor = 'text';
});
deleteBtn.addEventListener('click', e => {
  selection.selectionMode = 'delete';
  selectBtn.style.background = '#232323';
  lineBtn.style.background = '#232323';
  textBtn.style.background = '#232323';
  deleteBtn.style.background = 'black';
  canvas.style.cursor = 'not-allowed';
});

filesBtn.addEventListener('click', e => {
  filesToolbar.style.left = '0px';
  canvasSize.startX = 200;
});
filesBackBtn.addEventListener('click', e => {
  filesToolbar.style.left = '-200px';
  canvasSize.startX = 0;
});
newFileBtn.addEventListener('click', e => {
  newFile(prompt('Name of new file:'));
});
exportBtn.addEventListener('click', e => {
  let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storedFiles.files[currentFileIndex]));
  let downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href",     dataStr);
  downloadAnchorNode.setAttribute("download", file.title + ".json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
});
importBtn.addEventListener('change', e => {
  let file = e.target.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const contents = e.target.result;
    importFile(contents);
  };
  reader.readAsText(file);
});

// etc

animate();
