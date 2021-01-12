const containerHeight = 720;
const containerWidth = 600;
const minutesinDay = 60 * 12; // since day starts at 9 and ends at 9
let collisions = [];
let width = [];
let leftOffSet = [];
const NIKKI_LUNCH_EVENT_TITLE = "Me";
const OTHERS_LUNCH_EVENT_TITLE = "Brilliant Lunch";

var matchLunchEvent = (events) => {
  //delete old lunch events if exists
  clearLunchEvents();

  updateAndSortLunchEvents(events);
  getCollisions(events);
  getAttributes(events);

  let parentEvent = {};
  let parentUnit = 0;
  events.forEach((event, id) => {
    let height = ((event.end - event.start) / minutesinDay) * containerHeight;
    let top = (event.start / minutesinDay) * containerHeight;
    let end = event.end;
    let start = event.start;
    let units = width[id];
    ///Check if current event's parent count is 3 . If yes, then assign the parent's count to avoid child's overlap
    if (units >= 3 && id > 0) {
      parentEvent = event;
      parentUnit = units;
    }
    if (parentEvent) {
      if (start < parentEvent.end) {
        units = parentUnit;
      }
    }
    if (!units) {
      units = 1;
    }
    let left = (containerWidth / width[id]) * (leftOffSet[id] - 1) + 10;
    if (!left || left < 0) {
      left = 10;
    }
    createLunchEvent(height, top, left, units, event.title, event.color);
  });
};

function clearLunchEvents() {
  // Clear the existing lunch events if exists
  var myNode = document.getElementById("events");
  myNode.innerHTML = "";
}

/* Update each event in provided events list with title and color .
Once updated, then sort the events according to the start time.*/
function updateAndSortLunchEvents(events) {
  let meObj = {};
  events.map((value, index) => {
    if (index === 0) {
      // store the first object which is 'Me' object
      meObj = value;
      // set the title and default for 'Me' event object
      meObj["title"] = NIKKI_LUNCH_EVENT_TITLE;
      meObj["color"] = "Black";
    } else {
      // set the title and default for other event object
      value["title"] = OTHERS_LUNCH_EVENT_TITLE;
      value["color"] = "#3c5ecb"; //blue
      if (value.start - meObj.start < 0 && value.end > 255) {
        //overlapping by atleast 30 minutes
        //set the color green and push to target
        meObj["color"] = "#388b60"; //green
        value["color"] = "#388b60"; //green
      }
    }
  });
  //sort events based on start time
  events.sort((a, b) => {
    return a.start - b.start;
  });
}

// append one event to calendar
const createLunchEvent = (height, top, left, units, title, color) => {
  let node = document.createElement("DIV");
  node.className = "event";
  node.innerHTML = `<span style='color: ${color}; font-size: 150%;'>${title} </span>`;

  // Customized CSS to position each event
  node.style.width = containerWidth / units + "px";
  node.style.height = height + "px";
  node.style.top = top + "px";
  node.style.left = 100 + left + "px";
  node.style.borderLeftColor = color;

  document.getElementById("events").appendChild(node);
};

/* 
  collisions is an array that tells you which events are in each 30 min slot
  - each first level of array corresponds to a 30 minute slot on the calendar 
    - [[0 - 30mins], [ 30 - 60mins], ...]
  - next level of array tells you which event is present and the horizontal order
    - [0,0,1,2] 
    ==> event 1 is not present, event 2 is not present, event 3 is at order 1, event 4 is at order 2
  */

function getCollisions(events) {
  //initialize 2D storage to track the count of events for every 30 mins slot and fill the values with 0.
  collisions = [...new Array(24)].map((_) => new Array(events.length).fill(0));

  events.forEach((event, id) => {
    let end = event.end;
    let start = event.start;
    let order = 1;

    while (start < end) {
      timeIndex = Math.floor(start / 30);
      while (order < events.length) {
        if (collisions[timeIndex].indexOf(order) === -1) {
          break;
        }
        order++;
      }

      collisions[timeIndex][id] = order;
      start = start + 30;
    }

    collisions[Math.floor((end - 1) / 30)][id] = order;
  });
}

/*
  finds the width and horizontal position of each event (event collisions are handled with no overlap)
  
  width - number of units to divide container width by
  horizontal position - pixel offset from left
  */
function getAttributes(events) {
  //resets storage
  width = [];
  leftOffSet = [];

  for (var i = 0; i < events.length; i++) {
    width.push(0);
    leftOffSet.push(0);
  }

  collisions.forEach((period) => {
    // number of events in that period
    let count = period.reduce((a, b) => {
      return b ? a + 1 : a;
    });

    if (count > 1) {
      period.forEach((event, id) => {
        // max number of events it is sharing a time period with determines width
        if (period[id]) {
          if (count > width[id]) {
            width[id] = count;
          }
        }

        if (period[id] && !leftOffSet[id]) {
          leftOffSet[id] = period[id];
        }
      });
    }
  });
}
