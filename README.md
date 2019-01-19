# AutoYtSubs2Playlist
Automatic add Youtube channel subscriptions to a playlist

Important credits for the authors of the following articles, which this project is based on:
https://www.reddit.com/r/youtube/comments/3ukn4w/automatically_adding_youtube_videos_to_watch/
https://mashe.hawksey.info/2017/09/identity-crisis-using-the-youtube-api-with-google-apps-script-and-scheduling-live-broadcasts-from-google-sheets/

Configurs the camera to output JPEG, a background thread will convert it to Bitmap, and iterate over the pixels to count colors, using HashMap to count.


## Description 
This script will automatically add new videos from your subscribed channels to a specified playlist which you own (not including your Watch Later playlist).
You need to have subscribed to the channel and ALSO turned on email notifications (using the 'bell' icon).

## How It Works
Using the Gmail and Youtube API, the script searches for unread email from subscribed youtube channels under a certain label, extract the video ID and it to the desired playlist.

## Google Quota
Each API has a quota, the cost for each operation is mentioned in a comment

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
