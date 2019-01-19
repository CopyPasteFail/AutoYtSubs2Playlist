/********************************************
In the Script Editor click on Resources > Libraries… and in the ‘Add a library’
field add the following libraries slecting the latest version:
1EbLSESpiGkI3PYmJqWh3-rmLkYKAtCNPi1L2YCtMgo2Ut8xMThfJ41Ex – cUseful
1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF – OAuth2 for Apps Script
13FP5EWK7x2DASsiBXETcr0TQ07OCLEVWOoY1jbVR-bqVpFmsydUSXWdR – YouTube Data API



Creating client credentials
To use the authentication service we’ve created we need to provide client credentials.
To do this we need to setup a Google Cloud Platform project and create credentials:

In the Script Editor select Resources > Cloud platform project… and click the link to the currently associated project
(this should begin ‘Youtube Schedule Live Broadcas’ followed by a project id)
In the Google Cloud Platform window click ‘Go to APIs overview’
In APIs & services click ‘Enable APIs and Services’
In the Library search/click on YouTube Data API and click ‘Enable’

Enabling YouTube Data API
Still in the APIs & services screen click on Credentials from the side menu
Click the ‘Create credentials’, select ‘OAuth Client ID’ then ‘Web application’
Enter a name as required and in the ‘Authorised JavaScript origins’ enter https://script.google.com
In Script Editor click Run > Run function > logRedirectUri.
From the View > Logs copy the url into the ‘Authorised redirect URIs’ field API console, click ‘Create’

Create credentials
In the Script Editor open File > Project properties and in the Script properties tab and new rows for
client_id and client_secret copying the values from the API console
Project properties 
In the Script Editor click Run > Run function > setup and then from the View > Logs copy the url in a new browser tab.
Finally select either your personal or branded YouTube account you would like access to

You can test if you have successfully setup and connect with the YouTube Data API
by running the setup function again and checking the Log and to see if channel data is returned
********************************************/


/**
 * Authorizes and makes a request to the YouTube Data API.
 */
function setup() {
  var service = getYouTubeService();
  YouTube.setTokenService(function(){ return service.getAccessToken(); });
  if (service.hasAccess()) {
    var result = YouTube.channelsList("snippet", {mine:true});
    Logger.log(JSON.stringify(result, null, 2));
    throw "Open View > Logs to see result";
  } else {
    var authorizationUrl = service.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s',
        authorizationUrl);
    throw "Open View > Logs to get authentication url";
  }
}
 
 
/**
 * Configures the service.
 */
function getYouTubeService() {
  return OAuth2.createService('YouTube')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
      .setTokenUrl('https://accounts.google.com/o/oauth2/token')
 
      // Set the client ID and secret.
      .setClientId(getStaticScriptProperty_('client_id'))
      .setClientSecret(getStaticScriptProperty_('client_secret'))
 
      // Set the name of the callback function that should be invoked to complete
      // the OAuth flow.
      .setCallbackFunction('authCallback')
 
      // Set the property store where authorized tokens should be persisted
      // you might want to switch to Script Properties if sharing access
      .setPropertyStore(PropertiesService.getUserProperties())
 
      // Set the scope and additional Google-specific parameters.
      .setScope(["https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.force-ssl",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtubepartner",
      "https://www.googleapis.com/auth/youtubepartner-channel-audit"])
      .setParam('access_type', 'offline');
}
 
/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var service = getYouTubeService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied');
  }
}
 
/**
 * Logs the redirect URI to register in the Google Developers Console.
 */
function logRedirectUri() {
  var service = getYouTubeService();
  Logger.log(service.getRedirectUri());
  throw "Open View > Logs to get redirect url";
}
 
/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
  var service = getYouTubeService();
  service.reset();
}
 
/**
 * Gets a static script property, using long term caching.
 * @param {string} key The property key.
 * @returns {string} The property value.
 */
function getStaticScriptProperty_(key) {
  var value = CacheService.getScriptCache().get(key);
  if (!value) {
    value = PropertiesService.getScriptProperties().getProperty(key);
    CacheService.getScriptCache().put(key, value, 21600);
  }
  return value;
}
