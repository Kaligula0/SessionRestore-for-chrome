/*
	TODO: add info @ translations
			http://developer.chrome.com/extensions/i18n.html
	TODO: (?) save SELDOM but also WHEN NEW TAB OPEN
*/
/*
 * SessionRestore
 *  an extension for Google Chrome browser
 *  that saves open tabs just in case of the browser crash
 *
 * Licence CC-BY-SA 3.0 Kaligula 2020+ (script)
 *  http://creativecommons.org/licenses/by-sa/3.0/
 *
 */


/*
	MAY BE USEFUL

	chrome.tabs.getSelected(null,function(tab){})
	var g=tab.url.indexOf('facebook.com');
	
	chrome.browserAction.setIcon({path:'images/icon.png'});
	chrome.browserAction.setTitle({title:'Last saved: ('+(new Date()).toLocaleTimeString()+')'});
	chrome.browserAction.setBadgeText({text:''+counter});
	chrome.browserAction.setBadgeBackgroundColor({color:[208,0,24,255]}); // GMail red // it was green rgb(0,204,51) before
*/

/*
 * REQUIRED user settings
 */
window.$interval = 300; // [SEC]; DEFAULT: RUN EVERY 5 MINS
window.$quotaMax = 20; // DEFAULT: USE 20% OF MAX STORAGE
window.$quotaOverload = false; // DEFAULT: DON'T LET USER EXCEED 90% OF MAX STORAGE
window.$sessions = []; // DEFAULT: EMPTY ARRAY
window.$windowsOld = {};
if (typeof $ThisIsSessionsPage=="undefined" || !$ThisIsSessionsPage)
	window.$ThisIsSessionsPage = false;

/*
 * INITIATE
 * set alarm, read user settings
 */
function init(){
	chrome.alarms.onAlarm.addListener(save);
	activateButton();
	readSettings();
}

/*
 *  button onClick event
 */
function activateButton(){
	chrome.browserAction.onClicked.addListener(function($tab){
		chrome.tabs.create(
			{
				url:		'/sessions.html',
				selected:	true
			}
		);
	});
}

/*
 * read 1 or more user settings
 * all at once (default) or 1 given setting
 */
function readSettings($settings) {
	if (typeof $settings == "undefined") {
		$settings = ['sessions','quotaMax','quotaOverload','interval'];
	} else if (typeof $settings == "string") {
		$settings = [$settings];
	} // else I suppose it's already an Array
	
	log('I read user settings from storage…');
	$settings.forEach(readSetting);
}
/*
 * read 1 user setting (exist ? read : set)
 * arguments: Array of settings' names
 */
function readSetting($setting){
	chrome.storage.local.get(
		$setting,
		function($result){
			if ($result[$setting]!=undefined){ // b'coz empty $result={} instead of {$setting: value}
				if ($setting == 'sessions')
					return; // no need to read sessions on init, save() reads every time

				window['$'+$setting] = JSON.parse($result[$setting]);
			} else {
				chrome.storage.local.set(
					{
						[$setting]: window['$'+$setting]
					}
				);	
			}

			log('$'+$setting+'='+window['$'+$setting]);

			if ($setting == 'interval'){
				if (!$ThisIsSessionsPage)
					setAlarm();
			}

			if ($ThisIsSessionsPage) {
				var attr = ($setting == 'quotaOverload' ? 'checked' : 'value' );
				document.querySelector('input[name="'+$setting+'"]')[attr] = window['$'+$setting];
			}
		}
	);
}

/*
 * read or set a 'saveAlarm' alarm
 */
function setAlarm(){

	chrome.alarms.get(
		'saveAlarm',
		function($a){
			log('I\'m trying to find out if \'saveAlarm\' is already set:');
			if (typeof $a=='object') {
				log('→ true!');
				//chrome.alarms.create('saveAlarm', {periodInMinutes:$interval/60});
			} else {
				log('→ false. I\'m going to set it now.');
				chrome.alarms.create(
					'saveAlarm',
					{
						when:Date.now()+5000, // +5s
						periodInMinutes:$interval/60
					}
				);
				log('Alarm set.');
			}
		}
	);

}

