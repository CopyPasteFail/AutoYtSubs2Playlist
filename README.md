# AutoYtSubs2Playlist
Automatic add Youtube channel subscriptions to a playlist

Important credits for the authors of the following articles, which this project is based on:
https://www.reddit.com/r/youtube/comments/3ukn4w/automatically_adding_youtube_videos_to_watch/
https://mashe.hawksey.info/2017/09/identity-crisis-using-the-youtube-api-with-google-apps-script-and-scheduling-live-broadcasts-from-google-sheets/


## Description 
This script will automatically add new videos from your subscribed channels to a specified playlist which you own (not including your Watch Later playlist).
You need to have subscribed to the channel and ALSO turned on email notifications (using the 'bell' icon).

## Instructions
Visit script.google.com to open the script editor. (You'll need to be signed in to your Google account.) If this is the first time you've been to script.google.com, you'll be redirected to a page that introduces Apps Script. Click Start Scripting to proceed to the script editor.
A welcome screen will ask what kind of script you want to create. Click Blank Project.
Delete any code in the script editor and paste in the code and file names in this project.

In the Script Editor click on Resources > Libraries… and in the ‘Add a library’
field add the following libraries slecting the latest version:

1EbLSESpiGkI3PYmJqWh3-rmLkYKAtCNPi1L2YCtMgo2Ut8xMThfJ41Ex – cUseful
1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF – OAuth2 for Apps Script
13FP5EWK7x2DASsiBXETcr0TQ07OCLEVWOoY1jbVR-bqVpFmsydUSXWdR – YouTube Data API

### Creating client credentials
To use the authentication service we’ve created we need to provide client credentials.
To do this we need to setup a Google Cloud Platform project and create credentials:

In the Script Editor select Resources > Cloud platform project… and click the link to the currently associated project
(this should begin ‘Youtube Schedule Live Broadcas’ followed by a project id)
In the Google Cloud Platform window click ‘Go to APIs overview’
In APIs & services click ‘Enable APIs and Services’
In the Library search/click on YouTube Data API and click ‘Enable’

### Enabling YouTube Data API
Still in the APIs & services screen click on Credentials from the side menu
Click the ‘Create credentials’, select ‘OAuth Client ID’ then ‘Web application’
Enter a name as required and in the ‘Authorised JavaScript origins’ enter https://script.google.com
In Script Editor click Run > Run function > logRedirectUri.
From the View > Logs copy the url into the ‘Authorised redirect URIs’ field API console, click ‘Create’

### Create credentials
In the Script Editor open File > Project properties and in the Script properties tab and new rows for
client_id and client_secret copying the values from the API console
Project properties 
In the Script Editor click Run > Run function > setup and then from the View > Logs copy the url in a new browser tab.
Finally select either your personal or branded YouTube account you would like access to

You can test if you have successfully setup and connect with the YouTube Data API
by running the setup function again and checking the Log and to see if channel data is returned

## How It Works
Using the Gmail and Youtube API, the script searches for unread email from subscribed youtube channels under a certain label, extract the video ID and it to the desired playlist.

## Google Quota
Each API operation has a quota, the cost for each operation is mentioned in a comment

## Maintainers
This project is mantained by:
* [Omer Reznik](http://github.com/GipsyBeggar)

## Contributing
1. Fork it
2. Create your feature branch (git checkout -b my-new-feature)
3. Commit your changes (git commit -m 'Add some feature')
4. Push your branch (git push origin my-new-feature)
5. Create a new Pull Request

## License
This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE.md](LICENSE.md) file for details
