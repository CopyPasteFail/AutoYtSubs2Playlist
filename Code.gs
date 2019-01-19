YouTube.setTokenService(function(){ return getYouTubeService().getAccessToken(); });


// ===========================================================================
// YOUTUBE - AUTOMATICALLY ADD NEW VIDEOS FROM SUBSCRIBED CHANNELS TO PLAYLIST
// ===========================================================================

// This script will automatically add new videos from your subscribed channels to
// a specified playlist which you own (not including your Watch Later playlist).
// You need to have subscribed to the channel and ALSO turned on email notifications
// (using the 'bell' icon).

// There is a way to do this should the email notifications ever stop. Using YT's API you can
// get a list of your subscribed channels. Then loop through the videos in each subscribed channel
// to find any videos created since the script last ran (save last run date/time in Sheets cell).
// Of course this will give you ALL the videos from your subs not just those you want notified for.


// ------------------------------------------------------------------------------------------------------------------------------
// Set some variables
// ------------------------------------------------------------------------------------------------------------------------------


// Set playlist ID that you want to add the videos to.
// The Watch Later playlist is no longer supported:
// https://developers.google.com/youtube/v3/revision_history#september-15-2016
var targetPL = 'PLSz-DhyyvBy2haXqd5Qv7vv9Uuzkd5-lg'; // deepsy2k:: My Watch Later

// Set email search criteria. Written just like a gmail search.
// You can add more criteria to the search (see commented out line for example).
var emailQueries = [];
emailQueries.push('label:YoutubeToWatchLater is:unread from:noreply@youtube.com');
//emailQueries.push('from:"noreply@youtube.com" subject:"new videos from"');

// Set Google Sheets IDs for logging (comment out if not needed along with logging section below)
var logSpreadsheetId = '1WDsLuIW1r-NjyFaGe48vsF7XQQvRLO5WLiYAuA0ZhBg'; // For logging playlist additions
var errorSpreadsheetId = '1ieF2fDK-sNMdmD21KfWEpceFLbNl7upow09msEdRAl4'; // For logging errors - using same doc as above but different tab

// Get date var for logging
var currentTime = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd HH:mm:ss" ) // change the timezone if you need to

