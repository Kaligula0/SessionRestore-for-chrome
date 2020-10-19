/*
 * TODO
 *  - …
 **/
function start() {

	readSettings();
	readStorage();

	document.querySelectorAll('div.sessionsMenu ul.sessionsMenu > a').forEach(
		function($el, $i, $Arr){
			$el.addEventListener('click',toggleSessionsMenu);
		}
	);
	/* alternative method of calling a function '$callbackFn'
	 * that binds arguments but doesn't call the fn now
	 *     $callbackFn.call(thisObject, arg1, arg2, …)
	 * where 'thisObject' is what a 'this' will refer to
	 */
	document.querySelector('div.sessionsMenu ul.sessionsMenu > li.saveCurrentSession').addEventListener('click',save.bind(null, null, true, readStorage.bind(null, true, false)));
	document.querySelector('div.sessionsMenu ul.sessionsMenu > li.clearOldSessions').addEventListener('click',removeSessionsOlderThan.bind(null, readStorage));
	document.querySelector('div.sessionsMenu ul.sessionsMenu > li.clearAllSessions').addEventListener('click',clearStorage.bind(null, 'sessions', readStorage));

	document.querySelector('#mainTable td.settings input[name="quotaOverload"]').addEventListener(
		'input',
		function () {
			$quotaOverload = this.checked;
			chrome.storage.local.set({quotaOverload: this.checked});
			alert("Saved!");
		}
	);
	document.querySelector('#mainTable td.settings input[name="quotaMax"]').addEventListener(
		'input',
		function () {
			this.value = +this.value.replace(/[^\d]+/g,'');
		}
	);
	document.querySelector('#mainTable td.settings input[name="interval"]').addEventListener(
		'input',
		function () {
			this.value = +this.value.replace(/[^\d]+/g,'');
		}
	);
	document.querySelector('#mainTable td.settings input[name="quotaMax"]').addEventListener(
		'change',
		function () {
			if (this.value<1) {
				this.value = 1;
			}
			if (this.value>90) {
				if (!$quotaOverload) {
					this.value = 90;
				} else {
					if (this.value>100)
						this.value = 100;
				}
			}
			chrome.storage.local.set({quotaMax: this.value});
			alert("Saved!");
		}
	);
	document.querySelector('#mainTable td.settings input[name="interval"]').addEventListener(
		'change',
		function () {
			if (this.value<60) {
				this.value = 60;
			}
			chrome.storage.local.set({interval: this.value});
			alert("Saved!");
		}
	);

	document.querySelector('#mainTable td.settings a.openExtensionsLink').addEventListener(
		'click',
		function () {
			chrome.tabs.create(
				{
					url:		'chrome://extensions/',
					selected:	true
				}
			);
		}
	);

	document.querySelector('p.version span.version').innerText = chrome.runtime.getManifest().version;

}

function readStorage($buildSessionList = true, $showLatestSessionDetails = true){
	chrome.storage.local.get(
		'sessions',
		function($result){
			if ($result['sessions']!='') $sessions=JSON.parse($result['sessions']);
			log('sessions',$sessions);
			if ($buildSessionList)
				buildSessionList($showLatestSessionDetails);
		}
	);
}

function buildSessionList($showLatestSessionDetails = true){
	
	/* THEAD */
	// number of sessions
	document.querySelector('#mainTable th.mainList .number').innerHTML = $sessions.length;

	if ($sessions.length == 0) {
		clearSessionsList();
		clearSessionDetails();
	} else {

		/* TBODY */
		var $mainList = ''

		$sessions.forEach(
			function($el, $i, $arr){
				
				var $date = $el.date;
				$date = new Date($date);
				
				var $windows = $el.windows;
				var $windows_l = $el.windows.length;
				var $tabsSum = '';
				$windows.forEach(
					function($w, $j){
						$tabsSum = $tabsSum + ($j==0?'':'+') + $w.tabs.length;
					}
				);

				$mainList = ''
					+ '<p class="date session_'+$i+'">'
					+ '<a class="sessionLink session_'+$i+'">'
					+ $date.toLocaleString() + '</a><br />'
					+ '<small>'
					+ $windows_l + ' window' + ($windows_l==1?'':'s')
					+ ', ' + $tabsSum + ' tab' + ($tabsSum==1?'':'s')
					+ '</small>'
					+ '<small class="removeOlderThan session_'+$i+' noshow"><br />[REMOVE OLDER THAN THIS]</small>'
					+ '<small><a class="removeLink session_'+$i+'" title="Remove session">[X]</small>'
					+ '</p>'
					+ $mainList;

			}
		);
		
		document.querySelector('#mainTable tbody td.mainList div.mainListContainer').innerHTML = $mainList;

		document.querySelectorAll('#mainTable td.mainList p.date a.sessionLink').forEach(
			function($el, $i, $arr){
				$el.addEventListener(
					'click',
					function () {
						showSessionDetails(+this.className.match(/session_(\d+)/)[1]);
					}
				);
			}
		);

		document.querySelectorAll('#mainTable td.mainList p.date a.removeLink').forEach(
			function($el, $i, $arr){
				$el.addEventListener(
					'click',
					function () {
						removeNSessionsFromID(+this.className.match(/session_(\d+)/)[1]);
					}
				);
			}
		);

		/* if TRUE then update session detaild in central table cell
		 * if FALSE select active session on the list after list rebuild
		 * DO NOT USE FALSE AFTER REMOVING SESSION(S) because IDs of sessions change
		 */
		if ($showLatestSessionDetails) {
			showSessionDetails();
		} else {
			var $id = document.querySelector('#mainTable tbody td.details').className.match(/session_\d+/)[0];
			document.querySelector('#mainTable tbody td.mainList div.mainListContainer p.'+$id).classList.add('active');
		}

	}
}

