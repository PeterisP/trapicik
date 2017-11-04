// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets";
var SHEET_ID;
var SHEET_NAME = "Dalībnieki";
var round_participants = [];
var active_participant;
var round;
var series = 1;
var hits;

var authorizeButton;
var signoutButton;
var writeButton;

/** from StackOverflow https://stackoverflow.com/a/2880929 **/
var urlParams;
(window.onpopstate = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);
})();

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  authorizeButton = document.getElementById('authorize-button');
  signoutButton = document.getElementById('signout-button');
  writeButton = document.getElementById('write-button');
  hits = [0,0,0,0,0,0,0,0,0,0,0,0];
  SHEET_ID = urlParams["sheet"];
  round = urlParams["round"];
  gapi.load('client:auth2', initClient);
}

function increment(tbl, row) {
    return function () {
      hits[row] = hits[row]+1;
      tbl.rows[row].cells[2].innerHTML = hits[row];
    };
}
function decrement(tbl, row) {
    return function () {
      hits[row] = hits[row]-1;
      if (hits[row]<0) hits[row] = 0;
      tbl.rows[row].cells[2].innerHTML = hits[row];
    };
}
function setupTableEvents() {
  var tbl = document.getElementById("hits");
  if (tbl != null) {
    for (var row = 0; row < tbl.rows.length; row++) {
      tbl.rows[row].cells[2].innerHTML = hits[row];
      tbl.rows[row].cells[0].onclick = (decrement(tbl, row));
      tbl.rows[row].cells[1].onclick = (increment(tbl, row));
      tbl.rows[row].cells[2].onclick = (increment(tbl, row));
    }
    writeButton.style.display = 'block';
  }
}
function writeHits() {
  var nr = round_participants[active_participant];
  var range;
  switch (series) {
    case 1:
      range = SHEET_NAME+'!N'+(nr+3)+':Y'+(nr+3)
      break;
    case 2:
      range = SHEET_NAME+'!Z'+(nr+3)+':AK'+(nr+3)
      break;
    case 3:
      range = SHEET_NAME+'!AL'+(nr+3)+':AW'+(nr+3)
      break;
    default:
      return;
  }

  var values = [];
  for (i=0;i<12;i++)
    values[i] = hits[11-i];
  console.log(values);
  console.log(range);
  var body = {values:[values]};
  console.log(body);

  gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: range,
    resource: body,
    valueInputOption: "RAW"
  }).then(function(response){
    console.log(response);
  })
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
    writeButton.onclick = writeHits;
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    fetchRound(round);
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById('content');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

function fetchParticipant() {
  var nr = round_participants[active_participant];
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_NAME+'!A'+(nr+3)+':AW'+(nr+3),
  }).then(function(response) {
    var range = response.result;
    if (range.values.length == 1) {
      var row = range.values[0];
      appendPre(row[0] + ', ' + row[1] + ', ' + row[2] + ', ' + row[3] + ', ' + row[4]);
      for (var i = 0; i < 12; i++) {
        hit = row[i+13];
        if (hit=="") {
          hits[11-i] = 0;
        } else { 
          hits[11-i] = parseInt(hit,10);
        }
      }
      setupTableEvents();
    } else {
      appendPre('No data found.');
    }
  }, function(response) {
    appendPre('Error: ' + response.result.error.message);
  });
}

function fetchRound(round) {
  round_participants = [];
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_NAME+'!A3:E',
  }).then(function(response) {
    var range = response.result;
    if (range.values.length > 0) {
      for (var i = 0; i < range.values.length; i++) {
        var row = range.values[i];
        if (row[0]==round) {
          round_participants.push(i);
        }
      }
      active_participant=0;
      fetchParticipant();
    } else {
      appendPre('No data found.');
    }
  }, function(response) {
    appendPre('Error: ' + response.result.error.message);
  });
}