// Set regex to find video ID in email subscriptions - you shouldn't need to change this.
// Prior to 20160713: regex for video IDs was: RegExp(".*/watch%3Fv%3D([^%]+)%.*", "gi");
var youtubeLinksRegex1 = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*?[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
var youtubeLinksRegex2 = /(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/g;
var youtubeLinkPartsRegex = /^.*(youtu\.be\/|vi?\/|u\/\w\/|embed\/|\?vi?=|\&vi?=)([^#\&\?]*).*/;



// Run this function once to grant script access and add trigger automatically.
// Automatically adds new subscription videos from youtube to watch later list (if you have email notifications for those turned on)
function CreateAddNewVideosToDestinaionPlaylistTrigger()
{
  ScriptApp.newTrigger('AddNewVideosToDestinaionPlaylist')
  .timeBased()
  .everyMinutes(1)    // Runs script every min. You can change this to days, hours, min, etc. Just google how to set the triggers by using a script.
  .create();
}



function AddNewVideosToDestinaionPlaylist()
{  
  Logger.log('Email Search: ' + emailQueries);
  Logger.log('Log Sheet ID: ' + logSpreadsheetId);
  Logger.log('Error Log Sheet ID: ' + errorSpreadsheetId);
  Logger.log('Date_Time: ' + currentTime);
  var currentLoggedInChannel = YouTube.channelsList('brandingSettings, contentDetails, contentOwnerDetails, id, snippet, statistics, status, topicDetails', {'mine': 'true'});
  Logger.log('Current Logged In Channel ID: ' +  currentLoggedInChannel[0].id );
  Logger.log('Current Logged In Channel Name: ' +  currentLoggedInChannel[0].snippet.title );

  // ------------------------------------------------------------------------------------------------------------------------------
  // Create list of video IDs already in destination playlists to check for duplicates when adding new videos
  // ------------------------------------------------------------------------------------------------------------------------------ 
  var targetPLvideos = [];
  var targetPLlongvideos = [];
  var nextPageToken = '';
  try
  {
    while (nextPageToken != null)
    {
      // get all videos from destination playlist, 50 results per page
      // cost 3 units
      var playlistResponse = YouTube.playlistItemsList('snippet', {
        "playlistId": targetPL,
        "maxResults": "50",
        "pageToken": nextPageToken
      });

      // get all video id's from the page result and inset into targetPLvideos
      for (var itemIndex = 0; itemIndex < playlistResponse.length; itemIndex++)
      {
        var playlistItem = playlistResponse[itemIndex];
        targetPLvideos.push(playlistItem.snippet.resourceId.videoId);
      }
      nextPageToken = playlistResponse.nextPageToken;
    }
    
    Logger.log('Found #' + playlistResponse.length + ' videos in destination playlist: ');  // For debugging
    Logger.log('Destination playlist ID: "' + targetPLvideos + '"');  // For debugging
  }
  catch(e)
  {
    LogError(e);
    return;
  }

  // ------------------------------------------------------------------------------------------------------------------------------
  // Search email for YouTube emails
  // ------------------------------------------------------------------------------------------------------------------------------ 

  // Search email based on criteria set above
  var threads = [];
  for(var queryIndex = 0; queryIndex < emailQueries.length; queryIndex++)
  {
    if(queryIndex == 0)
    { // for first email search query
      threads = GmailApp.search(emailQueries[queryIndex]);
    }
    else
    { // for successive search criteria
      var additionalThreads = GmailApp.search(emailQueries[queryIndex]);
      for(var i in additionalThreads)
      {
        threads.push(additionalThreads[i]);
      }
    }
  }
  Utilities.sleep(1000);     // Required to avoid YT error about too many calls too close together
  Logger.log('# Gmail threads found: ' + threads.length);  // For debugging
  
  
  // ------------------------------------------------------------------------------------------------------------------------------
  // Process YouTube emails and add videos to playlists
  // ------------------------------------------------------------------------------------------------------------------------------ 
 
  // For each email in results of email search, process any video ID
  for (var i in threads)
  {
    try
    {
      threads[i].markRead();
      messages = threads[i].getMessages()
      
      for (var k in messages)
      {
        Logger.log('Thread #' + i + ', message #' + k);  // For debugging
        
        var msg = messages[k];
        var subject = messages[k].getSubject();
//        Logger.log('message body: ' + msg.getBody());  // For debugging

        var videoIdList = findYoutubeVideoIds(msg.getBody());

        Logger.log('# Of video IDs found in email: ' + videoIdList.length);  // For debugging
        var vidStatus = 'No video IDs';
        
        if (videoIdList.length == 0)
        {
          // mark unread for the user to notice in case no video IDs found
          threads[i].markUnread();
        }
 

        // for each video in the message
        for(var index = 0; index < videoIdList.length; index++)
        {
          var videoId = videoIdList[index];

          Logger.log('Video ID found in message (email): ' + videoId);  // For debugging
          
          // get video info
          // cost 5 units
          var videoResponse = YouTube.videosList('snippet, contentDetails',{"id":videoId, "maxResults":"1"});
          if(videoResponse.length > 0)
          {
            var theVideo = videoResponse[0];
            
            // Set video title
            var videoTitle = theVideo.snippet.title;
            
            // Set default PL to add videos to
            vidStatus = 'Added to PL';
            
            // check if already in playlist and add if it isn't
            if(targetPLvideos.indexOf(videoId) >= 0 )
            {
              Logger.log(videoId + ' already in PL');  // For debugging
              var vidStatus = 'Already in PL';
              continue;
            }
            else
            {
              targetPLvideos.push(videoId);
            }
            
            // Add the video to the playlist
            AddVideoToPlaylist(videoId, targetPL);
          } // end of video duplicate/adding loop
         
          AppendToLogSpreadsheet(currentTime, videoTitle, subject, videoId, vidStatus);
        } // end of individual video loop 
        
        // Logging (comment out if not needed)
        
        // Marks notification email as read and archives it
        //    threads[i].moveToArchive();    // Uncomment line if you want to archive notification emails. 
        
      } // end of message loop
      
    } //end try
    // This logs any errors in a Drive sheet. Set sheet ID at top of function.
    catch(e)
    {
      Logger.log(e.message);
      LogError(e);
    }
    
  } // end of threads loop 
} // end of function

function LogError(e)
{
    Logger.log(e.message);
    var errorSheet = SpreadsheetApp.openById(errorSpreadsheetId).getSheets()[0];
    //  var errorSheet = SpreadsheetApp.openById(errorSpreadsheetId).getSheetByName('Errors');
    lastRow = errorSheet.getLastRow();
    var cell = errorSheet.getRange('A1');
    cell.offset(lastRow, 0).setValue(currentTime);
    cell.offset(lastRow, 1).setValue(e.message);
    cell.offset(lastRow, 2).setValue(e.fileName);
    cell.offset(lastRow, 3).setValue(e.lineNumber);
}

function AppendToLogSpreadsheet(currentTime, videoTitle, subject, videoId, vidStatus)
{
  var logSheet = SpreadsheetApp.openById(logSpreadsheetId).getSheets()[0];
  lastRow = logSheet.getLastRow();
  var cell = logSheet.getRange('A1');
  cell.offset(lastRow, 0).setValue(currentTime);  // Email processed time
  cell.offset(lastRow, 1).setValue(videoTitle);  // Video Title
  cell.offset(lastRow, 2).setValue(subject);  // Email subject
  cell.offset(lastRow, 3).setValue(videoId);  // Vid ID
  cell.offset(lastRow, 4).setValue(vidStatus);  // Added to PL / Already in PL / etc
}

function AddVideoToPlaylist(videoId, PlaylistId)
{
  var details = {
    "videoId": videoId,
    "kind": 'youtube#video'
  };
  // Add the video to the playlist
  var resource = {
    "snippet": {
      "playlistId": PlaylistId,
      "resourceId": details
    }
  };
  // cost 53 units
  YouTube.playlistItemsInsert("snippet", resource,{})
}

function findYoutubeVideoIds(text)
{
  var youtubeLinksListMethod1 = text.match(youtubeLinksRegex1);
  var youtubeLinksListMethod2 = text.match(youtubeLinksRegex2);
  var dummyArray = [];
  var youtubeLinksList = dummyArray.concat(youtubeLinksListMethod1, youtubeLinksListMethod2);
  //filter {"", null, undefined, 0}:
  youtubeLinksList = youtubeLinksList.filter(function(e){return e});
  
  var videoIdList = [];
  if (youtubeLinksList)
  {
    for(var urlIndex = 0; urlIndex < youtubeLinksList.length; urlIndex++)
    {
      var url = youtubeLinksList[urlIndex];
      var urlParts = url.match(youtubeLinkPartsRegex);
      if (urlParts && urlParts[2])
      {
        videoIdList.push(urlParts[2]); 
      }
    }
  }
  return videoIdList;
}

function testYoutubeRegEx()
{
  var urls = [
      'http://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index',
      'http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/QdK8U-VIH_o',
      'http://www.youtube.com/v/0zM3nApSvMg?fs=1&amp;hl=en_US&amp;rel=0',
      'http://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s',
      'http://www.youtube.com/embed/0zM3nApSvMg?rel=0',
      'http://www.youtube.com/watch?v=0zM3nApSvMg',
      'http://youtu.be/0zM3nApSvMg',
      '//www.youtube-nocookie.com/embed/up_lNV-yoK4?rel=0',
      'http://www.youtube.com/user/Scobleizer#p/u/1/1p3vcRhsYGo',
      'http://www.youtube.com/watch?v=cKZDdG9FTKY&feature=channel',
      'http://www.youtube.com/watch?v=yZ-K7nCVnBI&playnext_from=TL&videos=osPknwzXEas&feature=sub',
      'http://www.youtube.com/ytscreeningroom?v=NRHVzbJVx8I',
      'http://www.youtube.com/user/SilkRoadTheatre#p/a/u/2/6dwqZw0j_jY',
      'http://youtu.be/6dwqZw0j_jY',
      'http://www.youtube.com/watch?v=6dwqZw0j_jY&feature=youtu.be',
      'http://youtu.be/afa-5HQHiAs',
      'http://www.youtube.com/user/Scobleizer#p/u/1/1p3vcRhsYGo?rel=0',
      'http://www.youtube.com/watch?v=cKZDdG9FTKY&feature=channel',
      'http://www.youtube.com/watch?v=yZ-K7nCVnBI&playnext_from=TL&videos=osPknwzXEas&feature=sub',
      'http://www.youtube.com/ytscreeningroom?v=NRHVzbJVx8I',
      'http://www.youtube.com/embed/nas1rJpm7wY?rel=0',
      'http://www.youtube.com/watch?v=peFZbP64dsU',
      'http://youtube.com/v/dQw4w9WgXcQ?feature=youtube_gdata_player',
      'http://youtube.com/vi/dQw4w9WgXcQ?feature=youtube_gdata_player',
      'http://youtube.com/?v=dQw4w9WgXcQ&feature=youtube_gdata_player',
      'http://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtube_gdata_player',
      'http://youtube.com/?vi=dQw4w9WgXcQ&feature=youtube_gdata_player',
      'http://youtube.com/watch?v=dQw4w9WgXcQ&feature=youtube_gdata_player',
      'http://youtube.com/watch?vi=dQw4w9WgXcQ&feature=youtube_gdata_player',
      'http://youtu.be/dQw4w9WgXcQ?feature=youtube_gdata_player'
  ];

  var failures = 0;
  // for each video in the message
  for(var urlIndex = 0; urlIndex < urls.length; urlIndex++)
  {
    var url = urls[urlIndex];
    const parsed = url.match(youtubeLinkPartsRegex);
    if (parsed && parsed[2])
    {
      Logger.log(parsed[2]);
    }
    else
    {
      failures++;
      Logger.log('Error: "' + url + '" vs "' + parsed[2] + '"');
    }
  }

  Logger.log(failures + ' failed out of ' + urls.length);  
}