function toggle($el, $i, $Arr){
	if (!$el.className || $el.className.indexOf('noshow') == -1) {
		$el.className = $el.className + ' noshow';
	} else {
		$el.className = $el.className.replace(/( noshow|noshow |noshow)/,'');
	}
}

function toggleSessionsMenu(){
	document.querySelectorAll('div.sessionsMenu a span, div.sessionsMenu ul li').forEach(toggle);
}

function showSessionDetails($id = $sessions.length-1){
	//last session by default
	if ($id<0) return; //if no sessions

	var $a = document.querySelector('#mainTable td.mainList p.date.active');
	if ($a!=null)
		$a.className = $a.className.replace(' active','');
	document.querySelector('#mainTable td.mainList p.date.session_'+$id).className += ' active';
	
	var $date = $sessions[$id].date;
	$date = new Date($date);
	
	var $windows = $sessions[$id].windows;
	var $windows_l = $sessions[$id].windows.length;
	var $tabsSum = '';
	$windows.forEach(
		function($w, $j){
			$tabsSum = $tabsSum + ($j==0?'':'+') + $w.tabs.length;
		}
	);
	
	var $sessionDetails = '';
	$sessionDetails = $sessionDetails
		+ '<h1 class="session_'+$id+'">' + $date.toLocaleString()
		+ '<small> → '
		+ $windows_l + ' window' + ($windows_l==1?'':'s')
		+ ', ' + $tabsSum + ' tab' + ($tabsSum==1?'':'s')
		+ '</small></h1>';
	
	$windows.forEach(function($el, $i, $arr){
		$sessionDetails = $sessionDetails
			+ '<div class="session session_'+$id+' window window_'+($i+1)+'">'
			+ '<h2 class="window"> » Window #' + ($i+1) + ($el.incognito?' (Incognito) – ':' – ') + $el.tabs.length + ' tabs '
			+ '<small>→ <a class="session_'+$id+' openall window_'+($i)+'" title="Open new window with all these tabs">[open all]</a></small></h2>'
			+ '<ul class="tabs">';
		
		$el.tabs.forEach(function($tab, $j, $arr){
			$sessionDetails = $sessionDetails
				+ '<li><img class="favicon" src="'+($tab.favIconUrl?$tab.favIconUrl:'/images/1x1.png')+'"> '
				+ '<a href="'+encodeURI($tab.url)+'" target="_blank">'
				+ ($tab.title.length>100?$tab.title.substring(0,100)+'…':$tab.title)
				+ '</a>'
				+ '</li>';
		});

		$sessionDetails = $sessionDetails
			+ '</ul>'
			+ '</div>';

	})
	
	var $container = document.querySelector('#mainTable tbody td.details div.detailsContainer');
	$container.innerHTML = $sessionDetails;
	$container.className = $container.className.replace(/( session_\d+|$)/,' session_'+$id);

	document.querySelectorAll('#mainTable tbody td.details div.detailsContainer h2 a.openall').forEach(
		function($el, $i, $arr){
			$el.addEventListener(
				'click',
				function () {
					var $s = +this.className.match(/session_(\d+)/)[1];
					var $w = +this.className.match(/window_(\d+)/)[1];
					openall( $sessions[$s].windows[$w] );
				}
			);
		}
	);

}

function clearSessionsList(){
	document.querySelector('#mainTable tbody td.mainList div.mainListContainer').innerHTML = '';	
}
function clearSessionDetails(){
	document.querySelector('#mainTable tbody td.details').innerHTML = '';	
}

function openall($elem){
/*
focused: true
height: 908
incognito: false
left: -4
state: "maximized"
	The minimized, maximized and, fullscreen states cannot be combined with left, top, width, or height.
top: -4
type: "normal"
url:
width: 1608
*/
	log($elem);

	//$elem.tabs[].url
	$urls=[];
	$elem.tabs.forEach(
		function ($el, $i, $arr){
			$urls.push($el.url);
		}
	);
	
	var $obj = {
		incognito:	$elem.incognito,
		state:		$elem.state,
		type:		$elem.type,
		url:		$urls
	}

	// The minimized, maximized and fullscreen states cannot be combined with left, top, width, or height.
	if ($elem.state=="normal") {
		$obj.focused = $elem.focused;
		$obj.height = $elem.height;
		$obj.left = $elem.left;
		$obj.top = $elem.top;
		$obj.width = $elem.width;
	}
log($obj);
	chrome.windows.create($obj);
}

function removeNSessionsFromID($id, $amount = 1) {
	log('Removed ',$amount,' session'+($amount>1?'s from ':' with ')+'ID=',$id,($amount>1?' onward.':'.'));
	$sessions.splice($id, $amount);
	chrome.storage.local.set(
		{
			sessions: JSON.stringify($sessions)
		}
	);
	if ($amount == 1)
		readStorage(true,false);
}
function removeSessionsOlderThan($callbackFn = null) {
	alert('Click session which refers to "older than". (Do not click the [X].)');
	document.querySelectorAll('td.mainList p.date small.removeOlderThan').forEach(
		function($el, $i, $arr){
			toggle($el);
			$el.addEventListener(
				'click',
				function () {
					$id = +this.className.match(/session_(\d+)/)[1];
					removeNSessionsFromID(0,$id);
					if (typeof $callbackFn == "function")
						/* alternative method of calling a function '$callbackFn'
						 *     $callbackFn.call(thisObject, arg1, arg2, …)
						 * where 'thisObject' is what a 'this' will refer to
						 */
						$callbackFn.call(null);
				}
			);
		}
	);
}

window.onload=start;