/*
 * get all alarms
 */
function getAlarms(){
	chrome.alarms.getAll(
		function($a){
			var $l=$a.length;
			log($l+' alarm'+($l>1?'s':'')+':');
			for (var i=1;i<=$l;i++){
				log('→ time of '+i+(i==1?'st':(i==2?'nd':(i==3?'rd':(i>3?'th':''))))+': '+new Date($a[0].scheduledTime));
			}
			log($a);
		}
	);
}

function clearAlarm($name){
	chrome.alarms.clear($name);
}

function save($forceSave = false, $callbackFn = null){
	chrome.windows.getAll(
		{populate:true},
		function($windows){

			if (!$forceSave) {
				window.$windows = $windows;
				// check if anything changed; if nothing – postpone autosave (return;)
				if (JSON.stringify($windowsOld)==JSON.stringify($windows)) {
					log('Alarm went off – but nothing changed since last save, so I\'m not saving anything.');
					return;
				}
			}

			chrome.storage.local.get(
				'sessions',
				function($result){
					var $data,$date,$sessions,$obj,$string;
					chrome.storage.local.getBytesInUse(function($a){window.$bytesInUse=$a});
					
					$data=$windows;
					$date=new Date();
					$date=Number($date);
					
					$result=(typeof $result=='object'?$result['sessions']:$result);
					$sessions=JSON.parse($result);

					$obj = {
						date : $date,
						windows : $data
					}
					$sessions.push( $obj );

					while (JSON.stringify($sessions).length + JSON.stringify($obj).length > $quotaMax/100 * chrome.storage.local.QUOTA_BYTES) {
//						log(JSON.stringify($sessions).length +'+'+ JSON.stringify($obj).length +'>'+ $quotaMax/100 * chrome.storage.local.QUOTA_BYTES);
						$sessions.shift();
					}
					//OR: if ($sessions.length>=30) $sessions.shift();

					// czy ta fx cos returnuje?
					chrome.storage.local.set(
						{
							sessions: JSON.stringify($sessions)
						}
					);
					
					$windowsOld = $windows;

					chrome.browserAction.setBadgeText({ text: "\u221A" });
					chrome.browserAction.setTitle({ title: "Last saved "+(new Date($date)).toLocaleString() });
					
					if (typeof $callbackFn == "function")
						$callbackFn.call(null);

					//return? concsole log

				}
			);
		}
	);
}

function clearStorage($key, $callbackFn = null){
	if ($key==undefined) {
		throw new Error("clearStorage() called without $key specified.");
	} else {
		chrome.storage.local.set(
			{
				[$key]: "[]"
			}
		);
		if (typeof $callbackFn == "function")
			$callbackFn.call(null);

	}
}
function clearStorageAll(){
	chrome.storage.local.clear();
}

/*
 * console.log() with time on line beginning
 * calls by default: console.info('time-ms: …');
 * arguments: ?type, arguments…
 *  - type = error|info|log|warn (default = info) (optional)
 *  - arguments = other arguments (what to log in console)
 */
function log(){
	var $type,
		$arguments = Array.from(arguments); // arguments in an array-like Object, but not Array

	if ($arguments.length>1 && 'error,info,log,warn'.indexOf($arguments[0])>-1) {
		$type = $arguments[0];
		$arguments.shift(); // remove 1st argument
	} else {
		$type = 'info';
	}

	var $date = new Date();
	var $ms = $date.getMilliseconds();
	$ms = $ms<100 ? ($ms<10?($ms==0?'000':'00'+$ms):'0'+$ms) : $ms ;

	$arguments.unshift('['+$date.toLocaleTimeString()+'.'+$ms+']'); // add to Array as 1st

	return console[$type].apply(null, $arguments);
}

// init() only when this script isn't included to sessions.html
if (!$ThisIsSessionsPage)
	window.onload=init;