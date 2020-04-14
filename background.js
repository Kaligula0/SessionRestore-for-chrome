﻿/*
	TODO: add info @ translations
			http://developer.chrome.com/extensions/i18n.html
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
	//remove/clear alarm
	chrome.alarms.clear('myAlarm');

	chrome.tabs.getSelected(null,function(tab){})
	var g=tab.url.indexOf('facebook.com');
	
	chrome.browserAction.setIcon({path:'images/icon.png'});
	chrome.browserAction.setTitle({title:'Last saved: ('+(new Date()).toLocaleTimeString()+')'});
	chrome.browserAction.setBadgeText({text:''+counter});
	chrome.browserAction.setBadgeBackgroundColor({color:[208,0,24,255]}); // GMail red // it was green rgb(0,204,51) before
	chrome.browserAction.setIcon({path:'images/icon-offline.png'});
*/


/*
 *  window.onload function
 */
function start(){

	// read user settings
	//window.$Interval = (+localStorage['TimerDelay']||300000); // 5 mins
	var $Interval = 300000; // 5 mins

	// read or set 'saveAlarm'
	chrome.alarms.get(
		'saveAlarm',
		function($a){
			clog('I\'m trying to find out if \'saveAlarm\' is already set:');
			if (typeof $a=='object') {
				clog('→ true!');
				chrome.alarms.create('saveAlarm', {periodInMinutes:$Interval/60000});
			} else {
				clog('→ false. I\'m going to set it now.');
				// chrome.alarms.create('saveAlarm', {delayInMinutes:$Interval/60000,periodInMinutes:$Interval/60000});
				chrome.alarms.create(
					'saveAlarm',
					{
						when:Date.now()+5000,
						periodInMinutes:$Interval/60000
					}
				);
				clog('Alarm set.');
			}
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
		clog('$windows');
		clog($windows);
			//var $sessions=[]
			//var $sessions=JSON.parse(localStorage['sessions']);
			chrome.storage.local.get(
				'sessions',
				function($result){
					var $data,$date,$sessions;
					
					$data=$windows;
					$date=new Date();
					$date=Number($date);
					clog('date: '+new Date($date));
					
					$result=(typeof $result=='object'?$result['sessions']:$result);
					$sessions=JSON.parse($result);
					clog('$sessions (get):');
					clog($sessions);

					if ($sessions.length>=30) $sessions.shift();
					
					$sessions.push(
						{
							date : $date,
							windows : $data
						}
					);
					clog('$sessions (push):');
					clog($sessions);

					//localStorage['sessions']=JSON.stringify($sessions);
					chrome.storage.local.set(
						{
							sessions: JSON.stringify($sessions)
						}
					)
				}
			);
			
			//remove var $sessions
		}
	);
}
/*

localStorage['sessions'] = [
	{
		date	: 1586624308968,
		windows	: [{…}]
	}
]

*/

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
	clog('Button clicked.');
	var $uri='/sessions.html';
	chrome.windows.getAll(
		{populate:true},
		function(windows){
			clog('Opening in new tab (or active newtab).');
			chrome.tabs.getSelected(
				null,
				function($tab){
					if($tab.url=='chrome://newtab/'){
						chrome.tabs.update($tab.id,{url:$uri});
					}
					else {
						chrome.tabs.create({url:$uri,selected:true});
					}
				}
			);
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