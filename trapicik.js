// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets";
var SHEET_ID;
var SHEET_NAME = "Dalībnieki";
var active_row = 1;
var series = 1;
var hits;

var authorizeButton;
var signoutButton;

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
  hits = [0,0,0,0,0,0,0,0,0,0,0,0];
  SHEET_ID = urlParams["sheet"];
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
        tbl.rows[row].cells[0].onclick = (decrement(tbl, row));
        tbl.rows[row].cells[1].onclick = (increment(tbl, row));
        tbl.rows[row].cells[2].onclick = (increment(tbl, row));
      }
  }
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
    updateInfo();
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

function updateInfo() {

  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_NAME+'!A'+(active_row+1)+':AT'+(active_row+1),
  }).then(function(response) {
    var range = response.result;
    if (range.values.length > 0) {
      for (i = 0; i < range.values.length; i++) {
        var row = range.values[i];
        appendPre(row[0] + ', ' + row[1] + ', ' + row[2] + ', ' + row[3] + ', ' + row[4]);
      }
      setupTableEvents();
    } else {
      appendPre('No data found.');
    }
  }, function(response) {
    appendPre('Error: ' + response.result.error.message);
  });
}