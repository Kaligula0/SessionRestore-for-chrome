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
 *  window.onload function
 */
function start(){

	// read REQUIRED user settings
	// I mean, check if there are already sessions in storage, if not then create default
	// if yes then read
	chrome.storage.local.get(
		'interval',
		function($result){
			if (Object.keys($result).length==0) //$result={} instead of {sessions: […]}
				$result="300"; // [SEC]; DEFAULT 5 MINS
			$result=(typeof $result=='object'?$result['interval']:$result);
			window.$interval = JSON.parse($result);

			// read or set 'saveAlarm'
			chrome.alarms.get(
				'saveAlarm',
				function($a){
					clog('I\'m trying to find out if \'saveAlarm\' is already set:');
					if (typeof $a=='object') {
						clog('→ true!');
						chrome.alarms.create('saveAlarm', {periodInMinutes:$interval/60});
					} else {
						clog('→ false. I\'m going to set it now.');
						// chrome.alarms.create('saveAlarm', {delayInMinutes:$interval/60,periodInMinutes:$interval/60});
						chrome.alarms.create(
							'saveAlarm',
							{
								when:Date.now()+5000,
								periodInMinutes:$interval/60
							}
						);
						clog('Alarm set.');
					}
				}
			);

		}
	);
	chrome.storage.local.get(
		'quotaMax',
		function($result){
			if (Object.keys($result).length==0) //$result={} instead of {sessions: […]}
				$result="20"; // DEFAULT 20%
			$result=(typeof $result=='object'?$result['quotaMax']:$result);
			window.$quotaMax = JSON.parse($result);
		}
	);

	// add listener before save, because while I was debugging the script,
	// the alarm usually went off during save() and before the listener was added
	// so the save didn't run at all
	chrome.alarms.onAlarm.addListener(save);

	// check if there are already sessions in storage, if not then create empty
	chrome.storage.local.get(
		'sessions',
		function($result){
			clog($result);
			if (Object.keys($result).length==0) //$result={} instead of {sessions: […]}
				chrome.storage.local.set(
					{
						sessions: "[]"
					}
				);
			clog($result);
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
			clog($l+' alarm'+($l>1?'s':'')+':');
			for (var i=1;i<=$l;i++){
				clog('→ time of '+i+(i==1?'st':(i==2?'nd':(i==3?'rd':(i>3?'th':''))))+': '+new Date($a[0].scheduledTime));
			}
			clog($a);
		}
	);
}

function clearAlarm($name){
	chrome.alarms.clear($name);
}

function save(){
	chrome.windows.getAll(
		{populate:true},
		function($windows){
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
						$sessions.shift();
					}
					//OR: if ($sessions.length>=30) $sessions.shift();

					chrome.storage.local.set(
						{
							sessions: JSON.stringify($sessions)
						}
					);

					chrome.browserAction.setBadgeText({ text: "\u221A" });
					chrome.browserAction.setTitle({ title: "Last saved "+(new Date($date)).toLocaleString() });

				}
			);
		}
	);
}

function clearStorage($key){
	chrome.storage.local.set(
		{
			[$key]: "[]"
		}
	);
}
function clearStorageAll(){
	chrome.storage.local.clear();
}

/*
 *  button onClick event
 */
chrome.browserAction.onClicked.addListener(function($tab){
	chrome.tabs.create(
		{
			url:		'/sessions.html',
			selected:	true
		}
	);
});

/*
 *  console.log() with time on line beginning
 */
function clog($txt,$type){
	$type=($type||'info');
	var $date=new Date();
	var $ms = $date.getMilliseconds();
	$ms = $ms<100 ? ($ms<10?($ms==0?'000':'00'+$ms):'0'+$ms) : $ms ;
	return console[$type]( //default: console.info('…');
		'['+$date.toLocaleTimeString()+'.'+$ms+']',
		$txt
	);
}

window.onload=start;