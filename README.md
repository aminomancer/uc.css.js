# uc.css.js
firefox customization stuff. my personal stylesheets and some privileged scripts.
the files in the scripts folder are not content scripts, they're meant to run in the same context as firefox's internal scripts.
sorta like background scripts but for the program itself rather than pages. they are loaded by (alice0775's autoconfig loader)[https://github.com/alice0775/userChrome.js/tree/master/72].
from that repo you put the stuff in install_folder in the firefox installation folder.
but get the updated userChrome.js (from here)[https://github.com/alice0775/userChrome.js/tree/master/73] and put it in your profile's chrome folder.
then at startup firefox will load any scripts in your chrome folder ending in .uc.js, e.g. the ones in my repo.